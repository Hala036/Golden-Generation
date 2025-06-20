import { useEffect, useState } from 'react';
import { FaInfoCircle, FaExclamationTriangle, FaCheckCircle, FaEnvelope } from 'react-icons/fa';
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db, getUserData } from '../../firebase';
import { useAuth } from '../../hooks/useAuth';
import SendNotification from './SendNotification';

const iconMap = {
  info: <FaInfoCircle className="text-blue-400 text-xl" />,
  alert: <FaExclamationTriangle className="text-yellow-500 text-xl" />,
  success: <FaCheckCircle className="text-green-500 text-xl" />,
  message: <FaEnvelope className="text-gray-500 text-xl" />,
};

const Notifications = ({ setSelectedTab, setShowNotificationsPopup }) => { // Add setShowNotificationsPopup as a prop
  const { currentUser } = useAuth();
  const [userRole, setUserRole] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);

  // Fetch user role
  useEffect(() => {
    const fetchUserRole = async () => {
      if (!currentUser?.uid) return;

      try {
        const userData = await getUserData(currentUser.uid);
        if (userData?.role) {
          setUserRole(userData.role);
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
    if (!currentUser) return;

    const fetchNotifications = async () => {
      setLoading(true);

      try {
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        const userData = userDoc.data();
        const userNotifications = userData?.notifs || [];

        const enrichedNotifications = await Promise.all(
          userNotifications.map(async (notif) => {
            const notifDoc = await getDoc(doc(db, "notifications", notif.id));
            return {
              id: notif.id,
              ...notifDoc.data(),
              read: notif.read,
            };
          })
        );

        setNotifications(enrichedNotifications);
      } catch (err) {
        console.error("Error fetching notifications:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [currentUser]);

  const handleMarkAsRead = async (notificationId) => {
    try {
      const userDoc = await getDoc(doc(db, "users", currentUser.uid));
      const userData = userDoc.data();
      const updatedNotifs = userData.notifs.map((notif) =>
        notif.id === notificationId ? { ...notif, read: true } : notif
      );

      await updateDoc(doc(db, "users", currentUser.uid), { notifs: updatedNotifs });

      setNotifications((prev) =>
        prev.map((notif) =>
          notif.id === notificationId ? { ...notif, read: true } : notif
        )
      );
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const userDoc = await getDoc(doc(db, "users", currentUser.uid));
      const userData = userDoc.data();
      const updatedNotifs = userData.notifs.map((notif) => ({
        ...notif,
        read: true,
      }));

      await updateDoc(doc(db, "users", currentUser.uid), { notifs: updatedNotifs });

      setNotifications((prev) =>
        prev.map((notif) => ({ ...notif, read: true }))
      );
    } catch (err) {
      console.error("Error marking all notifications as read:", err);
    }
  };

  const handleNotificationClick = (notification) => {
    // Mark the notification as read
    handleMarkAsRead(notification.id);

    // Switch to "messages" tab if the notification type is "message"
    if (notification.type === "message" && setSelectedTab) {
      setSelectedTab("messages");
      setShowNotificationsPopup(false); // Close the notifications popup
      setShowModal(false); // Close the notification modal
    } else {
      setSelectedNotification(notification);
      setShowModal(true);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-4 md:p-8">
      <div className="flex justify-between items-center mb-6">
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
              onClick={() => setShowModal(true)}
            >
              Create Notification
            </button>
          )}
        </div>
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
              onClick={() => handleNotificationClick(n)}
            >
              <div className="mt-1">
                {iconMap[n.type] || iconMap.info}
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

      {/* Modal for Notification Details */}
      {showModal && selectedNotification && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="absolute inset-0 bg-gray-800 opacity-50"></div>
          <div className="relative bg-white rounded-lg shadow-lg p-6 w-full max-w-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">{selectedNotification.title || "Notification"}</h3>
              <button
                className="text-red-500 hover:text-red-700"
                onClick={() => setShowModal(false)}
              >
                &times;
              </button>
            </div>
            <p className="text-gray-700">{selectedNotification.message}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Notifications;