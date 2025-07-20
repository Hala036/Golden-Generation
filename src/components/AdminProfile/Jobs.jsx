import React, { useState, useEffect } from "react";
import { FaSearch, FaPlus, FaEdit, FaTrash, FaUserPlus, FaCheck, FaTimes, FaHistory, FaInfoCircle, FaBriefcase } from "react-icons/fa";
import { toast } from "react-hot-toast";
import { 
  createJobRequest, 
  getJobRequests, 
  updateJobRequest, 
  deleteJobRequest,
  matchSeniorsToJobRequest,
  inviteSeniorToJobRequest
} from "../../jobRequestsService";
import { getAvailableSettlements, auth } from "../../firebase";
import MatchDetails from "./MatchDetails";
import StatusHistory from "./StatusHistory";
import { triggerNotification } from "../../components/SharedDashboard/TriggerNotifications"; // Import triggerNotification function
import useAuth from "../../hooks/useAuth"; // Import useAuth hook
import EmptyState from "../EmptyState"; // Import EmptyState component
import { useLanguage } from "../../context/LanguageContext"; // Import useLanguage
import Skeleton from 'react-loading-skeleton'; // Import Skeleton
import 'react-loading-skeleton/dist/skeleton.css'; // Import Skeleton CSS
import Select from 'react-select';
import VoluntaryRequestForm from './VoluntaryRequestForm';

