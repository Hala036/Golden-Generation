import React, { useState, useEffect } from "react";
import { db } from "../../firebase";
import { collection, doc, getDocs, updateDoc, deleteDoc, setDoc, query, where, writeBatch } from "firebase/firestore";
import { toast } from "react-hot-toast";
import { useLanguage } from "../../context/LanguageContext";
import { FaEdit, FaTrash, FaPlus, FaEye } from "react-icons/fa";

const CategoryManagement = () => {
  const { language, t } = useLanguage();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categoryUsage, setCategoryUsage] = useState({});
  const [orphanedEvents, setOrphanedEvents] = useState([]);
  const [formData, setFormData] = useState({
    translations: { en: "", he: "", ar: "" },
    color: "#CCCCCC"
  });

  // Fetch categories
  useEffect(() => {
    fetchCategories();
    fetchCategoryUsage();
    fetchOrphanedEvents();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const categoriesRef = collection(db, "categories");
      const snapshot = await getDocs(categoriesRef);
      const categoriesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setCategories(categoriesData);
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast.error("Failed to fetch categories");
    } finally {
      setLoading(false);
    }
  };

  const fetchCategoryUsage = async () => {
    try {
      const eventsRef = collection(db, "events");
      const snapshot = await getDocs(eventsRef);
      const usage = {};
      
      snapshot.docs.forEach(doc => {
        const event = doc.data();
        if (event.categoryId) {
          usage[event.categoryId] = (usage[event.categoryId] || 0) + 1;
        }
      });
      
      setCategoryUsage(usage);
    } catch (error) {
      console.error("Error fetching category usage:", error);
    }
  };

  const fetchOrphanedEvents = async () => {
    try {
      const eventsRef = collection(db, "events");
      const eventsSnapshot = await getDocs(eventsRef);
      const categoriesRef = collection(db, "categories");
      const categoriesSnapshot = await getDocs(categoriesRef);
      
      const categoryIds = new Set(categoriesSnapshot.docs.map(doc => doc.id));
      const orphaned = [];
      
      eventsSnapshot.docs.forEach(doc => {
        const event = doc.data();
        if (event.categoryId && !categoryIds.has(event.categoryId)) {
          orphaned.push({
            id: doc.id,
            title: event.title,
            date: event.startDate || event.date,
            categoryId: event.categoryId
          });
        }
      });
      
      setOrphanedEvents(orphaned);
    } catch (error) {
      console.error("Error fetching orphaned events:", error);
    }
  };

  const handleAddCategory = async () => {
    if (!formData.translations.en || !formData.translations.he) {
      toast.error("Please provide English and Hebrew translations");
      return;
    }

    const updatedTranslations = {
      ...formData.translations,
      ar: formData.translations.ar || formData.translations.he
    };

    const formattedName = updatedTranslations.en.toLowerCase().replace(/\s+/g, "");

    try {
      const categoriesRef = collection(db, "categories");
      const categoryDoc = doc(categoriesRef, formattedName);
      await setDoc(categoryDoc, {
        name: formattedName,
        translations: updatedTranslations,
        color: formData.color
      });
      toast.success("Category added successfully!");
      setShowAddModal(false);
      resetForm();
      fetchCategories();
    } catch (error) {
      console.error("Error adding category:", error);
      toast.error("Failed to add category");
    }
  };

  const handleEditCategory = async () => {
    if (!selectedCategory || !formData.translations.en || !formData.translations.he) {
      toast.error("Please provide English and Hebrew translations");
      return;
    }

    const updatedTranslations = {
      ...formData.translations,
      ar: formData.translations.ar || formData.translations.he
    };

    try {
      const categoryRef = doc(db, "categories", selectedCategory.id);
      await updateDoc(categoryRef, {
        translations: updatedTranslations,
        color: formData.color
      });
      toast.success("Category updated successfully!");
      setShowEditModal(false);
      resetForm();
      fetchCategories();
    } catch (error) {
      console.error("Error updating category:", error);
      toast.error("Failed to update category");
    }
  };

  const handleDeleteCategory = async (category) => {
    console.log('Attempting to delete category:', category);
    console.log('Category usage:', categoryUsage);
    console.log('Events using this category:', categoryUsage[category.id] || 0);
    
    const eventCount = categoryUsage[category.id] || 0;
    
    if (eventCount > 0) {
      // Get detailed information about events that will be deleted
      try {
        const eventsRef = collection(db, "events");
        const eventsQuery = query(eventsRef, where("categoryId", "==", category.id));
        const eventsSnapshot = await getDocs(eventsQuery);
        
        const eventDetails = eventsSnapshot.docs.map(doc => ({
          id: doc.id,
          title: doc.data().title,
          date: doc.data().startDate || doc.data().date,
          createdBy: doc.data().createdBy
        }));
        
        const eventList = eventDetails.map(event => 
          `• ${event.title} (${event.date})`
        ).join('\n');
        
        const forceDelete = window.confirm(
          `Category "${category.translations[language] || category.translations.en}" is used by ${eventCount} event(s).\n\n` +
          `This will also delete ALL events in this category:\n\n` +
          `${eventList}\n\n` +
          `Click OK to delete category and all its events, or Cancel to abort.`
        );
        
        if (!forceDelete) {
          return;
        }
      } catch (error) {
        console.error('Error fetching event details:', error);
        const forceDelete = window.confirm(
          `Category "${category.translations[language] || category.translations.en}" is used by ${eventCount} event(s).\n\n` +
          `This will also delete ALL events in this category.\n\n` +
          `Click OK to delete category and all its events, or Cancel to abort.`
        );
        
        if (!forceDelete) {
          return;
        }
      }
    }

    const confirmMessage = `Are you sure you want to delete "${category.translations[language] || category.translations.en}"? This action cannot be undone.`;
    console.log('Confirmation message:', confirmMessage);
    
    if (window.confirm(confirmMessage)) {
      try {
        console.log('Starting batch delete operation...');
        
        // Use a batch write to ensure atomicity
        const batch = writeBatch(db);
        
        // Delete all events that use this category
        if (eventCount > 0) {
          console.log(`Deleting ${eventCount} events for category: ${category.id}`);
          
          const eventsRef = collection(db, "events");
          const eventsQuery = query(eventsRef, where("categoryId", "==", category.id));
          const eventsSnapshot = await getDocs(eventsQuery);
          
          eventsSnapshot.docs.forEach((eventDoc) => {
            console.log(`Deleting event: ${eventDoc.id}`);
            batch.delete(eventDoc.ref);
          });
          
          toast.success(`Deleting ${eventCount} events...`);
        }
        
        // Delete the category
        console.log('Deleting category with ID:', category.id);
        const categoryRef = doc(db, "categories", category.id);
        batch.delete(categoryRef);
        
        // Commit all deletions in a single atomic operation
        await batch.commit();
        
        console.log('Batch delete completed successfully');
        toast.success(`Category and ${eventCount} events deleted successfully!`);
        
        // Refresh data
        fetchCategories();
        fetchCategoryUsage();
        
      } catch (error) {
        console.error("Error deleting category and events:", error);
        toast.error("Failed to delete category and events");
      }
    } else {
      console.log('Delete operation cancelled by user');
    }
  };

  const handleCleanupOrphanedEvents = async () => {
    if (orphanedEvents.length === 0) {
      toast.success("No orphaned events found!");
      return;
    }

    const confirmCleanup = window.confirm(
      `Found ${orphanedEvents.length} orphaned events (events with non-existent categories).\n\n` +
      `These events will be deleted:\n\n` +
      `${orphanedEvents.map(event => `• ${event.title} (${event.date})`).join('\n')}\n\n` +
      `Click OK to delete all orphaned events, or Cancel to abort.`
    );

    if (!confirmCleanup) return;

    try {
      const batch = writeBatch(db);
      
      orphanedEvents.forEach(event => {
        const eventRef = doc(db, "events", event.id);
        batch.delete(eventRef);
      });
      
      await batch.commit();
      
      toast.success(`${orphanedEvents.length} orphaned events deleted successfully!`);
      fetchOrphanedEvents();
      fetchCategoryUsage();
    } catch (error) {
      console.error("Error cleaning up orphaned events:", error);
      toast.error("Failed to clean up orphaned events");
    }
  };

  const openEditModal = (category) => {
    setSelectedCategory(category);
    setFormData({
      translations: category.translations || { en: "", he: "", ar: "" },
      color: category.color || "#CCCCCC"
    });
    setShowEditModal(true);
  };

  const openViewModal = (category) => {
    setSelectedCategory(category);
    setShowViewModal(true);
  };

  const resetForm = () => {
    setFormData({
      translations: { en: "", he: "", ar: "" },
      color: "#CCCCCC"
    });
    setSelectedCategory(null);
  };

  const openAddModal = () => {
    resetForm();
    setShowAddModal(true);
  };

  const Modal = ({ isOpen, onClose, title, children, onSubmit, submitText }) => {
    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
          <h2 className="text-xl font-bold mb-4">{title}</h2>
          {children}
          <div className="flex justify-end space-x-4 mt-6">
            <button
              onClick={onClose}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold px-4 py-2 rounded-md"
            >
              Cancel
            </button>
            {onSubmit && (
              <button
                onClick={onSubmit}
                className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold px-4 py-2 rounded-md"
              >
                {submitText}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Loading categories...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Category Management</h1>
        <div className="flex gap-2">
          {orphanedEvents.length > 0 && (
            <button
              onClick={handleCleanupOrphanedEvents}
              className="bg-red-500 hover:bg-red-600 text-white font-bold px-4 py-2 rounded-md flex items-center gap-2"
              title={`Clean up ${orphanedEvents.length} orphaned events`}
            >
              <FaTrash /> Cleanup ({orphanedEvents.length})
            </button>
          )}
          <button
            onClick={openAddModal}
            className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold px-4 py-2 rounded-md flex items-center gap-2"
          >
            <FaPlus /> Add Category
          </button>
        </div>
      </div>

      {/* Categories Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Color
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Translations
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Events Using
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {categories.map((category) => (
              <tr key={category.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {category.translations?.[language] || category.translations?.en || category.name}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div
                      className="w-6 h-6 rounded-full border border-gray-300"
                      style={{ backgroundColor: category.color }}
                    ></div>
                    <span className="ml-2 text-sm text-gray-500">{category.color}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div className="space-y-1">
                    <div>EN: {category.translations?.en || "N/A"}</div>
                    <div>HE: {category.translations?.he || "N/A"}</div>
                    <div>AR: {category.translations?.ar || "N/A"}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    (categoryUsage[category.id] || 0) > 0 
                      ? 'bg-yellow-100 text-yellow-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {categoryUsage[category.id] || 0} events
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => openViewModal(category)}
                      className="text-blue-600 hover:text-blue-900"
                      title="View"
                    >
                      <FaEye />
                    </button>
                    <button
                      onClick={() => openEditModal(category)}
                      className="text-yellow-600 hover:text-yellow-900"
                      title="Edit"
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(category)}
                      className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                      title="Delete category"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Category Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add New Category"
        onSubmit={handleAddCategory}
        submitText="Add Category"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              English Translation (Key)
            </label>
            <input
              type="text"
              className="border px-3 py-2 rounded-md w-full"
              value={formData.translations.en}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  translations: { ...formData.translations, en: e.target.value }
                })
              }
              placeholder="e.g., Trip"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hebrew Translation
            </label>
            <input
              type="text"
              className="border px-3 py-2 rounded-md w-full"
              value={formData.translations.he}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  translations: { ...formData.translations, he: e.target.value }
                })
              }
              placeholder="e.g., טיול"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Arabic Translation (Optional)
            </label>
            <input
              type="text"
              className="border px-3 py-2 rounded-md w-full"
              value={formData.translations.ar}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  translations: { ...formData.translations, ar: e.target.value }
                })
              }
              placeholder="e.g., رحلة"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category Color
            </label>
            <input
              type="color"
              className="w-full h-10 px-1 py-1 border rounded-md"
              value={formData.color}
              onChange={(e) => setFormData({ ...formData, color: e.target.value })}
            />
          </div>
        </div>
      </Modal>

      {/* Edit Category Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Category"
        onSubmit={handleEditCategory}
        submitText="Update Category"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              English Translation (Key)
            </label>
            <input
              type="text"
              className="border px-3 py-2 rounded-md w-full"
              value={formData.translations.en}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  translations: { ...formData.translations, en: e.target.value }
                })
              }
              placeholder="e.g., Trip"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hebrew Translation
            </label>
            <input
              type="text"
              className="border px-3 py-2 rounded-md w-full"
              value={formData.translations.he}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  translations: { ...formData.translations, he: e.target.value }
                })
              }
              placeholder="e.g., טיול"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Arabic Translation (Optional)
            </label>
            <input
              type="text"
              className="border px-3 py-2 rounded-md w-full"
              value={formData.translations.ar}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  translations: { ...formData.translations, ar: e.target.value }
                })
              }
              placeholder="e.g., رحلة"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category Color
            </label>
            <input
              type="color"
              className="w-full h-10 px-1 py-1 border rounded-md"
              value={formData.color}
              onChange={(e) => setFormData({ ...formData, color: e.target.value })}
            />
          </div>
        </div>
      </Modal>

      {/* View Category Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        title="Category Details"
      >
        {selectedCategory && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category ID
              </label>
              <div className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
                {selectedCategory.id}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                English Translation
              </label>
              <div className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
                {selectedCategory.translations?.en || "N/A"}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hebrew Translation
              </label>
              <div className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
                {selectedCategory.translations?.he || "N/A"}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Arabic Translation
              </label>
              <div className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
                {selectedCategory.translations?.ar || "N/A"}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Color
              </label>
              <div className="flex items-center">
                <div
                  className="w-8 h-8 rounded-full border border-gray-300 mr-3"
                  style={{ backgroundColor: selectedCategory.color }}
                ></div>
                <span className="text-sm text-gray-900">{selectedCategory.color}</span>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default CategoryManagement; 