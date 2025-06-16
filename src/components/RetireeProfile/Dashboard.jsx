import React, { useState, useEffect } from "react";
import { FaSearch, FaBell, FaCog, FaPlusCircle, FaCalendarAlt, FaComments, FaCalendarCheck, FaSignOutAlt, FaHeadset } from "react-icons/fa";
import { MdLanguage } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import { auth, getUserData } from "../../firebase";
import { signOut } from "firebase/auth";
import { toast } from "react-hot-toast";
import profile from "../../assets/profile.jpeg";
import { useLanguage } from '../../context/LanguageContext';
import { Select } from 'antd';
import Cards from "./Cards";
import SettingsCards from "./SettingsCards";
import Calendar from "./RetireeCalendar";
import Messages from "./Messages";
import Notifications from "./Notifications";
import AddEvents from "./AddEvents";
import Support from "./Support";

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
  const [userData, setUserData] = useState(null);

  useEffect(() => {
      const fetchUserData = async () => {
        try {
          const user = auth.currentUser;
          if (!user) {
            console.error("No user is currently logged in.");
            toast.error("No user is logged in.");
            return;
          }
          const data = await getUserData(user.uid);
  
          if (!data) {
            console.error("No user data found for the given UID.");
            toast.error("Failed to load user data.");
            return;
          }
  
          setUserData(data.credentials); // Set the credentials object, which contains the username
        } catch (error) {
          console.error("Error fetching user data:", error);
          toast.error("Failed to load user data.");
        }
      };
  
      fetchUserData();
    }, []);

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
      <div className="w-70 bg-gray-100 shadow-lg">
        {/* Logo */}
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-xl font-bold text-yellow-500">Golden Generation</h1>
        </div>

        {/* Profile Section */}
        <div className="p-6 border-b border-gray-200 flex flex-col items-center">
          <img 
            src={profile} 
            alt="Profile" 
            className="w-20 h-20 rounded-full mb-3"
          />
          <span className="text-lg font-semibold">
            {userData?.username || "User"}
          </span>
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
          <button
            onClick={() => setSelected("support")}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 w-full mb-4"
          >
            <FaHeadset className="text-xl" />
            <span className="text-sm">Customer Support</span> {/* Add Customer Support button */}
          </button>

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
        {/* Search Bar + Header */}
        <div>
          <h2 className="text-xl font-semibold mb-6">
            {icons.find(icon => icon.id === selected)?.label}
          </h2>
          {selected === "upcoming" && (
            <div className="mb-6 flex items-center max-w-md border px-3 py-2 rounded-md bg-white shadow-sm">
              <FaSearch className="text-gray-500" />
              <input 
                type="text" 
                placeholder="Search Events" 
                className="border-none outline-none text-sm ml-2 w-full"
              />
            </div>
          )}
        </div>

        {/* Scrollable Content Area */}
        <div className="bg-white rounded-lg shadow-sm p-6 overflow-y-auto flex-1">
          {selected === "upcoming" && <Cards />}
          {selected === "add" && <AddEvents />}
          {selected === "settings" && <SettingsCards />}
          {selected === "calendar" && <Calendar />}
          {selected === "messages" && <Messages />}
          {selected === "notifications" && <Notifications />}
          {selected === "support" && <Support />} {/* Add Support component */}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;