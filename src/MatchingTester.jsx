import React, { useState, useEffect } from 'react';
import { getDocs, query, where, collection } from 'firebase/firestore';
import { db } from './firebase';
import { performSeniorMatching } from './matchingAlgorithm';

const MatchingTester = () => {
  const [jobRequests, setJobRequests] = useState([]);
  const [seniors, setSeniors] = useState([]);
  const [selectedJobRequest, setSelectedJobRequest] = useState(null);
  const [matchingResults, setMatchingResults] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch job requests
      const jobRequestsRef = collection(db, "jobRequests");
      const jobRequestsSnapshot = await getDocs(jobRequestsRef);
      const jobRequestsData = jobRequestsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setJobRequests(jobRequestsData);

      // Fetch seniors
      const usersRef = collection(db, "users");
      const seniorsQuery = query(usersRef, where("role", "==", "retiree"));
      const seniorsSnapshot = await getDocs(seniorsQuery);
      const seniorsData = seniorsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setSeniors(seniorsData);

      console.log("Fetched job requests:", jobRequestsData);
      console.log("Fetched seniors:", seniorsData);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const testMatching = async (jobRequestId) => {
    setLoading(true);
    try {
      console.log("Testing matching for job request:", jobRequestId);
      const results = await performSeniorMatching(jobRequestId);
      setMatchingResults(results);
      console.log("Matching results:", results);
    } catch (error) {
      console.error("Error testing matching:", error);
    } finally {
      setLoading(false);
    }
  };

  const viewSeniorData = (senior) => {
    console.log("Senior data:", senior);
    console.log("Veterans community data:", senior.veteransCommunity);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Matching Algorithm Tester</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Job Requests */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Job Requests</h2>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {jobRequests.map(job => (
              <div key={job.id} className="border p-3 rounded">
                <h3 className="font-medium">{job.title}</h3>
                <p className="text-sm text-gray-600">Location: {job.location}</p>
                <p className="text-sm text-gray-600">Field: {job.volunteerField}</p>
                <p className="text-sm text-gray-600">Background: {job.professionalBackground}</p>
                <button
                  onClick={() => {
                    setSelectedJobRequest(job);
                    testMatching(job.id);
                  }}
                  className="mt-2 bg-blue-500 text-white px-3 py-1 rounded text-sm"
                  disabled={loading}
                >
                  {loading ? 'Testing...' : 'Test Matching'}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Seniors */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Seniors ({seniors.length})</h2>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {seniors.map(senior => (
              <div key={senior.id} className="border p-3 rounded">
                <h3 className="font-medium">{senior.credentials?.username || 'Unknown'}</h3>
                <p className="text-sm text-gray-600">Location: {senior.personalDetails?.settlement}</p>
                <p className="text-sm text-gray-600">Background: {senior.workBackground?.category}</p>
                <p className="text-sm text-gray-600">
                  Volunteer Areas: {senior.veteransCommunity?.volunteerAreas?.join(', ') || 'None'}
                </p>
                <button
                  onClick={() => viewSeniorData(senior)}
                  className="mt-2 bg-green-500 text-white px-3 py-1 rounded text-sm"
                >
                  View Data
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Matching Results */}
      {selectedJobRequest && matchingResults && (
        <div className="mt-6 bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">
            Matching Results for: {selectedJobRequest.title}
          </h2>
          <div className="space-y-2">
            {matchingResults.length > 0 ? (
              matchingResults.map((match, index) => (
                <div key={match.seniorId} className="border p-3 rounded">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">
                        {index + 1}. {match.seniorName} (Score: {match.score})
                      </h3>
                      <p className="text-sm text-gray-600">Location: {match.seniorLocation}</p>
                      <p className="text-sm text-gray-600">Background: {match.seniorBackground}</p>
                      <p className="text-sm text-gray-600">Days: {match.seniorDays.join(', ')}</p>
                    </div>
                    <div className="text-xs text-gray-500">
                      <div>Location: {match.scoreDetails.locationScore}</div>
                      <div>Volunteer Areas: {match.scoreDetails.volunteerAreasScore}</div>
                      <div>Background: {match.scoreDetails.backgroundScore}</div>
                      <div>Availability: {match.scoreDetails.availabilityScore}</div>
                      <div>Frequency: {match.scoreDetails.frequencyScore}</div>
                      <div>Timing: {match.scoreDetails.timingScore}</div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500">No matching seniors found.</p>
            )}
          </div>
        </div>
      )}

      {/* Debug Info */}
      <div className="mt-6 bg-gray-100 p-4 rounded-lg">
        <h2 className="text-lg font-semibold mb-4">Debug Information</h2>
        <p className="text-sm">
          Check the browser console for detailed matching debug information.
        </p>
        <p className="text-sm mt-2">
          Total Job Requests: {jobRequests.length} | Total Seniors: {seniors.length}
        </p>
      </div>
    </div>
  );
};

export default MatchingTester;
