import React, { useState, useEffect } from "react";
import { FaSearch, FaBell, FaCog, FaPlusCircle, FaUsers, FaUserEdit, FaBriefcase, FaUserCheck } from "react-icons/fa";
import { MdLanguage } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import { auth, getUserData } from "../../firebase";
import { signOut } from "firebase/auth";
import { toast } from "react-hot-toast";
import profile from "../../assets/profile.jpeg";
import { useLanguage } from '../../context/LanguageContext';
import { Select } from 'antd';
import SeniorsList from "./SeniorsList";
import SearchSeniors from "./SearchSeniors";
import JobRequestsManager from "./JobRequestsManager";
import MatchmakingPanel from "./MatchmakingPanel";
import AdminSettings from "./AdminSettings";

const icons = [
  { id: "seniors", label: "All Seniors", icon: <FaUsers /> },
  { id: "search", label: "Search Seniors", icon: <FaSearch /> },
  { id: "jobs", label: "Job Requests", icon: <FaBriefcase /> },
  { id: "matchmaking", label: "Matchmaking", icon: <FaUserCheck /> },
  { id: "settings", label: "Settings", icon: <FaCog /> },
  { id: "notifications", label: "Notifications", icon: <FaBell /> }
];

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { language, changeLanguage } = useLanguage();
  const [selected, setSelected] = useState("seniors");
  const [userData, setUserData] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          const data = await getUserData(user.uid);
          setUserData(data);
          
          // Check if user has admin privileges
          if (data.role !== 'admin') {
            toast.error('Access denied. Admin privileges required.');
            navigate('/dashboard');
            return;
          }
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        toast.error("Failed to load user data");
      }
    };

    fetchUserData();
  }, [navigate]);

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

  const renderMainContent = () => {
    switch (selected) {
      case "seniors":
        return <SeniorsList />;
      case "search":
        return <SearchSeniors />;
      case "jobs":
        return <JobRequestsManager />;
      case "matchmaking":
        return <MatchmakingPanel />;
      case "settings":
        return <AdminSettings />;
      case "notifications":
        return <div className="text-center text-gray-500">Notifications panel coming soon...</div>;
      default:
        return <SeniorsList />;
    }
  };

  const shouldShowSearchBar = () => {
    return selected === "seniors" || selected === "search" || selected === "jobs";
  };

  const getSearchPlaceholder = () => {
    switch (selected) {
      case "seniors":
        return "Search seniors by name, city, or interests...";
      case "search":
        return "Advanced search with filters...";
      case "jobs":
        return "Search job requests...";
      default:
        return "Search...";
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-70 bg-gray-100 shadow-lg">
        {/* Logo */}
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-xl font-bold text-yellow-500">Golden Generation</h1>
          <span className="text-sm text-gray-600 font-medium">Admin Panel</span>
        </div>

        {/* Profile Section */}
        <div className="p-6 border-b border-gray-200 flex flex-col items-center">
          <img 
            src={profile} 
            alt="Profile" 
            className="w-20 h-20 rounded-full mb-3"
          />
          <span className="text-lg font-semibold">
            {userData?.username || "Admin"}
          </span>
          <span className="text-sm text-yellow-600 font-medium">Manager</span>
        </div>

        {/* Navigation Items */}
        <nav className="py-4">
          {icons.map(({ id, label, icon }) => (
            <div
              key={id}
              onClick={() => setSelected(id)}
              className={`flex items-center space-x-3 px-6 py-3 cursor-pointer transition duration-200 ml-2
                ${selected === id 
                  ? "bg-yellow-100 text-yellow-700 border-r-4 border-yellow-500" 
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
      <div className="flex-1 p-8 flex flex-col h-screen box-border">
        {/* Header */}
        <div>
          <h2 className="text-xl font-semibold mb-6">
            {icons.find(icon => icon.id === selected)?.label}
          </h2>
          
          {/* Search Bar - Show for specific tabs */}
          {shouldShowSearchBar() && (
            <div className="mb-6 flex items-center max-w-md border px-3 py-2 rounded-md bg-white shadow-sm">
              <FaSearch className="text-gray-500" />
              <input 
                type="text" 
                placeholder={getSearchPlaceholder()}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="border-none outline-none text-sm ml-2 w-full"
              />
            </div>
          )}
        </div>

        {/* Scrollable Content Area */}
        <div className="bg-white rounded-lg shadow-sm p-6 overflow-y-auto flex-1">
          {renderMainContent()}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;