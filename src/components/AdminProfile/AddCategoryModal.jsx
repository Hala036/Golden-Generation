import React, { useState } from "react";
import { db } from "../../firebase";
import { collection, doc, setDoc } from "firebase/firestore";
import { toast } from "react-hot-toast"; // Import react-hot-toast

const AddCategoryModal = ({ onClose }) => {
  const [translations, setTranslations] = useState({
    en: "",
    he: "",
    ar: ""
  });
  const [loading, setLoading] = useState(false);

  const handleAddCategory = async () => {
    if (!translations.en || !translations.he) {
      toast.error("Please provide English and Hebrew translations."); // Show error toast
      return;
    }

    // If Arabic field is empty, fill it with Hebrew translation
    const updatedTranslations = {
      ...translations,
      ar: translations.ar || translations.he
    };

    // Format the English translation to be lowercase and remove spaces
    const formattedName = updatedTranslations.en.toLowerCase().replace(/\s+/g, "");

    setLoading(true);
    try {
      const categoriesRef = collection(db, "categories");
      const categoryDoc = doc(categoriesRef, formattedName); // Use formattedName as the document ID
      await setDoc(categoryDoc, {
        name: formattedName,
        translations: updatedTranslations
      });
      toast.success("Category added successfully!"); // Show success toast
      onClose(); // Close the modal
    } catch (error) {
      console.error("Error adding category:", error);
      toast.error("Failed to add category. Please try again."); // Show error toast
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
        <h2 className="text-xl font-bold mb-4">Add New Category</h2>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            English Translation (Key)
          </label>
          <input
            type="text"
            className="border px-3 py-2 rounded-md w-full"
            value={translations.en}
            onChange={(e) =>
              setTranslations({ ...translations, en: e.target.value })
            }
            placeholder="e.g., Trip"
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Hebrew Translation
          </label>
          <input
            type="text"
            className="border px-3 py-2 rounded-md w-full"
            value={translations.he}
            onChange={(e) =>
              setTranslations({ ...translations, he: e.target.value })
            }
            placeholder="e.g., טיול"
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Arabic Translation (Optional)
          </label>
          <input
            type="text"
            className="border px-3 py-2 rounded-md w-full"
            value={translations.ar}
            onChange={(e) =>
              setTranslations({ ...translations, ar: e.target.value })
            }
            placeholder="e.g., رحلة"
          />
        </div>
        <div className="flex justify-end space-x-4">
          <button
            onClick={onClose}
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold px-4 py-2 rounded-md"
          >
            Cancel
          </button>
          <button
            onClick={handleAddCategory}
            className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold px-4 py-2 rounded-md"
            disabled={loading}
          >
            {loading ? "Adding..." : "Add Category"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddCategoryModal;