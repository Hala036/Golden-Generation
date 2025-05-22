import { FaUserLock, FaFileInvoice, FaGlobe, FaUser, FaMoneyCheck, FaBell } from "react-icons/fa";

const settingsOptions = [
  { label: "Login & Security", description: "Update your password and secure your account", icon: <FaUserLock /> },
  { label: "Taxes", description: "Manage taxpayer information and tax documents", icon: <FaFileInvoice /> },
  { label: "Global Preferences", description: "Set your default language, currency, and timezone", icon: <FaGlobe /> },
  { label: "Personal Info", description: "Provide personal details and how we can reach you", icon: <FaUser /> },
  { label: "Payments & Payouts", description: "Review payments, payouts, coupons, and gift cards", icon: <FaMoneyCheck /> },
  { label: "Notifications", description: "Choose notification preferences and how you want to be contacted", icon: <FaBell /> }
];

const SettingsCards = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
      {settingsOptions.map((option, index) => (
        <div 
          key={index} 
          className="flex items-center border rounded-lg p-4 shadow-md bg-white max-w-[450px] "
        >
          <div className="text-2xl mr-4 text-gray-700">{option.icon}</div>
          <div>
            <h3 className="font-semibold text-lg">{option.label}</h3>
            <p className="text-sm text-gray-500">{option.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default SettingsCards;