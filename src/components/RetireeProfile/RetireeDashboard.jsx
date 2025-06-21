import { FaHeadset, FaCalendarAlt } from "react-icons/fa";
import Dashboard from '../SharedDashboard/SharedDashboard';
import { useTranslation } from 'react-i18next';

import AdminHomepage from "../SharedDashboard/MainPage";
import Cards from "../SharedDashboard/Cards";
import AddEvent from "../SharedDashboard/AddEvents";
import Settings from "../SharedDashboard/SettingsCards";
import Calendar from "../SharedDashboard/Calendar";
import Messages from "../SharedDashboard/Messages";
import Notifications from "../SharedDashboard/Notifications";
import CustomerSupport from "./Support";
import Volunteer from "./Volunteer";

const RetireeDashboard = () => {
  const { t } = useTranslation();

  const customIcons = [
    { id: "volunteer", label: t('dashboard.volunteer'), icon: <FaCalendarAlt /> }, // Add Volunteer icon
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
    main: <AdminHomepage />,
    settings: <Settings />,
    calendar: <Calendar />,
    messages: <Messages />,
    add: <AddEvent />,
    notifications: <Notifications />,
    support: <CustomerSupport />,
    volunteer: <Volunteer />,
  };

  return (
    <Dashboard customIcons={customIcons} customButtons={customButtons} componentsById={componentsById} />
  );
};

export default RetireeDashboard;
