import React, { useState, useEffect } from 'react';
import { X, AlertCircle, CheckCircle } from 'lucide-react';
import { db, auth, storage } from '../../firebase';
import { collection, addDoc, getDocs, serverTimestamp, doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { toast } from 'react-hot-toast';
import AddCategoryModal from "../AdminProfile/AddCategoryModal";
import useAuth from '../../hooks/useAuth';
import CustomTimePickerWrapper from './CustomTimePicker';
import SearchableDropdown from '../SearchableDropdown';
import { motion, AnimatePresence } from 'framer-motion';
import { getCategoryAppearance } from '../../utils/categoryColors';
import { getAllSettlements } from '../../utils/getSettlements';

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
    requirements: "",
  });
  const [settlements, setSettlements] = useState([]);

  const generateTimeSlots = (interval) => {
    const slots = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += interval) {
        const h = String(hour).padStart(2, '0');
        const m = String(minute).padStart(2, '0');
        slots.push(`${h}:${m}`);
      }
    }
    return slots;
  };

  const timeSlots = generateTimeSlots(30); // 30-minute intervals

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

  // Fetch settlements for superadmin
  useEffect(() => {
    if (actualUserRole === 'superadmin') {
      (async () => {
        const allSettlements = await getAllSettlements();
        // Add 'All Settlements' option at the top
        const settlementsWithAll = [
          { id: 'all', name: 'All Settlements' },
          ...allSettlements
        ];
        setSettlements(settlementsWithAll);
        // If not editing, set default to 'all'
        if (!isEditing && settlementsWithAll.length > 0) {
          setEventData(prev => ({ ...prev, settlement: settlementsWithAll[0].id }));
        }
      })();
    }
  }, [actualUserRole, isEditing]);

  // Check for selected date from calendar grid
  useEffect(() => {
    if (!isEditing) {
      const selectedDate = sessionStorage.getItem('selectedEventDate');
      if (selectedDate) {
        setEventData(prev => ({ ...prev, startDate: selectedDate }));
        // Clear the selected date from sessionStorage
        sessionStorage.removeItem('selectedEventDate');
      }
    }
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
      let eventSettlement = "";
      if (actualUserRole === "superadmin") {
        eventSettlement = eventData.settlement;
      } else {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        const userData = userDoc.data() || {};
        eventSettlement = (userData.idVerification && userData.idVerification.settlement) || userData.settlement || "";
      }
      console.log('User settlement:', eventSettlement);
      
      let eventStatus = "active";
      let eventColor = "yellow";
      if (actualUserRole === "retiree") {
        eventStatus = "pending";
      }
      // Always use the picked category's color (hex value from category.color)
      const selectedCategory = categories.find(cat => cat.id === eventData.categoryId);
      if (selectedCategory && selectedCategory.color) {
        eventColor = selectedCategory.color;
      }

      // Format date to DD-MM-YYYY for consistency
      const formatDate = (dateStr) => {
        if (!dateStr) return "";
        const [year, month, day] = dateStr.split('-');
        return `${day}-${month}-${year}`;
      };

      const { isRecurring, recurringType, recurringEndDate, ...eventDataNoRecurring } = eventData;
      const newEvent = {
        ...eventDataNoRecurring,
        startDate: formatDate(eventData.startDate),
        endDate: formatDate(eventData.endDate || eventData.startDate),
        date: formatDate(eventData.startDate), // Keep for backward compatibility
        createdBy: user.uid,
        createdAt: serverTimestamp(),
        participants: [],
        status: eventStatus,
        color: eventColor, // Store the picked hex color
        settlement: eventSettlement,
        imageUrl: imageUrl
      };

      // Remove any undefined fields (extra safety)
      Object.keys(newEvent).forEach(key => {
        if (newEvent[key] === undefined) delete newEvent[key];
      });

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
    return isToday(eventData.startDate) ? getCurrentTime() : "00:00";
  };

  // Get minimum end time based on start time
  const getMinEndTime = () => {
    if (!eventData.timeFrom) return "00:00";
    
    // Add 30 minutes to start time as minimum end time
    const startTime = new Date(`2000-01-01T${eventData.timeFrom}`);
    const minEndTime = new Date(startTime.getTime() + 30 * 60000); // 30 minutes later
    return minEndTime.toTimeString().slice(0, 5);
  };

  const getStartTimeDisabledStatus = (time) => {
    return isToday(eventData.startDate) && time < getCurrentTime();
  };

  const getEndTimeDisabledStatus = (time) => {
    const isSameDay = !eventData.endDate || eventData.startDate === eventData.endDate;
    return isSameDay && eventData.timeFrom && time <= eventData.timeFrom;
  };

  const categoryOptions = categories.map(cat => ({
    value: cat.id,
    label: cat.name,
  }));

  // Handle SearchableDropdown change
  const handleCategoryChange = (selectedOption) => {
    setEventData(prev => ({
      ...prev,
      categoryId: selectedOption.value
    }));
    setTouched(prev => ({
      ...prev,
      categoryId: true
    }));
  };

  return (
    <div
      className={`bg-white rounded-lg p-3 md:p-6 overflow-x-auto w-full mx-2 md:mx-4 ${
        parseFloat(getComputedStyle(document.documentElement).fontSize) >= 19
          ? 'max-h-[80vh] max-w-[90vw]'
          : 'max-h-screen max-w-md'
      } overflow-y-auto`}
    >
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          {isEditing ? 'Edit Event' : 'Create New Event'}
        </h2>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M6 18L18 6M6 6l12 12"
            ></path>
          </svg>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Event Title <span className="text-red-500">*</span>
          </label>
          {renderInput("title", "text", "e.g., Morning Yoga Session", { required: true, minLength: 3 })}
        </div>

        <div className="flex items-end">
          <div className="flex-grow">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category <span className="text-red-500">*</span>
            </label>
            <SearchableDropdown
              name="categoryId"
              options={categoryOptions}
              value={eventData.categoryId}
              onChange={handleCategoryChange}
              onBlur={handleBlur}
              touched={touched.categoryId}
              error={validationErrors.categoryId}
              placeholder="Select a category"
            />
            {touched.categoryId && validationErrors.categoryId && (
              <p className="text-red-500 text-xs mt-1">{validationErrors.categoryId}</p>
            )}
          </div>
          <div className="ml-2">
            {(actualUserRole === "admin" || actualUserRole === "superadmin") && (
              <button
                type="button"
                onClick={() => setShowAddCategoryModal(true)}
                className="p-2.5 border rounded-lg hover:bg-gray-100"
                title="Add New Category"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Time and Date Section */}
        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-lg font-medium text-gray-800 mb-4">Time & Date</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Start Time <span className="text-red-500">*</span>
                  </label>
                </div>
                <CustomTimePickerWrapper
                  name="timeFrom"
                  value={eventData.timeFrom}
            onChange={handleChange}
                  onBlur={handleBlur}
                  timeSlots={timeSlots}
                  getIsDisabled={getStartTimeDisabledStatus}
                  touched={touched.timeFrom}
                  error={validationErrors.timeFrom}
                />
                {touched.timeFrom && validationErrors.timeFrom && (
                  <p className="text-red-500 text-xs mt-1">{validationErrors.timeFrom}</p>
                )}
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-sm font-medium text-gray-700">
                    End Time <span className="text-red-500">*</span>
                  </label>
                </div>
                <CustomTimePickerWrapper
                  name="timeTo"
                  value={eventData.timeTo}
            onChange={handleChange}
                  onBlur={handleBlur}
                  timeSlots={timeSlots}
                  getIsDisabled={getEndTimeDisabledStatus}
                  touched={touched.timeTo}
                  error={validationErrors.timeTo}
                />
                {touched.timeTo && validationErrors.timeTo && (
                  <p className="text-red-500 text-xs mt-1">{validationErrors.timeTo}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Additional Details Section */}
        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-lg font-medium text-gray-800 mb-4">Additional Details</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              {renderInput("description", "textarea", "Provide details about the event...")}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location
                </label>
                {renderInput("location", "text", "e.g., Community Hall")}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Participants
                </label>
                {renderInput("capacity", "number", "e.g., 10", { min: 1 })}
              </div>
            </div>

            {/* Image Upload Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Event Image
                <span className="text-gray-400 text-xs ml-1">(optional, JPG/PNG/GIF/WebP, max 5MB)</span>
              </label>
              <input
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                onChange={handleImageChange}
                className="block w-full text-sm text-gray-700 border border-gray-300 rounded-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              {imageFile && (
                <div className="mt-2">
                  <img
                    src={URL.createObjectURL(imageFile)}
                    alt="Preview"
                    className="h-32 w-auto rounded shadow border border-gray-200 object-contain"
                  />
                </div>
              )}
              {touched.imageFile && validationErrors.imageFile && (
                <p className="text-red-500 text-xs mt-1">{validationErrors.imageFile}</p>
              )}
            </div>

            {actualUserRole === 'superadmin' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Settlement <span className="text-red-500">*</span>
                </label>
                <select
                  name="settlement"
                  value={eventData.settlement || ''}
                  onChange={handleChange}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  required
                >
                  {settlements.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex justify-end pt-6 border-t border-gray-200">
          <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg mr-2 hover:bg-gray-300">
            Cancel
          </button>
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
        </div>
      </form>

      {/* Add Category Modal */}
      {showAddCategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm flex items-center justify-center z-[60]">
          <div className="bg-white p-3 md:p-6 rounded-lg max-w-lg w-full relative">
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