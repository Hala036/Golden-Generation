import { useState, useEffect } from "react";
import { FaUser, FaComments, FaArrowLeft } from "react-icons/fa";
import { MdLanguage } from "react-icons/md";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-hot-toast";
import profile from "../../assets/profile.jpeg";
import { useLanguage } from '../../context/LanguageContext';
import { Select } from 'antd';
import ProfileDetails from "./ProfileDetails";
import Messages from "./SendMessage";
import DefaultProfilePic from '../DefaultProfilePic';
import { useTranslation } from 'react-i18next';

const ViewProfileDashboard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { language, changeLanguage } = useLanguage();
  const [selected, setSelected] = useState("profile");
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true); // Sidebar toggle state

  // Retrieve the retiree ID from the state passed via navigation
  const location = useLocation();
  const retireeData = location.state?.retireeData;
  const retireeIdNumber = retireeData?.idVerification?.idNumber;

  // Redirect to a fallback page if retireeIdNumber is not available
  useEffect(() => {
    if (!retireeIdNumber) {
      toast.error("No retiree ID number available.");
      navigate("/dashboard");
    }
  }, [retireeIdNumber, navigate]);

  const icons = [
    { id: "profile", label: "Profile", icon: <FaUser /> },
    { id: "messages", label: "Send Messages", icon: <FaComments /> }
  ];

  const handleBackToProfile = () => {
    navigate("/dashboard"); // Adjust this based on the user's role
  };

  if (!retireeData) {
    return <div>{t("common.loading")}</div>;
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div
        className={`transition-all duration-300 mt-12 md:mt-15 ${
          isSidebarExpanded ? "w-48 md:w-55" : "w-14 md:w-15"
        } bg-gray-100 shadow-lg min-h-[calc(100vh-theme(spacing.12))] flex flex-col`}
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
                name={retireeData.credentials?.username || "User"}
                size={80}
                fontSize="2rem"
                // bgColor={defaultColors[userRole?.toLowerCase()] || defaultColors.default}
              />
            </div>
            <span className="text-sm mt-3 md:mt-0 md:text-lg font-semibold text-center">
              {retireeData.credentials?.username || "User"}
            </span>
          </div>
        )}

        {/* Navigation Items (Flexible) */}
        <nav className="py-2 md:py-4 flex-1 overflow-y-auto mt-2">
          {icons
            .map(({ id, label, icon }) => (
              <div
                key={id}
                onClick={() => {
                  console.debug('[Sidebar] setSelected called with:', id);
                  setSelected(id);
                }}
                className={`flex items-center ${
                  isSidebarExpanded ? "space-x-2 md:space-x-3 px-3 md:px-6" : "justify-center"
                } py-2 md:py-3 cursor-pointer transition duration-200 ml-1 md:ml-2 ${
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
        <div className="border-t border-gray-200 bg-gray-100 p-2 md:p-4">
          {/* Custom Buttons *
          {customButtons.map(({ id, label, onClick, icon }) => (
            <button
              key={id}
              onClick={() => setSelected(id)}
            className={`flex items-center ${
              isSidebarExpanded ? "space-x-1 md:space-x-2" : "justify-center"
            } text-gray-600 hover:text-gray-800 w-full py-1 md:py-2`}
            >
              <span className="text-xl">{icon}</span>
              {isSidebarExpanded && <span className="text-sm">{label}</span>}
            </button>
          ))}

          {/* back to profile Button */}
          <button
            onClick={handleBackToProfile}
            className={`flex items-center ${
              isSidebarExpanded ? "space-x-1 md:space-x-2" : "justify-center"
            } text-gray-600 hover:text-gray-800 w-full mt-1 md:mt-2`}
          >
            <FaArrowLeft className="text-xl" />
            {isSidebarExpanded && <span className="text-sm">Back To Profile</span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen box-border p-2 md:p-4 relative">
        {/* Top Bar */}
        <div className="fixed top-0 left-0 right-0 bg-white shadow-md px-2 md:px-6 py-2 md:py-4 z-10 flex items-center justify-between">
          <h1 className="text-lg md:text-xl font-bold text-yellow-500">Golden Generation</h1>
          
          <div className="flex items-center gap-2 md:gap-4">
            <div className="flex items-center gap-1 text-xs md:text-sm ml-2 md:ml-5">
              <MdLanguage className="text-base md:text-lg text-gray-600" />
              <Select
                value={language}
                onChange={changeLanguage}
                className="w-22 md:w-24 text-xs md:text-sm"
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
        <div className="bg-white rounded-lg shadow-sm p-6 overflow-y-auto flex-1 mt-16">
          {selected === "profile" && <ProfileDetails retireeData={retireeData} />}
          {selected === "messages" && <Messages retireeData={retireeData} />}
        </div>
      </div>
    </div>
  );
};

export default ViewProfileDashboard;
