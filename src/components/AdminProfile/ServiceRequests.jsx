import React, { useState, useEffect } from "react";
import { getServiceRequests, updateServiceRequest } from "../../serviceRequestsService";
import { createJobRequest } from "../../jobRequestsService";
import { toast } from "react-hot-toast";
import { auth, db } from "../../firebase";
import { doc, getDoc } from "firebase/firestore";
import { FaHandsHelping, FaEye } from "react-icons/fa";
import EmptyState from "../EmptyState";
import { useLanguage } from "../../context/LanguageContext";
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

const ServiceRequests = () => {
  const { t } = useLanguage();
  const [requests, setRequests] = useState([]);
  const [adminSettlement, setAdminSettlement] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminSettlement = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          toast.error(t("serviceRequests.errors.mustBeLoggedIn"));
          return;
        }

        const userDoc = await getDoc(doc(db, "users", user.uid));
        
        if (!userDoc.exists()) {
          toast.error(t("serviceRequests.errors.userDocumentNotFound"));
          return;
        }

        const userData = userDoc.data();
        console.log("ServiceRequests - Admin data:", userData);

        if (userData.role === "superadmin") {
          setAdminSettlement("__ALL__");
          return;
        }

        const settlement = userData.idVerification?.settlement || 
                         userData.settlement || 
                         userData.credentials?.settlement;
        
        console.log("ServiceRequests - Found admin settlement:", settlement);

        if (!settlement) {
          toast.error(t("serviceRequests.errors.noSettlementFound"));
          return;
        }

        setAdminSettlement(settlement);
      } catch (error) {
        console.error("Error fetching admin settlement:", error);
        toast.error(t("serviceRequests.errors.fetchAdminSettlement"));
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
          filteredRequests = allRequests;
        } else {
          filteredRequests = allRequests.filter(
            (request) => request.settlement === adminSettlement
          );
        }
        setRequests(filteredRequests);
      } catch (error) {
        console.error("Error fetching service requests:", error);
        toast.error(t("serviceRequests.errors.fetchServiceRequests"));
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
        status: "Active",
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

      await updateServiceRequest(serviceRequest.id, { status: "viewed" });

      toast.success(t("admin.jobs.createSuccess"));
      setRequests((prevRequests) =>
        prevRequests.map((req) =>
          req.id === serviceRequest.id ? { ...req, status: "viewed" } : req
        )
      );
    } catch (error) {
      console.error("Error creating voluntary request:", error);
      toast.error(t("serviceRequests.errors.createVoluntaryRequest"));
    }
  };

  const pendingRequests = requests.filter((request) => request.status === "pending");
  const viewedRequests = requests.filter((request) => request.status === "viewed");

  if (loading && !requests.length) {
    return (
      <div className="p-4 sm:p-6 max-w-screen mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-4 sm:mb-6">
          <h1 className="text-lg sm:text-1xl md:text-3xl font-bold">{t("serviceRequests.title")}</h1>
        </div>
        <Skeleton count={3} />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">{t("serviceRequests.title")}</h1>
      {loading ? (
        <p>{t("loading")}</p>
      ) : (
        <>
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-yellow-500 mb-4">{t("serviceRequests.pendingRequests")}</h2>
            {pendingRequests.length === 0 ? (
              <EmptyState
                icon={<FaHandsHelping className="text-6xl text-gray-300" />}
                title={t("emptyStates.noPendingRequests")}
                message={t("emptyStates.noPendingRequestsMessage")}
                className="p-6 flex-grow"
              />
            ) : (
              <ul className="space-y-4">
                {pendingRequests.map((request) => (
                  <li key={request.id} className="p-4 border rounded shadow">
                    <h2 className="text-lg font-bold">{request.title}</h2>
                    <p><strong>{t("serviceRequests.description")}:</strong> {request.description}</p>
                    <p><strong>{t("serviceRequests.location")}:</strong> {request.location}</p>
                    <p><strong>{t("serviceRequests.volunteerField")}:</strong> {request.volunteerField}</p>
                    <p><strong>{t("serviceRequests.professionalBackground")}:</strong> {request.professionalBackground || t("serviceRequests.notSpecified")}</p>
                    <p><strong>{t("serviceRequests.timing")}:</strong> {request.timing}</p>
                    <p><strong>{t("serviceRequests.frequency")}:</strong> {request.frequency}</p>
                    <p><strong>{t("serviceRequests.days")}:</strong> {request.days.join(", ")}</p>
                    <button
                      onClick={() => handleFindMatch(request)}
                      className="bg-yellow-400 hover:bg-yellow-500 text-black font-medium py-2 px-4 rounded"
                    >
                      {t("serviceRequests.findMatch")}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <hr className="border-t border-gray-300 my-8" />

          <div>
            <h2 className="text-2xl font-semibold text-yellow-600 mb-4">{t("serviceRequests.viewedRequests")}</h2>
            {viewedRequests.length === 0 ? (
              <EmptyState
                icon={<FaEye className="text-6xl text-gray-300" />}
                title={t("emptyStates.noViewedRequests")}
                message={t("emptyStates.noViewedRequestsMessage")}
                className="p-6 flex-grow"
              />
            ) : (
              <ul className="space-y-4">
                {viewedRequests.map((request) => (
                  <li key={request.id} className="p-4 border rounded shadow">
                    <h2 className="text-lg font-bold">{request.title}</h2>
                    <p><strong>{t("serviceRequests.description")}:</strong> {request.description}</p>
                    <p><strong>{t("serviceRequests.location")}:</strong> {request.location}</p>
                    <p><strong>{t("serviceRequests.volunteerField")}:</strong> {request.volunteerField}</p>
                    <p><strong>{t("serviceRequests.professionalBackground")}:</strong> {request.professionalBackground || t("serviceRequests.notSpecified")}</p>
                    <p><strong>{t("serviceRequests.timing")}:</strong> {request.timing}</p>
                    <p><strong>{t("serviceRequests.frequency")}:</strong> {request.frequency}</p>
                    <p><strong>{t("serviceRequests.days")}:</strong> {request.days.join(", ")}</p>
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