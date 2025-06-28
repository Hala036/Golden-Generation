import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../firebase";
import { triggerNotification } from "./TriggerNotifications"; // Import the helper function
import { useAuth } from "../../hooks/useAuth"; // if you track current user
import { toast, Toaster } from "react-hot-toast";
import { useLanguage } from "../../context/LanguageContext";

const SendNotification = ({ onClose }) => {
  const [message, setMessage] = useState("");
  const [targetType, setTargetType] = useState("everyone"); // "everyone", "retirees", "admins", "custom"
  const [customUsername, setCustomUsername] = useState(""); // Current username being typed
  const [selectedUsernames, setSelectedUsernames] = useState([]); // Array of selected usernames
  const [uids, setUids] = useState([]); // Array of UIDs corresponding to selected usernames
  const [allUsernames, setAllUsernames] = useState([]); // Store all usernames for autofill
  const { currentUser } = useAuth(); // optional
  const { t } = useLanguage();

  useEffect(() => {
    const fetchUsernames = async () => {
      try {
        const snapshot = await getDocs(collection(db, "usernames"));
        const usernames = snapshot.docs.map((doc) => doc.id); // Get document names (usernames)
        setAllUsernames(usernames);
      } catch (err) {
        console.error("Failed to fetch usernames:", err);
      }
    };

    fetchUsernames();
  }, []);

  const handleAddUsername = async () => {
    if (!customUsername.trim()) return;

    if (selectedUsernames.includes(customUsername)) {
      toast.error(t('dashboard.sendNotification.toast.usernameAdded'));
      return;
    }

    try {
      const q = query(collection(db, "usernames"), where("__name__", "==", customUsername.trim()));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        toast.error(t('dashboard.sendNotification.toast.usernameNotFound'));
        return;
      }

      const uid = snapshot.docs[0].data().uid; // Get UID from the document
      setSelectedUsernames((prev) => [...prev, customUsername.trim()]);
      setUids((prev) => [...prev, uid]); // Add UID to the array
      setCustomUsername(""); // Clear the input field
    } catch (err) {
      console.error("Failed to add username:", err);
      toast.error(t('dashboard.sendNotification.toast.addUsernameFailed'));
    }
  };

  const handleRemoveUsername = (username) => {
    setSelectedUsernames((prev) => prev.filter((name) => name !== username));
    setUids((prev) => prev.filter((uid, index) => selectedUsernames[index] !== username));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    let target;
    if (targetType === "custom") {
      target = uids; // Use the array of UIDs for custom target
    } else if (targetType === "everyone") {
      target = ["admin", "retiree", "superadmin"]; // Array of roles for "Everyone"
    } else {
      target = [targetType]; // Single role (e.g., "retiree" or "admin")
    }

    try {
      await triggerNotification({
        message,
        target,
        createdBy: currentUser?.uid || "system",
        type: "info",
      });
      toast.success(t('dashboard.sendNotification.toast.sent'));
      setMessage("");
      setSelectedUsernames([]);
      setUids([]);
      if (onClose) onClose(); // Close the modal
    } catch (err) {
      toast.error(t('dashboard.sendNotification.toast.failed'));
      console.error("Error in handleSubmit:", err);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto">
      <Toaster position="top-right" />

      <textarea
        className="w-full border p-2 rounded"
        rows="3"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder={t('dashboard.sendNotification.messagePlaceholder')}
        required
      />

      <select
        className="w-full border p-2 rounded"
        value={targetType}
        onChange={(e) => setTargetType(e.target.value)}
      >
        <option value="everyone">{t('dashboard.sendNotification.target.everyone')}</option>
        <option value="retiree">{t('dashboard.sendNotification.target.retiree')}</option>
        <option value="admin">{t('dashboard.sendNotification.target.admin')}</option>
        <option value="custom">{t('dashboard.sendNotification.target.custom')}</option>
      </select>

      {targetType === "custom" && (
        <div>
          <input
            type="text"
            className="w-full border p-2 rounded"
            placeholder={t('dashboard.sendNotification.customUsernamePlaceholder')}
            value={customUsername}
            onChange={(e) => setCustomUsername(e.target.value)}
            list="usernames-list" // Enable autofill
          />
          <button
            type="button"
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded mt-2"
            onClick={handleAddUsername}
          >
            {t('dashboard.sendNotification.addUsername')}
          </button>

          {/* Autofill options */}
          <datalist id="usernames-list">
            {allUsernames.map((username) => (
              <option key={username} value={username} />
            ))}
          </datalist>

          <div className="flex flex-wrap gap-2 mt-4">
            {selectedUsernames.map((username) => (
              <div
                key={username}
                className="flex items-center bg-gray-200 px-3 py-1 rounded-full"
              >
                <span className="mr-2">{username}</span>
                <button
                  type="button"
                  className="text-red-500 hover:text-red-700"
                  onClick={() => handleRemoveUsername(username)}
                >
                  {t('dashboard.sendNotification.removeUsername')}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <button
        type="submit"
        className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded"
      >
        {t('dashboard.sendNotification.send')}
      </button>
    </form>
  );
};

export default SendNotification;
