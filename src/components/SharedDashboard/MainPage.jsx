import React, { useState, useEffect } from 'react';
import { 
  FaBell, 
  FaPlus, 
  FaSearch, 
  FaUsers, 
  FaChartBar, 
  FaCalendarAlt,
  FaClock,
  FaExclamationTriangle,
  FaCheckCircle,
  FaUserPlus,
  FaHandshake
} from 'react-icons/fa';
import { MdPendingActions, MdEventAvailable } from 'react-icons/md';

const AdminHomepage = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [notifications, setNotifications] = useState([
    { id: 1, type: 'alert', message: '3 requests pending approval', urgent: true },
    { id: 2, type: 'warning', message: 'Event "Cooking Together" has no volunteers yet', urgent: false },
    { id: 3, type: 'info', message: 'Weekly report is ready for review', urgent: false }
  ]);

  const [recentActivity] = useState([
    { id: 1, action: 'Ruth Cohen joined the community', time: '5 minutes ago', type: 'join' },
    { id: 2, action: 'Moshe Levi applied to "Garden Event"', time: '12 minutes ago', type: 'apply' },
    { id: 3, action: 'Sarah Davis completed volunteer service', time: '1 hour ago', type: 'complete' },
    { id: 4, action: 'New service request: Home cleaning', time: '2 hours ago', type: 'request' },
    { id: 5, action: 'Event "Music Workshop" fully booked', time: '3 hours ago', type: 'event' }
  ]);

  const [upcomingEvents] = useState([
    { id: 1, title: 'Music Workshop', date: '2025-06-16', time: '10:00', participants: 12, volunteers: 3 },
    { id: 2, title: 'Garden Event', date: '2025-06-17', time: '14:00', participants: 8, volunteers: 1 },
    { id: 3, title: 'Cooking Together', date: '2025-06-18', time: '16:00', participants: 15, volunteers: 0 }
  ]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const overviewCards = [
    {
      title: 'Pending Service Requests',
      value: '14',
      icon: <MdPendingActions className="text-3xl text-orange-500" />,
      color: 'bg-orange-50 border-orange-200',
      urgent: true
    },
    {
      title: 'Retirees Registered This Week',
      value: '7',
      icon: <FaUserPlus className="text-3xl text-green-500" />,
      color: 'bg-green-50 border-green-200',
      urgent: false
    },
    {
      title: 'Upcoming Events',
      value: '3',
      icon: <MdEventAvailable className="text-3xl text-blue-500" />,
      color: 'bg-blue-50 border-blue-200',
      urgent: false
    },
    {
      title: 'Volunteer Matches Pending',
      value: '5',
      icon: <FaHandshake className="text-3xl text-purple-500" />,
      color: 'bg-purple-50 border-purple-200',
      urgent: true
    }
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
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Welcome, Admin Sarah 👋</h1>
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
            className={`${card.color} border-2 rounded-xl p-6 transition-all duration-300 hover:shadow-lg hover:scale-105 cursor-pointer relative`}
          >
            {card.urgent && (
              <div className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold animate-pulse">
                !
              </div>
            )}
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
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <FaBell className="mr-2 text-red-500" />
              Alerts & Notifications
            </h2>
            <div className="space-y-3">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 rounded-lg border-l-4 ${
                    notification.urgent 
                      ? 'bg-red-50 border-red-400' 
                      : 'bg-yellow-50 border-yellow-400'
                  }`}
                >
                  <div className="flex items-start">
                    <FaExclamationTriangle 
                      className={`mr-2 mt-0.5 ${
                        notification.urgent ? 'text-red-500' : 'text-yellow-500'
                      }`} 
                    />
                    <p className="text-sm text-gray-700">{notification.message}</p>
                  </div>
                </div>
              ))}
            </div>
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