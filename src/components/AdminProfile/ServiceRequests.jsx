import React, { useState, useEffect } from "react";
import { getServiceRequests, updateServiceRequest } from "../../serviceRequestsService"; // Import serviceRequests logic
import { createJobRequest } from "../../jobRequestsService"; // Import jobRequests logic
import { toast } from "react-hot-toast";
import { auth, db } from "../../firebase"; // Import Firebase auth and db
import { doc, getDoc } from "firebase/firestore";

const ServiceRequests = () => {
  const [requests, setRequests] = useState([]);
  const [adminSettlement, setAdminSettlement] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminSettlement = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          toast.error("You must be logged in.");
          return;
        }

        const userDoc = await getDoc(doc(db, "users", user.uid));
        const settlement = userDoc.exists() ? userDoc.data().idVerification.settlement : "";

        if (!settlement) {
          toast.error("Failed to fetch admin settlement.");
          return;
        }

        setAdminSettlement(settlement);
      } catch (error) {
        console.error("Error fetching admin settlement:", error);
        toast.error("Failed to fetch admin settlement.");
      }
    };

    fetchAdminSettlement();
  }, []);

  useEffect(() => {
    const fetchServiceRequests = async () => {
      try {
        setLoading(true);
        const allRequests = await getServiceRequests();
        const filteredRequests = allRequests.filter(
          (request) => request.settlement === adminSettlement
        );
        setRequests(filteredRequests);
      } catch (error) {
        console.error("Error fetching service requests:", error);
        toast.error("Failed to fetch service requests.");
      } finally {
        setLoading(false);
      }
    };

    if (adminSettlement) {
      fetchServiceRequests();
    }
  }, [adminSettlement]);

  const handleFindMatch = async (serviceRequest) => {
    try {
      // Create a new job request
      const jobRequestData = {
        title: serviceRequest.title,
        description: serviceRequest.description,
        location: serviceRequest.location,
        volunteerField: serviceRequest.volunteerField,
        professionalBackground: serviceRequest.professionalBackground,
        timing: serviceRequest.timing,
        frequency: serviceRequest.frequency,
        days: serviceRequest.days,
        settlement: serviceRequest.settlement,
        createdBy: auth.currentUser.uid,
        createdAt: new Date(),
        status: "Active", // Default status for job requests
        statusHistory: [
          {
            status: "Active",
            timestamp: new Date(),
            changedBy: auth.currentUser.uid,
            notes: "Job request created from service request",
          },
        ],
        assignedSeniors: [],
      };

      await createJobRequest(jobRequestData);

      // Update the service request status to "viewed"
      await updateServiceRequest(serviceRequest.id, { status: "viewed" });

      toast.success("Voluntary request created successfully!");
      setRequests((prevRequests) =>
        prevRequests.map((req) =>
          req.id === serviceRequest.id ? { ...req, status: "viewed" } : req
        )
      );
    } catch (error) {
      console.error("Error creating voluntary request:", error);
      toast.error("Failed to create voluntary request.");
    }
  };

  const pendingRequests = requests.filter((request) => request.status === "pending");
  const viewedRequests = requests.filter((request) => request.status === "viewed");

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Service Requests</h1>
      {loading ? (
        <p>Loading service requests...</p>
      ) : (
        <>
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-yellow-500 mb-4">Pending Requests</h2>
            {pendingRequests.length === 0 ? (
              <p>No pending requests found.</p>
            ) : (
              <ul className="space-y-4">
                {pendingRequests.map((request) => (
                  <li key={request.id} className="p-4 border rounded shadow">
                    <h2 className="text-lg font-bold">{request.title}</h2>
                    <p><strong>Description:</strong> {request.description}</p>
                    <p><strong>Location:</strong> {request.location}</p>
                    <p><strong>Volunteer Field:</strong> {request.volunteerField}</p>
                    <p><strong>Professional Background:</strong> {request.professionalBackground || "Not specified"}</p>
                    <p><strong>Timing:</strong> {request.timing}</p>
                    <p><strong>Frequency:</strong> {request.frequency}</p>
                    <p><strong>Days:</strong> {request.days.join(", ")}</p>
                    <button
                      onClick={() => handleFindMatch(request)}
                      className="bg-yellow-400 hover:bg-yellow-500 text-black font-medium py-2 px-4 rounded"
                    >
                      Find Match
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <hr className="border-t border-gray-300 my-8" />

          <div>
            <h2 className="text-2xl font-semibold text-yellow-600 mb-4">Viewed Requests</h2>
            {viewedRequests.length === 0 ? (
              <p>No viewed requests found.</p>
            ) : (
              <ul className="space-y-4">
                {viewedRequests.map((request) => (
                  <li key={request.id} className="p-4 border rounded shadow">
                    <h2 className="text-lg font-bold">{request.title}</h2>
                    <p><strong>Description:</strong> {request.description}</p>
                    <p><strong>Location:</strong> {request.location}</p>
                    <p><strong>Volunteer Field:</strong> {request.volunteerField}</p>
                    <p><strong>Professional Background:</strong> {request.professionalBackground || "Not specified"}</p>
                    <p><strong>Timing:</strong> {request.timing}</p>
                    <p><strong>Frequency:</strong> {request.frequency}</p>
                    <p><strong>Days:</strong> {request.days.join(", ")}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default ServiceRequests;