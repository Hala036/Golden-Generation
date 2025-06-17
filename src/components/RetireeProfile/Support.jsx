import React, { useState, useEffect } from "react";
import { FaPaperPlane } from "react-icons/fa";
import { toast } from "react-hot-toast";
import { auth, getUserData, getUsersBySettlement } from "../../firebase";
import { useTranslation } from "react-i18next";

const Support = () => {
  const { t } = useTranslation();
  const [message, setMessage] = useState("");
  const [adminInfo, setAdminInfo] = useState(null);

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

        const usersInSettlement = await getUsersBySettlement(settlement);

        if (!usersInSettlement || usersInSettlement.length === 0) {
          console.error(t("retiree.errors.noUsersInSettlement"));
          toast.error(t("retiree.errors.noUsersInSettlement"));
          return;
        }

        const admin = usersInSettlement.find((user) => user.role === "admin");

        if (!admin) {
          console.error(t("retiree.errors.noAdminFound"));
          toast.error(t("retiree.errors.noAdminFound"));
          return;
        }

        setAdminInfo({
          username: admin.credentials?.username || t("retiree.admin.defaultUsername"),
          firstname: admin.idVerification?.firstName || t("retiree.admin.defaultFirstName"),
          lastname: admin.idVerification?.lastName || t("retiree.admin.defaultLastName"),
          email: admin.credentials?.email || t("retiree.admin.defaultEmail"),
          phone: admin.personalDetails?.phoneNumber || t("retiree.admin.defaultPhone"),
        });
      } catch (error) {
        console.error(t("retiree.errors.fetchAdminError"), error);
        toast.error(t("retiree.errors.fetchAdminError"));
      }
    };

    fetchAdminInfo();
  }, [t]);

  const handleSendMessage = () => {
    if (!message.trim()) {
      toast.error(t("retiree.errors.emptyMessage"));
      return;
    }

    toast.success(t("retiree.success.messageSent"));
    setMessage("");
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      {/* Admin Info Section */}
      <div className="mb-6 p-4 bg-gray-100 rounded-lg shadow-sm">
        <h2 className="text-lg font-bold mb-2 text-yellow-500">{t("retiree.admin.infoTitle")}</h2>
        {adminInfo ? (
          <div className="text-gray-600">
            <p><strong>{t("retiree.admin.username")}:</strong> {adminInfo.username}</p>
            <p><strong>{t("retiree.admin.name")}:</strong> {adminInfo.firstname} {adminInfo.lastname}</p>
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
      ></textarea>
      <button
        onClick={handleSendMessage}
        className="mt-4 px-6 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 flex items-center gap-2"
      >
        <FaPaperPlane />
        {t("retiree.support.sendButton")}
      </button>
    </div>
  );
};

export default Support;