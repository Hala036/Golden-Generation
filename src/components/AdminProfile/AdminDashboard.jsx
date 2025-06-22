import { useState } from "react";
import { FaUser, FaBriefcase, FaChartBar, FaTags, FaHandsHelping, FaCog, FaCalendarCheck, FaHome } from "react-icons/fa";
import Dashboard from '../SharedDashboard/SharedDashboard';
import { useTranslation } from 'react-i18next';

import AdminHomepage from "../SharedDashboard/MainPage";
import Cards from "../SharedDashboard/Cards";
import CategoryManagement from "./CategoryManagement";
import Retirees from "./Retirees";
import Jobs from "./Jobs";
import Service from "./ServiceRequests";
import Analysis from "./Analysis";
import Settings from "../SharedDashboard/SettingsCards";
import Notifications from "../SharedDashboard/Notifications";
import AddEvent from "../SharedDashboard/AddEvents";
import Messages from "../SharedDashboard/Messages";
import AdminCalendar from "../Calendar/AdminCalendar";
import Pending from "./PendingEvents";

const AdminDashboard = () => {
  const { t } = useTranslation();
  const [selected, setSelected] = useState("main"); // Manage selected state here

  const customIcons = [
    { id: "main", label: t('dashboard.homePage'), icon: <FaHome /> },
    { id: "upcoming", label: t('dashboard.events.upcomingEvents'), icon: <FaCalendarCheck /> },
    { id: "categoryManagement", label: t('dashboard.categoryManagement'), icon: <FaTags /> },
    { id: "retirees", label: t('dashboard.retirees'), icon: <FaUser /> },
    { id: "jobs", label: t('dashboard.volunteerRequests'), icon: <FaBriefcase /> },
    { id: "service", label: t('dashboard.serviceRequests'), icon: <FaHandsHelping /> },
    { id: "analysis", label: t('dashboard.analytics'), icon: <FaChartBar /> },
    { id: "settings", label: t('dashboard.settings'), icon: <FaCog /> },
  ];

  const customButtons = [];

  const componentsById = {
    upcoming: <Cards />,
    main: <AdminHomepage />,
    settings: <Settings />,
    calendar: <AdminCalendar />,
    messages: <Messages />,
    add: <AddEvent />,
    notifications: <Notifications />,
    retirees: <Retirees />,
    jobs: <Jobs />,
    service: <Service />, // Assuming service requests are handled in Messages
    analysis: <Analysis />,
    pending: <Pending />,
    categoryManagement: <CategoryManagement />
  };

  return (
    <Dashboard
      customIcons={customIcons}
      customButtons={customButtons}
      componentsById={componentsById}
      selected={selected}
      setSelected={setSelected}
    />
  );
};

export default AdminDashboard;
