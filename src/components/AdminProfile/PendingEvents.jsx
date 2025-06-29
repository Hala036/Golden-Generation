import React, { useState, useEffect } from "react";
import { db, auth } from "../../firebase";
import { collection, query, where, getDocs, getDoc, updateDoc, doc } from "firebase/firestore";
import { toast } from "react-hot-toast";
import { triggerNotification } from "../SharedDashboard/TriggerNotifications";
import { useLanguage } from '../../context/LanguageContext';

const PendingEvents = () => {
  const { t } = useLanguage();
  const [pendingEvents, setPendingEvents] = useState([]);
  const [adminSettlement, setAdminSettlement] = useState("");

  useEffect(() => {
    const fetchAdminSettlement = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          console.error(t('pendingEvents.errors.noUserLoggedIn'));
          return;
        }
        
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (!userDoc.exists()) {
          console.error(t('pendingEvents.errors.userDocumentNotFound'));
          return;
        }
        
        const userData = userDoc.data();
        console.log(t('pendingEvents.logs.adminData'), userData);
        
        // Try different possible locations for settlement
        const settlement = userData.idVerification?.settlement || 
                         userData.settlement || 
                         userData.credentials?.settlement;
        
        console.log(t('pendingEvents.logs.foundAdminSettlement'), settlement);
        setAdminSettlement(settlement || "");
      } catch (error) {
        console.error(t('pendingEvents.errors.errorFetchingAdminSettlement'), error);
      }
    };

    fetchAdminSettlement();
  }, [t]);

  useEffect(() => {
    const fetchPendingEvents = async () => {
      try {
        const eventsRef = collection(db, "events");
        const q = query(eventsRef, where("status", "==", "pending"), where("settlement", "==", adminSettlement));
        const snapshot = await getDocs(q);
        const events = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        }));
        setPendingEvents(events);
      } catch (error) {
        console.error(t('pendingEvents.errors.errorFetchingPendingEvents'), error);
        toast.error(t('pendingEvents.toasts.fetchError'));
      }
    };

    if (adminSettlement) {
      fetchPendingEvents();
    }
  }, [adminSettlement, t]);

  const handleApprove = async (eventId) => {
    try {
      const eventDoc = await getDoc(doc(db, "events", eventId));
      const eventData = eventDoc.data();

      await updateDoc(doc(db, "events", eventId), { status: "active", color: "yellow" });

      // Trigger notification for approval
      await triggerNotification({
        message: t('pendingEvents.notifications.approved', { title: eventData.title }),
        target: [eventData.createdBy],
        link: `/events/${eventId}`,
        createdBy: auth.currentUser.uid,
        type: "alert"
      });

      toast.success(t('pendingEvents.toasts.approveSuccess'));
      setPendingEvents((prev) => prev.filter((event) => event.id !== eventId));
    } catch (error) {
      console.error(t('pendingEvents.errors.errorApprovingEvent'), error);
      toast.error(t('pendingEvents.toasts.approveError'));
    }
  };

  const handleReject = async (eventId) => {
    try {
      const eventDoc = await getDoc(doc(db, "events", eventId));
      const eventData = eventDoc.data();

      await updateDoc(doc(db, "events", eventId), { status: "rejected", color: "red" });

      // Trigger notification for rejection
      await triggerNotification({
        message: t('pendingEvents.notifications.rejected', { title: eventData.title }),
        target: [eventData.createdBy],
        link: `/events/${eventId}`,
        createdBy: auth.currentUser.uid,
        type: "alert"
      });

      toast.success(t('pendingEvents.toasts.rejectSuccess'));
      setPendingEvents((prev) => prev.filter((event) => event.id !== eventId));
    } catch (error) {
      console.error(t('pendingEvents.errors.errorRejectingEvent'), error);
      toast.error(t('pendingEvents.toasts.rejectError'));
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow-sm">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">{t('pendingEvents.title')}</h2>
      {pendingEvents.length === 0 ? (
        <p>{t('pendingEvents.noEvents')}</p>
      ) : (
        <ul className="space-y-4">
          {pendingEvents.map((event) => (
            <li key={event.id} className="border p-4 rounded-md shadow-sm">
              <h3 className="text-lg font-bold">{event.title}</h3>
              <p><strong>{t('pendingEvents.location')}:</strong> {event.location}</p>
              <p><strong>{t('pendingEvents.startDate')}:</strong> {event.startDate}</p>
              <p><strong>{t('pendingEvents.endDate')}:</strong> {event.endDate}</p>
              <div className="flex space-x-4 mt-4">
                {/* Accept Button */}
                <button
                    onClick={() => handleApprove(event.id)}
                    className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold px-4 py-2 rounded-md transition-colors duration-200"
                >
                    {t('pendingEvents.actions.accept')}
                </button>

                {/* Reject Button */}
                <button
                    onClick={() => handleReject(event.id)}
                    className="bg-red-400 hover:bg-red-500 text-white font-bold px-4 py-2 rounded-md transition-colors duration-200"
                >
                    {t('pendingEvents.actions.reject')}
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
