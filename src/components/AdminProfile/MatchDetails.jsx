import React, { useState, useEffect } from "react";
import { FaUser, FaMapMarkerAlt, FaBriefcase, FaHeart, FaClock, FaPercentage } from "react-icons/fa";
import { getDetailedMatch, getGlobalScoreWeights } from "../../matchingAlgorithm";
import { useTranslation } from 'react-i18next';

const MatchDetails = ({ jobRequestId, seniorId, onClose }) => {
  const { t } = useTranslation();
  const [matchDetails, setMatchDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [globalWeights, setGlobalWeights] = useState(null);

  useEffect(() => {
    const fetchMatchDetails = async () => {
      try {
        setLoading(true);
        // Fetch both match details and global weights
        const [details, weights] = await Promise.all([
          getDetailedMatch(jobRequestId, seniorId),
          getGlobalScoreWeights()
        ]);
        setMatchDetails(details);
        setGlobalWeights(weights);
      } catch (err) {
        console.error("Error fetching match details:", err);
        setError(t('matchDetails.failedToLoad'));
      } finally {
        setLoading(false);
      }
    };

    fetchMatchDetails();
  }, [jobRequestId, seniorId, t]);

  // Remove all dynamic max/weight logic
  // Use static max values
  const maxValues = {
    locationScore: 40,
    interestsScore: 15,
    backgroundScore: 25,
    availabilityScore: 10
  };
  const totalMax = maxValues.locationScore + maxValues.interestsScore + maxValues.backgroundScore + maxValues.availabilityScore;

  // Remove all manualMax and handleAdjustMax logic
  // Only display static values

  useEffect(() => {
    if (matchDetails && globalWeights) {
      // Calculate combined availability score from individual components
      const combinedAvailabilityScore = 
        matchDetails.scoreDetails.daysScore + 
        matchDetails.scoreDetails.hoursScore + 
        matchDetails.scoreDetails.frequencyScore;
      
      // Calculate combined availability max from global weights
      const combinedAvailabilityMax = 
        globalWeights.daysScore + 
        globalWeights.hoursScore + 
        globalWeights.frequencyScore;

      // setManualScores({
      //   locationScore: matchDetails.scoreDetails.locationScore,
      //   interestsScore: matchDetails.scoreDetails.interestsScore,
      //   backgroundScore: matchDetails.scoreDetails.backgroundScore,
      //   availabilityScore: combinedAvailabilityScore
      // });

      // setManualMax({
      //   locationScore: globalWeights.locationScore,
      //   interestsScore: globalWeights.interestsScore,
      //   backgroundScore: globalWeights.backgroundScore,
      //   availabilityScore: combinedAvailabilityMax
      // });
    }
  }, [matchDetails, globalWeights]);

  // Update total score and max live
  const totalScore =
    matchDetails?.scoreDetails.locationScore +
    matchDetails?.scoreDetails.interestsScore +
    matchDetails?.scoreDetails.backgroundScore +
    (matchDetails?.scoreDetails.daysScore + matchDetails?.scoreDetails.hoursScore + matchDetails?.scoreDetails.frequencyScore);

  // Handlers for +/-
  // const handleAdjust = (field, delta) => {
  //   setManualScores(prev => {
  //     const next = { ...prev };
  //     next[field] = Math.max(0, Math.min(manualMax[field], prev[field] + delta));
  //     return next;
  //   });
  // };

  // Reset to original (now using dynamic weights)
  // const handleReset = () => {
  //   if (!matchDetails || !globalWeights) return;
    
  //   const combinedAvailabilityScore = 
  //     matchDetails.scoreDetails.daysScore + 
  //     matchDetails.scoreDetails.hoursScore + 
  //     matchDetails.scoreDetails.frequencyScore;
    
  //   const combinedAvailabilityMax = 
  //     globalWeights.daysScore + 
  //     globalWeights.hoursScore + 
  //     globalWeights.frequencyScore;

  //   setManualScores({
  //     locationScore: matchDetails.scoreDetails.locationScore,
  //     interestsScore: matchDetails.scoreDetails.interestsScore,
  //     backgroundScore: matchDetails.scoreDetails.backgroundScore,
  //     availabilityScore: combinedAvailabilityScore
  //   });

  //   setManualMax({
  //     locationScore: globalWeights.locationScore,
  //     interestsScore: globalWeights.interestsScore,
  //     backgroundScore: globalWeights.backgroundScore,
  //     availabilityScore: combinedAvailabilityMax
  //   });
  // };

  // Placeholder for save (to be implemented backend)
  const handleSave = () => {
    // TODO: Implement backend save for manual adjustments
    alert('Saving manual scores (to be implemented)');
  };

  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto"></div>
        <p className="mt-4 text-gray-600">{t('matchDetails.loading')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <div className="text-red-500 text-xl mb-4">{t('matchDetails.error', 'שגיאה')}</div>
        <p className="text-gray-600">{error}</p>
        <button
          onClick={onClose}
          className="mt-4 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2 px-4 rounded"
        >
          {t('matchDetails.close', 'סגור')}
        </button>
      </div>
    );
  }

  if (!matchDetails) {
    return (
      <div className="p-6 text-center">
        <div className="text-gray-500 text-xl mb-4">{t('matchDetails.noDetails', 'אין פרטי התאמה')}</div>
        <button
          onClick={onClose}
          className="mt-4 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2 px-4 rounded"
        >
          {t('matchDetails.close', 'סגור')}
        </button>
      </div>
    );
  }

  const { jobRequest, senior, scoreDetails } = matchDetails;

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold">{t('matchDetails.title', 'פירוט ניקוד התאמה')}</h3>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700"
        >
          &times;
        </button>
      </div>

      

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Job Request Details */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="text-lg font-semibold mb-3">{t('matchDetails.jobRequest', 'בקשת עבודה')}</h4>
          <div className="space-y-2">
            <p className="text-gray-700">
              <strong>{t('matchDetails.titleLabel', 'כותרת')}:</strong> {jobRequest.title}
            </p>
            <p className="text-gray-700">
              <strong>{t('matchDetails.location', 'מיקום')}:</strong> {jobRequest.location}
            </p>
            <p className="text-gray-700">
              <strong>{t('matchDetails.volunteerField', 'תחום התנדבות')}:</strong> {jobRequest.volunteerField}
            </p>
            <p className="text-gray-700">
              <strong>{t('matchDetails.professionalBackground', 'רקע מקצועי')}:</strong> {jobRequest.professionalBackground || t('matchDetails.notSpecified')}
            </p>
            <p className="text-gray-700">
              <strong>{t('matchDetails.timing', 'תזמון')}:</strong> {jobRequest.timing}
            </p>
            <p className="text-gray-700">
              <strong>{t('matchDetails.description', 'תיאור')}:</strong> {jobRequest.description}
            </p>
            <p className="text-gray-700">
              <strong>{t('matchDetails.interests', 'תחומי עניין')}:</strong> {Array.isArray(jobRequest.interests) && jobRequest.interests.length > 0 ? jobRequest.interests.join(', ') : t('matchDetails.notSpecified')}
            </p>
          </div>
        </div>

        {/* Senior Details */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="text-lg font-semibold mb-3">{t('matchDetails.senior', 'גמלאי')}</h4>
          <div className="space-y-2">
            <p className="text-gray-700">
              <strong>{t('matchDetails.name', 'שם')}:</strong> {senior.credentials?.username || t('matchDetails.unknown')}
            </p>
            <p className="text-gray-700">
              <strong>{t('matchDetails.location', 'מיקום')}:</strong> {senior.personalDetails?.settlement || t('matchDetails.unknown')}
            </p>
            <p className="text-gray-700">
              <strong>{t('matchDetails.interests', 'תחומי עניין')}:</strong> {senior.lifestyle?.interests && senior.lifestyle.interests.length > 0 ? senior.lifestyle.interests.join(", ") : t('matchDetails.notSpecified')}
            </p>
            <p className="text-gray-700">
              <strong>{t('matchDetails.professionalBackground', 'רקע מקצועי')}:</strong> {
                (() => {
                  const wb = senior.workBackground || {};
                  const custom = wb.customJobInfo || {};
                  const original = custom.originalSelection || {};
                  const fields = [
                    wb.jobTitle,
                    wb.subspecialty,
                    wb.category,
                    custom.customJobTitle,
                    original.category,
                    original.jobTitle,
                    original.subspecialty,
                    wb.otherJob
                  ].filter(Boolean);
                  return fields.length > 0 ? fields.join(", ") : t('matchDetails.notSpecified');
                })()
              }
            </p>
            <p className="text-gray-700">
              <strong>{t('matchDetails.availability', 'זמינות')}:</strong> {
                [
                  ...(Array.isArray(senior.volunteerDays) ? senior.volunteerDays : []),
                  ...(Array.isArray(senior.volunteerHours) ? senior.volunteerHours : []),
                  ...(Array.isArray(senior.volunteerFrequency) ? senior.volunteerFrequency : [])
                ].length > 0
                  ? [
                      ...(Array.isArray(senior.volunteerDays) ? senior.volunteerDays : []),
                      ...(Array.isArray(senior.volunteerHours) ? senior.volunteerHours : []),
                      ...(Array.isArray(senior.volunteerFrequency) ? senior.volunteerFrequency : [])
                    ].join(", ")
                  : t('matchDetails.notSpecified')
              }
            </p>
          </div>
        </div>
      </div>

      {/* Match Score Details */}
      <div className="mb-6">
        <h4 className="text-lg font-semibold mb-3">{t('matchDetails.scoreBreakdown', 'פירוט ניקוד')}</h4>
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center mb-2">
                <FaMapMarkerAlt className="text-yellow-500 mr-2" />
                <span className="font-medium">{t('matchDetails.locationMatch', 'התאמת מיקום')}:</span>
                <span className="mx-2">{scoreDetails.locationScore} / {maxValues.locationScore}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-yellow-500 h-2.5 rounded-full"
                  style={{ width: `${(scoreDetails.locationScore / maxValues.locationScore) * 100}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex items-center mb-2">
                <FaHeart className="text-yellow-500 mr-2" />
                <span className="font-medium">{t('matchDetails.interestsMatch', 'התאמת תחומי עניין')}:</span>
                <span className="mx-2">{scoreDetails.interestsScore} / {maxValues.interestsScore}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-yellow-500 h-2.5 rounded-full"
                  style={{ width: `${(scoreDetails.interestsScore / maxValues.interestsScore) * 100}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex items-center mb-2">
                <FaBriefcase className="text-yellow-500 mr-2" />
                <span className="font-medium">{t('matchDetails.backgroundMatch', 'התאמת רקע')}:</span>
                <span className="mx-2">{scoreDetails.backgroundScore} / {maxValues.backgroundScore}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-yellow-500 h-2.5 rounded-full"
                  style={{ width: `${(scoreDetails.backgroundScore / maxValues.backgroundScore) * 100}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex items-center mb-2">
                <FaClock className="text-yellow-500 mr-2" />
                <span className="font-medium">{t('matchDetails.availabilityMatch', 'התאמת זמינות')}:</span>
                <span className="mx-2">{scoreDetails.daysScore + scoreDetails.hoursScore + scoreDetails.frequencyScore} / {maxValues.availabilityScore}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-yellow-500 h-2.5 rounded-full"
                  style={{ width: `${((scoreDetails.daysScore + scoreDetails.hoursScore + scoreDetails.frequencyScore) / maxValues.availabilityScore) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <div className="flex items-center mb-2">
              <FaPercentage className="text-yellow-500 mr-2" />
              <span className="font-medium">{t('matchDetails.totalScore', 'ניקוד התאמה כולל')}:</span>
              <span className="ml-2 text-lg font-bold">
                {scoreDetails.scaledTotalScore} / 100
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div
                className={`h-4 rounded-full ${
                  scoreDetails.scaledTotalScore >= 70
                    ? "bg-green-500"
                    : scoreDetails.scaledTotalScore >= 50
                    ? "bg-yellow-500"
                    : "bg-orange-500"
                }`}
                style={{ width: `${scoreDetails.scaledTotalScore}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-3">
        {/* <button
          onClick={handleReset}
          className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2 px-4 rounded"
        >
          {t('matchDetails.reset', 'איפוס')}
        </button> */}
        {/* <button
          onClick={handleSave}
          className="bg-yellow-500 hover:bg-yellow-600 text-white font-medium py-2 px-4 rounded"
        >
          {t('matchDetails.save', 'שמור')}
        </button> */}
        <button
          onClick={onClose}
          className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2 px-4 rounded"
        >
          {t('matchDetails.close', 'סגור')}
        </button>
      </div>
    </div>
  );
};

export default MatchDetails;
