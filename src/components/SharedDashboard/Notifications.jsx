import { useEffect, useState } from 'react';
import { FaInfoCircle, FaExclamationTriangle, FaCheckCircle, FaEnvelope } from 'react-icons/fa'; // Added FaEnvelope for "message"
import { collection, query, where, getDocs, updateDoc, doc, deleteDoc } from "firebase/firestore";
import { db, getUserData } from '../../firebase'; // Import getUserData
import { useAuth } from '../../hooks/useAuth';
import SendNotification from './SendNotification';

const iconMap = {
  info: <FaInfoCircle className="text-blue-400 text-xl" />,
  alert: <FaExclamationTriangle className="text-yellow-500 text-xl" />,
  success: <FaCheckCircle className="text-green-500 text-xl" />,
  message: <FaEnvelope className="text-gray-500 text-xl" />, // Added icon for "message"
};

const Notifications = () => {
  const { currentUser } = useAuth();
  const [userRole, setUserRole] = useState(null); // Local state for role
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false); // State to control modal visibility

  // Fetch user role
  useEffect(() => {
    const fetchUserRole = async () => {
      if (!currentUser?.uid) return;

      try {
        const userData = await getUserData(currentUser.uid); // Use getUserData to fetch user data
        if (userData?.role) {
          setUserRole(userData.role); // Set role in local state
        } else {
          console.error("User role not found for UID:", currentUser.uid);
        }
      } catch (err) {
        console.error("Error fetching user role:", err);
      }
    };

    fetchUserRole();
  }, [currentUser]);

  // Fetch notifications
  useEffect(() => {
    if (!currentUser || !userRole) return;

    const fetchNotifications = async () => {
      setLoading(true);

      try {
        const q = query(
          collection(db, "notifications"),
          where("target", "array-contains-any", [currentUser.uid, userRole])
        );

        const snapshot = await getDocs(q);

        const data = snapshot.docs.map(doc => {
          const notification = doc.data();
          return {
            id: doc.id,
            ...notification,
            target: notification.target || "unknown", // Default target
            createdAt: notification.createdAt || null, // Handle missing createdAt
          };
        })
        .filter(n => n.createdBy !== currentUser.uid);

        console.log("Mapped notifications data:", data);

        setNotifications(data);
      } catch (err) {
        console.error("Error fetching notifications:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [currentUser, userRole]);

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

  const deleteOldNotifications = async () => {
    const snapshot = await getDocs(collection(db, "notifications"));
    const now = new Date();
    const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30)); // Calculate 30 days ago

    snapshot.forEach(async (docSnapshot) => {
      const data = docSnapshot.data();
      if (data.createdAt && data.createdAt.toDate() < thirtyDaysAgo) {
        console.log("Deleting old notification:", docSnapshot.id);
        await deleteDoc(doc(db, "notifications", docSnapshot.id));
      }
    });
  };

  // Call deleteOldNotifications function periodically (e.g., via a cron job or manually)

  return (
    <div className="w-full max-w-2xl mx-auto p-4 md:p-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Notifications</h2>
        <div className="flex items-center gap-4">
          <button
            className="text-sm text-blue-500 hover:underline"
            onClick={handleMarkAllAsRead}
          >
            Mark all as read
          </button>
          {userRole !== "retiree" && (
            <button
              className="text-sm text-green-500 hover:underline"
              onClick={() => setShowModal(true)} // Show the modal
            >
              Create Notification
            </button>
          )}
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-lg divide-y">
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No notifications</div>
        ) : loading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              className={`flex items-start gap-4 px-6 py-5 cursor-pointer hover:bg-gray-50 transition ${
                n.read ? 'opacity-60' : ''
              }`}
              onClick={() => handleMarkAsRead(n.id)}
            >
              {/* Check for type and assign appropriate icon */}
              <div className="mt-1">
                {iconMap[n.type] || iconMap.info} {/* Default to info icon */}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-800 truncate">{n.title || "Notification"}</div>
                <div className="text-sm text-gray-600 truncate">{n.message}</div>
                <div className="text-xs text-gray-400 mt-1">
                  {n.createdAt
                    ? typeof n.createdAt.toDate === "function"
                      ? n.createdAt.toDate().toLocaleString()
                      : typeof n.createdAt === "string"
                        ? new Date(n.createdAt).toLocaleString()
                        : ""
                    : ""}
                </div>
              </div>
              {!n.read && <span className="w-2 h-2 bg-red-500 rounded-full mt-2"></span>}
            </div>
          ))
        )}
      </div>

      {/* Modal for SendNotification */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Create Notification</h3>
              <button
                className="text-red-500 hover:text-red-700"
                onClick={() => setShowModal(false)} // Close the modal
              >
                &times;
              </button>
            </div>
            <SendNotification />
          </div>
        </div>
      )}
    </div>
  );
};

export default Notifications;