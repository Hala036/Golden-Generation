import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where, getDoc, doc, serverTimestamp, addDoc } from "firebase/firestore";
import { db } from "../../firebase";
import useAuth from "../../hooks/useAuth"; // if you track current user
import { toast, Toaster } from "react-hot-toast";
import { FaPaperPlane, FaUsers, FaBell, FaTimes } from 'react-icons/fa';
import { useLanguage } from "../../context/LanguageContext";

const SendNotification = ({ onClose }) => {
  const { user } = useAuth(); // optional
  const { t } = useLanguage();
  const [recipients, setRecipients] = useState([]);
  const [selectedRecipients, setSelectedRecipients] = useState([]);
  const [message, setMessage] = useState("");
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [recipientsLoading, setRecipientsLoading] = useState(true);

  // Fetch recipients based on user role
  useEffect(() => {
    const fetchRecipients = async () => {
      setRecipientsLoading(true);
      try {
        let recipientsQuery;
        
        if (user?.role === 'superadmin') {
          // Super admin can send to all users
          recipientsQuery = query(collection(db, "users"));
        } else if (user?.role === 'admin') {
          // Admin can send to users in their settlement
          const userDoc = await getDoc(doc(db, "users", user.uid));
          const userSettlement = userDoc.data()?.idVerification?.settlement;
          recipientsQuery = query(
            collection(db, "users"),
            where("idVerification.settlement", "==", userSettlement)
          );
        } else {
          // Regular users can only send to admins in their settlement
          const userDoc = await getDoc(doc(db, "users", user.uid));
          const userSettlement = userDoc.data()?.idVerification?.settlement;
          recipientsQuery = query(
            collection(db, "users"),
            where("idVerification.settlement", "==", userSettlement),
            where("role", "in", ["admin", "superadmin"])
          );
        }

        const snapshot = await getDocs(recipientsQuery);
        const users = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setRecipients(users);
      } catch (error) {
        console.error("Error fetching recipients:", error);
        toast.error("Failed to load recipients");
      } finally {
        setRecipientsLoading(false);
      }
    };

    if (user) {
      fetchRecipients();
    }
  }, [user]);

  const handleSendNotification = async (e) => {
    e.preventDefault();
    
    if (!title.trim() || !message.trim() || selectedRecipients.length === 0) {
      toast.error("Please fill in all fields and select at least one recipient");
      return;
    }

    setLoading(true);
    try {
      // Create notifications directly in Firestore
      const notificationPromises = selectedRecipients.map(recipient => {
        const notification = {
          title: title.trim(),
          message: message.trim(),
          recipientId: recipient.id,
          createdBy: user?.uid || "system",
          createdAt: serverTimestamp(),
          type: "custom",
          read: false,
          category: "system",
          priority: "normal",
          icon: "📢"
        };

        return addDoc(collection(db, "notifications"), notification);
      });

      await Promise.all(notificationPromises);
      toast.success("Notification sent successfully!");
      
      // Reset form
      setTitle("");
      setMessage("");
      setSelectedRecipients([]);
      onClose();
    } catch (error) {
      console.error("Error sending notification:", error);
      toast.error("Failed to send notification");
    } finally {
      setLoading(false);
    }
  };

  const handleRecipientSelect = (recipient) => {
    if (selectedRecipients.find(r => r.id === recipient.id)) {
      setSelectedRecipients(selectedRecipients.filter(r => r.id !== recipient.id));
    } else {
      setSelectedRecipients([...selectedRecipients, recipient]);
    }
  };

  const removeRecipient = (recipientId) => {
    setSelectedRecipients(selectedRecipients.filter(r => r.id !== recipientId));
  };

  if (recipientsLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-md mx-auto">
      <Toaster position="top-right" />
      
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold flex items-center">
          <FaBell className="mr-2" />
          Send Notification
        </h3>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700"
        >
          <FaTimes />
        </button>
      </div>

      <form onSubmit={handleSendNotification} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Title</label>
          <input
            type="text"
            className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter notification title"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Message</label>
          <textarea
            className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500"
            rows="3"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Enter notification message"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Recipients</label>
          <div className="max-h-40 overflow-y-auto border rounded p-2">
            {recipients.map((recipient) => (
              <div
                key={recipient.id}
                className={`flex items-center p-2 rounded cursor-pointer hover:bg-gray-100 ${
                  selectedRecipients.find(r => r.id === recipient.id) ? 'bg-blue-100' : ''
                }`}
                onClick={() => handleRecipientSelect(recipient)}
              >
                <input
                  type="checkbox"
                  checked={selectedRecipients.find(r => r.id === recipient.id) ? true : false}
                  onChange={() => {}}
                  className="mr-2"
                />
                <span className="flex-1">{recipient.displayName || recipient.email || recipient.id}</span>
              </div>
            ))}
          </div>
        </div>

        {selectedRecipients.length > 0 && (
          <div>
            <label className="block text-sm font-medium mb-2">Selected Recipients</label>
            <div className="flex flex-wrap gap-2">
              {selectedRecipients.map((recipient) => (
                <div
                  key={recipient.id}
                  className="flex items-center bg-blue-100 px-3 py-1 rounded-full"
                >
                  <span className="mr-2 text-sm">{recipient.displayName || recipient.email || recipient.id}</span>
                  <button
                    type="button"
                    className="text-red-500 hover:text-red-700"
                    onClick={() => removeRecipient(recipient.id)}
                  >
                    <FaTimes size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-4 py-2 rounded flex items-center justify-center"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <>
                <FaPaperPlane className="mr-2" />
                Send
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SendNotification;
