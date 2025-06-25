import React, { useState, useEffect, useContext } from "react";
import { UserContext } from "../../context/UserContext"; // Import UserContext
import { FaBell, FaPlus, FaSearch, FaUsers, FaChartBar, FaCalendarAlt, FaClock, FaExclamationTriangle, FaCheckCircle, FaUserPlus, FaHandshake, FaHandsHelping, FaCalendarCheck } from 'react-icons/fa';
import { getServiceRequests } from "../../serviceRequestsService"; // Import serviceRequests logic
import { query, collection, where, getDocs, getDoc, doc, orderBy, limit, Timestamp } from "firebase/firestore"; // Import Firestore utilities
import { auth, db } from "../../firebase"; // Import Firestore instance
import Notifications from "./Notifications"; // Import Notifications component

const AdminHomepage = ({ setSelected, setShowNotificationsPopup }) => {
  const user = auth.currentUser;
  const { userData } = useContext(UserContext); // Access user data from context
  const userSettlement = userData?.idVerification?.settlement || "";
  const userName = userData?.credentials?.username || "Admin";
  const [currentTime, setCurrentTime] = useState(new Date());
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [retireesRegisteredCount, setRetireesRegisteredCount] = useState(0); // State for retirees registered this week
  const [activeEventsCount, setActiveEventsCount] = useState(0); // State for active events
  const [volunteerMatchesCount, setVolunteerMatchesCount] = useState(0); // State for volunteer matches

  const [upcomingEvents] = useState([
    { id: 1, title: 'Music Workshop', date: '2025-06-16', time: '10:00', participants: 12, volunteers: 3 },
    { id: 2, title: 'Garden Event', date: '2025-06-17', time: '14:00', participants: 8, volunteers: 1 },
    { id: 3, title: 'Cooking Together', date: '2025-06-18', time: '16:00', participants: 15, volunteers: 0 }
  ]);

  const [notifications, setNotifications] = useState([
    // { id: 1, type: 'alert', message: '3 requests pending approval', urgent: true },
    // { id: 2, type: 'warning', message: 'Event "Cooking Together" has no volunteers yet', urgent: false },
    // { id: 3, type: 'info', message: 'Weekly report is ready for review', urgent: false }
  ]);

  // Define recentActivity array
  const recentActivity = [
    { id: 1, action: 'Ruth Cohen joined the community', time: '5 minutes ago', type: 'join' },
    { id: 2, action: 'Moshe Levi applied to "Garden Event"', time: '12 minutes ago', type: 'apply' },
    { id: 3, action: 'Sarah Davis completed volunteer service', time: '1 hour ago', type: 'complete' },
    { id: 4, action: 'New service request: Home cleaning', time: '2 hours ago', type: 'request' },
    { id: 5, action: 'Event "Music Workshop" fully booked', time: '3 hours ago', type: 'event' }
  ];

  useState(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  { /* Fetch information to display on overview cards and alerts */ }
  useEffect(() => {
    if (!userSettlement) return;

    // Pending Requests
    const fetchPendingRequestsCount = async () => {
      try {
        const allRequests = await getServiceRequests();
        const pendingRequests = allRequests.filter((request) => request.status === "pending");
        setPendingRequestsCount(pendingRequests.length);
      } catch (error) {
        console.error("Error fetching pending requests count:", error);
      }
    };

    // Registered Retirees This Week
    const fetchRetireesRegisteredCount = async () => {
      try {
        const lastWeek = new Date();
        lastWeek.setDate(lastWeek.getDate() - 7);

        const allUsersQuery = query(
          collection(db, "users"),
          where("role", "==", "retiree"),
          where("idVerification.settlement", "==", userSettlement)
        );

        const querySnapshot = await getDocs(allUsersQuery);

        // Filter users manually based on the `createdAt` string
        const retireesRegisteredThisWeek = querySnapshot.docs.filter((doc) => {
          const createdAt = new Date(doc.data().createdAt); // Convert `createdAt` string to Date
          return createdAt >= lastWeek; // Compare with `lastWeek`
        });

        setRetireesRegisteredCount(retireesRegisteredThisWeek.length); // Set the count of retirees registered
      } catch (error) {
        console.error("Error fetching retirees registered count:", error);
      }
    };

    // Active Events
    const fetchActiveEventsCount = async () => {
      try {
        const activeEventsQuery = query(
          collection(db, "events"),
          where("status", "==", "active") // Query for active events
        );

        const querySnapshot = await getDocs(activeEventsQuery);

        setActiveEventsCount(querySnapshot.size); // Set the count of active events
      } catch (error) {
        console.error("Error fetching active events count:", error);
      }
    };

    // Volunteer Matches
    const fetchVolunteerMatchesCount = async () => {
      try {
        const uid = user?.uid || null;
        const volunteerMatchesQuery = query(
          collection(db, "jobRequests"),
          where("status", "==", "Active"), // Query for active job requests
          where("createdBy", "==", uid) // Filter by current user's UID
        );

        const querySnapshot = await getDocs(volunteerMatchesQuery);

        setVolunteerMatchesCount(querySnapshot.size); // Set the count of volunteer matches
      } catch (error) {
        console.error("Error fetching volunteer matches count:", error);
      }
    };

    // Fetch recent notifications
    const fetchRecentNotifications = async () => {
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
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
      }
    };

    fetchRecentNotifications();
    fetchPendingRequestsCount();
    fetchRetireesRegisteredCount();
    fetchActiveEventsCount();
    fetchVolunteerMatchesCount();
  }, [userSettlement, userData?.uid]); // Dependencies on userSettlement and current user's UID

  const overviewCards = [
    {
      title: "Pending Service Requests",
      value: pendingRequestsCount, // Dynamically update the value
      icon: <FaClock className="text-3xl text-orange-500" />,
      color: "bg-orange-50 border-orange-200",
      urgent: true,
      onClick: () => setSelected("service"), // Set selected to "service"
    },
    {
      title: "Retirees Registered This Week",
      value: retireesRegisteredCount, // Dynamically update the value
      icon: <FaUserPlus className="text-3xl text-green-500" />,
      color: "bg-green-50 border-green-200",
      urgent: false,
    },
    {
      title: "Active Events",
      value: activeEventsCount, // Dynamically update the value
      icon: <FaCalendarCheck className="text-3xl text-blue-500" />,
      color: "bg-blue-50 border-blue-200",
      urgent: false,
      onClick: () => setSelected("upcoming"), // Set selected to "events"
    },
    {
      title: "Volunteer Matches Pending",
      value: volunteerMatchesCount, // Dynamically update the value
      icon: <FaHandsHelping className="text-3xl text-purple-500" />,
      color: "bg-purple-50 border-purple-200",
      urgent: true,
      onClick: () => setSelected("jobs"), // Set selected to "Jobs"
    },
  ];

  const quickActions = [
    { title: 'Add New Event', icon: <FaPlus />, color: 'bg-green-500 hover:bg-green-600' },
    { title: 'View All Requests', icon: <FaSearch />, color: 'bg-blue-500 hover:bg-blue-600' },
    { title: 'Manage Retirees', icon: <FaUsers />, color: 'bg-purple-500 hover:bg-purple-600' },
    { title: 'Reports & Analytics', icon: <FaChartBar />, color: 'bg-orange-500 hover:bg-orange-600' }
  ];

  const getActivityIcon = (type) => {
    switch (type) {
      case 'join': return <FaUserPlus className="text-green-500" />;
      case 'apply': return <FaHandshake className="text-blue-500" />;
      case 'complete': return <FaCheckCircle className="text-green-600" />;
      case 'request': return <FaClock className="text-orange-500" />;
      case 'event': return <FaCalendarAlt className="text-purple-500" />;
      default: return <FaBell className="text-gray-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Welcome, {userName} 👋</h1>
            <p className="text-gray-600">Here's what's happening in your community today</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Current Time</div>
            <div className="text-lg font-semibold text-gray-700">
              {currentTime.toLocaleTimeString()}
            </div>
          </div>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {overviewCards.map((card, index) => (
          <div
            key={index}
            onClick={card.onClick} // Handle card click
            className={`${card.color} border-2 rounded-xl p-6 transition-all duration-300 hover:shadow-lg hover:scale-105 cursor-pointer relative`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">{card.title}</p>
                <p className="text-3xl font-bold text-gray-800">{card.value}</p>
              </div>
              {card.icon}
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Recent Activity Feed */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <FaClock className="mr-2 text-blue-500" />
              Recent Activity Feed
            </h2>
            <div className="space-y-4 max-h-80 overflow-y-auto">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex-shrink-0 mt-1">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-grow">
                    <p className="text-sm text-gray-800">{activity.action}</p>
                    <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Alerts & Quick Actions */}
        <div className="space-y-6">
          {/* Alerts */}
          <div 
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 cursor-pointer"
          >
            <h2 className="text-xl font-semibold text-gray-800 mb-1 p-3 flex items-center">
              <FaBell className="mr-2 text-red-500" />
              Alerts & Notifications
            </h2>
            <Notifications 
              setSelectedTab={setSelected} 
              setShowNotificationsPopup={setShowNotificationsPopup} 
              limit={2} // Limit notifications to 3
            />
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Quick Access</h2>
            <div className="grid grid-cols-2 gap-3">
              {quickActions.map((action, index) => (
                <button
                  key={index}
                  className={`${action.color} text-white p-4 rounded-lg transition-all duration-200 hover:shadow-lg hover:scale-105 flex flex-col items-center space-y-2`}
                >
                  <span className="text-xl">{action.icon}</span>
                  <span className="text-xs font-medium text-center">{action.title}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Event Calendar */}
      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
          <FaCalendarAlt className="mr-2 text-green-500" />
          Upcoming Events Calendar
        </h2>
        <div className="grid md:grid-cols-3 gap-4">
          {upcomingEvents.map((event) => (
            <div
              key={event.id}
              className={`border-2 rounded-lg p-4 transition-all duration-200 hover:shadow-lg cursor-pointer ${
                event.volunteers === 0 
                  ? 'border-red-200 bg-red-50' 
                  : 'border-gray-200 bg-white hover:border-blue-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-800">{event.title}</h3>
                {event.volunteers === 0 && (
                  <FaExclamationTriangle className="text-red-500" />
                )}
              </div>
              <p className="text-sm text-gray-600 mb-2">
                📅 {new Date(event.date).toLocaleDateString()} at {event.time}
              </p>
              <div className="flex justify-between text-xs">
                <span className="text-green-600">👥 {event.participants} participants</span>
                <span className={event.volunteers === 0 ? 'text-red-600' : 'text-blue-600'}>
                  🙋 {event.volunteers} volunteers
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminHomepage;