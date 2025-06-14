import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { db, auth } from "../../firebase";
import { collection, addDoc, getDocs, serverTimestamp, doc, getDoc } from "firebase/firestore";
import AddCategoryModal from "../AdminProfile/AddCategoryModal"; // Import the modal component
import { useLanguage } from "../../context/LanguageContext"; // Import the LanguageContext hook

const AddEvents = () => {
  const { language, t } = useLanguage(); // Access language and translation function
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false); // State for modal visibility
  const [categories, setCategories] = useState([]); // Categories fetched from Firebase
  const [eventData, setEventData] = useState({
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
  const [userRole, setUserRole] = useState(""); // State to store the user's role

  // Fetch user role
  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          const userDoc = await getDoc(doc(db, "users", user.uid)); // Assuming user roles are stored in the "users" collection
          if (userDoc.exists()) {
            setUserRole(userDoc.data().role); // Set the user's role
          }
        }
      } catch (error) {
        console.error("Error fetching user role:", error);
      }
    };

    fetchUserRole();
  }, []);

  // Fetch categories from Firebase
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const categoriesRef = collection(db, "categories");
        const categoriesSnapshot = await getDocs(categoriesRef);
        const categoriesData = categoriesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        }));
        setCategories(categoriesData);
        // Set the default category to the first one fetched
        if (categoriesData.length > 0) {
          setEventData((prev) => ({
            ...prev,
            categoryId: categoriesData[0].id
          }));
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
        toast.error("Failed to fetch categories.");
      }
    };

    fetchCategories();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEventData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const user = auth.currentUser;
      if (!user) {
        toast.error("You must be logged in to create events");
        return;
      }

      const formatDate = (date) => {
        const [year, month, day] = date.split("-");
        return `${day}-${month}-${year}`;
      };

      const newEvent = {
        ...eventData,
        startDate: formatDate(eventData.startDate),
        createdBy: user.uid,
        createdAt: serverTimestamp(),
        participants: [],
        status: "active"
      };

      await addDoc(collection(db, "events"), newEvent);
      toast.success("Event created successfully!");

      setEventData({
        title: "",
        categoryId: categories.length > 0 ? categories[0].id : "",
        startDate: "",
        endDate: "",
        timeFrom: "",
        timeTo: "",
        location: "",
        description: "",
        capacity: "",
        requirements: ""
      });
    } catch (error) {
      console.error("Error creating event:", error);
      toast.error("Failed to create event. Please try again.");
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow-sm">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">{t("admin.createEvent.title")}</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t("admin.createEvent.eventTitle")}
          </label>
          <input
            type="text"
            name="title"
            value={eventData.title}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-yellow-400"
          />
        </div>

        {/* Event Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t("admin.createEvent.eventType")}
          </label>
          <select
            name="categoryId"
            value={eventData.categoryId}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-yellow-400"
          >
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.translations[language]} {/* Display translation based on current language */}
              </option>
            ))}
          </select>
          {/* Conditionally render the "Add Category" button */}
          {(userRole === "admin" || userRole === "superadmin") && (
            <button
              type="button"
              onClick={() => setShowAddCategoryModal(true)} // Open the modal
              className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold px-6 py-2 rounded-md mt-2"
            >
              {t("admin.createEvent.addCategory")}
            </button>
          )}
        </div>

        {/* Date / Date Range */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t("admin.createEvent.dateRange")}
          </label>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <input
                type="date"
                name="startDate"
                value={eventData.startDate}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-yellow-400"
              />
              <span className="block text-xs text-gray-500 mt-1">{t("admin.createEvent.startDate")}</span>
            </div>
            <div>
              <input
                type="date"
                name="endDate"
                value={eventData.endDate}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-yellow-400"
              />
              <span className="block text-xs text-gray-500 mt-1">{t("admin.createEvent.endDate")}</span>
            </div>
          </div>
        </div>

        {/* Time Range */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t("admin.createEvent.timeRange")}
          </label>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">{t("admin.createEvent.timeFrom")}</label>
              <input
                type="time"
                name="timeFrom"
                value={eventData.timeFrom}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-yellow-400"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">{t("admin.createEvent.timeTo")}</label>
              <input
                type="time"
                name="timeTo"
                value={eventData.timeTo}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-yellow-400"
              />
            </div>
          </div>
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t("admin.createEvent.location")}
          </label>
          <input
            type="text"
            name="location"
            value={eventData.location}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-yellow-400"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t("admin.createEvent.description")}
          </label>
          <textarea
            name="description"
            value={eventData.description}
            onChange={handleChange}
            required
            rows="4"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-yellow-400"
          />
        </div>

        {/* Capacity */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("admin.createEvent.capacity")}
            </label>
            <input
              type="number"
              name="capacity"
              value={eventData.capacity}
              onChange={handleChange}
              min="1"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-yellow-400"
            />
          </div>
        </div>

        {/* Special Requirements */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t("admin.createEvent.requirements")}
          </label>
          <textarea
            name="requirements"
            value={eventData.requirements}
            onChange={handleChange}
            rows="3"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-yellow-400"
            placeholder={t("admin.createEvent.requirementsPlaceholder")}
          />
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="bg-[#FFD966] hover:bg-yellow-500 text-white font-bold py-2 px-6 rounded-md transition-colors duration-200"
          >
            {t("admin.createEvent.submit")}
          </button>
        </div>
      </form>

      {/* Add Category Modal */}
      {showAddCategoryModal && (
        <AddCategoryModal
          onClose={() => setShowAddCategoryModal(false)} // Close the modal
        />
      )}
    </div>
  );
};

export default AddEvents;
