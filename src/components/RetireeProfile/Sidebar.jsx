import React, { useState } from "react";
import {
  FaHome,
  FaCalendarAlt,
  FaUserFriends,
  FaHandsHelping,
  FaClipboardList,
  FaChartBar,
  FaMapMarkerAlt,
  FaPlusSquare,
  FaCog,
  FaSignOutAlt,
  FaBell,
  FaComments,
  FaSearch,
} from "react-icons/fa";
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

const Sidebar = ({ activeKey = "home", onNavigate }) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(true);
  const navigate = useNavigate();

  const navItems = [
    { section: null, items: [
      { icon: <FaHome />, text: t('sidebar.home'), key: "home" },
      { icon: <FaCalendarAlt />, text: t('sidebar.upcomingEvents'), key: "events" },
      { icon: <FaUserFriends />, text: t('sidebar.retirees'), key: "retirees" },
      { icon: <FaSearch />, text: t('sidebar.searchRetirees', 'Find Retirees'), key: "searchRetirees" },
      { icon: <FaHandsHelping />, text: t('sidebar.volunteerRequests'), key: "volunteers" },
      { icon: <FaClipboardList />, text: t('sidebar.serviceRequests'), key: "services" },
    ]},
    { section: t('sidebar.management'), items: [
      { icon: <FaChartBar />, text: t('sidebar.analytics'), key: "analytics" },
      { icon: <FaPlusSquare />, text: t('sidebar.addSettlements'), key: "addSettlements" },
    ]},
    { section: t('sidebar.settingsSection'), items: [
      { icon: <FaCog />, text: t('sidebar.settings'), key: "settings" },
      { icon: <FaSignOutAlt />, text: t('sidebar.logout'), key: "logout" },
    ]},
  ];

  return (
    <div className={`fixed top-16 left-0 h-full bg-white shadow-lg p-4 transition-all duration-300 z-40 ${isOpen ? "w-56" : "w-16"}`}>
      {/* Toggle Button */}
      <button
        className="absolute top-4 right-[-12px] bg-gray-800 text-white rounded-full p-1 focus:outline-none"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? t('sidebar.collapse') : t('sidebar.expand')}
      >
        ☰
      </button>
      <nav className="flex flex-col gap-2 mt-8">
        {navItems.map((section, idx) => (
          <React.Fragment key={idx}>
            {section.section && (
              <div className="text-xs text-gray-400 pl-2 mb-1 mt-4 uppercase tracking-wider">{section.section}</div>
            )}
            {section.items.map(item => (
              <SidebarItem
                key={item.key}
                icon={item.icon}
                text={item.text}
                isOpen={isOpen}
                active={activeKey === item.key}
                onClick={() => {
                  if (item.key === 'searchRetirees') {
                    navigate('/retiree/search');
                  } else if (onNavigate) {
                    onNavigate(item.key);
                  }
                }}
              />
            ))}
            {idx < navItems.length - 1 && <div className="my-2 border-t" />}
          </React.Fragment>
        ))}
      </nav>
    </div>
  );
};

const SidebarItem = ({ icon, text, isOpen, active, onClick }) => (
  <button
    className={`flex items-center gap-2 w-full p-2 rounded-md transition font-medium text-left focus:outline-none
      ${active ? "bg-yellow-100 text-yellow-700" : "hover:bg-gray-200 text-gray-700"}`}
    onClick={onClick}
    aria-label={text}
  >
    <span className="text-xl">{icon}</span>
    {isOpen && <span className="text-sm font-medium">{text}</span>}
  </button>
);

export default Sidebar;
