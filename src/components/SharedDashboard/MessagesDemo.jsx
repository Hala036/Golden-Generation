import { useState } from "react";
import { FaArrowLeft } from "react-icons/fa";

export default function MessagingPage() {
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [isRTL, setIsRTL] = useState(false); // You could detect this from user preferences or locale

  return (
    <div className="h-screen flex flex-col md:flex-row" dir={isRTL ? "rtl" : "ltr"}>
      {/* Chat List */}
      <div
        className={`
          ${selectedChatId && window.innerWidth < 768 ? "hidden" : "block"}
          md:block md:w-1/3 border-r border-gray-300
        `}
      >
        <ChatList onSelectChat={setSelectedChatId} isRTL={isRTL} />
      </div>

      {/* Chat Window */}
      <div
        className={`
          ${!selectedChatId && window.innerWidth < 768 ? "hidden" : "flex"}
          flex-1 flex-col
        `}
      >
        {window.innerWidth < 768 && (
          <button
            onClick={() => setSelectedChatId(null)}
            className="md:hidden p-2 bg-gray-200"
          >
            ←
          </button>
        )}
        <ChatWindow chatId={selectedChatId} isRTL={isRTL} />
      </div>
    </div>
  );
}

function ChatList({ onSelectChat, isRTL }) {
  const allChats = ["Alice", "Bob", "Charlie", "David"];
  const [searchTerm, setSearchTerm] = useState("");

  const filteredChats = allChats.filter((chat) =>
    chat.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full">
      {/* Search Bar */}
      <div className="p-3 border-b">
        <input
          type="text"
          placeholder={isRTL ? "חפש משתמש..." : "Search user..."}
          className="w-full p-2 border rounded text-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          dir={isRTL ? "rtl" : "ltr"}
        />
      </div>

      {/* Chat Items */}
      <div className="overflow-y-auto flex-1">
        {filteredChats.length > 0 ? (
          filteredChats.map((name, idx) => (
            <div
              key={idx}
              className="p-4 border-b hover:bg-gray-100 cursor-pointer"
              onClick={() => onSelectChat(name)}
            >
              <p className="font-medium">{name}</p>
              <p className="text-sm text-gray-500">
                {isRTL ? "הודעה אחרונה..." : "Last message..."}
              </p>
            </div>
          ))
        ) : (
          <div className="p-4 text-gray-500 text-sm">
            {isRTL ? "לא נמצאו תוצאות" : "No results found"}
          </div>
        )}
      </div>
    </div>
  );
}

function ChatWindow({ chatId }) {
  if (!chatId) return <div className="flex-1 p-4 text-gray-500">Select a chat</div>;

  const dummyUser = {
    name: chatId,
    profilePic: `https://ui-avatars.com/api/?name=${chatId}&background=random`,
    phoneNumber: "+1234567890",
  };

  const handleCall = () => {
    // For example: trigger VoIP or open tel link
    window.open(`tel:${dummyUser.phoneNumber}`);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header with Profile and Call */}
      <div className="flex items-center justify-between p-4 border-b bg-gray-100">
        <div className="flex items-center gap-3">
          <img
            src={dummyUser.profilePic}
            alt={`${dummyUser.name}'s profile`}
            className="w-10 h-10 rounded-full object-cover"
          />
          <span className="font-bold text-lg">{dummyUser.name}</span>
        </div>
        <button
          onClick={handleCall}
          className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md"
        >
          Call
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        <div className="bg-gray-200 p-2 rounded-md w-max">Hey there!</div>
        <div className="bg-blue-100 p-2 rounded-md w-max ml-auto">Hi! How are you?</div>
      </div>

      {/* Input */}
      <div className="p-4 border-t">
        <input
          type="text"
          placeholder="Type a message"
          className="w-full p-2 border rounded"
        />
      </div>
    </div>
  );
}