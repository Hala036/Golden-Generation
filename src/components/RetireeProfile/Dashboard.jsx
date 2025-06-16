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
import Calendar from "./Calendar";
import Messages from "./Messages";
import Notifications from "./Notifications";
import AddEvents from "./AddEvents";
import { useTranslation } from "react-i18next";
import { useTheme } from '../../context/ThemeContext';
import { Search, ChevronDown } from 'lucide-react';
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
  const { t } = useTranslation();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const { language, changeLanguage } = useLanguage();
  const [selected, setSelected] = useState("upcoming");
  const [userData, setUserData] = useState(null);
  const [events, setEvents] = useState([]);
  const [lastVisible, setLastVisible] = useState(null);
  const [loading, setLoading] = useState(false);
  const [noMoreEvents, setNoMoreEvents] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');

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
  
          setUserData(data); // Set the entire user document
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
    <div className={`flex min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'} transition-colors duration-200`}>
      {/* Sidebar */}
      <div className={`w-70 h-screen shadow-lg ${theme === 'dark' ? 'bg-gray-800 text-gray-200' : 'bg-gray-100 text-gray-900'} transition-colors duration-200`}>
        {/* Logo */}
        <div className={`p-4 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
          <h1 className="text-xl font-bold text-[#FFD966]">Golden Generation</h1>
        </div>

        {/* Profile Section */}
        <div className={`p-6 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'} flex flex-col items-center`}>
          <img 
            src={userData?.personalDetails?.photoURL || profile} 
            alt="Profile" 
            className="w-20 h-20 rounded-full mb-3"
          />
          <span className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
            {userData?.credentials?.username || "User"}
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
                  : `${theme === 'dark' ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-200'}`}
              `}
            >
              <span className={`text-xl ${selected === id ? 'text-yellow-700' : (theme === 'dark' ? 'text-gray-400' : 'text-gray-600')}`}>{icon}</span>
              <span className={`text-sm font-medium ${selected === id ? 'text-yellow-700' : (theme === 'dark' ? 'text-gray-300' : 'text-gray-600')}`}>{label}</span>
            </div>
          ))}
        </nav>

        {/* Bottom Section */}
<div className={`absolute bottom-0 w-64 border-t ${theme === 'dark' ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-100'} p-4`}>
  {/* Language Selector */}
  <div className="flex items-center space-x-2 mb-4">
    <MdLanguage className={`text-xl ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`} />
    <Select
      value={language}
      onChange={changeLanguage}
      className="w-24"
      variant={false}
      dropdownStyle={{
        backgroundColor: theme === 'dark' ? '#374151' : 'white',
        color: theme === 'dark' ? 'white' : 'black'
      }}
      style={{
        backgroundColor: theme === 'dark' ? '#4B5563' : 'white',
        color: theme === 'dark' ? 'white' : 'black',
        border: theme === 'dark' ? '1px solid #4B5563' : '1px solid #D1D5DB'
      }}
    >
      <Select.Option 
        value="en" 
        style={{
          backgroundColor: theme === 'dark' ? '#374151' : 'white',
          color: theme === 'dark' ? 'white' : 'black'
        }}
      >English</Select.Option>
      <Select.Option 
        value="he" 
        style={{
          backgroundColor: theme === 'dark' ? '#374151' : 'white',
          color: theme === 'dark' ? 'white' : 'black'
        }}
      >עברית</Select.Option>
      <Select.Option 
        value="ru" 
        style={{
          backgroundColor: theme === 'dark' ? '#374151' : 'white',
          color: theme === 'dark' ? 'white' : 'black'
        }}
      >Русский</Select.Option>
      <Select.Option 
        value="ar" 
        style={{
          backgroundColor: theme === 'dark' ? '#374151' : 'white',
          color: theme === 'dark' ? 'white' : 'black'
        }}
      >العربية</Select.Option>
    </Select>
  </div>

  {/* Customer Support Button */}
  <button
    onClick={() => setSelected("support")}
    className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 w-full"
  >
    <FaHeadset className="text-xl" />
    <span className="text-sm">Customer Support</span>
  </button>
</div>

          <button
            onClick={handleLogout}
            className={`flex items-center space-x-2 w-full ${
              theme === 'dark' ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <FaSignOutAlt className={`text-xl ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`} />
            <span className="text-sm">Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className={`flex-1 p-8 ${theme === 'dark' ? 'bg-gray-900 text-gray-100' : 'bg-gray-100 text-gray-900'} transition-colors duration-200`}>
        {/* Search Bar + Header */}
        <div>
          <h2 className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            {icons.find(icon => icon.id === selected)?.label}
          </h2>
          {selected === "upcoming" && (
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <div className={`relative flex-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" />
                <input
                  type="text"
                  placeholder={t('dashboard.searchEvents')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full py-2 pl-10 pr-4 rounded-lg border ${
                    theme === 'dark' 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-300 placeholder-gray-500'
                  } focus:outline-none focus:ring-2 focus:ring-[#FFD966] focus:border-transparent transition duration-200`}
                />
              </div>
              <div className={`relative sm:w-1/4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className={`w-full py-2 pl-4 pr-10 rounded-lg border appearance-none ${
                    theme === 'dark' 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300'
                  } focus:outline-none focus:ring-2 focus:ring-[#FFD966] focus:border-transparent transition duration-200`}
                >
                  <option value="All Categories">{t('dashboard.allCategories')}</option>
                  {/* Add more categories here */}
                  <option value="Social Event">{t('dashboard.socialEvent')}</option>
                  <option value="Vacation">{t('dashboard.vacation')}</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none" />
              </div>
            </div>
          )}
        </div>

        {/* Scrollable Content Area */}
        <div className={`rounded-lg shadow-sm p-6 overflow-y-auto flex-1 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
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