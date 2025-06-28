import { useState, useEffect } from "react";
import { FaBell, FaCog, FaPlusCircle, FaCalendarAlt, FaComments, FaCalendarCheck, FaSignOutAlt, FaHome } from "react-icons/fa";
import { MdLanguage } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import { auth, getUserData } from "../../firebase";
import { signOut } from "firebase/auth";
import { toast } from "react-hot-toast";
import { useLanguage } from '../../context/LanguageContext';
import { Select } from 'antd';
import { useTranslation } from 'react-i18next';
import Notifications from './Notifications';
import DefaultProfilePic from '../DefaultProfilePic'; // Import DefaultProfilePic

const Dashboard = ({ customIcons = [], customButtons = [], componentsById, selected, setSelected }) => {
  const { t } = useTranslation();
  const { currentUser } = auth;
  const navigate = useNavigate();
  const { language, changeLanguage } = useLanguage();
  const [userData, setUserData] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [showNotificationsPopup, setShowNotificationsPopup] = useState(false);

  // Define colors for different user types
  const defaultColors = {
    admin: '#4F46E5', // Indigo
    superadmin: '#DC2626', // Red
    retiree: '#059669', // Green
    default: '#6B7280', // Gray
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          toast.error("No user is logged in.");
          return;
        }
        const data = await getUserData(user.uid);
        if (!data) {
          toast.error("Failed to load user data.");
          return;
        }
        setUserData(data.credentials);
        setUserRole(data.role); // Set the user role
      } catch (error) {
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
      toast.error('Failed to logout. Please try again.');
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div
        className={`transition-all duration-300 mt-15 ${
          isSidebarExpanded ? "w-60" : "w-15"
        } bg-gray-100 shadow-lg min-h-screen flex flex-col`}
      >
        {/* Toggle Button */}
        <button
          onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}
          className="absolute text-gray-600 hover:text-gray-800"
        >
          {isSidebarExpanded ? t('dashboard.arrowClose') : t('dashboard.arrowOpen')}
        </button>

        {/* Profile Section */}
        {isSidebarExpanded && (
          <div className="p-6 border-b border-gray-200 flex flex-col items-center">
            <div className="w-20 h-20 mb-3">
              <DefaultProfilePic 
                name={userData?.username || "User"}
                size={80}
                fontSize="2rem"
                bgColor={defaultColors[userRole?.toLowerCase()] || defaultColors.default}
              />
            </div>
            <span className="text-lg font-semibold">
              {userData?.username || "User"}
            </span>
          </div>
        )}

        {/* Navigation Items (Flexible) */}
        <nav className="py-4 flex-1 overflow-y-auto">
          {customIcons
            .filter(({ id }) => id !== "notifications" && id !== "messages" && id !== "add") // Exclude notifications and messages from sidebar
            .map(({ id, label, icon }) => (
              <div
                key={id}
                onClick={() => {
                  console.debug('[Sidebar] setSelected called with:', id);
                  setSelected(id);
                }}
                className={`flex items-center ${
                  isSidebarExpanded ? "space-x-3 px-6" : "justify-center"
                } py-3 cursor-pointer transition duration-200 ml-2 ${
                  selected === id
                    ? "bg-yellow-100 text-yellow-700 border-r-4 border-yellow-500"
                    : "text-gray-600 hover:bg-gray-200"
                }`}
              >
                <span className="text-xl">{icon}</span>
                {isSidebarExpanded && <span className="text-sm font-medium">{label}</span>}
              </div>
            ))}
        </nav>

        {/* Bottom Section (Pinned) */}
        <div className="border-t border-gray-200 bg-gray-100 p-4">
          {/* Custom Buttons */}
          {customButtons.map(({ id, label, onClick, icon }) => (
            <button
              key={id}
              onClick={() => setSelected(id)}
              className={`flex items-center ${
                isSidebarExpanded ? "space-x-2" : "justify-center"
              } text-gray-600 hover:text-gray-800 w-full py-2`}
            >
              <span className="text-xl">{icon}</span>
              {isSidebarExpanded && <span className="text-sm">{label}</span>}
            </button>
          ))}

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className={`flex items-center ${
              isSidebarExpanded ? "space-x-2" : "justify-center"
            } text-gray-600 hover:text-gray-800 w-full mt-2`}
          >
            <FaSignOutAlt className="text-xl" />
            {isSidebarExpanded && <span className="text-sm">{t("dashboard.logout")}</span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen box-border p-4 relative">
        {/* Top Bar */}
        <div className="fixed top-0 left-0 right-0 bg-white shadow-md px-6 py-4 z-10 flex items-center justify-between">
          <h1 className="text-xl font-bold text-yellow-500">Golden Generation</h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <FaPlusCircle
                className="text-gray-600 text-[1.4rem] cursor-pointer hover:text-gray-800"
                onClick={() => setSelected("add")}
              />
              <FaBell
                className="text-gray-600 text-[1.4rem] cursor-pointer hover:text-gray-800"
                onClick={() => setShowNotificationsPopup((prev) => !prev)} // Toggle the popup
              />
              <FaComments
                className="text-gray-600 text-[1.4rem] cursor-pointer hover:text-gray-800"
                onClick={() => setSelected("messages")}
              />
            </div>
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
                <Select.Option value="ar">العربية</Select.Option>
              </Select>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="bg-white rounded-lg shadow-sm p-2 overflow-y-auto flex-1 mt-13">
          {componentsById[selected] || <div>No Component Found</div>}
        </div>

        {/* Notifications Popup */}
        {showNotificationsPopup && (
          <div className="absolute top-20 right-10 bg-white rounded-lg shadow-lg p-6 w-96 z-50">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Notifications</h3>
              <button
                className="text-red-500 hover:text-red-700"
                onClick={() => setShowNotificationsPopup(false)} // Close the popup
              >
                &times;
              </button>
            </div>
            {/* Scrollable Notifications List */}
            <div className="max-h-96 overflow-y-auto">
              <Notifications setSelectedTab={setSelected} setShowNotificationsPopup={setShowNotificationsPopup} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
