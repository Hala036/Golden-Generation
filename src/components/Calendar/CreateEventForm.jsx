import React, { useState, useEffect } from 'react';
import { X, AlertCircle, CheckCircle } from 'lucide-react';
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
  const [validationErrors, setValidationErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  // Validation rules
  const validationRules = {
    title: {
      required: true,
      minLength: 3,
      maxLength: 100
    },
    categoryId: {
      required: true
    },
    startDate: {
      required: true
    },
    timeFrom: {
      required: true
    },
    timeTo: {
      required: true
    },
    location: {
      required: true,
      minLength: 2,
      maxLength: 200
    },
    description: {
      required: true,
      maxLength: 1000
    },
    capacity: {
      required: true,
      min: 1,
      max: 1000
    },
    requirements: {
      maxLength: 500
    },
    imageFile: {
      maxSize: 5 * 1024 * 1024,
      allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    }
  };

  // Validation functions
  const validateField = (name, value) => {
    const rules = validationRules[name];
    if (!rules) return null;

    // Required validation
    if (rules.required && (!value || value.trim() === '')) {
      return `${name.charAt(0).toUpperCase() + name.slice(1)} is required`;
    }

    if (value && value.trim() !== '') {
      // Length validations
      if (rules.minLength && value.length < rules.minLength) {
        return `${name.charAt(0).toUpperCase() + name.slice(1)} must be at least ${rules.minLength} characters`;
      }
      if (rules.maxLength && value.length > rules.maxLength) {
        return `${name.charAt(0).toUpperCase() + name.slice(1)} must be no more than ${rules.maxLength} characters`;
      }

      // Number range validation
      if (rules.min !== undefined && Number(value) < rules.min) {
        return `${name.charAt(0).toUpperCase() + name.slice(1)} must be at least ${rules.min}`;
      }
      if (rules.max !== undefined && Number(value) > rules.max) {
        return `${name.charAt(0).toUpperCase() + name.slice(1)} must be no more than ${rules.max}`;
      }
    }

    return null;
  };

  // Complex validation functions
  const validateDateRange = () => {
    if (!eventData.startDate || !eventData.endDate) return null;
    
    const startDate = new Date(eventData.startDate);
    const endDate = new Date(eventData.endDate);
    
    if (endDate < startDate) {
      return "End date cannot be before start date";
    }
    
    return null;
  };

  const validateTimeRange = () => {
    if (!eventData.timeFrom || !eventData.timeTo) return null;
    
    // If end date is specified and different from start date, allow any time order
    if (eventData.endDate && eventData.startDate !== eventData.endDate) {
      // For cross-day events, only check minimum duration
      const startDateTime = new Date(`${eventData.startDate}T${eventData.timeFrom}`);
      const endDateTime = new Date(`${eventData.endDate}T${eventData.timeTo}`);
      const timeDiff = endDateTime.getTime() - startDateTime.getTime();
      const minDuration = 30 * 60 * 1000; // 30 minutes
      
      if (timeDiff < minDuration) {
        return "Event must be at least 30 minutes long";
      }
      return null;
    }
    
    // For same-day events, check time order
    const startTime = new Date(`2000-01-01T${eventData.timeFrom}`);
    const endTime = new Date(`2000-01-01T${eventData.timeTo}`);
    
    if (endTime <= startTime) {
      return "End time must be after start time for same-day events";
    }
    
    // Check if time difference is at least 30 minutes
    const timeDiff = endTime.getTime() - startTime.getTime();
    const minDuration = 30 * 60 * 1000; // 30 minutes in milliseconds
    
    if (timeDiff < minDuration) {
      return "Event must be at least 30 minutes long";
    }
    
    return null;
  };

  const validateFutureDate = () => {
    if (!eventData.startDate) return null;
    
    const startDate = new Date(eventData.startDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (startDate < today) {
      return "Start date cannot be in the past";
    }
    
    return null;
  };

  const validateImageFile = () => {
    if (!imageFile) return null;
    
    // File size validation (5MB)
    if (imageFile.size > 5 * 1024 * 1024) {
      return "Image file size must be less than 5MB";
    }
    
    // File type validation
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(imageFile.type)) {
      return "Image must be JPEG, PNG, GIF, or WebP format";
    }
    
    return null;
  };

  // Real-time validation
  const validateForm = () => {
    const errors = {};
    
    // Validate individual fields
    Object.keys(validationRules).forEach(fieldName => {
      const error = validateField(fieldName, eventData[fieldName]);
      if (error) errors[fieldName] = error;
    });
    
    // Validate image file
    const imageError = validateImageFile();
    if (imageError) errors.imageFile = imageError;
    
    // Validate complex rules
    const dateRangeError = validateDateRange();
    if (dateRangeError) errors.endDate = dateRangeError;
    
    const timeRangeError = validateTimeRange();
    if (timeRangeError) errors.timeTo = timeRangeError;
    
    const futureDateError = validateFutureDate();
    if (futureDateError) errors.startDate = futureDateError;

    // Check for past time specifically on the time field
    if (isToday(eventData.startDate) && eventData.timeFrom < getCurrentTime()) {
      errors.timeFrom = "Start time cannot be in the past";
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Validate on data change
  useEffect(() => {
    validateForm();
  }, [eventData, imageFile]);

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
      
      // If start date changes, reset times to ensure they're valid for the new date
      if (name === 'startDate') {
        const isTodaySelected = isToday(value);
        if (isTodaySelected) {
          const currentTime = getCurrentTime();
          // If current time is later than the existing start time, update it
          if (!newData.timeFrom || newData.timeFrom < currentTime) {
            newData.timeFrom = currentTime;
          }
          // Update end time to be at least 30 minutes after start time
          if (newData.timeFrom) {
            const startTime = new Date(`2000-01-01T${newData.timeFrom}`);
            const endTime = new Date(startTime.getTime() + 30 * 60000); // 30 minutes later
            newData.timeTo = endTime.toTimeString().slice(0, 5);
          }
        }
      }
      
      // If timeFrom changes, calculate timeTo (30 minutes later by default)
      if (name === 'timeFrom' && value) {
        const startTime = new Date(`2000-01-01T${value}`);
        const endTime = new Date(startTime.getTime() + 30 * 60000); // 30 minutes later
        newData.timeTo = endTime.toTimeString().slice(0, 5);
      }
      
      return newData;
    });
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched({
      ...touched,
      [name]: true,
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
    }
    setTouched({
      ...touched,
      imageFile: true
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Mark all fields as touched to display errors
    const allFields = Object.keys(validationRules);
    const touchedAll = allFields.reduce((acc, field) => {
      acc[field] = true;
      return acc;
    }, {});
    setTouched(touchedAll);
    
    // Final validation before submission
    if (!validateForm()) {
      toast.error('Please fix the validation errors before submitting');
      return;
    }

    if (isSubmitting) {
      toast.error('Please wait, form is being submitted...');
      return;
    }

    setIsSubmitting(true);
    
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
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper function to render input with validation
  const renderInput = (name, type = "text", placeholder = "", additionalProps = {}, isRequired = false) => {
    const hasError = touched[name] && validationErrors[name];
    const isValid = touched[name] && eventData[name] && !hasError;
    
    return (
      <div className="relative">
        <input
          type={type}
          name={name}
          placeholder={placeholder}
          value={eventData[name]}
          onChange={handleChange}
          onBlur={handleBlur}
          className={`w-full border rounded-lg px-3 py-2 pr-10 ${
            hasError ? 'border-red-500 bg-red-50' : 
            isValid ? 'border-green-500 bg-green-50' : 
            'border-gray-300'
          }`}
          {...additionalProps}
        />
        {hasError && (
          <AlertCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-500" size={16} />
        )}
        {isValid && (
          <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500" size={16} />
        )}
        {hasError && (
          <p className="text-red-500 text-xs mt-1">{hasError}</p>
        )}
      </div>
    );
  };

  // Get today's date in YYYY-MM-DD format for min attribute
  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Get current time in HH:MM format for min attribute
  const getCurrentTime = () => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  // Check if the selected date is today
  const isToday = (dateStr) => {
    if (!dateStr) return false;
    const today = new Date();
    const selectedDate = new Date(dateStr);
    return today.toDateString() === selectedDate.toDateString();
  };

  // Get minimum time based on selected date
  const getMinTime = () => {
    if (isToday(eventData.startDate)) {
      return getCurrentTime();
    }
    return "00:00";
  };

  // Get minimum end time based on start time
  const getMinEndTime = () => {
    if (!eventData.timeFrom) return "00:00";
    
    // Add 30 minutes to start time as minimum end time
    const startTime = new Date(`2000-01-01T${eventData.timeFrom}`);
    const minEndTime = new Date(startTime.getTime() + 30 * 60000); // 30 minutes later
    return minEndTime.toTimeString().slice(0, 5);
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
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Event Title <span className="text-red-500">*</span>
          </label>
          {renderInput("title", "text", "Event title", { required: true }, true)}
        </div>
        
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Category <span className="text-red-500">*</span>
          </label>
          <select
            name="categoryId"
            value={eventData.categoryId}
            onChange={handleChange}
            onBlur={handleBlur}
            className={`w-full border rounded-lg px-3 py-2 ${
              touched.categoryId && validationErrors.categoryId ? 'border-red-500 bg-red-50' : 
              touched.categoryId && eventData.categoryId ? 'border-green-500 bg-green-50' : 
              'border-gray-300'
            }`}
            required
          >
            <option value="">Select a category</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name || cat.translations?.en || cat.id}
              </option>
            ))}
          </select>
          {touched.categoryId && validationErrors.categoryId && (
            <p className="text-red-500 text-xs">{validationErrors.categoryId}</p>
          )}
          {/* Add Category Button - Only for admin/superadmin */}
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date <span className="text-red-500">*</span>
            </label>
            {renderInput("startDate", "date", "", { required: true, min: getTodayDate() }, true)}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            {renderInput("endDate", "date", "", { min: eventData.startDate || getTodayDate() })}
          </div>
        </div>

        {/* Time Range */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Time <span className="text-red-500">*</span>
            </label>
            {renderInput("timeFrom", "time", "", { required: true, min: getMinTime() }, true)}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Time <span className="text-red-500">*</span>
            </label>
            {renderInput("timeTo", "time", "", { required: true, min: getMinEndTime() }, true)}
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Location <span className="text-red-500">*</span>
          </label>
          {renderInput("location", "text", "Location", { required: true }, true)}
        </div>

        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            name="description"
            placeholder="Description"
            value={eventData.description}
            onChange={handleChange}
            onBlur={handleBlur}
            className={`w-full border rounded-lg px-3 py-2 h-20 pr-10 ${
              touched.description && validationErrors.description ? 'border-red-500 bg-red-50' : 
              touched.description && eventData.description && !validationErrors.description ? 'border-green-500 bg-green-50' : 
              'border-gray-300'
            }`}
            required
          />
          {touched.description && validationErrors.description && (
            <AlertCircle className="absolute right-3 top-8 text-red-500" size={16} />
          )}
          {touched.description && eventData.description && !validationErrors.description && (
            <CheckCircle className="absolute right-3 top-8 text-green-500" size={16} />
          )}
          {touched.description && validationErrors.description && (
            <p className="text-red-500 text-xs mt-1">{validationErrors.description}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Max Participants <span className="text-red-500">*</span>
          </label>
          {renderInput("capacity", "number", "", { min: 1, max: 1000, required: true }, true)}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Special Requirements
          </label>
          <textarea
            name="requirements"
            placeholder="Special requirements (optional)"
            value={eventData.requirements}
            onChange={handleChange}
            onBlur={handleBlur}
            className={`w-full border rounded-lg px-3 py-2 h-12 ${
              touched.requirements && validationErrors.requirements ? 'border-red-500 bg-red-50' : 'border-gray-300'
            }`}
          />
          {touched.requirements && validationErrors.requirements && (
            <p className="text-red-500 text-xs mt-1">{validationErrors.requirements}</p>
          )}
        </div>

        {/* Image Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Event Image
          </label>

          <div className="flex items-center space-x-4">
            <label className={`cursor-pointer font-bold py-2 px-4 rounded-md ${
              touched.imageFile && validationErrors.imageFile ? 'bg-red-500 hover:bg-red-600' : 'bg-yellow-500 hover:bg-yellow-600'
            } text-white`}>
              {imageFile ? "Change Image" : "Upload Image"}
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </label>

            {imageFile && (
              <span className="text-sm text-gray-600 truncate max-w-xs">
                {imageFile.name}
              </span>
            )}
          </div>
          {touched.imageFile && validationErrors.imageFile && (
            <p className="text-red-500 text-xs mt-1">{validationErrors.imageFile}</p>
          )}
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
            disabled={isSubmitting}
            className={`px-4 py-2 rounded-lg flex-1 text-white font-bold ${
              isSubmitting
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {isSubmitting ? 'Submitting...' : (isEditing ? 'Update Event' : 'Create Event')}
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