import React, { useState } from "react";

const SendMessage = ({ retireeData }) => {
  const [message, setMessage] = useState("");

  const handleSendMessage = () => {
    // Logic to send the message (e.g., API call)
    console.log(`Message sent to ${retireeData.name}: ${message}`);
    setMessage(""); // Clear the input field
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Send Message</h2>
      <textarea
        className="w-full p-2 border rounded mb-4"
        rows="5"
        placeholder={`Write a message to ${retireeData.idVerification.firstName}`}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />
      <button
        className="bg-blue-500 text-white px-4 py-2 rounded"
        onClick={handleSendMessage}
      >
        Send
      </button>
    </div>
  );
};

export default SendMessage;