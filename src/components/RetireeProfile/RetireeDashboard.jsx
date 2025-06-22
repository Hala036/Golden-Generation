import { useState } from "react";
import { FaHeadset, FaCalendarAlt, FaCog, FaPlusCircle, FaComments, FaCalendarCheck, FaHome } from "react-icons/fa";
import Dashboard from '../SharedDashboard/SharedDashboard';
import { useTranslation } from 'react-i18next';

import AdminHomepage from "../SharedDashboard/MainPage";
import Cards from "../SharedDashboard/Cards";
import AddEvent from "../SharedDashboard/AddEvents";
import Settings from "../SharedDashboard/SettingsCards";
import RetireeCalendar from "../Calendar/RetireeCalendar";
import Messages from "../SharedDashboard/Messages";
import Notifications from "../SharedDashboard/Notifications";
import CustomerSupport from "./Support";
import Volunteer from "./Volunteer";

const RetireeDashboard = () => {
  const { t } = useTranslation();
  const [selected, setSelected] = useState("upcoming"); // Manage selected state here

  const customIcons = [
    { id: "upcoming", label: t('dashboard.events.upcomingEvents'), icon: <FaCalendarCheck /> },
    { id: "volunteer", label: t('dashboard.volunteer'), icon: <FaCalendarAlt /> }, // Add Volunteer icon
    // { id: "consultation", label: t('dashboard.consultation'), icon: <FaBriefcase /> },
    { id: "settings", label: t('dashboard.settings'), icon: <FaCog /> },
  ];

  const customButtons = [
    {
      id: "support",
      label: t("retiree.support.title"),
      icon: <FaHeadset />,
    },
  ];

  const componentsById = {
    upcoming: <Cards />,
    settings: <Settings />,
    calendar: <RetireeCalendar />,
    messages: <Messages />,
    add: <AddEvent />,
    notifications: <Notifications />,
    support: <CustomerSupport />,
    volunteer: <Volunteer />,
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

export default RetireeDashboard;
