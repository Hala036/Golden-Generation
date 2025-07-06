import React, { useState, useEffect } from "react";
import { getServiceRequests, updateServiceRequest } from "../../serviceRequestsService"; // Import serviceRequests logic
import { createJobRequest } from "../../jobRequestsService"; // Import jobRequests logic
import { toast } from "react-hot-toast";
import { auth, db } from "../../firebase"; // Import Firebase auth and db
import { doc, getDoc } from "firebase/firestore";
import { FaHandsHelping, FaEye } from "react-icons/fa"; // Import icons
import EmptyState from "../EmptyState"; // Import EmptyState component
import { useLanguage } from "../../context/LanguageContext"; // Import useLanguage
import Skeleton from 'react-loading-skeleton'; // Import Skeleton
import 'react-loading-skeleton/dist/skeleton.css'; // Import Skeleton CSS

const ServiceRequests = () => {
  const { t } = useLanguage(); // Add translation hook
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
        
        if (!userDoc.exists()) {
          toast.error("User document not found.");
          return;
        }

        const userData = userDoc.data();
        console.log("ServiceRequests - Admin data:", userData);

        // Check for superadmin role
        if (userData.role === "superadmin") {
          setAdminSettlement("__ALL__"); // Special value to indicate all settlements
          return;
        }
        // Try different possible locations for settlement
        const settlement = userData.idVerification?.settlement || 
                         userData.settlement || 
                         userData.credentials?.settlement;
        
        console.log("ServiceRequests - Found admin settlement:", settlement);

        if (!settlement) {
          toast.error("No settlement found for admin user.");
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
        let filteredRequests;
        if (adminSettlement === "__ALL__") {
          // Superadmin: see all requests
          filteredRequests = allRequests;
        } else {
          filteredRequests = allRequests.filter(
            (request) => request.settlement === adminSettlement
          );
        }
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

  // Loading skeleton for service requests
  const ServiceRequestsSkeleton = () => (
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

  // Render loading state
  if (loading && !requests.length) {
    return (
      <div className="p-4 sm:p-6 max-w-screen mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-4 sm:mb-6">
          <h1 className="text-lg sm:text-1xl md:text-3xl font-bold">Service Requests</h1>
          <div className="flex space-x-2 sm:space-x-4 mt-2 sm:mt-0">
            <div className="h-8 sm:h-10 bg-gray-200 rounded w-20 sm:w-40"></div>
          </div>
        </div>
        <ServiceRequestsSkeleton />
      </div>
    );
  }

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
              <EmptyState
                icon={<FaHandsHelping className="text-6xl text-gray-300" />}
                title={t('emptyStates.noPendingRequests')}
                message={t('emptyStates.noPendingRequestsMessage')}
                className="p-6 flex-grow"
              />
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
              <EmptyState
                icon={<FaEye className="text-6xl text-gray-300" />}
                title={t('emptyStates.noViewedRequests')}
                message={t('emptyStates.noViewedRequestsMessage')}
                className="p-6 flex-grow"
              />
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