const Jobs = () => {
  const { user, userData } = useAuth(); // Access user (firebase) and userData (profile)
  const { t } = useLanguage(); // Add translation hook

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
    frequency: [], // now array
    timing: [] // now array
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
    t("service.fields.healthcare"),
    t("service.fields.education"),
    t("service.fields.technology"),
    t("service.fields.arts"),
    t("service.fields.socialServices"),
    t("service.fields.administration"),
    t("service.fields.consulting"),
    t("service.fields.mentoring"),
    t("service.fields.homeAssistance"),
    t("service.fields.transportation"),
    t("service.fields.publicity"),
    t("service.fields.health"),
    t("service.fields.teaching"),
    t("service.fields.highTech"),
    t("service.fields.tourism"),
    t("service.fields.safety"),
    t("service.fields.funds"),
    t("service.fields.craftsmanship"),
    t("service.fields.culture"),
  ];

  // Timing options
  const timingOptions = [
    t("service.timing.onceMonth"),
    t("service.timing.onceTwoWeeks"),
    t("service.timing.onceWeek"),
    t("service.timing.twiceWeek"),
    t("service.timing.weekends"),
    t("service.timing.flexible"),
    t("service.timing.oneTime"),
  ];
  const timeOptions = [
    t("service.time.morning"),
    t("service.time.noon"),
    t("service.time.evening"),
  ];

  // Status options
  const statusOptions = [
    t("admin.jobs.status.active"),
    t("admin.jobs.status.inProgress"),
    t("admin.jobs.status.fulfilled"),
    t("admin.jobs.status.archived"),
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
        toast.error(t('admin.jobs.toasts.dataLoadFailed'));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Handle form input changes
  const handleInputChange = (e) => {
    if (e && e.target) {
      const { name, value } = e.target;
      setFormData({
        ...formData,
        [name]: value
      });
    } else if (e && e.name && Array.isArray(e.value)) {
      setFormData({
        ...formData,
        [e.name]: e.value
      });
    }
  };

  // Handle form submission
  const handleSubmit = async (jobRequestData) => {
    if (!user || !user.uid) {
      toast.error(t('admin.jobs.toasts.dataLoadFailed'));
      return;
    }

    try {
      setLoading(true);

      const finalJobRequestData = {
        ...jobRequestData,
        createdBy: user.uid,
        createdAt: new Date(),
        status: "Active",
        statusHistory: [
          {
            status: "Active",
            timestamp: new Date(),
            changedBy: user.uid,
            notes: "Job request created",
          },
        ],
        assignedSeniors: [],
      };

      if (editMode) {
        await updateJobRequest(editId, finalJobRequestData);
        toast.success(t("admin.jobs.toasts.updateSuccess"));
      } else {
        await createJobRequest(finalJobRequestData);
        toast.success(t("admin.jobs.toasts.createSuccess"));
      }

      resetForm();
      const updatedJobRequests = await getJobRequests();
      setJobRequests(updatedJobRequests);
    } catch (err) {
      console.error("Error submitting form:", err);
      toast.error(editMode ? t("admin.jobs.toasts.updateFailed") : t("admin.jobs.toasts.createFailed"));
    } finally {
      setLoading(false);
    }
  };

  // Handle job request deletion
  const handleDelete = async (id) => {
    if (window.confirm(t("admin.jobs.deleteConfirmation"))) {
      try {
        setLoading(true);
        await deleteJobRequest(id);
        toast.success(t("admin.jobs.deleteSuccess"));

        const updatedJobRequests = await getJobRequests();
        setJobRequests(updatedJobRequests);
      } catch (err) {
        console.error("Error deleting voluntary request:", err);
        toast.error(t("admin.jobs.deleteFailed"));
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
      jobCategory: jobRequest.jobCategory || '',
      jobTitle: jobRequest.jobTitle || '',
      jobSubspecialty: jobRequest.jobSubspecialty || '',
      customJob: jobRequest.customJob || '',
      interests: jobRequest.interests || [],
      volunteerDays: jobRequest.volunteerDays || [],
      volunteerHours: jobRequest.volunteerHours || [],
      volunteerFrequency: jobRequest.volunteerFrequency || [],
      volunteerAreas: jobRequest.volunteerAreas || [],
      academicDegrees: jobRequest.academicDegrees || [],
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
      toast.success(t('admin.jobs.toasts.statusUpdateSuccess', { status: t('admin.jobs.status.' + newStatus.toLowerCase().replace(/ /g, '')) }));

      const updatedJobRequests = await getJobRequests();
      setJobRequests(updatedJobRequests);
    } catch (err) {
      console.error("Error updating status:", err);
      toast.error(t("admin.jobs.toasts.statusUpdateFailed"));
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
        createdBy: auth.currentUser.uid // Admin who invited
      });

      toast.success(t('admin.jobs.toasts.seniorInvited'));

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
      toast.success(t("admin.jobs.toasts.matchSuccess"));

      const updatedJobRequests = await getJobRequests();
      setJobRequests(updatedJobRequests);

      if (showMatchDetails && selectedJobRequest) {
        const updatedJobRequest = updatedJobRequests.find(jr => jr.id === selectedJobRequest.id);
        setSelectedJobRequest(updatedJobRequest);
      }
    } catch (err) {
      console.error("Error re-running matching algorithm:", err);
      toast.error(t("admin.jobs.toasts.matchFailed"));
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
      frequency: [],
      timing: []
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

  // Loading skeleton for job requests
    const JobRequestsSkeleton = () => (
    <div className="space-y-4 w-full">
      {[1, 2, 3].map((i) => (
        <div key={i} className="p-4 border rounded-lg bg-white shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <div className="flex-1">
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="flex space-x-2 mb-1">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                <div className="h-4 bg-gray-200 rounded w-1/5"></div>
              </div>
            </div>
            <div className="flex space-x-2">
              <div className="h-6 bg-gray-200 rounded w-1/6"></div>
              <div className="h-6 bg-gray-200 rounded w-1/12"></div>
              <div className="h-6 bg-gray-200 rounded w-1/12"></div>
            </div>
          </div>
          <div className="h-4 bg-gray-200 rounded w-full mb-3"></div>
          <div className="flex justify-between items-center">
            <div className="h-3 bg-gray-200 rounded w-1/3"></div>
            <div className="flex space-x-2">
              <div className="h-6 bg-gray-200 rounded w-1/4"></div>
              <div className="h-6 bg-gray-200 rounded w-1/5"></div>
              <div className="h-6 bg-gray-200 rounded w-1/3"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  // Loading skeleton for table rows
  const TableSkeleton = () => (
    <div className="space-y-2">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex items-center p-4 border-b border-gray-200">
          <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-1"></div>
            <div className="h-3 bg-gray-200 rounded w-1/4"></div>
          </div>
          <div className="h-6 bg-gray-200 rounded w-20 mx-4"></div>
          <div className="h-6 bg-gray-200 rounded w-24 mx-4"></div>
          <div className="h-6 bg-gray-200 rounded w-16 mx-4"></div>
          <div className="flex space-x-2">
            <div className="h-6 bg-gray-200 rounded w-6"></div>
            <div className="h-6 bg-gray-200 rounded w-6"></div>
          </div>
        </div>
      ))}
    </div>
  );

  // Render loading state
  if (loading && !jobRequests.length) {
    return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">{t('admin.jobs.title')}</h1>
          <div className="flex space-x-4">
            <div className="h-10 bg-gray-200 rounded w-40"></div>
          </div>
        </div>
        <JobRequestsSkeleton />
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
    <div className="p-1">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">{t("admin.jobs.title")}</h1>
        <div className="flex space-x-2">
          <button
            onClick={() => {
              resetForm();
              setShowForm(!showForm);
            }}
            className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold px-2.5 py-1.5 rounded-md flex items-center gap-1.5 text-sm"
            style={{ minWidth: 0 }}
          >
            <FaPlus className="text-xs" />
            <span>{showForm ? t("admin.jobs.cancel") : t("admin.jobs.addRequest")}</span>
          </button>
        </div>
      </div>

      {/* Create/Edit Job Request Form */}
      {showForm && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/10 flex items-center justify-center z-50">
          <VoluntaryRequestForm
            editMode={editMode}
            initialData={formData}
            settlements={settlements}
            onSubmit={handleSubmit}
            onCancel={resetForm}
            loading={loading}
            t={t}
          />
        </div>
      )}
      {showMatchDetails && selectedJobRequest && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/10 flex items-center justify-center z-50">
          {selectedSenior ? (
            <MatchDetails 
              jobRequestId={selectedJobRequest.id} 
              seniorId={selectedSenior} 
              onClose={closeMatchDetails} 
            />
          ) : (
            <div className="bg-white rounded-lg shadow-lg p-2 sm:p-4 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2 sm:mb-4 gap-2">
                <h3 className="text-lg sm:text-xl font-bold">
                  {t("admin.jobs.matchResults")}: {selectedJobRequest.title}
                </h3>
                <button
                  onClick={closeMatchDetails}
                  className="text-gray-500 hover:text-gray-700 self-end"
                >
                  <FaTimes className="text-xl" />
                </button>
              </div>
              <div className="mb-2 sm:mb-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                <p className="text-gray-600 text-sm">
                  <strong>{t("admin.jobs.location")}:</strong> {selectedJobRequest.location}
                </p>
                <p className="text-gray-600 text-sm">
                  <strong>{t("admin.jobs.volunteerField")}:</strong> {selectedJobRequest.volunteerField}
                </p>
                <p className="text-gray-600 text-sm">
                  <strong>{t("admin.jobs.professionalBackground")}:</strong> {selectedJobRequest.professionalBackground || t("admin.jobs.notSpecified")}
                </p>
                <p className="text-gray-600 text-sm">
                  <strong>{t("admin.jobs.timing")}:</strong> {Array.isArray(selectedJobRequest.timing) ? selectedJobRequest.timing.join(', ') : selectedJobRequest.timing}
                </p>
                <p className="text-gray-600 text-sm col-span-1 sm:col-span-2">
                  <strong>{t("admin.jobs.description")}:</strong> {selectedJobRequest.description}
                </p>
              </div>
              <div className="mb-2 sm:mb-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2 gap-2">
                  <h4 className="text-base sm:text-lg font-semibold">{t("admin.jobs.matchingSeniors")}</h4>
                  <button
                    onClick={() => handleRerunMatching(selectedJobRequest.id)}
                    className="bg-blue-500 hover:bg-blue-600 text-white text-xs sm:text-sm py-1 px-2 sm:px-3 rounded"
                  >
                    {t("admin.jobs.actions.rematch")}
                  </button>
                </div>
                {/* Responsive: Table for md+, cards for mobile */}
                <div className="hidden md:block">
                  {selectedJobRequest.matchResults && selectedJobRequest.matchResults.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full bg-white border border-gray-200 text-sm">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="py-2 px-2 border-b text-left">{t("admin.jobs.table.name")}</th>
                            <th className="py-2 px-2 border-b text-left">{t("admin.jobs.table.location")}</th>
                            <th className="py-2 px-2 border-b text-left">{t("admin.jobs.table.professionalBackground")}</th>
                            <th className="py-2 px-2 border-b text-left">{t("admin.jobs.table.interests")}</th>
                            <th className="py-2 px-2 border-b text-center">{t("admin.jobs.table.matchScore")}</th>
                            <th className="py-2 px-2 border-b text-center">{t("admin.jobs.table.status")}</th>
                            <th className="py-2 px-2 border-b text-center">{t("admin.jobs.table.actions")}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedJobRequest.matchResults.map((match) => {
                            const isInvited = selectedJobRequest.assignedSeniors &&
                              selectedJobRequest.assignedSeniors.some(
                                (assignment) => assignment.seniorId === match.seniorId
                              );
                            const assignmentStatus = isInvited
                              ? selectedJobRequest.assignedSeniors.find(
                                  (assignment) => assignment.seniorId === match.seniorId
                                ).status
                              : null;
                            return (
                              <tr key={match.seniorId} className="hover:bg-gray-50">
                                <td className="py-2 px-2 border-b font-semibold">{match.seniorName}</td>
                                <td className="py-2 px-2 border-b">{match.seniorLocation}</td>
                                <td className="py-2 px-2 border-b">
                                  {match.seniorBackground && match.seniorBackground.length > 0
                                    ? match.seniorBackground
                                    : t("admin.jobs.notSpecified")}
                                </td>
                                <td className="py-2 px-2 border-b">
                                  {match.seniorInterests && match.seniorInterests.length > 0
                                    ? match.seniorInterests.join(", ")
                                    : t("admin.jobs.notSpecified")}
                                </td>
                                <td className="py-2 px-2 border-b text-center">
                                  <span
                                    className={`inline-block rounded-full px-2 py-1 text-xs font-semibold ${
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
                                <td className="py-2 px-2 border-b text-center">
                                  {isInvited ? (
                                    <span
                                      className={`inline-block rounded-full px-2 py-1 text-xs font-semibold ${
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
                                    <span className="inline-block rounded-full px-2 py-1 text-xs font-semibold bg-gray-100 text-gray-800">
                                      {t("admin.jobs.notSpecified")}
                                    </span>
                                  )}
                                </td>
                                <td className="py-2 px-2 border-b text-center">
                                  <div className="flex justify-center space-x-1">
                                    <button
                                      onClick={() => viewSeniorMatchDetails(selectedJobRequest, match.seniorId)}
                                      className="bg-blue-500 hover:bg-blue-600 text-white text-xs py-1 px-2 rounded flex items-center"
                                      title={t("admin.jobs.table.viewDetails")}
                                    >
                                      <FaInfoCircle />
                                    </button>
                                    {!isInvited && (
                                      <button
                                        onClick={() => handleInviteSenior(selectedJobRequest.id, match.seniorId)}
                                        className="bg-green-500 hover:bg-green-600 text-white text-xs py-1 px-2 rounded flex items-center"
                                        title={t("admin.jobs.table.invite")}
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
                    <EmptyState
                      icon={<FaUserPlus className="text-4xl text-gray-300" />}
                      title={t("emptyStates.noMatchingSeniors")}
                      message={t("emptyStates.noMatchingSeniorsMessage")}
                      actionLabel={t("emptyStates.rerunMatching")}
                      onAction={() => handleRerunMatching(selectedJobRequest.id)}
                      className="p-4"
                    />
                  )}
                </div>
              </div>
              <div className="mt-4 sm:mt-6">
                {/* Responsive: Table for md+, cards for mobile */}
                <div className="hidden md:block">
                  {selectedJobRequest.assignedSeniors && selectedJobRequest.assignedSeniors.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full bg-white border border-gray-200 text-sm">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="py-2 px-2 border-b text-left">Senior ID</th>
                            <th className="py-2 px-2 border-b text-center">Status</th>
                            <th className="py-2 px-2 border-b text-left">Assigned At</th>
                            <th className="py-2 px-2 border-b text-left">Response At</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedJobRequest.assignedSeniors.map((assignment) => (
                            <tr key={assignment.seniorId} className="hover:bg-gray-50">
                              <td className="py-2 px-2 border-b">{assignment.seniorId}</td>
                              <td className="py-2 px-2 border-b text-center">
                                <span
                                  className={`inline-block rounded-full px-2 py-1 text-xs font-semibold ${
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
                              <td className="py-2 px-2 border-b">
                                {assignment.assignedAt ? new Date(assignment.assignedAt.seconds * 1000).toLocaleString() : "N/A"}
                              </td>
                              <td className="py-2 px-2 border-b">
                                {assignment.responseAt ? new Date(assignment.responseAt.seconds * 1000).toLocaleString() : "Pending"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <EmptyState
                      icon={<FaUserPlus className="text-4xl text-gray-300" />}
                      title={t('emptyStates.noSeniorsAssigned')}
                      message={t('emptyStates.noSeniorsAssignedMessage')}
                      className="p-4"
                    />
                  )}
                </div>
                {/* Mobile: Card layout */}
                <div className="block md:hidden space-y-2">
                  {selectedJobRequest.assignedSeniors && selectedJobRequest.assignedSeniors.length > 0 ? (
                    selectedJobRequest.assignedSeniors.map((assignment) => (
                      <div key={assignment.seniorId} className="border rounded-lg p-2 bg-gray-50 flex flex-col gap-1">
                        <div className="flex justify-between items-center">
                          <div className="font-semibold text-sm">{assignment.seniorId}</div>
                          <span className={`inline-block rounded-full px-2 py-1 text-xs font-semibold ${
                            assignment.status === "Accepted"
                              ? "bg-green-100 text-green-800"
                              : assignment.status === "Declined"
                              ? "bg-red-100 text-red-800"
                              : "bg-blue-100 text-blue-800"
                          }`}>
                            {assignment.status}
                          </span>
                        </div>
                        <div className="text-xs text-gray-600">
                          <strong>Assigned At:</strong> {assignment.assignedAt ? new Date(assignment.assignedAt.seconds * 1000).toLocaleString() : "N/A"}
                        </div>
                        <div className="text-xs text-gray-600">
                          <strong>Response At:</strong> {assignment.responseAt ? new Date(assignment.responseAt.seconds * 1000).toLocaleString() : "Pending"}
                        </div>
                      </div>
                    ))
                  ) : (
                    <EmptyState
                      icon={<FaUserPlus className="text-4xl text-gray-300" />}
                      title={t('emptyStates.noSeniorsAssigned')}
                      message={t('emptyStates.noSeniorsAssignedMessage')}
                      className="p-4"
                    />
                  )}
                </div>
              </div>
              <div className="mt-4 sm:mt-6 flex justify-end">
                <button
                  onClick={closeMatchDetails}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2 px-4 rounded"
                >
                  {t('admin.jobs.close')}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Status History Modal */}
      {showStatusHistory && selectedJobRequest && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/10 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">
                {t('admin.jobs.status.history')}: {selectedJobRequest.title}
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

      {/* Job Requests List - Responsive (Table for md+, Card for mobile) */}
      <div className="bg-white rounded shadow overflow-hidden">
        <h3 className="text-xl font-bold p-4 border-b">
          {t('admin.jobs.title')} ({jobRequests.length})
        </h3>
        {jobRequests.length === 0 ? (
          <EmptyState
            icon={<FaBriefcase className="text-6xl text-gray-300" />}
            title={t('emptyStates.noVoluntaryRequests')}
            message={t('emptyStates.noVoluntaryRequestsMessage')}
            actionLabel={t('emptyStates.createNewRequest')}
            onAction={() => {
              resetForm();
              setShowForm(true);
            }}
            className="p-6"
          />
        ) : (
          <>
            {/* Table for md+ screens */}
            <div className="hidden md:block">
              <table className="min-w-full bg-white border border-gray-200">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="py-2 px-4 border-b text-right w-48">{t('admin.jobs.table.title', 'כותרת')}</th>
                    <th className="py-2 px-4 border-b text-right w-40">{t('admin.jobs.table.location', 'מיקום')}</th>
                    <th className="py-2 px-4 border-b text-right w-56">{t('admin.jobs.table.field', 'תחום התנדבות')}</th>
                    <th className="py-2 px-4 border-b text-right w-32">{t('admin.jobs.table.status', 'סטטוס')}</th>
                    <th className="py-2 px-4 border-b text-right w-40">{t('admin.jobs.table.created', 'נוצר בתאריך')}</th>
                    <th className="py-2 px-4 border-b text-right w-40">{t('admin.jobs.table.actions', 'פעולות')}</th>
                  </tr>
                </thead>
                <tbody>
                  {jobRequests.map((jobRequest) => (
                    <tr key={jobRequest.id} className="hover:bg-gray-50">
                      <td className="py-2 px-4 border-b text-right w-48">{jobRequest.title}</td>
                      <td className="py-2 px-4 border-b text-right w-40">{jobRequest.location}</td>
                      <td className="py-2 px-4 border-b text-right w-56">{jobRequest.jobTitle || jobRequest.customJob || ''}</td>
                      <td className="py-2 px-4 border-b text-right w-32">
                        <span className={`inline-block rounded-full px-3 py-1 text-sm font-semibold ${
                          jobRequest.status === "Active"
                            ? "bg-green-100 text-green-800"
                            : jobRequest.status === "In Progress"
                            ? "bg-blue-100 text-blue-800"
                            : jobRequest.status === "Fulfilled"
                            ? "bg-purple-100 text-purple-800"
                            : "bg-gray-100 text-gray-800"
                        }`}>
                          {jobRequest.status ? t('admin.jobs.status.' + jobRequest.status.toLowerCase().replace(/ /g, '')) : ''}
                        </span>
                      </td>
                      <td className="py-2 px-4 border-b text-right w-40 text-sm text-gray-500">
                        {jobRequest.createdAt ? new Date(jobRequest.createdAt.seconds * 1000).toLocaleString() : "N/A"}
                      </td>
                      <td className="py-2 px-4 border-b text-right w-40">
                        {/* Actions (edit, delete, match, etc.) */}
                        <div className="flex flex-wrap gap-2 justify-end">
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
                          <button
                            onClick={() => viewMatchDetails(jobRequest)}
                            className="flex items-center space-x-1 bg-blue-100 hover:bg-blue-200 text-blue-700 text-xs py-1 px-2 rounded"
                          >
                            <FaSearch className="text-xs" />
                            <span>{t('admin.jobs.actions.matches')} ({jobRequest.matchResults ? jobRequest.matchResults.length : 0})</span>
                          </button>
                          <button
                            onClick={() => viewStatusHistory(jobRequest)}
                            className="flex items-center space-x-1 bg-purple-100 hover:bg-purple-200 text-purple-700 text-xs py-1 px-2 rounded"
                          >
                            <FaHistory className="text-xs" />
                            <span>{t('admin.jobs.actions.history')}</span>
                          </button>
                          <button
                            onClick={() => handleRerunMatching(jobRequest.id)}
                            className="flex items-center space-x-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs py-1 px-2 rounded"
                          >
                            <FaHistory className="text-xs" />
                            <span>{t('admin.jobs.actions.rematch')}</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Card layout for mobile screens */}
            <div className="block md:hidden w-full">
              <div className="space-y-3 flex flex-col items-center w-full">
                {jobRequests.map((jobRequest) => (
                  <div
                    key={jobRequest.id}
                    className="bg-white rounded-lg shadow p-2 flex flex-col w-full max-w-xs sm:max-w-sm hover:bg-gray-50"
                    style={{ minWidth: '220px' }}
                  >
                    <div className="flex justify-between items-start gap-2 w-full">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-base truncate">{jobRequest.title}</h4>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-600 mb-1 mt-1">
                          <span>{jobRequest.location}</span>
                          <span>•</span>
                          <span>{jobRequest.volunteerField}</span>
                          <span>•</span>
                          <span>{Array.isArray(jobRequest.timing) ? jobRequest.timing.join(', ') : jobRequest.timing}</span>
                        </div>
                      </div>
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${
                          jobRequest.status === "Active"
                            ? "bg-green-100 text-green-800"
                            : jobRequest.status === "In Progress"
                            ? "bg-blue-100 text-blue-800"
                            : jobRequest.status === "Fulfilled"
                            ? "bg-purple-100 text-purple-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {jobRequest.status ? t('admin.jobs.status.' + jobRequest.status.toLowerCase().replace(/ /g, '')) : ''}
                      </span>
                    </div>
                    <p className="text-gray-700 text-sm line-clamp-3 mb-1 w-full break-words">{jobRequest.description}</p>
                    <div className="flex flex-wrap items-center justify-between gap-2 mt-1 w-full">
                      <span className="text-xs text-gray-500">
                        {jobRequest.createdAt ? new Date(jobRequest.createdAt.seconds * 1000).toLocaleDateString() : "N/A"}
                      </span>
                      <div className="flex flex-wrap gap-1">
                        <button
                          className="text-gray-500 hover:text-gray-700"
                          onClick={() => handleEdit(jobRequest)}
                          title="Edit"
                        >
                          <FaEdit className="text-base" />
                        </button>
                        <button
                          onClick={() => handleDelete(jobRequest.id)}
                          className="text-red-500 hover:text-red-700"
                          title="Delete"
                        >
                          <FaTrash className="text-base" />
                        </button>
                        <button
                          onClick={() => viewMatchDetails(jobRequest)}
                          className="flex items-center space-x-1 bg-blue-100 hover:bg-blue-200 text-blue-700 text-xs py-1 px-2 rounded"
                        >
                          <FaSearch className="text-xs" />
                          <span>{t('admin.jobs.actions.matches')}</span>
                        </button>
                        <button
                          onClick={() => viewStatusHistory(jobRequest)}
                          className="flex items-center space-x-1 bg-purple-100 hover:bg-purple-200 text-purple-700 text-xs py-1 px-2 rounded"
                        >
                          <FaHistory className="text-xs" />
                          <span>{t('admin.jobs.actions.history')}</span>
                        </button>
                        <button
                          onClick={() => handleRerunMatching(jobRequest.id)}
                          className="flex items-center space-x-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs py-1 px-2 rounded"
                        >
                          <FaHistory className="text-xs" />
                          <span>{t('admin.jobs.actions.rematch')}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Jobs;

