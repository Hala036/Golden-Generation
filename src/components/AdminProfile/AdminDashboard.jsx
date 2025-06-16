import React, { useState, useEffect } from "react";
import { FaClock, FaBell, FaCog, FaPlusCircle, FaCalendarAlt, FaComments, FaCalendarCheck, FaSignOutAlt, FaUser, FaHeadset, FaBriefcase, FaHome, FaChartBar } from "react-icons/fa";
import { MdLanguage } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import { auth, getUserData } from "../../firebase";
import { signOut } from "firebase/auth";
import { toast } from "react-hot-toast";
import profile from "../../assets/profile.jpeg";
import { useLanguage } from '../../context/LanguageContext';
import { Select } from 'antd';
import Main from "./Main";
import AdminHomepage from "./MainPage";
import Retirees from "./Retirees";
import Jobs from "./Jobs";
import Analysis from "./Analysis";
import Pending from "./PendingEvents";
import Cards from "../RetireeProfile/Cards";
import AddEvent from "../RetireeProfile/AddEvents";
import Settings from "../RetireeProfile/SettingsCards";
import Calendar from "../RetireeProfile/Calendar";
import Messages from "../RetireeProfile/Messages";
import Notifications from "../RetireeProfile/Notifications";
import Support from "../RetireeProfile/Support";
import { useTranslation } from 'react-i18next';


const Dashboard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { language, changeLanguage } = useLanguage();
  const [selected, setSelected] = useState("upcoming");
  const [userData, setUserData] = useState(null);

  const icons = [
    { id: "upcoming", label: t('dashboard.events.upcomingEvents'), icon: <FaCalendarCheck /> },
    { id: "main", label: t('dashboard.homePage'), icon: <FaHome /> },
    { id: "retirees", label: t('dashboard.retirees'), icon: <FaUser /> },
    { id: "jobs", label: t('dashboard.volunteerRequests'), icon: <FaBriefcase /> },
    { id: "analysis", label: t('dashboard.analytics'), icon: <FaChartBar /> },
    { id: "settings", label: t('dashboard.settings'), icon: <FaCog /> },
    { id: "notifications", label: t('dashboard.notifications'), icon: <FaBell /> },
    { id: "add", label: t('dashboard.events.addEvent'), icon: <FaPlusCircle /> },
    { id: "calendar", label: t('dashboard.calendar'), icon: <FaCalendarAlt /> },
    { id: "messages", label: t('dashboard.messages'), icon: <FaComments /> },
    { id: "pending", label: t('dashboard.pendingEvents'), icon: <FaClock /> }
  ];

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
    <div className="flex min-h-screen bg-gray-50 ">
      {/* Sidebar */}
      <div className="w-70 bg-gray-100 shadow-lg h-[calc(100vh-60px)] mt-15">

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
          {icons
            .filter(({ id }) => id !== "notifications" && id !== "messages")
            .map(({ id, label, icon }) => (
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
            <span className="text-sm">{t('dashboard.contactUs')}</span>
          </button>

          <button
            onClick={handleLogout}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 w-full"
          >
            <FaSignOutAlt className="text-xl" />
            <span className="text-sm">{t('dashboard.logout')}</span>
          </button>
        </div> 
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen box-border p-4">
        {/* Top Bar */}
        <div className="fixed top-0 left-0 right-0 bg-white shadow-md px-6 py-4 z-10 flex items-center justify-between">
          <h1 className="text-xl font-bold text-yellow-500">Golden Generation</h1>
          <div className="flex items-center gap-4">
            {/* Action Icons */}
            <div className="flex items-center gap-3">
              <FaPlusCircle 
                className="text-gray-600 text-[1.4rem] cursor-pointer hover:text-gray-800" 
                onClick={() => setSelected("add")} 
              />
              <FaBell 
                className="text-gray-600 text-[1.4rem] cursor-pointer hover:text-gray-800" 
                onClick={() => setSelected("notifications")} 
              />
              <FaComments 
                className="text-gray-600 text-[1.4rem] cursor-pointer hover:text-gray-800" 
                onClick={() => setSelected("messages")} 
              />
            </div>

            {/* Language Selector */}
            <div className="flex items-center gap-1 text-sm ml-5">
              <MdLanguage className="text-lg text-gray-600" />
              <Select
                value={language}
                onChange={changeLanguage}
                className="w-24 text-sm"
                variant={false}
              >
                <Select.Option value="en">English</Select.Option>
                <Select.Option value="he">עברית</Select.Option>
                <Select.Option value="ru">Русский</Select.Option>
                <Select.Option value="ar">العربية</Select.Option>
              </Select>
            </div>

          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="bg-white rounded-lg shadow-sm p-6 overflow-y-auto flex-1 mt-16">
          {selected === "upcoming" && <Cards setSelected={setSelected} />}
          {selected === "main" && <AdminHomepage />}
          {selected === "retirees" && <Retirees />}
          {selected === "jobs" && <Jobs />}
          {selected === "analysis" && <Analysis />}
          {selected === "settings" && <Settings />}
          {selected === "calendar" && <Calendar />}
          {selected === "messages" && <Messages />}
          {selected === "add" && <AddEvent />}
          {selected === "notifications" && <Notifications />}
          {selected === "support" && <Support />}
          {selected === "pending" && <Pending />}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
