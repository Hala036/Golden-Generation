import { useEffect, useState } from 'react';
import { FaInfoCircle, FaExclamationTriangle, FaCheckCircle, FaEnvelope } from 'react-icons/fa';
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db, getUserData, auth } from '../../firebase';
import useAuth from '../../hooks/useAuth';
import SendNotification from './SendNotification';
import { useLanguage } from "../../context/LanguageContext";
import i18n from "i18next";

const iconMap = {
  info: <FaInfoCircle className="text-yellow-500 text-xl" />,
  alert: <FaExclamationTriangle className="text-orange-500 text-xl" />,
  success: <FaCheckCircle className="text-green-500 text-xl" />,
  message: <FaEnvelope className="text-blue-500 text-xl" />,
};

const Notifications = ({ setSelectedTab, setShowNotificationsPopup, limit }) => { // Add setShowNotificationsPopup as a prop
  const  currentUser = auth.currentUser;
  const [userRole, setUserRole] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateNotificationModal, setShowCreateNotificationModal] = useState(false); // Modal for creating notifications
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
    if (!currentUser) { return; }

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
        const displayedNotifications = limit ? enrichedNotifications.slice(0, limit) : enrichedNotifications;

        setNotifications(displayedNotifications);
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

    // Redirect based on notification type
    if (notification.type === "message" && setSelectedTab) {
      setSelectedTab("messages");
      setShowNotificationsPopup(false); // Close the notifications popup
      setShowModal(false); // Close the notification modal
    } else if (notification.type === "request" && setSelectedTab) {
      setSelectedTab("volunteer"); // Redirect to Volunteer tab
      setShowNotificationsPopup(false); // Close the notifications popup
      setShowModal(false); // Close the notification modal
    } else {
      setSelectedNotification(notification);
      setShowModal(true);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (setShowModal) {
        setSelectedNotification(false); // Close the popup if clicked outside
      }
    };

    if (selectedNotification) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [selectedNotification]);

  return (
    <div className="w-full max-w-2xl mx-auto p-2 md:p-4">
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-4">
          <button
            className="text-sm text-blue-500 hover:underline"
            onClick={handleMarkAllAsRead}
          >
            {i18n.t('auth.dashboard.notifications.markAllAsRead')}
          </button>
          {userRole !== "retiree" && (
            <button
              className="text-sm text-green-500 hover:underline"
              onClick={() => setShowCreateNotificationModal(true)}
            >
              {i18n.t('auth.dashboard.notifications.createNotification')}
            </button>
          )}
        </div>
      </div>
      <div className="bg-white rounded-xl divide-y">
        {loading ? (
          <div className="p-8 text-center text-gray-400">{i18n.t('auth.dashboard.notifications.loading')}</div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center text-gray-400">{i18n.t('auth.dashboard.notifications.noNotifications')}</div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              className={`relative p-3 rounded-lg border-l-4 mb-3 shadow-lg ${
                n.type === 'alert' ? 'border-orange-500 bg-orange-50' : 
                n.type === 'success' ? 'border-green-500 bg-green-50' :
                n.type === 'message' ? 'border-blue-500 bg-blue-50' :
                n.type === 'info' ? 'border-yellow-500 bg-yellow-50' :
                'border-gray-300 bg-gray-50' // Default color
              }`}
              style={{
                opacity: n.read ? 0.6 : 1, // Apply opacity via inline style
              }}
              onClick={() => handleNotificationClick(n)}
            >
              {!n.read && (
                <div className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold animate-pulse">
                  !
                </div>
              )}

              <div className="flex items-start">
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
            </div>
          ))
        )}
      </div>

      {/* Modal for Notification Details */}
      {showModal && selectedNotification && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/10">
          <div className="absolute inset-0 bg-gray-200 opacity-50"></div>
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

      {/* Modal for SendNotification */}
      {showCreateNotificationModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="absolute inset-0 bg-gray-200"></div>
          <div className="relative bg-white rounded-lg shadow-lg p-6 w-full max-w-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Create Notification</h3>
              <button
                className="text-red-500 hover:text-red-700"
                onClick={() => setShowCreateNotificationModal(false)} // Close the modal
              >
                &times;
              </button>
            </div>
            <SendNotification onClose={() => setShowCreateNotificationModal(false)} /> {/* Pass onClose callback */}
          </div>
        </div>
      )}
    </div>
  );
};

export default Notifications;