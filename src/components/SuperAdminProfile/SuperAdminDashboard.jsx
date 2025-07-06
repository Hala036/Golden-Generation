import Dashboard from '../SharedDashboard/SharedDashboard';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FaHome, FaCalendarCheck, FaUser, FaBriefcase, FaHandsHelping, FaChartBar, FaCog, FaMapMarkerAlt, FaPlus, FaUserShield, FaTags, FaSync } from 'react-icons/fa';
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

  // Function to manually update past events
  const handleUpdatePastEvents = async () => {
    try {
      const functions = getFunctions();
      const manualUpdatePastEvents = httpsCallable(functions, 'manualUpdatePastEvents');
      
      toast.loading('Updating past events...');
      const result = await manualUpdatePastEvents();
      
      toast.dismiss();
      if (result.data.success) {
        toast.success(`Successfully updated ${result.data.updatedCount} past events to completed status`);
      } else {
        toast.error('Failed to update past events');
      }
    } catch (error) {
      toast.dismiss();
      console.error('Error updating past events:', error);
      toast.error('Error updating past events: ' + error.message);
    }
  };

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
    { id: "settings", label: t("sidebar.settings"), icon: <FaCog /> },
  ];


  const customButtons = [
    {
      id: "updatePastEvents",
      label: "Update Past Events",
      icon: <FaSync />,
      onClick: handleUpdatePastEvents,
      className: "bg-blue-500 hover:bg-blue-600 text-white"
    }
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
