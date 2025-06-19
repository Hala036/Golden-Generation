import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { db, auth, storage } from '../../firebase';
import { collection, addDoc, getDocs, serverTimestamp, doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { toast } from 'react-hot-toast';
import AddCategoryModal from "../AdminProfile/AddCategoryModal";
import { useAuth } from '../../hooks/useAuth';

const CreateEventForm = ({ onClose, userRole: propUserRole, initialData = null, isEditing = false }) => {
  const [categories, setCategories] = useState([]);
  const [imageFile, setImageFile] = useState(null);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [actualUserRole, setActualUserRole] = useState(propUserRole);
  const { currentUser } = useAuth();
  const [eventData, setEventData] = useState(initialData || {
    title: "",
    categoryId: "",
    startDate: "",
    endDate: "",
    timeFrom: "",
    timeTo: "",
    location: "",
    description: "",
    capacity: "",
    requirements: ""
  });

  // Fetch user role from Firestore
  useEffect(() => {
    const fetchUserRole = async () => {
      if (currentUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (userDoc.exists()) {
            const firestoreRole = userDoc.data().role;
            console.log('Fetched user role:', firestoreRole);
            setActualUserRole(firestoreRole);
          }
        } catch (error) {
          console.error('Error fetching user role:', error);
        }
      }
    };
    fetchUserRole();
  }, [currentUser]);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      const categoriesRef = collection(db, "categories");
      const categoriesSnapshot = await getDocs(categoriesRef);
      const categoriesData = categoriesSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setCategories(categoriesData);
      if (categoriesData.length > 0 && !isEditing) {
        setEventData((prev) => ({ ...prev, categoryId: categoriesData[0].id }));
      }
    };
    fetchCategories();
  }, [isEditing]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEventData(prev => {
      const newData = { ...prev, [name]: value };
      
      // If timeFrom changes, calculate timeTo (1 hour later by default)
      if (name === 'timeFrom' && value) {
        const startTime = new Date(`2000-01-01T${value}`);
        const endTime = new Date(startTime.getTime() + 60 * 60000); // 1 hour later
        newData.timeTo = endTime.toTimeString().slice(0, 5);
      }
      
      return newData;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const user = auth.currentUser;
      if (!user) {
        toast.error('You must be logged in to create an event');
        return;
      }

      console.log('Starting event creation process...');

      let imageUrl = "";
      if (imageFile) {
        console.log('Uploading image...');
        const imageRef = ref(storage, `eventImages/${Date.now()}_${imageFile.name}`);
        const snapshot = await uploadBytes(imageRef, imageFile);
        imageUrl = await getDownloadURL(snapshot.ref);
        console.log('Image uploaded successfully:', imageUrl);
      }

      console.log('Fetching user settlement...');
      const userDoc = await getDoc(doc(db, "users", user.uid));
      const userSettlement = userDoc.exists() ? userDoc.data().idVerification?.settlement : "";
      console.log('User settlement:', userSettlement);
      
      let eventStatus = "active";
      let eventColor = "yellow";
      if (actualUserRole === "retiree") {
        eventStatus = "pending";
        eventColor = "green";
      } else if (actualUserRole === "admin" || actualUserRole === "superadmin") {
        eventColor = "blue";
      }

      // Format date to DD-MM-YYYY for consistency
      const formatDate = (dateStr) => {
        if (!dateStr) return "";
        const [year, month, day] = dateStr.split('-');
        return `${day}-${month}-${year}`;
      };

      const newEvent = {
        ...eventData,
        startDate: formatDate(eventData.startDate),
        endDate: formatDate(eventData.endDate || eventData.startDate),
        date: formatDate(eventData.startDate), // Keep for backward compatibility
        createdBy: user.uid,
        createdAt: serverTimestamp(),
        participants: [],
        status: eventStatus,
        color: eventColor,
        settlement: userSettlement,
        imageUrl: imageUrl
      };

      console.log('Preparing to save event:', newEvent);

      if (isEditing && initialData?.id) {
        console.log('Updating existing event...');
        await updateDoc(doc(db, "events", initialData.id), newEvent);
        console.log('Event updated successfully');
        toast.success('Event updated successfully');
      } else {
        console.log('Creating new event...');
        const docRef = await addDoc(collection(db, "events"), newEvent);
        console.log('Event created successfully with ID:', docRef.id);
        toast.success('Event created successfully');
      }
      onClose();
    } catch (error) {
      console.error('Error creating/updating event:', error);
      toast.error('Failed to create/update event');
    }
  };

  return (
    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-screen overflow-y-auto">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold">{isEditing ? 'Edit Event' : 'Create New Event'}</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
        >
          <X size={24} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          name="title"
          placeholder="Event title"
          value={eventData.title}
          onChange={handleChange}
          className="w-full border rounded-lg px-3 py-2"
          required
        />
        
        <div className="space-y-2">
          <select
            name="categoryId"
            value={eventData.categoryId}
            onChange={handleChange}
            className="w-full border rounded-lg px-3 py-2"
            required
          >
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name || cat.translations?.en || cat.id}
              </option>
            ))}
          </select>
          {/* Add Category Button - Only for admin/superadmin */}
          {console.log('Current role:', actualUserRole)}
          {(actualUserRole === "admin" || actualUserRole === "superadmin") && (
            <button
              type="button"
              onClick={() => setShowAddCategoryModal(true)}
              className="w-full bg-[#FFD966] hover:bg-yellow-500 text-white font-bold py-2 px-4 rounded-lg"
            >
              Add Category
            </button>
          )}
        </div>
        
        {/* Date Range */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <input
              type="date"
              name="startDate"
              value={eventData.startDate}
              onChange={handleChange}
              className="border rounded-lg px-3 py-2 w-full"
              required
            />
            <span className="text-xs text-gray-500 mt-1">Start Date</span>
          </div>
          <div>
            <input
              type="date"
              name="endDate"
              value={eventData.endDate}
              onChange={handleChange}
              className="border rounded-lg px-3 py-2 w-full"
            />
            <span className="text-xs text-gray-500 mt-1">End Date (Optional)</span>
          </div>
        </div>

        {/* Time Range */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <input
              type="time"
              name="timeFrom"
              value={eventData.timeFrom}
              onChange={handleChange}
              className="border rounded-lg px-3 py-2 w-full"
              required
            />
            <span className="text-xs text-gray-500 mt-1">Start Time</span>
          </div>
          <div>
            <input
              type="time"
              name="timeTo"
              value={eventData.timeTo}
              onChange={handleChange}
              className="border rounded-lg px-3 py-2 w-full"
              required
            />
            <span className="text-xs text-gray-500 mt-1">End Time</span>
          </div>
        </div>
        
        <input
          type="text"
          name="location"
          placeholder="Location"
          value={eventData.location}
          onChange={handleChange}
          className="w-full border rounded-lg px-3 py-2"
          required
        />

        <textarea
          name="description"
          placeholder="Description"
          value={eventData.description}
          onChange={handleChange}
          className="w-full border rounded-lg px-3 py-2 h-20"
          required
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Max Participants
          </label>
          <input
            type="number"
            name="capacity"
            value={eventData.capacity}
            onChange={handleChange}
            min="1"
            className="w-full border rounded-lg px-3 py-2"
            required
          />
        </div>
        
        <textarea
          name="requirements"
          placeholder="Special requirements"
          value={eventData.requirements}
          onChange={handleChange}
          className="w-full border rounded-lg px-3 py-2 h-12"
        />

        {/* Image Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Event Image
          </label>

          <div className="flex items-center space-x-4">
            <label className="cursor-pointer bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded-md">
              {imageFile ? "Change Image" : "Upload Image"}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files[0])}
                className="hidden"
              />
            </label>

            {imageFile && (
              <span className="text-sm text-gray-600 truncate max-w-xs">
                {imageFile.name}
              </span>
            )}
          </div>
        </div>
        
        {/* Image Preview */}
        {imageFile && (
          <div className="mt-4">
            <img
              src={URL.createObjectURL(imageFile)}
              alt="Event Preview"
              className="w-full h-48 object-cover rounded-md border border-gray-300"
            />
          </div>
        )}

        <div className="flex gap-2 pt-4">
          <button
            type="submit"
            className="bg-green-600 text-white px-4 py-2 rounded-lg flex-1"
          >
            {isEditing ? 'Update Event' : 'Create Event'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="bg-gray-500 text-white px-4 py-2 rounded-lg"
          >
            Cancel
          </button>
        </div>
      </form>

      {/* Add Category Modal */}
      {showAddCategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-white p-6 rounded-lg max-w-lg w-full relative">
            <AddCategoryModal
              onClose={() => setShowAddCategoryModal(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateEventForm; 