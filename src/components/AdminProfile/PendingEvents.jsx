import React, { useState, useEffect } from "react";
import { db, auth } from "../../firebase";
import { collection, query, where, getDocs, getDoc, updateDoc, doc } from "firebase/firestore";
import { toast } from "react-hot-toast";
import { triggerNotification } from "../SharedDashboard/TriggerNotifications";
import { useLanguage } from "../../context/LanguageContext";

const PendingEvents = () => {
  const { t } = useLanguage();
  const [pendingEvents, setPendingEvents] = useState([]);
  const [adminSettlement, setAdminSettlement] = useState("");

  useEffect(() => {
    const fetchAdminSettlement = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          console.error(t("pendingEvents.fetchError"));
          return;
        }
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (!userDoc.exists()) {
          console.error(t("pendingEvents.fetchError"));
          return;
        }
        const userData = userDoc.data();
        const settlement = userData.idVerification?.settlement || 
                           userData.settlement || 
                           userData.credentials?.settlement;
        setAdminSettlement(settlement || "");
      } catch (error) {
        console.error(t("pendingEvents.fetchError"), error);
      }
    };
    fetchAdminSettlement();
  }, []);

  useEffect(() => {
    const fetchPendingEvents = async () => {
      try {
        const user = auth.currentUser;
        const userDoc = await getDoc(doc(db, "users", user.uid));
        const userData = userDoc.data();
        const role = userData?.role?.toLowerCase() || "";
        const eventsRef = collection(db, "events");
        let q;
        if (role === "superadmin") {
          q = query(eventsRef, where("status", "==", "pending"));
        } else {
          q = query(eventsRef, where("status", "==", "pending"), where("settlement", "==", adminSettlement));
        }
        const snapshot = await getDocs(q);
        const events = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        }));
        setPendingEvents(events);
      } catch (error) {
        console.error(t("pendingEvents.fetchError"), error);
        toast.error(t("pendingEvents.fetchError"));
      }
    };
    fetchPendingEvents();
  }, [adminSettlement]);

  const handleApprove = async (eventId) => {
    try {
      const eventDoc = await getDoc(doc(db, "events", eventId));
      const eventData = eventDoc.data();
      await updateDoc(doc(db, "events", eventId), { status: "active", color: "yellow" });
      await triggerNotification({
        message: t("pendingEvents.approveSuccess"),
        target: [eventData.createdBy],
        link: `/events/${eventId}`,
        createdBy: auth.currentUser.uid,
        type: "alert"
      });
      toast.success(t("pendingEvents.approveSuccess"));
      setPendingEvents((prev) => prev.filter((event) => event.id !== eventId));
    } catch (error) {
      console.error(t("pendingEvents.approveError"), error);
      toast.error(t("pendingEvents.approveError"));
    }
  };

  const handleReject = async (eventId) => {
    try {
      const eventDoc = await getDoc(doc(db, "events", eventId));
      const eventData = eventDoc.data();
      await updateDoc(doc(db, "events", eventId), { status: "rejected", color: "red" });
      await triggerNotification({
        message: t("pendingEvents.rejectSuccess"),
        target: [eventData.createdBy],
        link: `/events/${eventId}`,
        createdBy: auth.currentUser.uid,
        type: "alert"
      });
      toast.success(t("pendingEvents.rejectSuccess"));
      setPendingEvents((prev) => prev.filter((event) => event.id !== eventId));
    } catch (error) {
      console.error(t("pendingEvents.rejectError"), error);
      toast.error(t("pendingEvents.rejectError"));
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow-sm">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">{t("pendingEvents.title")}</h2>
      {pendingEvents.length === 0 ? (
        <p>{t("pendingEvents.empty")}</p>
      ) : (
        <ul className="space-y-4">
          {pendingEvents.map((event) => (
            <li key={event.id} className="border p-4 rounded-md shadow-sm">
              <h3 className="text-lg font-bold">{event.title}</h3>
              <p><strong>{t("pendingEvents.location")}:</strong> {event.location}</p>
              <p><strong>{t("pendingEvents.startDate")}:</strong> {event.startDate}</p>
              <p><strong>{t("pendingEvents.endDate")}:</strong> {event.endDate}</p>
              <div className="flex space-x-4 mt-4">
                <button
                  onClick={() => handleApprove(event.id)}
                  className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold px-4 py-2 rounded-md transition-colors duration-200"
                >
                  {t("pendingEvents.accept")}
                </button>
                <button
                  onClick={() => handleReject(event.id)}
                  className="bg-red-400 hover:bg-red-500 text-white font-bold px-4 py-2 rounded-md transition-colors duration-200"
                >
                  {t("pendingEvents.reject")}
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
