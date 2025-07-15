import { useState, useEffect } from "react";
import { FaBell, FaCog, FaPlusCircle, FaCalendarAlt, FaComments, FaCalendarCheck, FaSignOutAlt, FaHome, FaSearch } from "react-icons/fa";
import { FiType } from "react-icons/fi";
import { MdLanguage } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import { auth, getUserData } from "../../firebase";
import { signOut } from "firebase/auth";
import { toast } from "react-hot-toast";
import profile from "../../assets/profile.jpeg";
import { useLanguage } from '../../context/LanguageContext';
import { Select } from 'antd';
import { useTranslation } from 'react-i18next';
import Notifications from './Notifications'; // Import the Notifications component
import DefaultProfilePic from '../DefaultProfilePic';
import { set } from "lodash";

const Dashboard = ({ customIcons = [], customButtons = [], componentsById }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { language, changeLanguage } = useLanguage();
  const [selected, setSelected] = useState("main");
  const [userData, setUserData] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true); // Track sidebar state
  const [showNotificationsPopup, setShowNotificationsPopup] = useState(false); // State for notifications popup
  const [showFontSize, setShowFontSize] = useState(false);
  const [fontSize, setFontSize] = useState(16);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [theme, setTheme] = useState('light'); // fallback if not using context
  // Define colors for different user types
  const defaultColors = {
    admin: '#4F46E5', // Indigo
    superadmin: '#DC2626', // Red
    retiree: '#059669', // Green
    default: '#6B7280', // Gray
  };

  const baseIcons = [
    { id: "main", label: t('dashboard.homePage'), icon: <FaHome /> },
    { id: "upcoming", label: t('dashboard.events.upcomingEvents'), icon: <FaCalendarCheck /> },
    { id: "settings", label: t('dashboard.settings'), icon: <FaCog /> },
    { id: "notifications", label: t('dashboard.notifications'), icon: <FaBell /> },
    { id: "add", label: t('dashboard.events.addEvent'), icon: <FaPlusCircle /> },
    { id: "calendar", label: t('dashboard.calendar'), icon: <FaCalendarAlt /> },
    { id: "messages", label: t('dashboard.messages'), icon: <FaComments /> },
  ];

  const icons = [...baseIcons, ...customIcons];

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
        setUserRole(data.role);
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

  const handleFontSizeChange = (size) => {
    if (size < 2) size = 2;
    if (size > 40) size = 40;
    setFontSize(size);
    document.documentElement.style.fontSize = size + "px";
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div
        className={`transition-all duration-300 ${
          isSidebarExpanded ? "w-60" : "w-15"
        } bg-gray-100 shadow-lg h-[calc(100vh-60px)] mt-15`}
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

          <div className="p-4 md:p-6 border-b border-gray-200 flex flex-col items-center">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-full mb-2">
              <DefaultProfilePic 
                name={userData?.username || "User"}
                size={80}
                fontSize="2rem"
                bgColor={defaultColors[userRole?.toLowerCase()] || defaultColors.default}
              />
            </div>
            <span className="text-sm mt-3 md:mt-0 md:text-lg font-semibold text-center">
              {userData?.username || "User"}
            </span>
          </div>
        )}

        {/* Navigation Items */}
        <nav className="py-4">
          {icons
            .filter(({ id }) => id !== "notifications" && id !== "messages")
            .map(({ id, label, icon }) => (
              <div
                key={id}
                onClick={() => setSelected(id)}
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

        {/* Bottom Section */}
        <div
          className={`absolute bottom-0 ${
            isSidebarExpanded ? "w-64" : "w-20"
          } border-t border-gray-200 bg-gray-100 p-4`}
        >
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
        <div className="fixed top-0 left-0 right-0 bg-white shadow-md px-2 md:px-6 py-2 md:py-4 z-10 flex items-center justify-between">
          <h1 className="text-lg md:text-xl font-bold text-yellow-500">{t('auth.dashboard.topbar.title')}</h1>
          
          <div className="flex items-center gap-2 md:gap-4">
            <div className="flex items-center gap-2 md:gap-3">
              <FaPlusCircle
                className="text-gray-600 text-[1.4rem] cursor-pointer hover:text-gray-800"
                onClick={() => setShowCreateModal("add")}
              />
              <FaBell
                className="text-gray-600 text-[1.4rem] cursor-pointer hover:text-gray-800"
                onClick={() => setShowNotificationsPopup((prev) => !prev)}
              />
              <FaComments
                className="text-gray-600 text-[1.4rem] cursor-pointer hover:text-gray-800"
                onClick={() => setSelected("messages")}
              />
              <FiType
                className="text-gray-600 text-[1.4rem] cursor-pointer hover:text-yellow-500"
                title="Font Size"
                onClick={() => setShowFontSize(true)}
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
                {/* <Select.Option value="ar">العربية</Select.Option> */}
              </Select>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="bg-white rounded-lg shadow-sm p-2 overflow-y-auto flex-1 mt-13">
          {componentsById[selected] || <div>dashboard.No Component Found</div>}
        </div>

        {/* Notifications Popup */}
        {showNotificationsPopup && (
          <div
            className={`absolute top-20 ${
              language === "he" || language === "ar" ? "left-10" : "right-10"
            } bg-white rounded-lg shadow-lg p-6 w-96 z-50`}
>
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

        {/* Font Size Modal */}
        {showFontSize && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/30 backdrop-blur-sm">
            <div className="bg-white rounded-lg shadow-lg p-6 min-w-[320px] relative">
              <button
                className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-xl"
                onClick={() => setShowFontSize(false)}
              >
                &times;
              </button>
              <h2 className="text-lg font-bold mb-4 text-yellow-600">Font Size</h2>
              <div className="flex flex-col items-center gap-4">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleFontSizeChange(fontSize - 1)}
                    className="px-3 py-1 rounded text-xl font-bold bg-gray-200 hover:bg-yellow-400"
                    disabled={fontSize <= 2}
                  >
                    –
                  </button>
                  <input
                    type="number"
                    min={2}
                    max={40}
                    value={fontSize}
                    onChange={e => handleFontSizeChange(Number(e.target.value))}
                    className="w-16 text-center border rounded p-2 text-lg font-semibold bg-white border-gray-300"
                  />
                  <button
                    onClick={() => handleFontSizeChange(fontSize + 1)}
                    className="px-3 py-1 rounded text-xl font-bold bg-gray-200 hover:bg-yellow-400"
                    disabled={fontSize >= 40}
                  >
                    +
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 justify-center mt-2">
                  {[
                    { label: "Small", size: 12 },
                    { label: "Medium", size: 16 },
                    { label: "Large", size: 20 }
                  ].map(option => (
                    <button
                      key={option.label}
                      onClick={() => handleFontSizeChange(option.size)}
                      className={`px-3 py-1 rounded border ${
                        fontSize === option.size 
                          ? "bg-yellow-500 text-white border-yellow-500" 
                          : "bg-white border-gray-300 hover:bg-yellow-100"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
                <div className="mt-4 text-gray-600" style={{ fontSize: fontSize }}>
                  Live preview: The quick brown fox jumps over the lazy dog.
                </div>
              </div>
            </div>
          </div>
        )}
        {/* Create Event Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 backdrop-blur-sm bg-black/10 flex items-center justify-center z-50">
            <CreateEventForm
              onClose={() => setShowCreateModal(false)}
              userRole={userRole}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
