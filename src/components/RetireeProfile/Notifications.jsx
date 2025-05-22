import React, { useState } from 'react';
import { FaInfoCircle, FaExclamationTriangle, FaCheckCircle } from 'react-icons/fa';

const mockNotifications = [
  {
    id: 1,
    type: 'info',
    title: 'Welcome!',
    message: 'Thanks for joining Golden Generation.',
    time: '2 min ago',
    read: false,
  },
  {
    id: 2,
    type: 'alert',
    title: 'Event Reminder',
    message: 'Football event starts in 1 hour.',
    time: '10 min ago',
    read: false,
  },
  {
    id: 3,
    type: 'success',
    title: 'Profile Updated',
    message: 'Your profile was updated successfully.',
    time: '1 day ago',
    read: true,
  },
];

const iconMap = {
  info: <FaInfoCircle className="text-blue-400 text-xl" />,
  alert: <FaExclamationTriangle className="text-yellow-500 text-xl" />,
  success: <FaCheckCircle className="text-green-500 text-xl" />,
};

const Notifications = () => {
  const [notifications, setNotifications] = useState(mockNotifications);

  const handleMarkAsRead = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const handleMarkAllAsRead = () => {
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
        {notifications.length === 0 ? (
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
              <div className="mt-1">{iconMap[n.type]}</div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-800 truncate">{n.title}</div>
                <div className="text-sm text-gray-600 truncate">{n.message}</div>
                <div className="text-xs text-gray-400 mt-1">{n.time}</div>
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