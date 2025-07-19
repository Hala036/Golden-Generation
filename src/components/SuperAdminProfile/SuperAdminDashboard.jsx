import Dashboard from '../SharedDashboard/SharedDashboard';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FaHome, FaCalendarCheck, FaUser, FaBriefcase, FaHandsHelping, FaChartBar, FaCog, FaMapMarkerAlt, FaPlus, FaUserShield, FaTags, FaClock } from 'react-icons/fa';
import { getFunctions, httpsCallable } from "firebase/functions";
import { toast } from "react-hot-toast";

import AdminHomepage from "../SharedDashboard/MainPage";
import Cards from "../SharedDashboard/Cards";
import Retirees from "../AdminProfile/Retirees";
import Jobs from "../AdminProfile/Jobs";
import ServiceRequests from "../AdminProfile/ServiceRequests"; // Import ServiceRequests component
import Analysis from "../AdminProfile/Analytics/Analysis";
import ComprehensiveAnalytics from "../AdminProfile/Analytics/ComprehensiveAnalytics";
import Settings from "../SharedDashboard/SettingsCards";
import AddEvent from "../SharedDashboard/AddEvents";
import Messages from "../SharedDashboard/Messages";
import SuperAdminCalendar from "../Calendar/SuperAdminCalendar";
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
    { id: "main", label: t("sidebar.home"), icon: <FaHome /> },
    { id: "upcoming", label: t("sidebar.upcomingEvents"), icon: <FaCalendarCheck /> },
    { id: "eventRequests", label: t("sidebar.pendingEventRequests"), icon: <FaClock /> },
    { id: "categoryManagement", label: t("sidebar.categoryManagement"), icon: <FaTags /> },
    { id: "addSettlements", label: t("sidebar.addSettlements"), icon: <FaPlus /> },
    { id: "admins", label: t("sidebar.adminManagement"), icon: <FaUserShield /> },
    { id: "retirees", label: t("sidebar.retirees"), icon: <FaUser /> },
    { id: "jobs", label: t("sidebar.volunteerRequests"), icon: <FaBriefcase /> },
    { id: "service", label: t("sidebar.serviceRequests"), icon: <FaHandsHelping /> },
    { id: "analysis", label: t("sidebar.analytics"), icon: <FaChartBar /> },
    { id: "settings", label: t("sidebar.settings"), icon: <FaCog /> },
  ];

  const componentsById = {
    upcoming: <Cards setSelected={setSelected} />,
    main: <AdminHomepage setSelected={setSelected} />,
    settings: <Settings />,
    calendar: <SuperAdminCalendar />,
    messages: <Messages />,
    add: <AddEvent />,
    retirees: <Retirees />,
    jobs: <Jobs />,
    service: <ServiceRequests />,
    analysis: <Analysis />,
    eventRequests: <EventRequests />,
    addSettlements: <AdminSettlements setSelected={setSelected} />,
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
      componentsById={componentsById}
      selected={selected}
      setSelected={setSelected}
    />  );
};

export default RetireeDashboard;
