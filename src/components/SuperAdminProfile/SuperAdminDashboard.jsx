import Dashboard from '../SharedDashboard/SharedDashboard';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FaHome, FaCalendarCheck, FaUser, FaBriefcase, FaHandsHelping, FaChartBar, FaCog, FaMapMarkerAlt, FaPlus, FaUserShield, FaTags } from 'react-icons/fa';

import AdminHomepage from "../SharedDashboard/MainPage";
import Cards from "../SharedDashboard/Cards";
import Retirees from "../AdminProfile/Retirees";
import Jobs from "../AdminProfile/Jobs";
import ServiceRequests from "../AdminProfile/ServiceRequests"; // Import ServiceRequests component
import Analysis from "../AdminProfile/Analytics/Analysis";
import ComprehensiveAnalytics from "../AdminProfile/Analytics/ComprehensiveAnalytics";
import Settings from "../SharedDashboard/SettingsCards";
import Notifications from "../SharedDashboard/Notifications";
import AddEvent from "../SharedDashboard/AddEvents";
import Messages from "../SharedDashboard/Messages";
import AdminCalendar from "../Calendar/AdminCalendar";
import EventRequests from "../AdminProfile/PendingEvents";
import SettlementsManager from "./SettlementsManager";
import AdminSettlements from "../SignUp/AdminSettlements";
import AdminManagement from "./Admins";
import CategoryManagement from "../AdminProfile/CategoryManagement";

const RetireeDashboard = () => {
  const { t } = useTranslation();
  const [selected, setSelected] = useState("main"); // Manage selected state here

  console.debug('[SuperAdminDashboard] mounted');
  console.debug('[SuperAdminDashboard] selected:', selected);

  const customIcons = [
    { id: "main", label: t("dashboard.homePage"), icon: <FaHome /> },
    { id: "upcoming", label: t("dashboard.events.upcomingEvents"), icon: <FaCalendarCheck /> },
    { id: "categoryManagement", label: "Category Management", icon: <FaTags /> },
    { id: "addSettlements", label: "Add Settlements", icon: <FaPlus /> },
    { id: "admins", label: "Admin Management", icon: <FaUserShield /> },
    { id: "retirees", label: t("dashboard.retirees"), icon: <FaUser /> },
    { id: "jobs", label: t("dashboard.volunteerRequests"), icon: <FaBriefcase /> },
    { id: "service", label: t("dashboard.serviceRequests"), icon: <FaHandsHelping /> },
    { id: "analysis", label: t("dashboard.analytics"), icon: <FaChartBar /> },
    { id: "settings", label: t("dashboard.settings"), icon: <FaCog /> },
  ];

  const customButtons = [];

  const componentsById = {
    upcoming: <Cards />,
    main: <AdminHomepage setSelected={setSelected} />, // Pass setSelected to AdminHomepage
    settings: <Settings />,
    calendar: <AdminCalendar />,
    messages: <Messages />,
    add: <AddEvent />,
    notifications: <Notifications />,
    retirees: <Retirees />,
    jobs: <Jobs />,
    service: <ServiceRequests />, // Link to ServiceRequests component
    analysis: <Analysis />,
    eventRequests: <EventRequests />,
    addSettlements: <AdminSettlements />,
    admins: <AdminManagement />,
    categoryManagement: <CategoryManagement />,
  };

  // Log when selected changes
  React.useEffect(() => {
    console.debug('[SuperAdminDashboard] selected changed:', selected);
  }, [selected]);

  return (
    <Dashboard
      customIcons={customIcons}
      customButtons={customButtons}
      componentsById={componentsById}
      selected={selected}
      setSelected={setSelected}
    />  );
};

export default RetireeDashboard;
