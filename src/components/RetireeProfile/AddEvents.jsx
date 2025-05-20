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
    type: EVENT_TYPES[0],
    date: "",
    time: "",
    location: "",
    description: "",
    capacity: "",
    requirements: ""
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEventData(prev => ({
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

      const newEvent = {
        ...eventData,
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
        type: EVENT_TYPES[0],
        date: "",
        time: "",
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
            name="type"
            value={eventData.type}
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

        {/* Date and Time */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date
            </label>
            <input
              type="date"
              name="date"
              value={eventData.date}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-yellow-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Time
            </label>
            <input
              type="time"
              name="time"
              value={eventData.time}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-yellow-400"
            />
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