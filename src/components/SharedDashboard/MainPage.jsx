import React, { useState, useEffect, useContext, useMemo, useRef } from "react";
import { UserContext } from "../../context/UserContext"; // Import UserContext
import { FaBell, FaPlus, FaSearch, FaUsers, FaChartBar, FaCalendarAlt, FaClock, FaExclamationTriangle, FaCheckCircle, FaUserPlus, FaHandshake, FaHandsHelping, FaCalendarCheck, FaCalendarDay, FaUserShield, FaMapMarkerAlt } from 'react-icons/fa';
import { getServiceRequests } from "../../serviceRequestsService"; // Import serviceRequests logic
import { query, collection, where, getDocs, getDoc, doc, orderBy, limit, Timestamp } from "firebase/firestore"; // Import Firestore utilities
import { auth, db } from "../../firebase"; // Import Firestore instance
import Notifications from "./Notifications"; // Import Notifications component
import { useLanguage } from "../../context/LanguageContext";
import i18n from "i18next"; // Import i18next for translations

import DefaultProfilePic from "../DefaultProfilePic"; // Import DefaultProfilePic component
const AdminHomepage = React.memo(({ setSelected, setShowNotificationsPopup }) => {
  const mountedRef = useRef(false);
  const { t } = useLanguage();
  
  if (!mountedRef.current) {
    mountedRef.current = true;
  }
  
  const { userData, loading } = useContext(UserContext);
  const user = auth.currentUser;

  // Memoize user data calculations to prevent unnecessary re-renders
  const userInfo = useMemo(() => {
    const userSettlement = userData?.idVerification?.settlement || userData?.settlement || "";
    const userName = userData?.credentials?.username || "Admin";
    const userRole = userData?.role || "";
    return { userSettlement, userName, userRole };
  }, [userData, user]);

  const { userSettlement, userName, userRole } = userInfo;

  // Define colors for different user types
  const defaultColors = {
    admin: '#4F46E5', // Indigo
    superadmin: '#DC2626', // Red
    retiree: '#059669', // Green
    default: '#6B7280', // Gray
  };

  const [currentTime, setCurrentTime] = useState(new Date());
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [retireesRegisteredCount, setRetireesRegisteredCount] = useState(0); // State for retirees registered this week
  const [activeEventsCount, setActiveEventsCount] = useState(0); // State for active events
  const [volunteerMatchesCount, setVolunteerMatchesCount] = useState(0); // State for volunteer matches
  const [pendingEventsCount, setPendingEventsCount] = useState(0); // State for pending event requests

  const [notifications, setNotifications] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]); // State for recent activity
  const [searchQuery, setSearchQuery] = useState(''); // State for search functionality

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => {
      clearInterval(timer);
      mountedRef.current = false;
    };
  }, []);

  { /* Fetch information to display on overview cards, alerts and recent activity */ }
  useEffect(() => {    
    // Don't run if still loading or if userData is null
    if (loading || !userData) return;
    
    // For admin users without settlement, show global data
    // For retiree users, require settlement
    if (!userSettlement && userRole !== 'admin' && userRole !== 'superadmin') return;

    // Pending Service Requests
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

        let allDocs = [];
        
        if (userSettlement) {
          // Query by idVerification.settlement
          const allUsersQuery1 = query(
            collection(db, "users"),
            where("role", "==", "retiree"),
            where("idVerification.settlement", "==", userSettlement)
          );
          const querySnapshot1 = await getDocs(allUsersQuery1);
          // Query by settlement (root)
          const allUsersQuery2 = query(
            collection(db, "users"),
            where("role", "==", "retiree"),
            where("settlement", "==", userSettlement)
          );
          const querySnapshot2 = await getDocs(allUsersQuery2);
          // Merge and deduplicate
          allDocs = [...querySnapshot1.docs, ...querySnapshot2.docs.filter(doc2 => !querySnapshot1.docs.some(doc1 => doc1.id === doc2.id))];
        } else {
          // For admin users without settlement, get all retirees
          const allUsersQuery = query(
            collection(db, "users"),
            where("role", "==", "retiree")
          );
          const querySnapshot = await getDocs(allUsersQuery);
          allDocs = querySnapshot.docs;
        }
        
        // Filter users manually based on the `createdAt` field
        const retireesRegisteredThisWeek = allDocs.filter((doc) => {
          let createdAt = doc.data().createdAt;
          if (createdAt && createdAt.toDate) {
            createdAt = createdAt.toDate();
          } else if (typeof createdAt === 'string') {
            createdAt = new Date(createdAt);
          }
          return createdAt && createdAt >= lastWeek;
        });
        setRetireesRegisteredCount(retireesRegisteredThisWeek.length);
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

    // Pending Event Requests Count
    const fetchPendingEventRequestsCount = async () => {
      try {
        let pendingEventsQuery;
        if (userSettlement) {
          pendingEventsQuery = query(
            collection(db, "events"),
            where("status", "==", "pending"), // Query for pending events
            where("settlement", "==", userSettlement)
          );
        } else {
          // For admin users without settlement, get all pending events
          pendingEventsQuery = query(
            collection(db, "events"),
            where("status", "==", "pending") // Query for pending events
          );
        }
        const querySnapshot = await getDocs(pendingEventsQuery);
        setPendingEventsCount(querySnapshot.size);
      } catch (error) {
        console.error("Error fetching pending event requests count:", error);
        return 0; // Return 0 in case of error
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

    // Recent Activity

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to start of the day

    const fetchRecentActivity = async () => {
      const activity = [];

      try {
        // Fetch actions from service requests
        const allRequests = await getServiceRequests();
        const todayRequests = allRequests.filter((request) => {
          const requestDate = request.createdAt instanceof Timestamp 
            ? request.createdAt.toDate() // Convert Firestore Timestamp to JavaScript Date
            : new Date(request.createdAt); // Parse as a regular date string if not a Timestamp
          return requestDate >= today; // Compare with today's date
        });
        todayRequests.forEach((request) => {
          activity.push({
            id: request.id,
            title: request.title,
            action: `New service request: ${request.title}`,
            time: (() => {
              const createdAtDate =
                request.createdAt instanceof Timestamp
                  ? request.createdAt.toDate() // Convert Firestore Timestamp to JavaScript Date
                  : new Date(request.createdAt); // Parse as a regular date string if not a Timestamp

              return createdAtDate;
            })(),
            type: "request",
          });
        });

        // Fetch actions from retirees
        const lastWeek = new Date();
        lastWeek.setDate(lastWeek.getDate() - 7);
        
        let allDocs = [];
        if (userSettlement) {
          // Query by idVerification.settlement
          const allUsersQuery1 = query(
            collection(db, "users"),
            where("role", "==", "retiree"),
            where("idVerification.settlement", "==", userSettlement)
          );
          const querySnapshot1 = await getDocs(allUsersQuery1);
          // Query by settlement (root)
          const allUsersQuery2 = query(
            collection(db, "users"),
            where("role", "==", "retiree"),
            where("settlement", "==", userSettlement)
          );
          const querySnapshot2 = await getDocs(allUsersQuery2);
          // Merge and deduplicate
          allDocs = [...querySnapshot1.docs, ...querySnapshot2.docs.filter(doc2 => !querySnapshot1.docs.some(doc1 => doc1.id === doc2.id))];
        } else {
          // For admin users without settlement, get all retirees
          const allUsersQuery = query(
            collection(db, "users"),
            where("role", "==", "retiree")
          );
          const querySnapshot = await getDocs(allUsersQuery);
          allDocs = querySnapshot.docs;
        }
        
        const lastWeekForActivity = new Date();
        lastWeekForActivity.setDate(lastWeekForActivity.getDate() - 7);
        const recentRetirees = allDocs.filter((doc) => {
          let createdAt = doc.data().createdAt;
          if (createdAt && createdAt.toDate) {
            createdAt = createdAt.toDate();
          } else if (typeof createdAt === 'string') {
            createdAt = new Date(createdAt);
          }
          return createdAt && createdAt >= lastWeekForActivity;
        });
        recentRetirees.forEach((retiree) => {
          activity.push({
            id: retiree.id,
            title: retiree.data().credentials?.username || retiree.data().username || 'Retiree',
            action: `${retiree.data().credentials?.username || retiree.data().username || 'Retiree'} joined the community`,
            time: (() => {
              let createdAtDate = retiree.data().createdAt;
              if (createdAtDate && createdAtDate.toDate) {
                createdAtDate = createdAtDate.toDate();
              } else if (typeof createdAtDate === 'string') {
                createdAtDate = new Date(createdAtDate);
              }
              if (isNaN(createdAtDate?.getTime?.() || createdAtDate?.getTime?.() === undefined)) {
                return "Invalid date";
              }
              return createdAtDate;
              const diffInMs = new Date() - createdAtDate;
              const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
              const diffInHours = Math.floor(diffInMinutes / 60);
              const diffInDays = Math.floor(diffInHours / 24);
              if (diffInMinutes < 60) {
                return `${diffInMinutes} minutes ago`;
              } else if (diffInHours < 24) {
                return `${diffInHours} hours ago`;
              } else {
                return `${diffInDays} days ago`;
              }
            })(),
            type: "join",
          });
        });

        // Fetch actions from events
        const activeEventsQuery = query(
          collection(db, "events"),
          where("status", "==", "active")
        );
        const eventsSnapshot = await getDocs(activeEventsQuery);
        const recentEvents = eventsSnapshot.docs.filter((doc) => {
          let eventDate = doc.data().createdAt;
          if (eventDate && eventDate.toDate) {
            eventDate = eventDate.toDate();
          } else if (typeof eventDate === 'string') {
            eventDate = new Date(eventDate);
          }
          return eventDate && eventDate >= lastWeekForActivity;
        });
        recentEvents.forEach((event) => {
          activity.push({
            id: event.id,
            title: event.data().title || 'Event',
            action: `Event "${event.data().title}" created`,
            time: (() => {
              let createdAtDate = event.data().createdAt;
              if (createdAtDate && createdAtDate.toDate) {
                createdAtDate = createdAtDate.toDate();
              } else if (typeof createdAtDate === 'string') {
                createdAtDate = new Date(createdAtDate);
              }
              if (isNaN(createdAtDate?.getTime?.() || createdAtDate?.getTime?.() === undefined)) {
                return "Invalid date";
              }
              return createdAtDate;
              const diffInMs = new Date() - createdAtDate;
              const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
              const diffInHours = Math.floor(diffInMinutes / 60);
              const diffInDays = Math.floor(diffInHours / 24);
              if (diffInMinutes < 60) {
                return `${diffInMinutes} minutes ago`;
              } else if (diffInHours < 24) {
                return `${diffInHours} hours ago`;
              } else {
                return `${diffInDays} days ago`;
              }
            })(),
            type: "event",
          });
        });

        // Fetch actions from volunteer matches
        const volunteerMatchesQuery = query(
          collection(db, "jobRequests"),
          where("status", "==", "Active"),
          where("createdBy", "==", user?.uid || null)
        );
        const matchesSnapshot = await getDocs(volunteerMatchesQuery);
        const todayMatches = matchesSnapshot.docs.filter((doc) => {
          const matchDate = doc.data().createdAt instanceof Timestamp
            ? doc.data().createdAt.toDate()
            : new Date(doc.data().createdAt);
          return matchDate >= today;
        });
        todayMatches.forEach((match) => {
          activity.push({
            id: match.id,
            title: match.data().title || 'Volunteer Match',
            action: `Volunteer match created for "${match.data().title}"`,
            time: (() => {
              const createdAtDate =
                match.data().createdAt instanceof Timestamp
                  ? match.data().createdAt.toDate() // Convert Firestore Timestamp to JavaScript Date
                  : new Date(match.data().createdAt); // Parse as a regular date string if not a Timestamp

              if (isNaN(createdAtDate.getTime())) {
                return "Invalid date";
              }
              return createdAtDate;

              const diffInMs = new Date() - createdAtDate; // Difference in milliseconds
              const diffInMinutes = Math.floor(diffInMs / (1000 * 60)); // Convert to minutes
              const diffInHours = Math.floor(diffInMinutes / 60); // Convert to hours

              if (diffInMinutes < 60) {
                return `${diffInMinutes} minutes ago`;
              } else {
                return `${diffInHours} hours ago`;
              }
            })(),
            type: "apply",
          });
        });

        // Update recentActivity state
        setRecentActivity(activity);
      } catch (error) {
        console.error("Error fetching recent activity:", error);
      }
    };

    fetchPendingEventRequestsCount();
    fetchRecentNotifications();
    fetchPendingRequestsCount();
    fetchRetireesRegisteredCount();
    fetchActiveEventsCount();
    fetchVolunteerMatchesCount();
    fetchRecentActivity();
  }, [userSettlement, user?.uid, userRole, loading]); // Include loading dependency

  // Loading check after all hooks are declared
  if (loading) return <div>Loading...</div>;

  const overviewCards = [
    {
      title: t('dashboard.main.cards.pendingServiceRequests'),
      value: pendingRequestsCount, // Dynamically update the value
      icon: <FaClock className="text-2xl md:text-3xl text-orange-500" />, // Adjust icon size
      color: "bg-orange-50 border-orange-200",
      urgent: true,
      onClick: () => setSelected("service"), // Set selected to "service"
    },
    {
      title: t('dashboard.main.cards.signupsThisWeek'),
      value: retireesRegisteredCount, // Dynamically update the value
      icon: <FaUserPlus className="text-2xl md:text-3xl text-green-500" />, // Adjust icon size
      color: "bg-green-50 border-green-200",
      urgent: false,
      onClick: () => setSelected("retirees"),
    },
    {
      title: t('dashboard.main.cards.activeEvents'),
      value: activeEventsCount, // Dynamically update the value
      icon: <FaCalendarCheck className="text-2xl md:text-3xl text-blue-500" />, // Adjust icon size
      color: "bg-blue-50 border-blue-200",
      urgent: false,
      onClick: () => setSelected("upcoming"), // Set selected to "events"
    },
    {
      title: t('dashboard.main.cards.volunteerMatchesPending'),
      value: volunteerMatchesCount, // Dynamically update the value
      icon: <FaHandsHelping className="text-2xl md:text-3xl text-purple-500" />, // Adjust icon size
      color: "bg-purple-50 border-purple-200",
      urgent: true,
      onClick: () => setSelected("jobs"), // Set selected to "Jobs"
    },
    {
      title: t('dashboard.main.cards.pendingEventRequests'),
      value: pendingEventsCount, // Replace with dynamic value if available
      icon: <FaCalendarAlt className="text-2xl md:text-3xl text-red-500" />, // Adjust icon size
      color: "bg-red-50 border-red-200",
      urgent: true,
      onClick: () => setSelected("eventRequests"), // Set selected to "eventRequests"
    },
  ];

  // Filter recent activity based on search query
  const filteredRecentActivity = recentActivity.filter(activity => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    return activity.action.toLowerCase().includes(searchLower) ||
           activity.type.toLowerCase().includes(searchLower);
  });

  const quickActions = [
    { title: t('dashboard.main.quickActions.calendar'), icon: <FaCalendarAlt />, color: 'bg-green-500 hover:bg-green-600', onClick: () => setSelected("calendar") },
    { title: t('dashboard.main.quickActions.viewAllRequests'), icon: <FaSearch />, color: 'bg-blue-500 hover:bg-blue-600', onClick: () => setSelected("service") },
    { title: t('dashboard.main.quickActions.manageRetirees'), icon: <FaUsers />, color: 'bg-purple-500 hover:bg-purple-600', onClick: () => setSelected("retirees") },
    { title: t('dashboard.main.quickActions.reportsAnalytics'), icon: <FaChartBar />, color: 'bg-orange-500 hover:bg-orange-600', onClick: () => setSelected("analysis") },
  ];

  // SuperAdmin-only quick actions
  const superAdminQuickActions = [
    { title: t('dashboard.main.quickActions.adminManagement'), icon: <FaUserShield />, color: 'bg-red-500 hover:bg-red-600', onClick: () => setSelected("admins") },
    { title: t('dashboard.main.quickActions.addSettlements'), icon: <FaMapMarkerAlt />, color: 'bg-indigo-500 hover:bg-indigo-600', onClick: () => setSelected("addSettlements") },
  ];

  // Only show for superadmin
  const allQuickActions = (userRole && userRole.toLowerCase() === 'superadmin')
    ? [...quickActions, ...superAdminQuickActions]
    : quickActions;

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

  // Function to extract name from activity action
  const extractNameFromAction = (action) => {
    // Match pattern: starts with any word characters up to a space or 'joined'
    const match = action.match(/^([^\s]+)(?=\s|joined)/);
    return match ? match[1] : '';
  };

  // Dynamic activity string helpers
  const getActivityAction = (activity) => {
    switch (activity.type) {
      case 'join':
        return i18n.t('dashboard.main.activity.joinedCommunity', { username: activity.title || 'Retiree' });
      case 'apply':
        return i18n.t('dashboard.main.activity.volunteerMatchCreated', { title: activity.title });
      case 'complete':
        return i18n.t('dashboard.main.activity.completedVolunteerService', { username: activity.title || 'Volunteer' });
      case 'request':
        return i18n.t('dashboard.main.activity.newServiceRequest', { title: activity.title });
      case 'event':
        return i18n.t('dashboard.main.activity.createdEvent', { title: activity.title || 'Event' });
      default:
        return activity.action;
    }
  };

  // Dynamic time string helpers
  const getTimeAgo = (date) => {
    if (!date || isNaN(date.getTime())) return t('dashboard.main.time.invalidDate');
    const now = new Date();
    const diffInMs = now - date;
    const minutes = Math.floor(diffInMs / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 60) return i18n.t('dashboard.main.time.minutesAgo', { count: minutes });
    if (hours < 24) return i18n.t('dashboard.main.time.hoursAgo', { count: hours });
    return i18n.t('dashboard.main.time.daysAgo', { count: days });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-2 md:p-6 w-full">
      {/* Header */}
      <div className="mb-4 md:mb-8 w-full">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between w-full gap-2 md:gap-0">
          <div className="flex items-center gap-2 md:gap-4 md:w-auto">
            <div>
              <h1 className="text-xl md:text-3xl font-bold text-gray-800 mb-1 md:mb-2 truncate">
                {i18n.t('dashboard.main.welcome', { userName: userName })}
              </h1>
              <p className="text-xs md:text-base text-gray-600">
                {t('dashboard.main.communityToday')}
              </p>
            </div>
          </div>
          {/* Quick Actions */}
          <div className="grid gap-1 md:gap-2 w-full md:w-auto grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 flex-shrink-0">
            {allQuickActions.map((action, index) => (
              <button
                key={index}
                onClick={action.onClick}
                className={`${action.color} text-white p-1 md:p-3 rounded-md transition-all duration-200 hover:shadow-md hover:scale-105 flex flex-col items-center space-y-0.5 md:space-y-1 w-full`}
                style={{ minWidth: 0 }}
              >
                <span className="text-base md:text-xl">{action.icon}</span>
                <span className="text-[9px] md:text-xs font-small text-center truncate">{action.title}</span>
              </button>
            ))}
          </div>
          {/* Clock for desktop only */}
          <div className="text-right hidden md:block flex-shrink-0">
            <div className="text-sm text-gray-500">
              {t('dashboard.main.currentTime')}
            </div>
            <div className="text-lg font-semibold text-gray-700">
              {currentTime.toLocaleTimeString()}
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-4 md:mb-6 w-full">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FaSearch className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 md:py-3 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-yellow-500 focus:border-yellow-500 text-sm md:text-base"
            placeholder= {i18n.t('dashboard.main.activity.placeholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 xs:grid-cols-3 md:grid-cols-3 lg:grid-cols-5 gap-2 md:gap-4 mb-4 md:mb-6 w-full">
        {overviewCards.map((card, index) => (
          <div
            key={index}
            onClick={card.onClick}
            className={`${card.color} border-2 rounded-lg p-2 md:p-6 transition-all duration-300 hover:shadow-lg hover:scale-105 cursor-pointer relative w-full min-w-0`}
            style={{ minWidth: 0 }}
          >
            <div className="flex flex-col items-center justify-between h-full mb-1 w-full">
              {/* Title and Icon */}
              <div className="flex items-center justify-between w-full">
                <p className="text-[11px] md:text-sm font-medium text-gray-600 truncate">{card.title}</p>
                <div className="text-base md:text-3xl">{card.icon}</div>
              </div>
              {/* Value */}
              <p className="text-lg md:text-3xl font-bold text-gray-800 text-center break-words">{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 md:gap-8 lg:grid-cols-3 w-full">
        {/* Recent Activity Feed */}
        <div className="lg:col-span-2 w-full">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2 md:p-6 w-full">
            <h2 className="text-base md:text-xl font-semibold text-gray-800 mb-2 md:mb-4 flex items-center">
              <FaClock className="mr-2 text-blue-500" />
              {t('dashboard.main.recentActivityFeed')}
            </h2>
            <div className="space-y-2 md:space-y-4 max-h-56 md:max-h-80 overflow-y-auto w-full">
              {filteredRecentActivity.length === 0 && (
                <div className="text-center text-gray-500 py-2 md:py-4">
                  {searchQuery ? "No matching activity found" : t('dashboard.main.noRecentActivity')}
                </div>
              )}
              {filteredRecentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-2 md:space-x-3 p-2 md:p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors w-full">
                  <div className="flex-shrink-0 mt-1">
                    {activity.type === 'join' ? (
                      <div className="w-8 h-8">
                        <DefaultProfilePic 
                          name={extractNameFromAction(activity.action)} 
                          size={32} 
                          fontSize="0.9rem"
                          bgColor={defaultColors['retiree']}
                        />
                      </div>
                    ) : (
                      getActivityIcon(activity.type)
                    )}
                  </div>
                  <div className="flex-grow min-w-0">
                    <p className="text-xs md:text-sm text-gray-800 truncate">{getActivityAction(activity)}</p>
                    <p className="text-[10px] md:text-xs text-gray-500 mt-1 truncate">{getTimeAgo(new Date(activity.time))}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Alerts & Quick Actions */}
        <div className="lg:col-span-1 flex flex-col w-full min-w-0">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2 md:p-6 flex flex-col w-full min-w-0">
            <h2 className="text-base md:text-xl font-semibold text-gray-800 mb-1 md:p-3 flex items-center min-w-0">
              <FaBell className="mr-2 text-red-500 flex-shrink-0" />
              {t('dashboard.main.alertsAndNotifications')}
            </h2>
            <div className="space-y-2 md:space-y-4 max-h-56 md:max-h-80 overflow-y-auto w-full min-w-0">
              <Notifications 
                setSelectedTab={setSelected} 
                setShowNotificationsPopup={setShowNotificationsPopup} 
                limit={3}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default AdminHomepage;