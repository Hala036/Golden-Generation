import React, { useState, useEffect } from "react";
import { FaPaperPlane } from "react-icons/fa";
import { toast } from "react-hot-toast";
import { auth, getUserData, getUsersBySettlement, db } from "../../firebase";
import { addDoc, collection, serverTimestamp, query, where, getDocs, updateDoc } from "firebase/firestore";
import { useTranslation } from "react-i18next";

const Support = () => {
  const { t } = useTranslation();
  const [message, setMessage] = useState("");
  const [adminInfo, setAdminInfo] = useState(null);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    const fetchAdminInfo = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          console.error(t("retiree.errors.noUserLoggedIn"));
          toast.error(t("retiree.errors.noUserLoggedIn"));
          return;
        }

        const userData = await getUserData(user.uid);

        if (!userData || !userData.idVerification) {
          console.error(t("retiree.errors.noUserData"));
          toast.error(t("retiree.errors.noUserData"));
          return;
        }

        const settlement = userData.idVerification.settlement;
        if (!settlement) {
          console.error(t("retiree.errors.missingSettlement"));
          toast.error(t("retiree.errors.missingSettlement"));
          return;
        }

        const usersRef = collection(db, "users");
        const q = query(usersRef, where("settlement", "==", settlement), where("role", "==", "admin"));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          console.error(t("retiree.errors.noAdminFound"));
          toast.error(t("retiree.errors.noAdminFound"));
          return;
        }

        // Extract admin document and set the id (uid)
        const adminDoc = querySnapshot.docs.map((doc) => ({
          id: doc.id, // Document ID (UID)
          ...doc.data(), // Document data
        }))[0]; // Assuming there's only one admin per settlement

        console.log("Admin Document:", adminDoc); // Debugging log

        if (!adminDoc || !adminDoc.id) {
          console.error(t("retiree.errors.missingAdminUID"));
          toast.error(t("retiree.errors.missingAdminUID"));
          return;
        }

        // Include the admin's UID in the adminInfo object
        setAdminInfo({
          uid: adminDoc.id, // Use document ID as UID
          username: adminDoc.credentials?.username || t("retiree.admin.defaultUsername"),
          email: adminDoc.credentials?.email || t("retiree.admin.defaultEmail"),
          phone: adminDoc.credentials?.phone || t("retiree.admin.defaultPhone"),
        });
      } catch (error) {
        console.error(t("retiree.errors.fetchAdminError"), error);
        toast.error(t("retiree.errors.fetchAdminError"));
      }
    };

    fetchAdminInfo();
  }, [t]);

  useEffect(() => {
    if (adminInfo) {
      console.log("Admin Info:", adminInfo); // Log after state update
    }
  }, [adminInfo]);

  const handleSendMessage = async () => {
    if (!message.trim()) {
      toast.error(t("retiree.errors.emptyMessage"));
      return;
    }

    if (!adminInfo || !auth.currentUser) {
      toast.error(t("retiree.errors.missingAdminOrUser"));
      return;
    }

    // Debugging logs
    console.log("Current User UID:", auth.currentUser.uid);
    console.log("Admin Info UID:", adminInfo.uid);

    if (!auth.currentUser.uid || !adminInfo.uid) {
      toast.error(t("retiree.errors.missingParticipantUIDs"));
      return;
    }

    setIsSending(true);

    try {
      const conversationsRef = collection(db, "conversations");

      // Query to find a conversation with both participants
      const q = query(
        conversationsRef,
        where("participants", "array-contains", auth.currentUser.uid)
      );
      const querySnapshot = await getDocs(q);

      let conversationDoc = null;

      // Check if any conversation matches both participants
      querySnapshot.forEach((doc) => {
        const participants = doc.data().participants;
        if (participants.includes(adminInfo.uid)) {
          conversationDoc = doc;
        }
      });

      if (!conversationDoc) {
        // Create a new conversation document if none exists
        const conversationData = {
          participants: [auth.currentUser.uid, adminInfo.uid],
          lastMessage: message.trim(),
          lastMessageTime: serverTimestamp(),
          createdAt: serverTimestamp(),
        };

        console.log("Creating conversation:", conversationData); // Debugging log
        conversationDoc = await addDoc(conversationsRef, conversationData);
      } else {
        // Update the lastMessage and lastMessageTime fields in the existing conversation
        await updateDoc(conversationDoc.ref, {
          lastMessage: message.trim(),
          lastMessageTime: serverTimestamp(),
        });
      }

      // Send the message
      const messageData = {
        conversationId: conversationDoc.id,
        senderId: auth.currentUser.uid,
        text: message.trim(),
        timestamp: serverTimestamp(),
      };

      console.log("Sending message:", messageData); // Debugging log
      await addDoc(collection(db, "messages"), messageData);
      toast.success(t("retiree.support.messageSent"));
      setMessage(""); // Clear the input field
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error(t("retiree.support.messageFailed"));
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      {/* Admin Info Section */}
      <div className="mb-6 p-4 bg-gray-100 rounded-lg shadow-sm">
        <h2 className="text-lg font-bold mb-2 text-yellow-500">{t("retiree.admin.infoTitle")}</h2>
        {adminInfo ? (
          <div className="text-gray-600">
            <p><strong>{t("retiree.admin.username")}:</strong> {adminInfo.username}</p>
            <p><strong>{t("retiree.admin.email")}:</strong> {adminInfo.email}</p>
            <p><strong>{t("retiree.admin.phone")}:</strong> {adminInfo.phone}</p>
          </div>
        ) : (
          <p className="text-gray-500">{t("retiree.admin.loadingInfo")}</p>
        )}
      </div>

      {/* Support Message Section */}
      <h2 className="text-xl font-bold mb-4 text-yellow-500">{t("retiree.support.title")}</h2>
      <p className="text-gray-600 mb-4">{t("retiree.support.description")}</p>
      <textarea
        className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
        placeholder={t("retiree.support.placeholder")}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        disabled={isSending}
      ></textarea>
      <button
        onClick={handleSendMessage}
        className={`mt-4 px-6 py-2 rounded-lg flex items-center gap-2 ${
          isSending ? "bg-gray-300 cursor-not-allowed" : "bg-yellow-500 hover:bg-yellow-600 text-white"
        }`}
        disabled={isSending}
      >
        <FaPaperPlane />
        {isSending ? t('retiree.support.sending') : t('retiree.support.sendButton')}
      </button>
    </div>
  );
};

export default Support;