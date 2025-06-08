import React, { useState, useEffect } from "react";
import { FaUser, FaMapMarkerAlt, FaBriefcase, FaHeart, FaClock, FaPercentage } from "react-icons/fa";
import { getDetailedMatch } from "../../matchingAlgorithm";

const MatchDetails = ({ jobRequestId, seniorId, onClose }) => {
  const [matchDetails, setMatchDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMatchDetails = async () => {
      try {
        setLoading(true);
        const details = await getDetailedMatch(jobRequestId, seniorId);
        setMatchDetails(details);
      } catch (err) {
        console.error("Error fetching match details:", err);
        setError("Failed to load match details");
      } finally {
        setLoading(false);
      }
    };

    fetchMatchDetails();
  }, [jobRequestId, seniorId]);

  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading match details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <div className="text-red-500 text-xl mb-4">Error</div>
        <p className="text-gray-600">{error}</p>
        <button
          onClick={onClose}
          className="mt-4 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2 px-4 rounded"
        >
          Close
        </button>
      </div>
    );
  }

  if (!matchDetails) {
    return (
      <div className="p-6 text-center">
        <div className="text-gray-500 text-xl mb-4">No Match Details Found</div>
        <button
          onClick={onClose}
          className="mt-4 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2 px-4 rounded"
        >
          Close
        </button>
      </div>
    );
  }

  const { jobRequest, senior, scoreDetails } = matchDetails;

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold">Match Details</h3>
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
          <h4 className="text-lg font-semibold mb-3">Job Request</h4>
          <div className="space-y-2">
            <p className="text-gray-700">
              <strong>Title:</strong> {jobRequest.title}
            </p>
            <p className="text-gray-700">
              <strong>Location:</strong> {jobRequest.location}
            </p>
            <p className="text-gray-700">
              <strong>Volunteer Field:</strong> {jobRequest.volunteerField}
            </p>
            <p className="text-gray-700">
              <strong>Professional Background:</strong>{" "}
              {jobRequest.professionalBackground || "Not specified"}
            </p>
            <p className="text-gray-700">
              <strong>Timing:</strong> {jobRequest.timing}
            </p>
            <p className="text-gray-700">
              <strong>Description:</strong> {jobRequest.description}
            </p>
          </div>
        </div>

        {/* Senior Details */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="text-lg font-semibold mb-3">Senior</h4>
          <div className="space-y-2">
            <p className="text-gray-700">
              <strong>Name:</strong> {senior.credentials?.username || "Unknown"}
            </p>
            <p className="text-gray-700">
              <strong>Location:</strong> {senior.location || "Unknown"}
            </p>
            <p className="text-gray-700">
              <strong>Interests:</strong>{" "}
              {senior.interests && senior.interests.length > 0
                ? senior.interests.join(", ")
                : "Not specified"}
            </p>
            <p className="text-gray-700">
              <strong>Professional Background:</strong>{" "}
              {senior.professionalBackground &&
              (Array.isArray(senior.professionalBackground)
                ? senior.professionalBackground.length > 0
                : senior.professionalBackground)
                ? Array.isArray(senior.professionalBackground)
                  ? senior.professionalBackground.join(", ")
                  : senior.professionalBackground
                : "Not specified"}
            </p>
            <p className="text-gray-700">
              <strong>Availability:</strong>{" "}
              {senior.availability
                ? Object.entries(senior.availability)
                    .filter(([_, value]) => value)
                    .map(([key, _]) => key.charAt(0).toUpperCase() + key.slice(1))
                    .join(", ")
                : "Not specified"}
            </p>
          </div>
        </div>
      </div>

      {/* Match Score Details */}
      <div className="mb-6">
        <h4 className="text-lg font-semibold mb-3">Match Score Breakdown</h4>
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center mb-2">
                <FaMapMarkerAlt className="text-yellow-500 mr-2" />
                <span className="font-medium">Location Match:</span>
                <span className="ml-2">{scoreDetails.locationScore} / 40</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-yellow-500 h-2.5 rounded-full"
                  style={{ width: `${(scoreDetails.locationScore / 40) * 100}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex items-center mb-2">
                <FaHeart className="text-yellow-500 mr-2" />
                <span className="font-medium">Interests Match:</span>
                <span className="ml-2">{scoreDetails.interestsScore} / 25</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-yellow-500 h-2.5 rounded-full"
                  style={{ width: `${(scoreDetails.interestsScore / 25) * 100}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex items-center mb-2">
                <FaBriefcase className="text-yellow-500 mr-2" />
                <span className="font-medium">Background Match:</span>
                <span className="ml-2">{scoreDetails.backgroundScore} / 25</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-yellow-500 h-2.5 rounded-full"
                  style={{ width: `${(scoreDetails.backgroundScore / 25) * 100}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex items-center mb-2">
                <FaClock className="text-yellow-500 mr-2" />
                <span className="font-medium">Availability Match:</span>
                <span className="ml-2">{scoreDetails.availabilityScore} / 10</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-yellow-500 h-2.5 rounded-full"
                  style={{ width: `${(scoreDetails.availabilityScore / 10) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <div className="flex items-center mb-2">
              <FaPercentage className="text-yellow-500 mr-2" />
              <span className="font-medium">Total Match Score:</span>
              <span className="ml-2 text-lg font-bold">
                {scoreDetails.totalScore} / 100
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div
                className={`h-4 rounded-full ${
                  scoreDetails.totalScore >= 70
                    ? "bg-green-500"
                    : scoreDetails.totalScore >= 50
                    ? "bg-yellow-500"
                    : "bg-orange-500"
                }`}
                style={{ width: `${scoreDetails.totalScore}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={onClose}
          className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2 px-4 rounded"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default MatchDetails;

