import React, { useState, useEffect } from "react";
import { matchSeniorsToJobRequest } from "../../jobRequestsService"; // Import matching function
import { toast } from "react-hot-toast";

const ServiceRequests = () => {
  const [requests, setRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [matchResults, setMatchResults] = useState([]);

  useEffect(() => {
    // Fetch requests from the server (replace with actual API endpoint)
    fetch("/api/requests")
      .then((response) => response.json())
      .then((data) => setRequests(data))
      .catch((error) => console.error("Error fetching requests:", error));
  }, []);

  const handleFindMatch = async (requestId) => {
    try {
      const results = await matchSeniorsToJobRequest(requestId);
      setSelectedRequest(requestId);
      setMatchResults(results);
      toast.success("Matching algorithm executed successfully!");
    } catch (error) {
      console.error("Error running matching algorithm:", error);
      toast.error("Failed to run matching algorithm");
    }
  };

  return (
    <div>
      <h1>Service Requests</h1>
      {requests.length === 0 ? (
        <p>No requests found.</p>
      ) : (
        <ul>
          {requests.map((request) => (
            <li key={request.id} className="mb-4">
              <strong>{request.title}</strong>
              <p>{request.description}</p>
              <p>Status: {request.status}</p>
              <button
                onClick={() => handleFindMatch(request.id)}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                Find Match
              </button>
              {selectedRequest === request.id && matchResults.length > 0 && (
                <div className="mt-4">
                  <h3>Match Results:</h3>
                  <ul>
                    {matchResults.map((match) => (
                      <li key={match.seniorId}>
                        <p>Name: {match.seniorName}</p>
                        <p>Match Score: {match.score}%</p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ServiceRequests;