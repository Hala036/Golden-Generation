import { useState } from "react";
import { FaHeadset, FaCalendarAlt, FaCog, FaHandsHelping, FaCalendarCheck } from "react-icons/fa";
import Dashboard from '../SharedDashboard/SharedDashboard';
import { useTranslation } from 'react-i18next';

import Cards from "../SharedDashboard/Cards";
import Volunteer from "./Volunteer";
import Services from "./Services";
import AddEvent from "../SharedDashboard/AddEvents";
import Settings from "../SharedDashboard/SettingsCards";
import RetireeCalendar from "../Calendar/RetireeCalendar";
import Messages from "../SharedDashboard/Messages";
import Notifications from "../SharedDashboard/Notifications";
import CustomerSupport from "./Support";

const RetireeDashboard = () => {
  const { t } = useTranslation();
  const [selected, setSelected] = useState("upcoming"); // Manage selected state here

  const customIcons = [
    { id: "upcoming", label: t('dashboard.events.upcomingEvents'), icon: <FaCalendarCheck /> },
    { id: "volunteer", label: t('dashboard.volunteer'), icon: <FaCalendarAlt /> },
    { id: "service", label: t('dashboard.service'), icon: <FaHandsHelping /> },
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
    service: <Services />, // Assuming service requests are handled in Messages
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
