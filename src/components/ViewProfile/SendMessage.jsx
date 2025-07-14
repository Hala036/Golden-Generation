import React, { useState } from "react";
import { useTranslation } from "react-i18next";

const SendMessage = ({ retireeData }) => {
  const [message, setMessage] = useState("");
  const { t } = useTranslation();

  const handleSendMessage = () => {
    // Logic to send the message (e.g., API call)
    console.log(`${t('viewProfile.sendMessage.successMessage')} ${retireeData.name}: ${message}`);
    setMessage(""); // Clear the input field
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">{t('viewProfile.sendMessage.title')}</h2>
      <textarea
        className="w-full p-2 border rounded mb-4"
        rows="5"
        placeholder={t('viewProfile.sendMessage.placeholder', { name: retireeData.idVerification.firstName })}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />
      <button
        className="bg-blue-500 text-white px-4 py-2 rounded"
        onClick={handleSendMessage}
      >
        {t('viewProfile.sendMessage.button')}
      </button>
    </div>
  );
};

export default SendMessage;