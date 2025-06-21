// import React, { useState, useEffect } from "react";
// import { FaBell, FaCheck, FaEnvelope, FaEnvelopeOpen, FaTrash } from "react-icons/fa";
// import { getNotifications, markNotificationAsRead } from "../../jobRequestsService";
// import { auth } from "../../firebase";
// import { toast } from "react-hot-toast";

// const JobNotifications = () => {
//   const [notifications, setNotifications] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [showUnreadOnly, setShowUnreadOnly] = useState(false);

//   useEffect(() => {
//     const fetchNotifications = async () => {
//       try {
//         setLoading(true);
//         const currentUser = auth.currentUser;
//         if (!currentUser) {
//           setError("User not authenticated");
//           return;
//         }

//         const fetchedNotifications = await getNotifications(
//           currentUser.uid,
//           showUnreadOnly
//         );
//         setNotifications(fetchedNotifications);
//       } catch (err) {
//         console.error("Error fetching notifications:", err);
//         setError("Failed to load notifications");
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchNotifications();
//   }, [showUnreadOnly]);

//   const handleMarkAsRead = async (notificationId) => {
//     try {
//       await markNotificationAsRead(notificationId);
      
//       // Update the local state
//       setNotifications(
//         notifications.map((notification) =>
//           notification.id === notificationId
//             ? { ...notification, read: true }
//             : notification
//         )
//       );
      
//       toast.success("Notification marked as read");
//     } catch (err) {
//       console.error("Error marking notification as read:", err);
//       toast.error("Failed to mark notification as read");
//     }
//   };

//   const handleMarkAllAsRead = async () => {
//     try {
//       const unreadNotifications = notifications.filter(
//         (notification) => !notification.read
//       );
      
//       if (unreadNotifications.length === 0) {
//         toast.info("No unread notifications");
//         return;
//       }
      
//       // Mark each notification as read
//       await Promise.all(
//         unreadNotifications.map((notification) =>
//           markNotificationAsRead(notification.id)
//         )
//       );
      
//       // Update the local state
//       setNotifications(
//         notifications.map((notification) => ({
//           ...notification,
//           read: true,
//         }))
//       );
      
//       toast.success("All notifications marked as read");
//     } catch (err) {
//       console.error("Error marking all notifications as read:", err);
//       toast.error("Failed to mark all notifications as read");
//     }
//   };

//   const getNotificationIcon = (type) => {
//     switch (type) {
//       case "job_invitation":
//         return <FaEnvelope className="text-blue-500" />;
//       case "senior_response":
//         return <FaEnvelopeOpen className="text-green-500" />;
//       default:
//         return <FaBell className="text-yellow-500" />;
//     }
//   };

//   if (loading && notifications.length === 0) {
//     return (
//       <div className="p-6">
//         <div className="flex justify-between items-center mb-4">
//           <h2 className="text-xl font-bold">Job Notifications</h2>
//         </div>
//         <div className="flex justify-center items-center h-64">
//           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
//         </div>
//       </div>
//     );
//   }

//   if (error && notifications.length === 0) {
//     return (
//       <div className="p-6">
//         <div className="flex justify-between items-center mb-4">
//           <h2 className="text-xl font-bold">Job Notifications</h2>
//         </div>
//         <div className="flex justify-center items-center h-64">
//           <div className="text-red-500 text-center">
//             <p className="text-xl mb-2">Error</p>
//             <p>{error}</p>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="p-6">
//       <div className="flex justify-between items-center mb-4">
//         <h2 className="text-xl font-bold">Job Notifications</h2>
//         <div className="flex space-x-4">
//           <div className="flex items-center">
//             <input
//               type="checkbox"
//               id="unreadOnly"
//               checked={showUnreadOnly}
//               onChange={() => setShowUnreadOnly(!showUnreadOnly)}
//               className="mr-2"
//             />
//             <label htmlFor="unreadOnly" className="text-sm">
//               Show unread only
//             </label>
//           </div>
//           <button
//             onClick={handleMarkAllAsRead}
//             className="bg-blue-500 hover:bg-blue-600 text-white text-sm py-1 px-3 rounded flex items-center"
//           >
//             <FaCheck className="mr-1" /> Mark all as read
//           </button>
//         </div>
//       </div>

//       {notifications.length === 0 ? (
//         <div className="bg-white rounded shadow p-6 text-center">
//           <p className="text-gray-500">No notifications found.</p>
//         </div>
//       ) : (
//         <div className="bg-white rounded shadow divide-y">
//           {notifications.map((notification) => (
//             <div
//               key={notification.id}
//               className={`p-4 ${
//                 notification.read ? "bg-white" : "bg-blue-50"
//               } hover:bg-gray-50`}
//             >
//               <div className="flex items-start">
//                 <div className="mr-3 mt-1">
//                   {getNotificationIcon(notification.type)}
//                 </div>
//                 <div className="flex-1">
//                   <p className={`${notification.read ? "text-gray-700" : "text-black font-medium"}`}>
//                     {notification.message}
//                   </p>
//                   <p className="text-gray-500 text-sm mt-1">
//                     {notification.createdAt
//                       ? new Date(notification.createdAt.seconds * 1000).toLocaleString()
//                       : "Unknown date"}
//                   </p>
//                 </div>
//                 <div className="flex space-x-2">
//                   {!notification.read && (
//                     <button
//                       onClick={() => handleMarkAsRead(notification.id)}
//                       className="text-blue-500 hover:text-blue-700"
//                       title="Mark as read"
//                     >
//                       <FaCheck />
//                     </button>
//                   )}
//                 </div>
//               </div>
//             </div>
//           ))}
//         </div>
//       )}
//     </div>
//   );
// };

// export default JobNotifications;

