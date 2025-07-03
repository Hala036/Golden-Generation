import { useEffect, useState } from 'react';
import { FaInfoCircle, FaExclamationTriangle, FaCheckCircle, FaEnvelope, FaBell } from 'react-icons/fa';
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db, getUserData } from '../../firebase';
import useAuth from '../../hooks/useAuth';
import SendNotification from './SendNotification';
import { useLanguage } from '../../context/LanguageContext';
import EmptyState from '../EmptyState';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';

const iconMap = {
  info: <FaInfoCircle className="text-yellow-500 text-xl" />,
  alert: <FaExclamationTriangle className="text-orange-500 text-xl" />,
  success: <FaCheckCircle className="text-green-500 text-xl" />,
  message: <FaEnvelope className="text-blue-500 text-xl" />,
};

const Notifications = ({ setSelectedTab, setShowNotificationsPopup, limit }) => { // Add setShowNotificationsPopup as a prop
  const { currentUser } = useAuth();
  const { t } = useLanguage();
  const [userRole, setUserRole] = useState(null);

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateNotificationModal, setShowCreateNotificationModal] = useState(false); // Modal for creating notifications
  const [showModal, setShowModal] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [showSendNotification, setShowSendNotification] = useState(false);

  // Fetch notifications based on user role
  useEffect(() => {
    const fetchNotifications = async () => {
      if (!currentUser?.uid) return;

      try {
        const userData = await getUserData(currentUser.uid);
        const userRole = userData?.role;

        if (!userRole) {
          console.error("User role not found for UID:", currentUser.uid);
          return;
        }

        let notificationsQuery;
        if (userRole === 'superadmin') {
          // Super admin sees all notifications
          notificationsQuery = query(collection(db, "notifications"), orderBy("createdAt", "desc"));
        } else if (userRole === 'admin') {
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));
          const userSettlement = userDoc.data()?.idVerification?.settlement;
          if (!userSettlement) {
            setNotifications([]);
            setLoading(false);
            return;
          }
          notificationsQuery = query(
            collection(db, "notifications"),
            where("settlement", "==", userSettlement),
            orderBy("createdAt", "desc")
          );
        } else {
          // Regular users see their own notifications
          notificationsQuery = query(
            collection(db, "notifications"),
            where("recipientId", "==", currentUser.uid),
            orderBy("createdAt", "desc")
          );
        }

        const unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
          const notifs = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setNotifications(notifs);
          setLoading(false);
        });

        return unsubscribe;
      } catch (error) {
        console.error("Error fetching notifications:", error);
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [currentUser]);

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    if (!currentUser) { return; }

    try {
      const userDoc = await getDoc(doc(db, "users", currentUser.uid));
      const currentNotifs = userDoc.data()?.notifs || [];
      
      const updatedNotifs = currentNotifs.map(notif => 
        notif.id === notificationId ? { ...notif, read: true } : notif
      );

      await updateDoc(doc(db, "users", currentUser.uid), { notifs: updatedNotifs });
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    if (!currentUser) { return; }

    try {
      const userDoc = await getDoc(doc(db, "users", currentUser.uid));
      const currentNotifs = userDoc.data()?.notifs || [];
      
      const updatedNotifs = currentNotifs.map(notif => ({ ...notif, read: true }));

      await updateDoc(doc(db, "users", currentUser.uid), { notifs: updatedNotifs });
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  const handleNotificationClick = (notification) => {
    // Mark the notification as read
    markAsRead(notification.id);

    // Redirect based on notification type
    if (notification.type === "message" && setSelectedTab) {
      setSelectedTab("messages");
      if (setShowNotificationsPopup) {
        setShowNotificationsPopup(false); // Close the notifications popup
      }
      setShowModal(false); // Close the notification modal
    } else if (notification.type === "request" && setSelectedTab) {
      setSelectedTab("volunteer"); // Redirect to Volunteer tab
      if (setShowNotificationsPopup) {
        setShowNotificationsPopup(false); // Close the notifications popup
      }
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

  // Loading skeleton for notifications
  const NotificationsSkeleton = () => (
    <div className="space-y-3">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="relative p-3 rounded-lg border-l-4 mb-3 shadow-lg bg-gray-50">
          <div className="flex items-start">
            <div className="w-6 h-6 bg-gray-200 rounded mr-3 mt-1"></div>
            <div className="flex-1 min-w-0">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-full mb-1"></div>
              <div className="h-3 bg-gray-200 rounded w-1/3"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="w-full max-w-2xl mx-auto p-2 md:p-4">
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-4">
          <button
            className="text-sm text-blue-500 hover:underline"
            onClick={markAllAsRead}
          >
            {t('auth.dashboard.notifications.markAllAsRead')}
          </button>
          {currentUser?.role !== "retiree" && (
            <button
              className="text-sm text-green-500 hover:underline"
              onClick={() => setShowCreateNotificationModal(true)}
            >
              {t('auth.dashboard.notifications.createNotification')}
            </button>
          )}
        </div>
      </div>
      <div className="bg-white rounded-xl divide-y">
        {loading ? (

          <NotificationsSkeleton />
        ) : notifications.length === 0 ? (
          <EmptyState
            icon={<FaBell className="text-6xl text-gray-300" />}
            title={t('emptyStates.noNotifications')}
            message={t('emptyStates.noNotificationsMessage')}
            className="p-8"
          />
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
                <div className="font-semibold text-gray-800 truncate">{n.title || t('auth.dashboard.notifications.notification')}</div>
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
              <h3 className="text-xl font-bold">{selectedNotification.title || t('dashboard.notifications.notification')}</h3>
              <button
                className="text-red-500 hover:text-red-700"
                onClick={() => setShowModal(false)}
              >
                {t('auth.dashboard.notifications.close')}
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
              <h3 className="text-xl font-bold">{t('dashboard.notifications.modalTitle')}</h3>
              <button
                className="text-red-500 hover:text-red-700"
                onClick={() => setShowCreateNotificationModal(false)} // Close the modal
              >
                {t('dashboard.notifications.close')}
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