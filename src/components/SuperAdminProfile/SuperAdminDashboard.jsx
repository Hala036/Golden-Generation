import Dashboard from '../SharedDashboard/SharedDashboard';

import AdminHomepage from "../SharedDashboard/MainPage";
import Cards from "../SharedDashboard/Cards";
import AddEvent from "../SharedDashboard/AddEvents";
import Settings from "../SharedDashboard/SettingsCards";
import Calendar from "../SharedDashboard/Calendar";
import Messages from "../SharedDashboard/Messages";
import Notifications from "../SharedDashboard/Notifications";

const RetireeDashboard = () => {
  const customIcons = [];

  const customButtons = [];

  const componentsById = {
    upcoming: <Cards />,
    main: <AdminHomepage />,
    settings: <Settings />,
    calendar: <Calendar />,
    messages: <Messages />,
    add: <AddEvent />,
    notifications: <Notifications />,
  };

  return (
    <Dashboard customIcons={customIcons} customButtons={customButtons} componentsById={componentsById} />
  );
};

export default RetireeDashboard;
