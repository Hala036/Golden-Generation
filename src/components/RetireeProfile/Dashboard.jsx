import React, { useState } from "react";
import { FaSearch, FaBell, FaCog, FaPlusCircle, FaCalendarAlt, FaComments, FaCalendarCheck, FaSignOutAlt } from "react-icons/fa";
import { MdLanguage } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import { auth } from "../../firebase";
import { signOut } from "firebase/auth";
import { toast } from "react-hot-toast";
import profile from "../../assets/profile.jpeg";
import { useLanguage } from '../../context/LanguageContext';
import { Select } from 'antd';
import Cards from "./Cards";
import SettingsCards from "./SettingsCards";

const icons = [
  { id: "upcoming", label: "Upcoming Events", icon: <FaCalendarCheck /> },
  { id: "add", label: "Add Events", icon: <FaPlusCircle /> },
  { id: "settings", label: "Settings", icon: <FaCog /> },
  { id: "notifications", label: "Notifications", icon: <FaBell /> },
  { id: "calendar", label: "Calendar", icon: <FaCalendarAlt /> },
  { id: "messages", label: "Messages", icon: <FaComments /> }
];

const Dashboard = () => {
  const navigate = useNavigate();
  const { language, changeLanguage } = useLanguage();
  const [selected, setSelected] = useState("upcoming");

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success('Logged out successfully!');
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to logout. Please try again.');
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-75 bg-gray-100 shadow-lg">
        {/* Logo */}
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-xl font-bold text-orange-500">Golden Generation</h1>
        </div>

        {/* Profile Section */}
        <div className="p-4 border-b border-gray-200 flex items-center space-x-3">
          <img src={profile} alt="Profile" className="w-10 h-10 rounded-full" />
          <div className="flex flex-col">
            <span className="text-sm font-medium">Welcome back!</span>
            <span className="text-xs text-gray-500">User Profile</span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="py-4">
          {icons.map(({ id, label, icon }) => (
            <div
              key={id}
              onClick={() => setSelected(id)}
              className={`flex items-center space-x-3 px-4 py-3 cursor-pointer transition duration-200
                ${selected === id 
                  ? "bg-orange-100 text-orange-500 border-r-4 border-orange-500" 
                  : "text-gray-600 hover:bg-gray-200"}`}
            >
              <span className="text-xl">{icon}</span>
              <span className="text-sm font-medium">{label}</span>
            </div>
          ))}
        </nav>

        {/* Bottom Section */}
        <div className="absolute bottom-0 w-64 border-t border-gray-200 bg-gray-100 p-4">
          <div className="flex items-center space-x-2 mb-4">
            <MdLanguage className="text-xl text-gray-600" />
            <Select
              value={language}
              onChange={changeLanguage}
              className="w-24"
              variant={false}
            >
              <Select.Option value="en">English</Select.Option>
              <Select.Option value="he">עברית</Select.Option>
              <Select.Option value="ru">Русский</Select.Option>
              <Select.Option value="ar">العربية</Select.Option>
            </Select>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 w-full"
          >
            <FaSignOutAlt className="text-xl" />
            <span className="text-sm">Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8">
        {/* Search Bar */}
        <div className="mb-6 flex items-center max-w-md border px-3 py-2 rounded-md bg-white shadow-sm">
          <FaSearch className="text-gray-500" />
          <input 
            type="text" 
            placeholder="Search Events" 
            className="border-none outline-none text-sm ml-2 w-full"
          />
        </div>

        {/* Content Area */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-6">
            {icons.find(icon => icon.id === selected)?.label}
          </h2>
          
          {selected === "upcoming" && <Cards />}
          {selected === "settings" && <SettingsCards />}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;