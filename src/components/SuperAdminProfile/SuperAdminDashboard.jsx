import Dashboard from '../SharedDashboard/SharedDashboard';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FaHome, FaCalendarCheck, FaUser, FaBriefcase, FaHandsHelping, FaChartBar, FaCog, FaChartLine } from 'react-icons/fa';

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
import Pending from "../AdminProfile/PendingEvents";

const RetireeDashboard = () => {
  const { t } = useTranslation();
  const [selected, setSelected] = useState("main"); // Manage selected state here

  const customIcons = [
      { id: "main", label: t("dashboard.homePage"), icon: <FaHome /> },
      { id: "upcoming", label: t("dashboard.events.upcomingEvents"), icon: <FaCalendarCheck /> },
      { id: "retirees", label: t("dashboard.retirees"), icon: <FaUser /> },
      { id: "jobs", label: t("dashboard.volunteerRequests"), icon: <FaBriefcase /> },
      { id: "service", label: t("dashboard.serviceRequests"), icon: <FaHandsHelping /> },
      { id: "analysis", label: t("dashboard.analytics"), icon: <FaChartBar /> },
      { id: "settings", label: t("dashboard.settings"), icon: <FaCog /> },
      { id: "comprehensiveAnalytics", label: "Advanced Analytics", icon: <FaChartLine /> },
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
    comprehensiveAnalytics: <ComprehensiveAnalytics />,
    pending: <Pending />,
  };

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
