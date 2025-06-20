import { useState } from "react";
import { triggerNotification } from "./TriggerNotifications"; // Import the helper function
import { db } from "../../firebase";
import { useAuth } from "../../hooks/useAuth"; // if you track current user
import { toast } from "react-toastify";
import { collection, query, where, getDocs } from "firebase/firestore";

const SendNotification = () => {
  const [message, setMessage] = useState("");
  const [targetType, setTargetType] = useState("everyone"); // "everyone", "retirees", "admins", "custom"
  const [customUsernames, setCustomUsernames] = useState("");
  const { currentUser } = useAuth(); // optional

  const handleSubmit = async (e) => {
    e.preventDefault();

    let target;
    if (targetType === "custom") {
      const usernames = customUsernames.split(",").map((username) => username.trim());
      target = await fetchUIDsByUsernames(usernames); // Fetch UIDs based on usernames
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
      });
      toast.success("Notification sent successfully");
      setMessage("");
      setCustomUsernames("");
    } catch (err) {
      toast.error("Failed to send notification");
      console.error(err);
    }
  };

  const fetchUIDsByUsernames = async (usernames) => {
    try {
      const q = query(collection(db, "users"), where("username", "in", usernames));
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => doc.id); // Extract UIDs from the documents
    } catch (err) {
      console.error("Failed to fetch UIDs by usernames", err);
      return [];
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto">

      <textarea
        className="w-full border p-2 rounded"
        rows="3"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Notification message"
        required
      />

      <select
        className="w-full border p-2 rounded"
        value={targetType}
        onChange={(e) => setTargetType(e.target.value)}
      >
        <option value="admin retiree superadmin">Everyone</option>
        <option value="retiree">Retirees</option>
        <option value="admin">Admins</option>
        <option value="custom">Specific Users (Usernames)</option>
      </select>

      {targetType === "custom" && (
        <input
          type="text"
          className="w-full border p-2 rounded"
          placeholder="Comma-separated usernames"
          value={customUsernames}
          onChange={(e) => setCustomUsernames(e.target.value)}
        />
      )}

      <button
        type="submit"
        className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Send
      </button>
    </form>
  );
};

export default SendNotification;
