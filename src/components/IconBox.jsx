import React from "react";

const titles = {
  upcoming: "Events available Now",
  add: "Add Events",
  settings: "Settings",
  notifications: "Notifications",
  calendar: "Calendar",
  messages: "Messages"
};

const IconBox = ({ selected }) => {
  return (
    
    
     <div className="flex justify-center items-center bg-[#ababab] border shadow-md px-6 py-2 mt-2 rounded-md w-fit mx-auto">
     <h2 className="text-lg font-semibold text-gray-700">{titles[selected]}</h2>
     
   </div>
  );
};

export default IconBox;
