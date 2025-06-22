import React, { useState, useEffect } from "react";
import { FaSearch, FaPlus, FaEdit, FaTrash, FaUserPlus, FaCheck, FaTimes, FaHistory, FaInfoCircle } from "react-icons/fa";
import { toast } from "react-hot-toast";
import { 
  createJobRequest, 
  getJobRequests, 
  updateJobRequest, 
  deleteJobRequest,
  matchSeniorsToJobRequest,
  inviteSeniorToJobRequest
} from "../../jobRequestsService";
import { getAvailableSettlements } from "../../firebase";
import MatchDetails from "./MatchDetails";
import StatusHistory from "./StatusHistory";
import { triggerNotification } from "../../components/SharedDashboard/TriggerNotifications"; // Import triggerNotification
import { useAuth } from "../../hooks/useAuth"; // Import useAuth hook

const Jobs = () => {
  const { currentUser } = useAuth(); // Access currentUser from useAuth

  // State for job requests
  const [jobRequests, setJobRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State for form
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
    volunteerField: "",
    professionalBackground: "",
    timing: ""
  });

  // State for editing
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);

  // State for settlements (locations)
  const [settlements, setSettlements] = useState([]);

  // State for viewing match details
  const [selectedJobRequest, setSelectedJobRequest] = useState(null);
  const [showMatchDetails, setShowMatchDetails] = useState(false);
  const [selectedSenior, setSelectedSenior] = useState(null);

  // State for viewing status history
  const [showStatusHistory, setShowStatusHistory] = useState(false);

  // Volunteer field options
  const volunteerFields = [
    "Healthcare", "Education", "Technology", "Arts", "Social Services", "Administration",
    "Consulting", "Mentoring", "Home Assistance", "Transportation", 'publicity', 'health',
    'eater', 'teaching', 'High tech', 'tourism', 'safety', 'funds', 'A special treat',
    'craftsmanship', 'Aaliyah', 'culture'
  ];

  // Timing options
  const timingOptions = [
    "once a month", "once every two weeks", "once a week", "twice a week", "Weekends", "Flexible"
  ];
  const timeOptions = ['morning hours', 'noon hours', 'evening hours'];

  // Status options
  const statusOptions = [
    "Active", "In Progress", "Fulfilled", "Archived"
  ];

  // Fetch job requests and settlements on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const fetchedJobRequests = await getJobRequests(); // No filters
        setJobRequests(fetchedJobRequests);

        const fetchedSettlements = await getAvailableSettlements();
        setSettlements(fetchedSettlements);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load data. Please try again.");
        toast.error("Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      const jobRequestData = {
        ...formData,
        volunteerDays: formData.days || [], // Add volunteerDays
        volunteerHours: formData.timing || "", // Add volunteerHours
        volunteerFrequency: formData.frequency || "", // Add volunteerFrequency
        createdBy: currentUser.uid, // Admin ID
        createdAt: new Date(), // Timestamp
        status: "Active", // Default status
        statusHistory: [
          {
            status: "Active",
            timestamp: new Date(),
            changedBy: currentUser.uid,
            notes: "Job request created",
          },
        ],
        assignedSeniors: [], // Initialize empty array
      };

      if (editMode) {
        await updateJobRequest(editId, jobRequestData);
        toast.success("Voluntary request updated successfully");
      } else {
        await createJobRequest(jobRequestData);
        toast.success("Voluntary request created successfully");
      }

      resetForm();
      const updatedJobRequests = await getJobRequests();
      setJobRequests(updatedJobRequests);
    } catch (err) {
      console.error("Error submitting form:", err);
      toast.error(editMode ? "Failed to update voluntary request" : "Failed to create voluntary request");
    } finally {
      setLoading(false);
    }
  };

  // Handle job request deletion
  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this voluntary request?")) {
      try {
        setLoading(true);
        await deleteJobRequest(id);
        toast.success("Voluntary request deleted successfully");

        const updatedJobRequests = await getJobRequests();
        setJobRequests(updatedJobRequests);
      } catch (err) {
        console.error("Error deleting voluntary request:", err);
        toast.error("Failed to delete voluntary request");
      } finally {
        setLoading(false);
      }
    }
  };

  // Handle edit button click
  const handleEdit = (jobRequest) => {
    setFormData({
      title: jobRequest.title,
      description: jobRequest.description,
      location: jobRequest.location,
      volunteerField: jobRequest.volunteerField,
      professionalBackground: jobRequest.professionalBackground || "",
      timing: jobRequest.timing
    });
    setEditMode(true);
    setEditId(jobRequest.id);
    setShowForm(true);
    window.scrollTo(0, 0);
  };

  // Handle status change
  const handleStatusChange = async (id, newStatus) => {
    try {
      setLoading(true);
      await updateJobRequest(id, { 
        status: newStatus,
        statusNotes: `Status manually changed to ${newStatus}`
      });
      toast.success(`Status updated to ${newStatus}`);

      const updatedJobRequests = await getJobRequests();
      setJobRequests(updatedJobRequests);
    } catch (err) {
      console.error("Error updating status:", err);
      toast.error("Failed to update status");
    } finally {
      setLoading(false);
    }
  };

  // Handle inviting a senior
  const handleInviteSenior = async (jobRequestId, seniorId) => {
    try {
      setLoading(true);
      await inviteSeniorToJobRequest(jobRequestId, seniorId);

      // Send notification to the invited senior
      const jobRequest = jobRequests.find((jr) => jr.id === jobRequestId);
      await triggerNotification({
        message: `You have been invited to volunteer for the job: "${jobRequest.title}".`,
        target: [seniorId], // Target specific senior
        type: "request", // Notification type
        link: `/jobs/${jobRequestId}`, // Link to job details
        createdBy: currentUser.uid // Admin who invited
      });

      toast.success("Senior invited successfully");

      const updatedJobRequests = await getJobRequests();
      setJobRequests(updatedJobRequests);

      if (showMatchDetails && selectedJobRequest) {
        const updatedJobRequest = updatedJobRequests.find(jr => jr.id === selectedJobRequest.id);
        setSelectedJobRequest(updatedJobRequest);
      }
    } catch (err) {
      console.error("Error inviting senior:", err);
      toast.error("Failed to invite senior");
    } finally {
      setLoading(false);
    }
  };

  // Handle re-running the matching algorithm
  const handleRerunMatching = async (jobRequestId) => {
    try {
      setLoading(true);
      await matchSeniorsToJobRequest(jobRequestId);
      toast.success("Matching algorithm re-run successfully");

      const updatedJobRequests = await getJobRequests();
      setJobRequests(updatedJobRequests);

      if (showMatchDetails && selectedJobRequest) {
        const updatedJobRequest = updatedJobRequests.find(jr => jr.id === selectedJobRequest.id);
        setSelectedJobRequest(updatedJobRequest);
      }
    } catch (err) {
      console.error("Error re-running matching algorithm:", err);
      toast.error("Failed to re-run matching algorithm");
    } finally {
      setLoading(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      location: "",
      volunteerField: "",
      professionalBackground: "",
      timing: ""
    });
    setEditMode(false);
    setEditId(null);
    setShowForm(false);
  };

  // View match details
  const viewMatchDetails = (jobRequest) => {
    setSelectedJobRequest(jobRequest);
    setShowMatchDetails(true);
    setSelectedSenior(null);
    setShowStatusHistory(false);
  };

  // View detailed match for a specific senior
  const viewSeniorMatchDetails = (jobRequest, seniorId) => {
    setSelectedJobRequest(jobRequest);
    setSelectedSenior(seniorId);
    setShowMatchDetails(true);
    setShowStatusHistory(false);
  };

  // Close match details
  const closeMatchDetails = () => {
    setSelectedJobRequest(null);
    setShowMatchDetails(false);
    setSelectedSenior(null);
  };

  // View status history
  const viewStatusHistory = (jobRequest) => {
    setSelectedJobRequest(jobRequest);
    setShowStatusHistory(true);
    setShowMatchDetails(false);
    setSelectedSenior(null);
  };

  // Close status history
  const closeStatusHistory = () => {
    setShowStatusHistory(false);
    setSelectedJobRequest(null);
  };

  // Render loading state
  if (loading && !jobRequests.length) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-xl text-gray-500">Loading voluntary requests...</div>
        </div>
      </div>
    );
  }

  // Render error state
  if (error && !jobRequests.length) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-xl text-red-500">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Voluntary Requests</h1>
        <div className="flex space-x-4">
          <button
            onClick={() => {
              resetForm();
              setShowForm(!showForm);
            }}
            className="flex items-center space-x-2 bg-yellow-400 hover:bg-yellow-500 text-black font-medium py-2 px-4 rounded"
          >
            <FaPlus />
            <span>{showForm ? "Cancel" : "New Voluntary Request"}</span>
          </button>
        </div>
      </div>

      {/* Create/Edit Job Request Form */}
      {showForm && (
        <div className="bg-white rounded shadow p-6 mb-6">
          <h3 className="text-xl font-bold mb-4">
            {editMode ? "Edit Voluntary Request" : "Create New Voluntary Request"}
          </h3>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
                  placeholder="e.g. Medical Escort Needed"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <select
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
                  required
                >
                  <option value="">Select Location</option>
                  {settlements.map((settlement) => (
                    <option key={settlement.id} value={settlement.name}>
                      {settlement.name}
                    </option>
                  ))}
                </select>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Professional Background (Optional)
                </label>
                <input
                  type="text"
                  name="professionalBackground"
                  value={formData.professionalBackground}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
                  placeholder="e.g. Healthcare, Education"
                />
              </div>

              {/* Frequency */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
                <select
                  name="frequency"
                  value={formData.frequency || ""}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
                >
                  <option value="">Select frequency</option>
                  {timingOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              {/* Timing */}
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

 {/* Days selection - like gender but for days */}
<div className="space-y-1">
  <label className="block text-sm font-medium text-gray-700">
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
                      

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
                  rows="3"
                  placeholder="Describe the voluntary request in detail"
                  required
                ></textarea>
              </div>
            </div>
            <div className="flex space-x-4">
              <button
                type="submit"
                className="bg-yellow-400 hover:bg-yellow-500 text-black font-medium py-2 px-4 rounded"
                disabled={loading}
              >
                {loading ? "Saving..." : editMode ? "Update Voluntary Request" : "Create Voluntary Request"}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2 px-4 rounded"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
      {showMatchDetails && selectedJobRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          {selectedSenior ? (
            <MatchDetails 
              jobRequestId={selectedJobRequest.id} 
              seniorId={selectedSenior} 
              onClose={closeMatchDetails} 
            />
          ) : (
            <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">
                  Match Results: {selectedJobRequest.title}
                </h3>
                <button
                  onClick={closeMatchDetails}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <FaTimes className="text-xl" />
                </button>
              </div>
              
              <div className="mb-4">
                <p className="text-gray-600 mb-2">
                  <strong>Location:</strong> {selectedJobRequest.location}
                </p>
                <p className="text-gray-600 mb-2">
                  <strong>Volunteer Field:</strong> {selectedJobRequest.volunteerField}
                </p>
                <p className="text-gray-600 mb-2">
                  <strong>Professional Background:</strong>{" "}
                  {selectedJobRequest.professionalBackground || "Not specified"}
                </p>
                <p className="text-gray-600 mb-2">
                  <strong>Timing:</strong> {selectedJobRequest.timing}
                </p>
                <p className="text-gray-600">
                  <strong>Description:</strong> {selectedJobRequest.description}
                </p>
              </div>
              
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-lg font-semibold">Matching Seniors</h4>
                  <button
                    onClick={() => handleRerunMatching(selectedJobRequest.id)}
                    className="bg-blue-500 hover:bg-blue-600 text-white text-sm py-1 px-3 rounded"
                  >
                    Re-run Matching
                  </button>
                </div>
                
                {selectedJobRequest.matchResults && selectedJobRequest.matchResults.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border border-gray-200">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="py-2 px-4 border-b text-left">Name</th>
                          <th className="py-2 px-4 border-b text-left">Location</th>
                          <th className="py-2 px-4 border-b text-left">Background</th>
                          <th className="py-2 px-4 border-b text-left">Interests</th>
                          <th className="py-2 px-4 border-b text-center">Match Score</th>
                          <th className="py-2 px-4 border-b text-center">Status</th>
                          <th className="py-2 px-4 border-b text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedJobRequest.matchResults.map((match) => {
                          // Check if senior is already invited
                          const isInvited = selectedJobRequest.assignedSeniors &&
                            selectedJobRequest.assignedSeniors.some(
                              (assignment) => assignment.seniorId === match.seniorId
                            );
                          
                          // Get assignment status if invited
                          const assignmentStatus = isInvited
                            ? selectedJobRequest.assignedSeniors.find(
                                (assignment) => assignment.seniorId === match.seniorId
                              ).status
                            : null;
                          
                          return (
                            <tr key={match.seniorId} className="hover:bg-gray-50">
                              <td className="py-2 px-4 border-b">{match.seniorName}</td>
                              <td className="py-2 px-4 border-b">{match.seniorLocation}</td>
                              <td className="py-2 px-4 border-b">
                                {match.seniorBackground && match.seniorBackground.length > 0
                                  ? match.seniorBackground
                                  : "Not specified"}
                              </td>
                              <td className="py-2 px-4 border-b">
                                {match.seniorInterests && match.seniorInterests.length > 0
                                  ? match.seniorInterests.join(", ")
                                  : "Not specified"}
                              </td>
                              <td className="py-2 px-4 border-b text-center">
                                <span
                                  className={`inline-block rounded-full px-3 py-1 text-sm font-semibold ${
                                    match.score >= 70
                                      ? "bg-green-100 text-green-800"
                                      : match.score >= 50
                                      ? "bg-yellow-100 text-yellow-800"
                                      : "bg-gray-100 text-gray-800"
                                  }`}
                                >
                                  {match.score}%
                                </span>
                              </td>
                              <td className="py-2 px-4 border-b text-center">
                                {isInvited ? (
                                  <span
                                    className={`inline-block rounded-full px-3 py-1 text-sm font-semibold ${
                                      assignmentStatus === "Accepted"
                                        ? "bg-green-100 text-green-800"
                                        : assignmentStatus === "Declined"
                                        ? "bg-red-100 text-red-800"
                                        : "bg-blue-100 text-blue-800"
                                    }`}
                                  >
                                    {assignmentStatus}
                                  </span>
                                ) : (
                                  <span className="inline-block rounded-full px-3 py-1 text-sm font-semibold bg-gray-100 text-gray-800">
                                    Not Invited
                                  </span>
                                )}
                              </td>
                              <td className="py-2 px-4 border-b text-center">
                                <div className="flex justify-center space-x-2">
                                  <button
                                    onClick={() => viewSeniorMatchDetails(selectedJobRequest, match.seniorId)}
                                    className="bg-blue-500 hover:bg-blue-600 text-white text-sm py-1 px-2 rounded flex items-center"
                                    title="View detailed match"
                                  >
                                    <FaInfoCircle />
                                  </button>
                                  
                                  {!isInvited && (
                                    <button
                                      onClick={() => handleInviteSenior(selectedJobRequest.id, match.seniorId)}
                                      className="bg-green-500 hover:bg-green-600 text-white text-sm py-1 px-2 rounded flex items-center"
                                      title="Invite senior"
                                    >
                                      <FaUserPlus />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-gray-500 italic">No matching seniors found.</p>
                )}
              </div>
              
              <div className="mt-6">
                <h4 className="text-lg font-semibold mb-2">Assigned Seniors</h4>
                {selectedJobRequest.assignedSeniors && selectedJobRequest.assignedSeniors.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border border-gray-200">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="py-2 px-4 border-b text-left">Senior ID</th>
                          <th className="py-2 px-4 border-b text-center">Status</th>
                          <th className="py-2 px-4 border-b text-left">Assigned At</th>
                          <th className="py-2 px-4 border-b text-left">Response At</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedJobRequest.assignedSeniors.map((assignment) => (
                          <tr key={assignment.seniorId} className="hover:bg-gray-50">
                            <td className="py-2 px-4 border-b">{assignment.seniorId}</td>
                            <td className="py-2 px-4 border-b text-center">
                              <span
                                className={`inline-block rounded-full px-3 py-1 text-sm font-semibold ${
                                  assignment.status === "Accepted"
                                    ? "bg-green-100 text-green-800"
                                    : assignment.status === "Declined"
                                    ? "bg-red-100 text-red-800"
                                    : "bg-blue-100 text-blue-800"
                                }`}
                              >
                                {assignment.status}
                              </span>
                            </td>
                            <td className="py-2 px-4 border-b">
                              {assignment.assignedAt ? new Date(assignment.assignedAt.seconds * 1000).toLocaleString() : "N/A"}
                            </td>
                            <td className="py-2 px-4 border-b">
                              {assignment.responseAt ? new Date(assignment.responseAt.seconds * 1000).toLocaleString() : "Pending"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-gray-500 italic">No seniors assigned yet.</p>
                )}
              </div>
              
              <div className="mt-6 flex justify-end">
                <button
                  onClick={closeMatchDetails}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2 px-4 rounded"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Status History Modal */}
      {showStatusHistory && selectedJobRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">
                Status History: {selectedJobRequest.title}
              </h3>
              <button
                onClick={closeStatusHistory}
                className="text-gray-500 hover:text-gray-700"
              >
                <FaTimes className="text-xl" />
              </button>
            </div>
            <StatusHistory statusHistory={selectedJobRequest.statusHistory || []} />
          </div>
        </div>
      )}

      {/* Job Requests List */}
      <div className="bg-white rounded shadow overflow-hidden">
        <h3 className="text-xl font-bold p-4 border-b">
          Voluntary Requests ({jobRequests.length})
        </h3>
        
        {jobRequests.length === 0 ? (
          <p className="p-6 text-gray-500 italic">No voluntary requests found.</p>
        ) : (
          <div className="divide-y">
            {jobRequests.map((jobRequest) => (
              <div key={jobRequest.id} className="p-4 hover:bg-gray-50">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-bold text-lg">{jobRequest.title}</h4>
                    <div className="flex items-center space-x-2 text-sm text-gray-600 mb-1">
                      <span>{jobRequest.location}</span>
                      <span>•</span>
                      <span>{jobRequest.volunteerField}</span>
                      <span>•</span>
                      <span>{jobRequest.timing}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span
                      className={`inline-block rounded-full px-3 py-1 text-sm font-semibold ${
                        jobRequest.status === "Active"
                          ? "bg-green-100 text-green-800"
                          : jobRequest.status === "In Progress"
                          ? "bg-blue-100 text-blue-800"
                          : jobRequest.status === "Fulfilled"
                          ? "bg-purple-100 text-purple-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {jobRequest.status}
                    </span>
                    <button
                      className="text-gray-500 hover:text-gray-700"
                      onClick={() => handleEdit(jobRequest)}
                      title="Edit"
                    >
                      <FaEdit className="text-lg" />
                    </button>
                    <button
                      onClick={() => handleDelete(jobRequest.id)}
                      className="text-red-500 hover:text-red-700"
                      title="Delete"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
                
                <p className="text-gray-700 mb-3">{jobRequest.description}</p>
                
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-sm text-gray-500">
                      Created: {jobRequest.createdAt ? new Date(jobRequest.createdAt.seconds * 1000).toLocaleString() : "N/A"}
                    </span>
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => viewMatchDetails(jobRequest)}
                      className="flex items-center space-x-1 bg-blue-100 hover:bg-blue-200 text-blue-700 text-sm py-1 px-3 rounded"
                    >
                      <FaSearch className="text-xs" />
                      <span>
                        View Matches ({jobRequest.matchResults ? jobRequest.matchResults.length : 0})
                      </span>
                    </button>
                    
                    <button
                      onClick={() => viewStatusHistory(jobRequest)}
                      className="flex items-center space-x-1 bg-purple-100 hover:bg-purple-200 text-purple-700 text-sm py-1 px-3 rounded"
                    >
                      <FaHistory className="text-xs" />
                      <span>History</span>
                    </button>
                    
                    <button
                      onClick={() => handleRerunMatching(jobRequest.id)}
                      className="flex items-center space-x-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm py-1 px-3 rounded"
                    >
                      <FaHistory className="text-xs" />
                      <span>Re-match</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Jobs;

