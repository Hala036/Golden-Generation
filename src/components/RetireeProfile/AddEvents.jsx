import React, { useState } from "react";
import { toast } from "react-hot-toast";
import { db, auth } from "../../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

const EVENT_TYPES = [
  "Trip",
  "Vacation",
  "Workshop",
  "Lecture",
  "Home Group",
  "Social Gathering"
];

const AddEvents = () => {
  const [eventData, setEventData] = useState({
    title: "",
    categoryId: EVENT_TYPES[0],
    startDate: "",
    endDate: "",
    timeFrom: "",
    timeTo: "",
    location: "",
    description: "",
    capacity: "",
    requirements: ""
  });

  // New state for files
  const [selectedFiles, setSelectedFiles] = useState([]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEventData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle file selection
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(prev => [...prev, ...files]);
  };

  // Remove a file from the list
  const handleRemoveFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const user = auth.currentUser;
      if (!user) {
        toast.error("You must be logged in to create events");
        return;
      }

      // Format dates to DD-MM-YYYY
      const formatDate = (date) => {
        const [year, month, day] = date.split("-");
        return `${day}-${month}-${year}`;
      };

      const newEvent = {
        ...eventData,
        categoryId: eventData.categoryId.toLowerCase(),
        startDate: formatDate(eventData.startDate),
        createdBy: user.uid,
        createdAt: serverTimestamp(),
        participants: [],
        status: "active"
      };

      await addDoc(collection(db, "events"), newEvent);
      toast.success("Event created successfully!");
      
      // Reset form
      setEventData({
        title: "",
        categoryId: EVENT_TYPES[0],
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
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Create New Event</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Event Title
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
            Event Type
          </label>
          <select
            name="categoryId"
            value={eventData.categoryId}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-yellow-400"
          >
            {EVENT_TYPES.map(type => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        {/* Add Photos and Files */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Add photos and files</label>
          <input
            id="add-files-input"
            type="file"
            multiple
            accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/zip,application/x-zip-compressed,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,.txt"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
          <button
            type="button"
            className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-md mb-2"
            onClick={() => document.getElementById('add-files-input').click()}
          >
            Add photos and files
          </button>
          {/* Show selected files */}
          {selectedFiles.length > 0 && (
            <ul className="mt-2 space-y-1">
              {selectedFiles.map((file, idx) => (
                <li key={idx} className="flex items-center justify-between bg-gray-100 px-2 py-1 rounded">
                  <span className="text-sm text-gray-800">{file.name}</span>
                  <button
                    type="button"
                    className="ml-2 text-red-500 hover:text-red-700 text-xs"
                    onClick={() => handleRemoveFile(idx)}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Date / Date Range */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Date / Date Range
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
              <span className="block text-xs text-gray-500 mt-1">Start date</span>
            </div>
            <div>
              <input
                type="date"
                name="endDate"
                value={eventData.endDate}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-yellow-400"
              />
              <span className="block text-xs text-gray-500 mt-1">End date (optional)</span>
            </div>
          </div>
        </div>
        {/* Time Range */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Time Range
          </label>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">From</label>
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
              <label className="block text-xs text-gray-500 mb-1">To</label>
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
            Location
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
            Description
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
              Capacity
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
            Special Requirements (Optional)
          </label>
          <textarea
            name="requirements"
            value={eventData.requirements}
            onChange={handleChange}
            rows="3"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-yellow-400"
            placeholder="Any special requirements or items participants should bring..."
          />
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="bg-[#FFD966] hover:bg-yellow-500 text-white font-bold py-2 px-6 rounded-md transition-colors duration-200"
          >
            Create Event
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddEvents;