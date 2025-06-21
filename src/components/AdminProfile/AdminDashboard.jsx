import { FaUser, FaBriefcase, FaChartBar, FaClock } from "react-icons/fa";
import Dashboard from '../SharedDashboard/SharedDashboard';
import { useTranslation } from 'react-i18next';

import AdminHomepage from "../SharedDashboard/MainPage";
import Cards from "../SharedDashboard/Cards";
import AddEvent from "../SharedDashboard/AddEvents";
import Settings from "../SharedDashboard/SettingsCards";
import Calendar from "../Calendar/AdminCalendar";
import Messages from "../SharedDashboard/Messages";
import Notifications from "../SharedDashboard/Notifications";
import Pending from "./PendingEvents";
import Retirees from "./Retirees";
import Jobs from "./Jobs";
import Analysis from "./Analysis";

const AdminDashboard = () => {
  const { t } = useTranslation();
  const customIcons = [
    { id: "retirees", label: t('dashboard.retirees'), icon: <FaUser /> },
    { id: "jobs", label: t('dashboard.volunteerRequests'), icon: <FaBriefcase /> },
    { id: "analysis", label: t('dashboard.analytics'), icon: <FaChartBar /> },
    { id: "pending", label: t('dashboard.pendingEvents'), icon: <FaClock /> }
  ];

  const customButtons = [];

  const componentsById = {
    upcoming: <Cards />,
    main: <AdminHomepage />,
    settings: <Settings />,
    calendar: <Calendar />,
    messages: <Messages />,
    add: <AddEvent />,
    notifications: <Notifications />,
    retirees: <Retirees />,
    jobs: <Jobs />,
    analysis: <Analysis />,
    pending: <Pending />
  };

  return (
    <Dashboard customIcons={customIcons} customButtons={customButtons} componentsById={componentsById} />
  );
};

export default AdminDashboard;
