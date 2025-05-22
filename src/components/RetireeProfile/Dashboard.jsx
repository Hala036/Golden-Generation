import React, { useState } from "react";
import { FaSearch, FaBell, FaCog, FaPlusCircle, FaCalendarAlt, FaComments, FaCalendarCheck, FaSignOutAlt, FaPlus } from "react-icons/fa";
import { MdLanguage } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import { auth } from "../../firebase";
import { signOut } from "firebase/auth";
import { toast } from "react-hot-toast";
import profile from "../../assets/profile.jpeg";
import IconNav from "./IconNav"; // Importing icon navigation
import { useLanguage } from "../../context/LanguageContext";
import Calendar from "./Calendar";
import Cards from "./Cards";
import IconBox from "./IconBox";
import Messages from "./Messages";
import Notifications from "./Notifications";

const Dashboard = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [selected, setSelected] = useState("upcoming");
  const [events, setEvents] = useState([
    // Example initial events
    { title: "Football", date: "2025-04-01" },
    { title: "Swimming", date: "2025-04-11" },
    { title: "Tennis", date: "2025-04-26" },
    { title: "Walking in Nature", date: "2025-05-07" },
  ]);
  const [newEvent, setNewEvent] = useState({ title: "", date: "" });

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success(t('auth.logout.success'));
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error(t('auth.logout.error'));
    }
  };

  // IconNav handler
  const handleIconSelect = (id) => setSelected(id);

  // Create Event logic
  const handleCreateEvent = (e) => {
    e.preventDefault();
    if (!newEvent.title || !newEvent.date) return;
    setEvents([...events, newEvent]);
    setNewEvent({ title: "", date: "" });
    setSelected("upcoming");
  };

  // Main content based on selected icon
  let mainContent = null;
  if (selected === "upcoming") {
    mainContent = <Cards events={events} />;
  } else if (selected === "add") {
    mainContent = (
      <div className="flex justify-center items-center min-h-[300px]">
        <form onSubmit={handleCreateEvent} className="bg-white p-6 rounded-lg shadow-lg w-80">
          <h2 className="text-lg font-bold mb-4">Create Event</h2>
          <input
            type="text"
            placeholder="Event Title"
            value={newEvent.title}
            onChange={e => setNewEvent({ ...newEvent, title: e.target.value })}
            className="w-full mb-3 p-2 border rounded"
            required
          />
          <input
            type="date"
            value={newEvent.date}
            onChange={e => setNewEvent({ ...newEvent, date: e.target.value })}
            className="w-full mb-3 p-2 border rounded"
            required
          />
          <div className="flex justify-end space-x-2">
            <button type="submit" className="px-3 py-1 bg-blue-500 text-white rounded">Add</button>
          </div>
        </form>
      </div>
    );
  } else if (selected === "settings") {
    mainContent = <div className="p-8 text-center">Settings Page (customize as needed)</div>;
  } else if (selected === "notifications") {
    mainContent = <Notifications />;
  } else if (selected === "messages") {
    mainContent = <Messages />;
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5]  overflow-x-hidden">
      {/* Header */}
      <div className="flex items-center w-full pr-38 p-4 border-b bg-[#D3D3D3] shadow-md">
        {/* Logo */}
        <h1 className="text-2xl font-bold text-orange-500">Golden Generation</h1>

        {/* Spacer to push right content */}
        <div className="flex-1" />

        {/* Search Bar + Profile + Logout as a group */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center border px-3 py-1 rounded-md bg-gray-100 w-[220px]">
            <FaSearch className="text-gray-500" />
            <input
              type="text"
              placeholder="Search Events"
              className="border-none outline-none text-sm ml-2 bg-gray-100 w-full"
            />
            <span className="ml-2 text-gray-600 text-sm">Search</span>
          </div>
          <img src={profile} alt="Profile" className="w-10 h-10 rounded-full" />
          <button
            onClick={handleLogout}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors duration-200"
          >
            <FaSignOutAlt className="text-xl" />
            <span className="text-sm">{t('dashboard.header.logout') || 'Logout'}</span>
          </button>
        </div>
      </div>

      {/* Icon Navigation */}
      <IconNav
        selected={selected}
        onSelect={handleIconSelect}
      />

      {/* Main Content - removed top padding */}
      {selected === "messages" ? (
        <div className="flex-1 min-h-0">{mainContent}</div>
      ) : (
        <div className="max-w-screen-lg mx-auto">{mainContent}</div>
      )}

      {/* IconBox and Calendar Modal */}
      {selected === "calendar" && (
        <Calendar
          events={events}
          onClose={() => setSelected("upcoming")}
        />
      )}
    </div>
  );
};

export default Dashboard;
