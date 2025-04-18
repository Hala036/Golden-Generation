// import React, { useState } from "react";
// import { FaCalendarAlt, FaBell, FaCog, FaPlusCircle, FaComments, FaCalendarCheck } from "react-icons/fa";

// const Sidebar = () => {
//   const [isOpen, setIsOpen] = useState(false);

//   return (
//     <div className={`fixed top-16 left-0 h-full bg-white shadow-lg p-4 transition-all duration-300 ${isOpen ? "w-48" : "w-16"}`}>
//       {/* Toggle Button */}
//       <button
//         className="absolute top-4 right-[-12px] bg-gray-800 text-white rounded-full p-1"
//         onClick={() => setIsOpen(!isOpen)}
//       >
//         ☰
//       </button>

//       {/* Sidebar Items */}
//       <nav className="flex flex-col space-y-6 mt-6">
//         <SidebarItem icon={<FaCalendarCheck />} text="Upcoming Events" isOpen={isOpen} />
//         <SidebarItem icon={<FaPlusCircle />} text="Add Events" isOpen={isOpen} />
//         <SidebarItem icon={<FaCog />} text="Settings" isOpen={isOpen} />
//         <SidebarItem icon={<FaBell />} text="Notifications" isOpen={isOpen} />
//         <SidebarItem icon={<FaCalendarAlt />} text="Calendar" isOpen={isOpen} />
//         <SidebarItem icon={<FaComments />} text="Messages" isOpen={isOpen} />
//       </nav>
//     </div>
//   );
// };

// // Sidebar Item Component
// const SidebarItem = ({ icon, text, isOpen }) => (
//   <div className="flex items-center space-x-2 p-2 hover:bg-gray-200 rounded-md cursor-pointer">
//     <span className="text-xl">{icon}</span>
//     {isOpen && <span className="text-sm font-medium">{text}</span>}
//   </div>
// );

// export default Sidebar;
