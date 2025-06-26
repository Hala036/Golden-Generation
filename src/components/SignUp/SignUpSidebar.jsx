import React from "react";

const SignUpSidebar = ({ sections, selectedSection, onSectionChange }) => (
  <div className="w-72 border-l bg-gray-50 p-6 flex flex-col gap-4 fixed right-0 top-0 h-full shadow-lg">
    <h3 className="text-lg font-semibold mb-4">Sign-Up Sections</h3>
    {sections.map((section) => (
      <button
        key={section.key}
        className={`text-left px-4 py-2 rounded transition font-medium ${
          selectedSection === section.key
            ? "bg-yellow-500 text-white" : "hover:bg-yellow-100 text-gray-800"
        }`}
        onClick={() => onSectionChange(section.key)}
      >
        {section.label}
      </button>
    ))}
  </div>
);

export default SignUpSidebar; 