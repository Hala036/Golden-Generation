import React, { useState, useEffect } from "react";
import { db, auth } from "../../firebase";
import { collection, query, where, getDocs, getDoc, updateDoc, doc } from "firebase/firestore";
import { toast } from "react-hot-toast";
import { triggerNotification } from "../SharedDashboard/TriggerNotifications";
import { useTranslation } from "react-i18next";

const PendingEvents = () => {
  const { t } = useTranslation();
  const [pendingEvents, setPendingEvents] = useState([]);
  const [adminSettlement, setAdminSettlement] = useState("");
  const [userRole, setUserRole] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminSettlement = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          console.error("No user logged in");
          return;
        }
        
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (!userDoc.exists()) {
          console.error("User document not found");
          return;
        }
        
        const userData = userDoc.data();
        setUserRole(userData.role);
        
        // Check if user is superadmin
        if (userData.role === 'superadmin') {
          setAdminSettlement("__ALL__"); // Special value for superadmin
          return;
        }
        
        // Try different possible locations for settlement
        const settlement = userData.idVerification?.settlement || 
                         userData.settlement || 
                         userData.credentials?.settlement;
        
        setAdminSettlement(settlement || "");
      } catch (error) {
        console.error("Error fetching admin settlement:", error);
      }
    };

    fetchAdminSettlement();
  }, []);

  useEffect(() => {
    const fetchPendingEvents = async () => {
      try {
        setLoading(true);
        const eventsRef = collection(db, "events");
        let q;
        
        if (adminSettlement === "__ALL__") {
          // Superadmin: get all pending events
          q = query(eventsRef, where("status", "==", "pending"));
        } else {
          // Admin: get pending events from their settlement
          q = query(eventsRef, where("status", "==", "pending"), where("settlement", "==", adminSettlement));
        }
        
        const snapshot = await getDocs(q);
        const events = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        }));
        setPendingEvents(events);
      } catch (error) {
        console.error("Error fetching pending events:", error);
        toast.error("Failed to fetch pending events.");
      } finally {
        setLoading(false);
      }
    };

    if (adminSettlement) {
      fetchPendingEvents();
    }
  }, [adminSettlement]);

  const handleApprove = async (eventId) => {
    try {
      const eventDoc = await getDoc(doc(db, "events", eventId));
      const eventData = eventDoc.data();

      await updateDoc(doc(db, "events", eventId), { status: "active", color: "yellow" });

      // Trigger notification for approval
      await triggerNotification({
        message: `Your event "${eventData.title}" has been approved.`,
        target: [eventData.createdBy],
        link: `/events/${eventId}`,
        createdBy: auth.currentUser.uid,
        type: "alert"
      });

      toast.success("Event approved successfully!");
      setPendingEvents((prev) => prev.filter((event) => event.id !== eventId));
    } catch (error) {
      console.error("Error approving event:", error);
      toast.error("Failed to approve event.");
    }
  };

  const handleReject = async (eventId) => {
    try {
      const eventDoc = await getDoc(doc(db, "events", eventId));
      const eventData = eventDoc.data();

      await updateDoc(doc(db, "events", eventId), { status: "rejected", color: "red" });

      // Trigger notification for rejection
      await triggerNotification({
        message: `Your event "${eventData.title}" has been rejected.`,
        target: [eventData.createdBy],
        link: `/events/${eventId}`,
        createdBy: auth.currentUser.uid,
        type: "alert"
      });

      toast.success("Event rejected successfully!");
      setPendingEvents((prev) => prev.filter((event) => event.id !== eventId));
    } catch (error) {
      console.error("Error rejecting event:", error);
      toast.error("Failed to reject event.");
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">
          {userRole === 'superadmin' ? 'All Pending Events' : 'Pending Events'}
        </h2>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border p-4 rounded-md shadow-sm">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/3"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow-sm">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">
        {userRole === 'superadmin' ? 'All Pending Events' : 'Pending Events'}
      </h2>
      {pendingEvents.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500 text-lg">No pending events to review.</p>
        </div>
      ) : (
        <ul className="space-y-4">
          {pendingEvents.map((event) => (
            <li key={event.id} className="border p-4 rounded-md shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-lg font-bold text-gray-800">{event.title}</h3>
                {userRole === 'superadmin' && event.settlement && (
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm font-medium">
                    {event.settlement}
                  </span>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">
                    <strong>Location:</strong>
                  </p>
                  <p className="text-gray-800">{event.location || 'Not specified'}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600 mb-1">
                    <strong>Date:</strong>
                  </p>
                  <p className="text-gray-800">
                    {event.startDate} {event.endDate && event.endDate !== event.startDate && `- ${event.endDate}`}
                  </p>
                </div>
                
                {event.timeFrom && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">
                      <strong>Time:</strong>
                    </p>
                    <p className="text-gray-800">
                      {event.timeFrom} {event.timeTo && `- ${event.timeTo}`}
                    </p>
                  </div>
                )}
                
                {event.description && (
                  <div className="md:col-span-2">
                    <p className="text-sm text-gray-600 mb-1">
                      <strong>Description:</strong>
                    </p>
                    <p className="text-gray-800 text-sm">{event.description}</p>
                  </div>
                )}
              </div>
              
              <div className="flex space-x-4 mt-4">
                {/* Accept Button */}
                <button
                  onClick={() => handleApprove(event.id)}
                  className="bg-green-500 hover:bg-green-600 text-white font-bold px-4 py-2 rounded-md transition-colors duration-200 flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  Approve
                </button>

                {/* Reject Button */}
                <button
                  onClick={() => handleReject(event.id)}
                  className="bg-red-500 hover:bg-red-600 text-white font-bold px-4 py-2 rounded-md transition-colors duration-200 flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                  Reject
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default PendingEvents;
