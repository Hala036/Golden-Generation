import React, { useState } from "react";
import { toast } from "react-hot-toast";
import { db, auth } from "../../firebase"; // Adjust the import path as necessary
import { doc, getDoc } from "firebase/firestore";
import { createServiceRequest } from "../../serviceRequestsService";

const Services = () => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
    volunteerField: "",
    professionalBackground: "",
    frequency: "",
    timing: "",
    days: [],
    settlement: "", // New field for settlement
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const volunteerFields = [
    "Healthcare", "Education", "Technology", "Arts", "Social Services", "Administration",
    "Consulting", "Mentoring", "Home Assistance", "Transportation", "Publicity", "Health",
    "Teaching", "High Tech", "Tourism", "Safety", "Funds", "Craftsmanship", "Culture",
  ];

  const timingOptions = [
    "Once a month", "Once every two weeks", "Once a week", "Twice a week", "Weekends", "Flexible",
  ];

  const timeOptions = ["Morning hours", "Noon hours", "Evening hours"];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    console.log("Form Data:", formData);
    try {
      const user = auth.currentUser;
      if (!user) {
        toast.error("You must be logged in to create events");
        setIsSubmitting(false);
        return;
      }

      const userDoc = await getDoc(doc(db, "users", user.uid));
      const userData = userDoc.exists() ? userDoc.data() : {};
      
      // Try different possible locations for settlement
      const userSettlement = userData.idVerification?.settlement || 
                           userData.settlement || 
                           userData.credentials?.settlement || "";
      console.log("User Settlement:", userSettlement);

      if (!userSettlement) {
        toast.error("Failed to fetch user settlement.");
        setIsSubmitting(false);
        return;
      }

      const serviceRequestData = {
        ...formData,
        settlement: userSettlement, // Ensure settlement is included
        status: "pending",
      };

      await createServiceRequest(serviceRequestData);
      toast.success("Service request created successfully!");

      setFormData({
        title: "",
        description: "",
        location: "",
        volunteerField: "",
        professionalBackground: "",
        frequency: "",
        timing: "",
        days: [],
        settlement: userSettlement, // Reset settlement field
      });
      setIsSubmitting(false);
    } catch (error) {
      toast.error("Failed to create service request");
    }
  };

  return (
    <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-auto max-h-screen overflow-y-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Create a Service Request</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
              placeholder="e.g., Medical Escort Needed"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
              placeholder="e.g., Community Center"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Volunteer Field</label>
            <select
              name="volunteerField"
              value={formData.volunteerField}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
              required
            >
              <option value="">Select Field</option>
              {volunteerFields.map((field) => (
                <option key={field} value={field}>
                  {field}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Professional Background</label>
            <input
              type="text"
              name="professionalBackground"
              value={formData.professionalBackground}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
              placeholder="e.g., Healthcare, Education"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
            <select
              name="frequency"
              value={formData.frequency}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
            >
              <option value="">Select Frequency</option>
              {timingOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Timing</label>
            <select
              name="timing"
              value={formData.timing}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
            >
              <option value="">Select Timing</option>
              {timeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Select Days <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(day => (
              <div
                key={day}
                onClick={() =>
                  setFormData((prev) => {
                    const selectedDays = prev.days || [];
                    return {
                      ...prev,
                      days: selectedDays.includes(day)
                        ? selectedDays.filter(d => d !== day)
                        : [...selectedDays, day]
                    };
                  })
                }
                className={`cursor-pointer p-3 rounded-lg border-2 transition-all duration-200 flex flex-col items-center gap-2 hover:shadow-md ${
                  (formData.days || []).includes(day)
                    ? 'border-[#FFD966] bg-[#FFD966] bg-opacity-20'
                    : 'border-gray-300 hover:border-[#FFD966] hover:bg-gray-50'
                }`}
              >
                <span className={`text-sm font-medium ${(formData.days || []).includes(day) ? 'text-gray-900 font-bold' : 'text-gray-600'}`}>
                  {day}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            className="w-full p-2 border rounded"
            rows="3"
            placeholder="Describe the request in detail"
            required
          ></textarea>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`px-4 py-2 rounded-lg text-white font-bold ${
              isSubmitting ? "bg-gray-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"
            }`}
          >
            {isSubmitting ? "Submitting..." : "Create Request"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Services;