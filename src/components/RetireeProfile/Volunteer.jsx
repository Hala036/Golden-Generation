import React, { useState, useEffect } from "react";
import { getDocs, collection } from "firebase/firestore";
import { db, auth } from "../../firebase"; // Firebase configuration
import { updateJobRequest } from "../../jobRequestsService"; // Import Firestore update function
import { toast } from "react-hot-toast";

const Volunteer = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);

  // Fetch user ID and job requests
  useEffect(() => {
    const fetchUserDataAndRequests = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          toast.error("No user is logged in.");
          return;
        }
        setUserId(user.uid); // Set user ID

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
        console.error("Error fetching volunteer requests:", err);
        toast.error("Failed to load volunteering requests.");
      } finally {
        setLoading(false);
      }
    };

    fetchUserDataAndRequests();
  }, []);

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
      toast.success("You have accepted the volunteering request!");

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
      toast.error("Failed to accept the volunteering request.");
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
      toast.success("You have declined the volunteering request.");

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
      toast.error("Failed to decline the volunteering request.");
    }
  };

  if (loading) {
    return <p className="text-gray-500">Loading volunteering requests...</p>;
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Volunteering Requests</h2>
      {requests && requests.length > 0 ? (
        <ul className="space-y-4">
          {requests.map((request) => (
            <li key={request.id} className="border border-gray-300 rounded-lg p-4 shadow-sm">
              <h3 className="text-lg font-semibold">{request.title}</h3>
              <p className="text-sm text-gray-600">{request.description}</p>
              <p className="text-sm text-gray-500">
                <strong>Timing:</strong> {request.volunteerHours || "Not specified"}
              </p>
              <p className="text-sm text-gray-500">
                <strong>Location:</strong> {request.location || "Not specified"}
              </p>
              <p className="text-sm text-gray-500">
                <strong>Frequency:</strong> {request.volunteerFrequency || "Not specified"}
              </p>
              <p className="text-sm text-gray-500">
                <strong>Professional Background Requirements:</strong>{" "}
                {request.professionalBackground || "Not specified"}
              </p>
              <div className="flex space-x-4 mt-4">
                <button
                  onClick={() => handleAcceptInvite(request.id)}
                  className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                >
                  Accept
                </button>
                <button
                  onClick={() => handleRejectInvite(request.id)}
                  className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                >
                  Reject
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-500">No volunteering requests available.</p>
      )}
    </div>
  );
};

export default Volunteer;