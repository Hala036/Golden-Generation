import { useState } from "react";
import { FaUser, FaBriefcase, FaChartBar, FaClock, FaTags, FaChartLine, FaHandsHelping, FaCog, FaCalendarCheck, FaHome, FaSync } from "react-icons/fa";
import Dashboard from "../SharedDashboard/SharedDashboard";
import { useTranslation } from "react-i18next";
import { getFunctions, httpsCallable } from "firebase/functions";
import { toast } from "react-hot-toast";

import AdminHomepage from "../SharedDashboard/MainPage";
import Cards from "../SharedDashboard/Cards";
import CategoryManagement from "./CategoryManagement";
import Retirees from "./Retirees";
import Jobs from "./Jobs";
import ServiceRequests from "./ServiceRequests"; // Import ServiceRequests component
import Analysis from "./Analytics/Analysis";
import ComprehensiveAnalytics from "./Analytics/ComprehensiveAnalytics";
import Settings from "../SharedDashboard/SettingsCards";
import AddEvent from "../SharedDashboard/AddEvents";
import Messages from "../SharedDashboard/Messages";
import AdminCalendar from "../Calendar/AdminCalendar";
import EventRequests from "./PendingEvents";

const AdminDashboard = () => {
  const { t } = useTranslation();
  const [selected, setSelected] = useState("main"); // Manage selected state here

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
    { id: "categoryManagement", label: t("dashboard.categoryManagement"), icon: <FaTags /> },
    { id: "retirees", label: t("dashboard.retirees"), icon: <FaUser /> },
    { id: "jobs", label: t("dashboard.volunteerRequests"), icon: <FaBriefcase /> },
    { id: "service", label: t("dashboard.serviceRequests"), icon: <FaHandsHelping /> },
    { id: "analysis", label: t("dashboard.analytics"), icon: <FaChartBar /> },
    { id: "settings", label: t("dashboard.settings.title"), icon: <FaCog /> },
    //{ id: "comprehensiveAnalytics", label: t("dashboard.advancedAnalytics"), icon: <FaChartLine /> },
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
    main: <AdminHomepage setSelected={setSelected} />, // Pass setSelected to AdminHomepage
    settings: <Settings />,
    calendar: <AdminCalendar />,
    messages: <Messages />,
    add: <AddEvent />,
    retirees: <Retirees />,
    jobs: <Jobs />,
    service: <ServiceRequests />, // Link to ServiceRequests component
    analysis: <Analysis />,
    comprehensiveAnalytics: <ComprehensiveAnalytics />,
    eventRequests: <EventRequests />,
    categoryManagement: <CategoryManagement />,
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
