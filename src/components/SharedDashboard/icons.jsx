import { FaCalendarCheck, FaPlusCircle, FaCog, FaBell, FaCalendarAlt, FaComments } from "react-icons/fa";
import { useLanguage } from "../../context/LanguageContext";

const useCommonIcons = () => {
  const { t } = useLanguage();
  
  return [
    { id: "upcoming", label: t("dashboard.events.upcomingEvents"), icon: <FaCalendarCheck /> },
    { id: "add", label: t("dashboard.events.addEvents"), icon: <FaPlusCircle /> },
    { id: "settings", label: t("dashboard.settings"), icon: <FaCog /> },
    { id: "notifications", label: t("dashboard.notifications"), icon: <FaBell /> },
    { id: "calendar", label: t("dashboard.calendar"), icon: <FaCalendarAlt /> },
    { id: "messages", label: t("dashboard.messages.title"), icon: <FaComments /> },
  ];
};

export const commonIcons = [
  { id: "upcoming", label: "Upcoming Events", icon: <FaCalendarCheck /> },
  { id: "add", label: "Add Events", icon: <FaPlusCircle /> },
  { id: "settings", label: "Settings", icon: <FaCog /> },
  { id: "notifications", label: "Notifications", icon: <FaBell /> },
  { id: "calendar", label: "Calendar", icon: <FaCalendarAlt /> },
  { id: "messages", label: "Messages", icon: <FaComments /> },
];

export default useCommonIcons;