import React, { useState, useRef, useEffect } from "react";
import { FaBell, FaCog, FaPlusCircle, FaCalendarAlt, FaComments, FaCalendarCheck } from "react-icons/fa";
import IconBox from "./IconBox";
import Cards from "./Cards"; // Import the Cards component
import SettingsCards from "./SettingsCards";
import { useLanguage } from "../../context/LanguageContext";
import NotificationDropdown from "./NotificationDropdown";

const IconNav = ({ selected, onSelect }) => {
  const { t } = useLanguage();
  const [notifOpen, setNotifOpen] = useState(false);
  // Mock unread notifications count (replace with real logic if needed)
  const [unreadCount, setUnreadCount] = useState(2);
  const notifRef = useRef();

  useEffect(() => {
    function handleClickOutside(event) {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const icons = [
    { id: "upcoming", label: t('dashboard.upcomingEvents'), icon: <FaCalendarCheck /> },
    { id: "add", label: t('dashboard.createEvent'), icon: <FaPlusCircle /> },
    { id: "settings", label: t('dashboard.settings'), icon: <FaCog /> },
    {
      id: "notifications",
      label: t('dashboard.notifications'),
      icon: (
        <span className="relative">
          <FaBell />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></span>
          )}
        </span>
      )
    },
    { id: "calendar", label: t('dashboard.calendar'), icon: <FaCalendarAlt /> },
    { id: "messages", label: t('dashboard.messages.newChat'), icon: <FaComments /> }
  ];

  const handleIconClick = (id) => {
    onSelect(id);
    if (id === "notifications") {
      setNotifOpen((open) => !open);
      setUnreadCount(0); // Mark all as read when opening (for demo)
    } else {
      setNotifOpen(false);
    }
  };

  return (
    <div className="relative">
      {/* Icons Section */}
      <div className="flex justify-around items-center bg-[#ACCFDA] py-3 border-b-1 shadow-md z-50 relative">
        {icons.map(({ id, label, icon }) => (
          <div
            key={id}
            onClick={() => handleIconClick(id)}
            className={`flex flex-col items-center cursor-pointer transition duration-200 
              ${selected === id ? "text-orange-500 font-bold" : "text-gray-600 hover:text-orange-400"}`}
            ref={id === "notifications" ? notifRef : undefined}
          >
            <span className="text-2xl">{icon}</span>
            <span className="text-xs font-medium mt-1">{label}</span>
            {id === "notifications" && (
              <NotificationDropdown open={notifOpen} onClose={() => setNotifOpen(false)} />
            )}
          </div>
        ))}
      </div>

      {/* Selected Box */}
      {selected !== "messages" && <IconBox selected={selected} />}

      {/* Display event cards only when "Upcoming Events" is selected */}
      {selected === "upcoming" && <Cards />}
      {selected === "settings" && <SettingsCards />}
    </div>
  );
};

export default IconNav;