import React, { useState } from 'react';
import { FaBell, FaInfoCircle, FaExclamationTriangle, FaCheckCircle } from 'react-icons/fa';

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
  info: <FaInfoCircle className="text-blue-400" />,
  alert: <FaExclamationTriangle className="text-yellow-500" />,
  success: <FaCheckCircle className="text-green-500" />,
};

const NotificationDropdown = ({ open, onClose }) => {
  const [notifications, setNotifications] = useState(mockNotifications);

  const handleMarkAsRead = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  return (
    <div
      className={`absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border z-50 transition-all duration-200 ${
        open ? 'opacity-100 visible' : 'opacity-0 invisible'
      }`}
    >
      <div className="p-4 border-b flex justify-between items-center">
        <span className="font-semibold text-gray-800">Notifications</span>
        <button
          className="text-xs text-blue-500 hover:underline"
          onClick={() => setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))}
        >
          Mark all as read
        </button>
      </div>
      <div className="max-h-80 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="p-4 text-center text-gray-400">No notifications</div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              className={`flex items-start gap-3 px-4 py-3 border-b last:border-b-0 cursor-pointer hover:bg-gray-50 transition ${
                n.read ? 'opacity-60' : ''
              }`}
              onClick={() => handleMarkAsRead(n.id)}
            >
              <div className="mt-1">{iconMap[n.type]}</div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-800 truncate">{n.title}</div>
                <div className="text-sm text-gray-500 truncate">{n.message}</div>
                <div className="text-xs text-gray-400 mt-1">{n.time}</div>
              </div>
              {!n.read && <span className="w-2 h-2 bg-red-500 rounded-full mt-2"></span>}
            </div>
          ))
        )}
      </div>
      <div className="p-2 text-center">
        <button
          className="text-xs text-gray-500 hover:text-orange-500 transition"
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default NotificationDropdown; 