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

const ViewProfileDashboard = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { language, changeLanguage } = useLanguage();
  const [selected, setSelected] = useState("profile");

  // Retrieve the retiree ID from the state passed via navigation
  const location = useLocation();
  const retireeData = location.state?.retireeData;
  const retireeIdNumber = retireeData?.idVerification?.idNumber;


  // Redirect to a fallback page if retireeIdNumber is not available
  useEffect(() => {
    if (!retireeIdNumber) {
      toast.error(t('viewProfile.errors.noRetireeId'));
      navigate("/dashboard");
    }
  }, [retireeIdNumber, navigate, t]);

  const icons = [
    { id: "profile", label: t('viewProfile.navigation.profile'), icon: <FaUser /> },
    { id: "messages", label: t('viewProfile.navigation.sendMessages'), icon: <FaComments /> }
  ];

  const handleBackToProfile = () => {
    navigate("/dashboard"); // Adjust this based on the user's role
  };

  if (!retireeData) {
    return <div>{t("viewProfile.common.loading")}</div>;
  }

  return (
    <div className="flex min-h-screen bg-gray-50 mt-15">
      {/* Sidebar */}
      <div className="w-70 bg-gray-100 shadow-lg">
        {/* Profile Section */}
        <div className="p-6 border-b border-gray-200 flex flex-col items-center">
          <img 
            src={retireeData.profilePicture || profile} 
            alt="Profile" 
            className="w-20 h-20 rounded-full mb-3"
          />
          <span className="text-lg font-semibold">
            {retireeData?.credentials?.username || "Retiree"}
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
            onClick={handleBackToProfile}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-800"
          >
            <FaArrowLeft className="text-xl" />
            <span className="text-sm">{t('viewProfile.navigation.backToProfile')}</span>
          </button>
        </div> 
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen box-border p-4">
        {/* Top Bar */}
        <div className="fixed top-0 left-0 right-0 bg-white shadow-md px-6 py-4 z-10 flex items-center justify-between">
          <h1 className="text-xl font-bold text-yellow-500">{t('viewProfile.header.title')}</h1>
          <div className="flex items-center gap-4">
            {/* Language Selector */}
            <div className="flex items-center gap-1 text-sm ml-5">
              <MdLanguage className="text-lg text-gray-600" />
              <Select
                value={language}
                onChange={changeLanguage}
                className="w-24 text-sm"
                variant={false}
              >
                <Select.Option value="en">{t('viewProfile.languageSelector.english')}</Select.Option>
                <Select.Option value="he">{t('viewProfile.languageSelector.hebrew')}</Select.Option>
                <Select.Option value="ar">{t('viewProfile.languageSelector.arabic')}</Select.Option>
              </Select>
            </div>
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="bg-white rounded-lg shadow-sm p-6 overflow-y-auto flex-1 mt-16">
          {selected === "profile" && <ProfileDetails retireeData={retireeData} />}
          {selected === "messages" && <Messages retireeData={retireeData} />}
        </div>
      </div>
    </div>
  );
};

export default ViewProfileDashboard;
