import React, { useEffect, useState } from 'react';
import { FaInfoCircle, FaExclamationTriangle, FaCheckCircle } from 'react-icons/fa';
import { collection, query, where, orderBy, getDocs, updateDoc, doc } from "firebase/firestore";
import { db } from '../../firebase';
import { useAuth } from '../../hooks/useAuth';

const iconMap = {
  info: <FaInfoCircle className="text-blue-400 text-xl" />,
  alert: <FaExclamationTriangle className="text-yellow-500 text-xl" />,
  success: <FaCheckCircle className="text-green-500 text-xl" />,
  job_invitation: <FaInfoCircle className="text-blue-400 text-xl" />,
};

const Notifications = () => {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch notifications from Firestore
  useEffect(() => {
    if (!currentUser) return;
    const fetchNotifications = async () => {
      setLoading(true);
      const q = query(
        collection(db, "notifications"),
        where("recipientId", "==", currentUser.uid),
        orderBy("createdAt", "desc")
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setNotifications(data);
      setLoading(false);
    };
    fetchNotifications();
  }, [currentUser]);

  const handleMarkAsRead = async (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    await updateDoc(doc(db, "notifications", id), { read: true });
  };

  const handleMarkAllAsRead = async () => {
    const updates = notifications
      .filter((n) => !n.read)
      .map((n) => updateDoc(doc(db, "notifications", n.id), { read: true }));
    await Promise.all(updates);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-4 md:p-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Notifications</h2>
        <button
          className="text-sm text-blue-500 hover:underline"
          onClick={handleMarkAllAsRead}
        >
          Mark all as read
        </button>
      </div>
      <div className="bg-white rounded-xl shadow-lg divide-y">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No notifications</div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              className={`flex items-start gap-4 px-6 py-5 cursor-pointer hover:bg-gray-50 transition ${
                n.read ? 'opacity-60' : ''
              }`}
              onClick={() => handleMarkAsRead(n.id)}
            >
              <div className="mt-1">{iconMap[n.type] || iconMap.info}</div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-800 truncate">{n.title || "Notification"}</div>
                <div className="text-sm text-gray-600 truncate">{n.message}</div>
                <div className="text-xs text-gray-400 mt-1">
                  {n.createdAt?.toDate
                    ? n.createdAt.toDate().toLocaleString()
                    : ""}
                </div>
              </div>
              {!n.read && <span className="w-2 h-2 bg-red-500 rounded-full mt-2"></span>}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Notifications;