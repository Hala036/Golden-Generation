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
          toast.error(t('serviceRequests.toasts.mustBeLoggedIn'));
          return;
        }

        const userDoc = await getDoc(doc(db, "users", user.uid));
        
        if (!userDoc.exists()) {
          toast.error(t('serviceRequests.toasts.userDocumentNotFound'));
          return;
        }

        const userData = userDoc.data();
        console.log(t('serviceRequests.logs.adminData'), userData);
        
        // Try different possible locations for settlement
        const settlement = userData.idVerification?.settlement || 
                         userData.settlement || 
                         userData.credentials?.settlement;
        
        console.log(t('serviceRequests.logs.foundAdminSettlement'), settlement);

        if (!settlement) {
          toast.error(t('serviceRequests.toasts.noSettlementFound'));
          return;
        }

        setAdminSettlement(settlement);
      } catch (error) {
        console.error(t('serviceRequests.errors.errorFetchingAdminSettlement'), error);
        toast.error(t('serviceRequests.toasts.failedToFetchAdminSettlement'));
      }
    };

    fetchAdminSettlement();
  }, [t]);

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
        console.error(t('serviceRequests.errors.errorFetchingServiceRequests'), error);
        toast.error(t('serviceRequests.toasts.failedToFetchServiceRequests'));
      } finally {
        setLoading(false);
      }
    };

    if (adminSettlement) {
      fetchServiceRequests();
    }
  }, [adminSettlement, t]);

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

      toast.success(t('serviceRequests.toasts.voluntaryRequestCreated'));
      setRequests((prevRequests) =>
        prevRequests.map((req) =>
          req.id === serviceRequest.id ? { ...req, status: "viewed" } : req
        )
      );
    } catch (error) {
      console.error(t('serviceRequests.errors.errorCreatingVoluntaryRequest'), error);
      toast.error(t('serviceRequests.toasts.failedToCreateVoluntaryRequest'));
    }
  };

  const pendingRequests = requests.filter((request) => request.status === "pending");
  const viewedRequests = requests.filter((request) => request.status === "viewed");

  // Loading skeleton for service requests
  const ServiceRequestsSkeleton = () => (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="p-4 border rounded-lg bg-white shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <div className="flex-1">
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="flex space-x-2 mb-1">
                <div className="h-4 bg-gray-200 rounded w-20"></div>
                <div className="h-4 bg-gray-200 rounded w-24"></div>
                <div className="h-4 bg-gray-200 rounded w-16"></div>
              </div>
            </div>
            <div className="flex space-x-2">
              <div className="h-6 bg-gray-200 rounded w-16"></div>
              <div className="h-6 bg-gray-200 rounded w-6"></div>
              <div className="h-6 bg-gray-200 rounded w-6"></div>
            </div>
          </div>
          <div className="h-4 bg-gray-200 rounded w-full mb-3"></div>
          <div className="flex justify-between items-center">
            <div className="h-3 bg-gray-200 rounded w-32"></div>
            <div className="flex space-x-2">
              <div className="h-6 bg-gray-200 rounded w-24"></div>
              <div className="h-6 bg-gray-200 rounded w-16"></div>
              <div className="h-6 bg-gray-200 rounded w-20"></div>
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
  if (loading && !requests.length) {
    return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">{t('serviceRequests.title')}</h1>
          <div className="flex space-x-4">
            <div className="h-10 bg-gray-200 rounded w-40"></div>
          </div>
        </div>
        <ServiceRequestsSkeleton />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">{t('serviceRequests.title')}</h1>
      {loading ? (
        <p>{t('serviceRequests.loading')}</p>
      ) : (
        <>
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-yellow-500 mb-4">{t('serviceRequests.sections.pendingRequests')}</h2>
            {pendingRequests.length === 0 ? (
              <EmptyState
                icon={<FaHandsHelping className="text-6xl text-gray-300" />}
                title={t('emptyStates.noPendingRequests')}
                message={t('emptyStates.noPendingRequestsMessage')}
                className="p-6"
              />
            ) : (
              <ul className="space-y-4">
                {pendingRequests.map((request) => (
                  <li key={request.id} className="p-4 border rounded shadow">
                    <h2 className="text-lg font-bold">{request.title}</h2>
                    <p><strong>{t('serviceRequests.labels.description')}:</strong> {request.description}</p>
                    <p><strong>{t('serviceRequests.labels.location')}:</strong> {request.location}</p>
                    <p><strong>{t('serviceRequests.labels.volunteerField')}:</strong> {request.volunteerField}</p>
                    <p><strong>{t('serviceRequests.labels.professionalBackground')}:</strong> {request.professionalBackground || t('serviceRequests.labels.notSpecified')}</p>
                    <p><strong>{t('serviceRequests.labels.timing')}:</strong> {request.timing}</p>
                    <p><strong>{t('serviceRequests.labels.frequency')}:</strong> {request.frequency}</p>
                    <p><strong>{t('serviceRequests.labels.days')}:</strong> {request.days.join(", ")}</p>
                    <button
                      onClick={() => handleFindMatch(request)}
                      className="bg-yellow-400 hover:bg-yellow-500 text-black font-medium py-2 px-4 rounded"
                    >
                      {t('serviceRequests.actions.findMatch')}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <hr className="border-t border-gray-300 my-8" />

          <div>
            <h2 className="text-2xl font-semibold text-yellow-600 mb-4">{t('serviceRequests.sections.viewedRequests')}</h2>
            {viewedRequests.length === 0 ? (
              <EmptyState
                icon={<FaEye className="text-6xl text-gray-300" />}
                title={t('emptyStates.noViewedRequests')}
                message={t('emptyStates.noViewedRequestsMessage')}
                className="p-6"
              />
            ) : (
              <ul className="space-y-4">
                {viewedRequests.map((request) => (
                  <li key={request.id} className="p-4 border rounded shadow">
                    <h2 className="text-lg font-bold">{request.title}</h2>
                    <p><strong>{t('serviceRequests.labels.description')}:</strong> {request.description}</p>
                    <p><strong>{t('serviceRequests.labels.location')}:</strong> {request.location}</p>
                    <p><strong>{t('serviceRequests.labels.volunteerField')}:</strong> {request.volunteerField}</p>
                    <p><strong>{t('serviceRequests.labels.professionalBackground')}:</strong> {request.professionalBackground || t('serviceRequests.labels.notSpecified')}</p>
                    <p><strong>{t('serviceRequests.labels.timing')}:</strong> {request.timing}</p>
                    <p><strong>{t('serviceRequests.labels.frequency')}:</strong> {request.frequency}</p>
                    <p><strong>{t('serviceRequests.labels.days')}:</strong> {request.days.join(", ")}</p>
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