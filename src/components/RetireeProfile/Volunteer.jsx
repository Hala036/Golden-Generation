import React, { useState, useEffect } from "react";
import { getDocs, getDoc, collection, doc, updateDoc } from "firebase/firestore";
import { db, auth } from "../../firebase"; // Firebase configuration
import { toast } from "react-hot-toast";
import { Check, Calendar, Clock, MapPin, Star } from "lucide-react";
import { updateJobRequest } from "../../jobRequestsService"; // Import Firestore update function
import { useTranslation } from 'react-i18next';

const Volunteer = () => {
  const { t } = useTranslation();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const [volunteerInfo, setVolunteerInfo] = useState({
    volunteerAreas: [],
    volunteerFrequency: "",
    volunteerHours: "",
    volunteerDays: [],
    isVolunteer: false,
  });
  const [activeTab, setActiveTab] = useState("requests"); // State for active tab

  const volunteerAreaOptions = [
    { id: "publicity", label: t('volunteer.areas.publicity'), icon: "📢" },
    { id: "health", label: t('volunteer.areas.health'), icon: "🏥" },
    { id: "catering", label: t('volunteer.areas.catering'), icon: "🍽️" },
    { id: "teaching", label: t('volunteer.areas.teaching'), icon: "👨‍🏫" },
    { id: "high-tech", label: t('volunteer.areas.highTech'), icon: "💻" },
    { id: "tourism", label: t('volunteer.areas.tourism'), icon: "🗺️" },
    { id: "safety", label: t('volunteer.areas.safety'), icon: "🛡️" },
    { id: "fundraising", label: t('volunteer.areas.fundraising'), icon: "💰" },
    { id: "special-events", label: t('volunteer.areas.specialEvents'), icon: "🎉" },
    { id: "craftsmanship", label: t('volunteer.areas.craftsmanship'), icon: "🔨" },
    { id: "aaliyah", label: t('volunteer.areas.aaliyah'), icon: "✈️" },
    { id: "culture", label: t('volunteer.areas.culture'), icon: "🎭" },
  ];

  const frequencyOptions = [
    t('volunteer.frequency.onceMonth'),
    t('volunteer.frequency.onceTwoWeeks'),
    t('volunteer.frequency.onceWeek'),
    t('volunteer.frequency.twiceWeek'),
  ];

  const timeOptions = [
    t('volunteer.time.morning'),
    t('volunteer.time.noon'),
    t('volunteer.time.evening'),
  ];

  const dayOptions = [
    { id: "sunday", label: t('volunteer.days.sunday'), short: t('volunteer.days.sun') },
    { id: "monday", label: t('volunteer.days.monday'), short: t('volunteer.days.mon') },
    { id: "tuesday", label: t('volunteer.days.tuesday'), short: t('volunteer.days.tue') },
    { id: "wednesday", label: t('volunteer.days.wednesday'), short: t('volunteer.days.wed') },
    { id: "thursday", label: t('volunteer.days.thursday'), short: t('volunteer.days.thu') },
    { id: "friday", label: t('volunteer.days.friday'), short: t('volunteer.days.fri') },
  ];

  useEffect(() => {
    const fetchVeteransCommunityInfo = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          toast.error(t('volunteer.toast.noUser'));
          return;
        }
        setUserId(user.uid);

        const userDoc = await getDoc(doc(db, "users", user.uid));
        const userData = userDoc.data();
        console.log("Fetched User Data:", userData); // Debug log
        console.log("Veterans Community Data:", userData.veteransCommunity); // Debug log

        // Set the state with the fetched veteransCommunity data
        setVolunteerInfo({
          volunteerAreas: userData.veteransCommunity?.volunteerAreas || [],
          volunteerFrequency: userData.veteransCommunity?.volunteerFrequency || "",
          volunteerHours: userData.veteransCommunity?.volunteerHours || "",
          volunteerDays: userData.veteransCommunity?.volunteerDays || [],
          isVolunteer: userData.veteransCommunity?.isVolunteer || false,
        });

        // Fetch job requests
        const jobRequestsRef = collection(db, "jobRequests");
        const snapshot = await getDocs(jobRequestsRef);

        const fetchedRequests = snapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
          .filter((request) =>
            request.matchResults?.some((match) => match.seniorId === user.uid)
          ); // Filter locally based on seniorId in matchResults

        setRequests(fetchedRequests);
      } catch (err) {
        console.error("Error fetching volunteer information:", err);
        toast.error(t('volunteer.toast.failedLoad'));
      } finally {
        setLoading(false);
      }
    };

    fetchVeteransCommunityInfo();
  }, [t]);

  const handleArraySelection = (field, value) => {
    setVolunteerInfo((prev) => {
      const currentArray = prev[field] || [];
      const updatedArray = currentArray.includes(value)
        ? currentArray.filter((item) => item !== value)
        : [...currentArray, value];
      return { ...prev, [field]: updatedArray };
    });
  };

  const handleUpdateVolunteerInfo = async () => {
    try {
      const userRef = doc(db, "users", userId);

      // Fetch the current user data to ensure no fields are overwritten
      const userDoc = await getDoc(userRef);
      const userData = userDoc.data();

      // Merge the existing data with the updated volunteer info
      const updatedData = {
        ...userData.veteransCommunity,
        volunteerAreas: volunteerInfo.volunteerAreas,
        volunteerFrequency: volunteerInfo.volunteerFrequency,
        volunteerHours: volunteerInfo.volunteerHours,
        volunteerDays: volunteerInfo.volunteerDays,
        isVolunteer: volunteerInfo.isVolunteer,
      };

      // Update the Firestore document
      await updateDoc(userRef, {
        veteransCommunity: updatedData,
      });

      toast.success(t('volunteer.toast.updated'));
    } catch (err) {
      console.error("Error updating volunteering information:", err);
      toast.error(t('volunteer.toast.failedUpdate'));
    }
  };

  const handleAcceptInvite = async (jobRequestId) => {
    try {
      const jobRequest = requests.find((request) => request.id === jobRequestId);

      const updatedAssignedSeniors = [
        ...(jobRequest.assignedSeniors || []),
        {
          seniorId: userId, // Retiree ID
          status: "Accepted",
          assignedAt: new Date(),
        },
      ];

      await updateJobRequest(jobRequestId, { assignedSeniors: updatedAssignedSeniors });

      console.log(`Accepted invite for job request ID: ${jobRequestId}`);
      toast.success(t('volunteer.toast.accepted'));

      // Update local state
      setRequests((prevRequests) =>
        prevRequests.map((req) =>
          req.id === jobRequestId
            ? { ...req, assignedSeniors: updatedAssignedSeniors }
            : req
        )
      );
    } catch (err) {
      console.error("Error accepting invite:", err);
      toast.error(t('volunteer.toast.failedAccept'));
    }
  };

  const handleRejectInvite = async (jobRequestId) => {
    try {
      const jobRequest = requests.find((request) => request.id === jobRequestId);

      const updatedAssignedSeniors = [
        ...(jobRequest.assignedSeniors || []),
        {
          seniorId: userId, // Retiree ID
          status: "Declined",
          assignedAt: new Date(),
        },
      ];

      await updateJobRequest(jobRequestId, { assignedSeniors: updatedAssignedSeniors });

      console.log(`Rejected invite for job request ID: ${jobRequestId}`);
      toast.success(t('volunteer.toast.rejected'));

      // Update local state
      setRequests((prevRequests) =>
        prevRequests.map((req) =>
          req.id === jobRequestId
            ? { ...req, assignedSeniors: updatedAssignedSeniors }
            : req
        )
      );
    } catch (err) {
      console.error("Error rejecting invite:", err);
      toast.error(t('volunteer.toast.failedReject'));
    }
  };

  const SelectionCard = ({ isSelected, onClick, children }) => (
    <div
      className={`relative overflow-hidden transition-all duration-300 ease-in-out cursor-pointer
        border-2 rounded-xl p-4 bg-gradient-to-br from-white to-gray-50
        hover:border-yellow-300 hover:shadow-lg hover:scale-105
        ${isSelected 
          ? 'border-yellow-400 bg-gradient-to-br from-yellow-50 to-yellow-100 shadow-xl shadow-yellow-200/50 scale-105 -translate-y-0.5' 
          : 'border-gray-200'
        }`}
      onClick={onClick}
    >
      {isSelected && (
        <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-yellow-400 text-white flex items-center justify-center">
          <Check size={16} />
        </div>
      )}
      {children}
    </div>
  );

  if (loading) {
    return <p className="text-gray-500">{t('volunteer.toast.loading')}</p>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4 relative">
      {/* Tabs */}
      <div className="flex justify-center gap-2">
        <button
          className={`px-6 py-3 w-full ml-7 font-bold rounded-t-lg ${
            activeTab === "requests"
              ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white"
              : "bg-gray-200 text-gray-600"
          }`}
          onClick={() => setActiveTab("requests")}
        >
          {t('volunteer.tabs.requests')}
        </button>
        <button
          className={`px-6 py-3 w-full mr-7 font-bold rounded-t-lg ${
            activeTab === "info"
              ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white"
              : "bg-gray-200 text-gray-600"
          }`}
          onClick={() => setActiveTab("info")}
        >
          {t('volunteer.tabs.info')}
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "requests" && (
        <div className="bg-white rounded-b-2xl ml-6 mr-6 mb-6 p-8 shadow-lg border border-gray-100 backdrop-blur-sm bg-white/95">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent text-center mb-6">
              {t('volunteer.section.requests')}
            </h2>
            {requests && requests.length > 0 ? (
              <ul className="space-y-4">
                {requests.map((request) => {
                  // Check if the current user has a status in the assignedSeniors array
                  const userAssignment = request.assignedSeniors?.find(
                    (senior) => senior.seniorId === userId
                  );

                  return (
                    <li key={request.id} className="border border-gray-300 rounded-lg p-4 shadow-sm">
                      <h3 className="text-lg font-semibold">{request.title}</h3>
                      <p className="text-sm text-gray-600">{request.description}</p>
                      <p className="text-sm text-gray-500">
                        <strong>{t('volunteer.label.timing')}</strong> {request.volunteerHours || t('volunteer.label.notSpecified')}
                      </p>
                      <p className="text-sm text-gray-500">
                        <strong>{t('volunteer.label.location')}</strong> {request.location || t('volunteer.label.notSpecified')}
                      </p>
                      <p className="text-sm text-gray-500">
                        <strong>{t('volunteer.label.frequency')}</strong> {request.volunteerFrequency || t('volunteer.label.notSpecified')}
                      </p>
                      <p className="text-sm text-gray-500">
                        <strong>{t('volunteer.label.professionalBackground')}</strong>{" "}
                        {request.professionalBackground || t('volunteer.label.notSpecified')}
                      </p>

                      {/* Display status if the user is assigned */}
                      {userAssignment ? (
                        <p
                          className={`text-lg font-bold mt-4 ${
                            userAssignment.status === "Accepted"
                              ? "text-green-500"
                              : "text-red-500"
                          } text-center`}
                        >
                          {userAssignment.status === "Accepted" ? t('volunteer.label.accepted') : t('volunteer.label.declined')}
                        </p>
                      ) : (
                        <div className="flex space-x-4 mt-4 justify-center">
                          <button
                            onClick={() => handleAcceptInvite(request.id)}
                            className="bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-white font-bold py-4 px-8 rounded-xl transition-all duration-300 ease-in-out shadow-lg hover:shadow-xl hover:scale-105 transform active:scale-95 flex items-center justify-center gap-2"
                          >
                            {t('volunteer.label.accept')}
                          </button>
                          <button
                            onClick={() => handleRejectInvite(request.id)}
                            className="bg-gradient-to-r from-red-400 to-red-500 hover:from-red-500 hover:to-red-600 text-white font-bold py-4 px-8 rounded-xl transition-all duration-300 ease-in-out shadow-lg hover:shadow-xl hover:scale-105 transform active:scale-95 flex items-center justify-center gap-2"
                          >
                            {t('volunteer.label.reject')}
                          </button>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-gray-500">{t('volunteer.toast.noRequests')}</p>
            )}
          </div>
        </div>
      )}

      {activeTab === "info" && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleUpdateVolunteerInfo();
          }}
          className="space-y-12"
        >
          <div className="bg-white rounded-b-2xl ml-6 mr-6 p-8 shadow-lg border border-gray-100 backdrop-blur-sm bg-white/95">
            <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent text-center mb-6">
              {t('volunteer.section.info')}
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {t('volunteer.label.managePreferences')}
            </p>
            {/* Current Volunteering */}
            <div className="flex items-center mb-6">
              <Star className="w-8 h-8 text-yellow-500 mr-3" />
              <div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {t('volunteer.section.current')}
                </h3>
                <p className="text-gray-600 text-lg">{t('volunteer.label.currentlyVolunteering')}</p>
              </div>
            </div>

            <label className="flex items-center space-x-3 p-4 border-2 border-gray-200 rounded-xl hover:border-yellow-300 transition-all duration-300 cursor-pointer">
              <input
                type="checkbox"
                checked={volunteerInfo.isVolunteer}
                onChange={(e) =>
                  setVolunteerInfo({ ...volunteerInfo, isVolunteer: e.target.checked })
                }
                className="w-5 h-5 text-yellow-500 border-2 border-gray-300 rounded focus:ring-yellow-400 focus:ring-2 transition-all duration-200"
              />
              <span className="text-lg font-semibold text-gray-800">
                {t('volunteer.label.yesCurrentlyVolunteering')}
              </span>
            </label>

            {volunteerInfo.isVolunteer && (
              <div className="mt-8 space-y-8">
                {/* Volunteer Areas */}
                <div>
                  <h4 className="text-xl font-bold text-gray-800 mb-4">{t('volunteer.section.areas')}</h4>
                  <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
                    {volunteerAreaOptions.map((area) => (
                      <SelectionCard
                        key={area.id}
                        isSelected={volunteerInfo.volunteerAreas?.includes(area.id)}
                        onClick={() => handleArraySelection("volunteerAreas", area.id)}
                      >
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">{area.icon}</span>
                          <span className="font-semibold text-gray-800">{area.label}</span>
                        </div>
                      </SelectionCard>
                    ))}
                  </div>
                </div>

                {/* Frequency */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <div className="flex items-center mb-4">
                      <Calendar className="w-6 h-6 text-blue-500 mr-2" />
                      <h4 className="text-xl font-bold text-gray-800">{t('volunteer.section.frequency')}</h4>
                    </div>
                    <select
                      value={volunteerInfo.volunteerFrequency}
                      onChange={(e) =>
                        setVolunteerInfo({ ...volunteerInfo, volunteerFrequency: e.target.value })
                      }
                      className="w-full border-2 border-gray-200 rounded-xl p-4 focus:border-yellow-400 focus:ring-4 focus:ring-yellow-100 transition-all duration-300 bg-white hover:border-gray-300"
                    >
                      <option value="">{t('volunteer.placeholder.selectFrequency')}</option>
                      {frequencyOptions.map((freq) => (
                        <option key={freq} value={freq}>
                          {freq}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Hours */}
                  <div>
                    <div className="flex items-center mb-4">
                      <Clock className="w-6 h-6 text-green-500 mr-2" />
                      <h4 className="text-xl font-bold text-gray-800">{t('volunteer.section.hours')}</h4>
                    </div>
                    <select
                      value={volunteerInfo.volunteerHours}
                      onChange={(e) =>
                        setVolunteerInfo({ ...volunteerInfo, volunteerHours: e.target.value })
                      }
                      className="w-full border-2 border-gray-200 rounded-xl p-4 focus:border-yellow-400 focus:ring-4 focus:ring-yellow-100 transition-all duration-300 bg-white hover:border-gray-300"
                    >
                      <option value="">{t('volunteer.placeholder.selectHours')}</option>
                      {timeOptions.map((time) => (
                        <option key={time} value={time}>
                          {time}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Days */}
                <div>
                  <div className="flex items-center mb-4">
                    <MapPin className="w-6 h-6 text-purple-500 mr-2" />
                    <h4 className="text-xl font-bold text-gray-800">{t('volunteer.section.days')}</h4>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    {dayOptions.map((day) => (
                      <SelectionCard
                        key={day.id}
                        isSelected={volunteerInfo.volunteerDays?.includes(day.id)}
                        onClick={() => handleArraySelection("volunteerDays", day.id)}
                      >
                        <div className="text-center">
                          <div className="font-bold text-gray-800">{day.short}</div>
                          <div className="text-sm text-gray-600">{day.label}</div>
                        </div>
                      </SelectionCard>
                    ))}
                  </div>
                </div>
              </div>
            )}
            {/* Submit Button */}
            <div className="text-center pt-8">
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-white font-bold py-4 px-8 rounded-xl transition-all duration-300 ease-in-out shadow-lg hover:shadow-xl hover:scale-105 transform active:scale-95 flex items-center justify-center gap-2"
              >
                <span className="flex items-center justify-center space-x-2">
                  <Star className="w-6 h-6" />
                  <span>{t('volunteer.label.saveChanges')}</span>
                  <Star className="w-6 h-6" />
                </span>
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};

export default Volunteer;
