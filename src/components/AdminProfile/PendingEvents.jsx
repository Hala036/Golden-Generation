import React, { useState, useEffect } from "react";
import { db, auth } from "../../firebase";
import { collection, query, where, getDocs, getDoc, updateDoc, doc } from "firebase/firestore";
import { toast } from "react-hot-toast";

const PendingEvents = () => {
  const [pendingEvents, setPendingEvents] = useState([]);
  const [adminSettlement, setAdminSettlement] = useState("");

  useEffect(() => {
    const fetchAdminSettlement = async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            setAdminSettlement(userDoc.data().idVerification.settlement); // Fetch admin's settlement
          }
        }
      } catch (error) {
        console.error("Error fetching admin settlement:", error);
      }
    };

    fetchAdminSettlement();
  }, []);

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
        console.error("Error fetching pending events:", error);
        toast.error("Failed to fetch pending events.");
      }
    };

    if (adminSettlement) {
      fetchPendingEvents();
    }
  }, [adminSettlement]);

  const handleApprove = async (eventId) => {
    try {
      await updateDoc(doc(db, "events", eventId), { status: "active", color: "yellow" });
      toast.success("Event approved successfully!");
      setPendingEvents((prev) => prev.filter((event) => event.id !== eventId));
    } catch (error) {
      console.error("Error approving event:", error);
      toast.error("Failed to approve event.");
    }
  };

  const handleReject = async (eventId) => {
    try {
      await updateDoc(doc(db, "events", eventId), { status: "rejected", color: "red" });
      toast.success("Event rejected successfully!");
      setPendingEvents((prev) => prev.filter((event) => event.id !== eventId));
    } catch (error) {
      console.error("Error rejecting event:", error);
      toast.error("Failed to reject event.");
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow-sm">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Pending Events</h2>
      {pendingEvents.length === 0 ? (
        <p>No pending events to review.</p>
      ) : (
        <ul className="space-y-4">
          {pendingEvents.map((event) => (
            <li key={event.id} className="border p-4 rounded-md shadow-sm">
              <h3 className="text-lg font-bold">{event.title}</h3>
              <p><strong>Location:</strong> {event.location}</p>
              <p><strong>Start Date:</strong> {event.startDate}</p>
              <p><strong>End Date:</strong> {event.endDate}</p>
              <div className="flex space-x-4 mt-4">
                {/* Accept Button */}
                <button
                    onClick={() => handleApprove(event.id)}
                    className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold px-4 py-2 rounded-md transition-colors duration-200"
                >
                    Accept
                </button>

                {/* Reject Button */}
                <button
                    onClick={() => handleReject(event.id)}
                    className="bg-red-400 hover:bg-red-500 text-white font-bold px-4 py-2 rounded-md transition-colors duration-200"
                >
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
