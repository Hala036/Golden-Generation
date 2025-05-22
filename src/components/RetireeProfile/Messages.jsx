import React, { useState, useEffect, useRef } from 'react';
import { db, auth } from '../../firebase';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, getDocs, updateDoc, doc } from 'firebase/firestore';
import { useLanguage } from '../../context/LanguageContext';
import { FaPaperPlane, FaSearch, FaEllipsisV, FaPhone, FaVideo, FaComments } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import profile from '../../assets/profile.jpeg';

const Messages = () => {
  const [conversations, setConversations] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef(null);
  const { t } = useLanguage();

  // Fetch users for chat
  useEffect(() => {
    const fetchUsers = async () => {
      const usersRef = collection(db, 'users');
      const q = query(usersRef);
      const querySnapshot = await getDocs(q);
      const usersList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data().credentials
      }));
      setUsers(usersList);
    };
    fetchUsers();
  }, []);

  // Fetch conversations
  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', auth.currentUser.uid),
      orderBy('lastMessageTime', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const conversationsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setConversations(conversationsList);
    });

    return () => unsubscribe();
  }, []);

  // Fetch messages for selected chat
  useEffect(() => {
    if (!selectedChat) return;

    const q = query(
      collection(db, 'messages'),
      where('conversationId', '==', selectedChat.id),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messagesList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMessages(messagesList);
    });

    return () => unsubscribe();
  }, [selectedChat]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChat) return;

    try {
      const messageData = {
        conversationId: selectedChat.id,
        senderId: auth.currentUser.uid,
        text: newMessage.trim(),
        timestamp: serverTimestamp()
      };

      await addDoc(collection(db, 'messages'), messageData);
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const startNewChat = async (userId) => {
    try {
      const conversationData = {
        participants: [auth.currentUser.uid, userId],
        lastMessageTime: serverTimestamp(),
        lastMessage: ''
      };

      const docRef = await addDoc(collection(db, 'conversations'), conversationData);
      setSelectedChat({ id: docRef.id, ...conversationData });
    } catch (error) {
      console.error('Error starting new chat:', error);
    }
  };

  const filteredUsers = users.filter(user => 
    (user.username || '').toLowerCase().includes(searchQuery.toLowerCase()) &&
    user.id !== auth.currentUser?.uid
  );  

  return (
    <div className="flex h-[calc(100vh-200px)] bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Chat List */}
      <div className="w-full md:w-1/3 lg:w-1/4 border-r bg-gray-50">
        {/* Search Bar */}
        <div className="p-4 bg-white border-b sticky top-0 z-10">
          <div className="relative">
            <input
              type="text"
              placeholder={t('dashboard.messages.search')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border rounded-full focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all"
            />
            <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
        </div>

        {/* Users List */}
        <div className="overflow-y-auto h-[calc(100%-80px)]">
          {searchQuery ? (
            filteredUsers.map(user => (
              <div
                key={user.id}
                onClick={() => startNewChat(user.id)}
                className="flex items-center p-4 hover:bg-gray-100 cursor-pointer transition-colors duration-200 border-b border-gray-100"
              >
                <div className="relative">
                  <img src={profile} alt={user.username} className="w-12 h-12 rounded-full mr-4 object-cover border-2 border-orange-500" />
                  <span className="absolute bottom-0 right-4 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></span>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800">{user.username}</h3>
                  <p className="text-sm text-gray-500 truncate">{user.email}</p>
                </div>
              </div>
            ))
          ) : (
            conversations.map(conv => {
              const otherUser = users.find(u => 
                u.id === conv.participants.find(p => p !== auth.currentUser?.uid)
              );
              return (
                <div
                  key={conv.id}
                  onClick={() => setSelectedChat(conv)}
                  className={`flex items-center p-4 hover:bg-gray-100 cursor-pointer transition-colors duration-200 border-b border-gray-100 ${
                    selectedChat?.id === conv.id ? 'bg-orange-50' : ''
                  }`}
                >
                  <div className="relative">
                    <img src={profile} alt={otherUser?.username} className="w-12 h-12 rounded-full mr-4 object-cover border-2 border-orange-500" />
                    <span className="absolute bottom-0 right-4 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <h3 className="font-semibold text-gray-800 truncate">{otherUser?.username}</h3>
                      <span className="text-xs text-gray-500">
                        {conv.lastMessageTime?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 truncate">{conv.lastMessage}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="hidden md:flex flex-1 flex-col bg-white">
        {selectedChat ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b bg-white sticky top-0 z-10 flex items-center justify-between shadow-sm">
              <div className="flex items-center">
                <div className="relative">
                  <img
                    src={profile}
                    alt="Profile"
                    className="w-10 h-10 rounded-full mr-4 object-cover border-2 border-orange-500"
                  />
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></span>
                </div>
                <div>
                  <h2 className="font-semibold text-gray-800">
                    {users.find(u => u.id === selectedChat.participants.find(p => p !== auth.currentUser?.uid))?.username}
                  </h2>
                  <p className="text-xs text-gray-500">Online</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <button className="p-2 text-gray-600 hover:text-orange-500 transition-colors">
                  <FaPhone />
                </button>
                <button className="p-2 text-gray-600 hover:text-orange-500 transition-colors">
                  <FaVideo />
                </button>
                <button className="p-2 text-gray-600 hover:text-orange-500 transition-colors">
                  <FaEllipsisV />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-500">
                  {t('dashboard.messages.noMessages')}
                </div>
              ) : (
                messages.map(message => (
                  <div
                    key={message.id}
                    className={`flex ${message.senderId === auth.currentUser?.uid ? 'justify-end' : 'justify-start'} mb-4`}
                  >
                    <div
                      className={`max-w-[70%] rounded-2xl p-3 shadow-sm ${
                        message.senderId === auth.currentUser?.uid
                          ? 'bg-orange-500 text-white rounded-tr-none'
                          : 'bg-white text-gray-800 rounded-tl-none'
                      }`}
                    >
                      <p className="text-sm">{message.text}</p>
                      <span className={`text-xs ${message.senderId === auth.currentUser?.uid ? 'text-orange-100' : 'text-gray-500'}`}>
                        {message.timestamp?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <form onSubmit={handleSendMessage} className="p-4 border-t bg-white">
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={t('dashboard.messages.typeMessage')}
                  className="flex-1 p-3 border rounded-full focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all"
                  disabled={isSending}
                />
                <button
                  type="submit"
                  className={`p-3 rounded-full transition-colors ${
                    isSending 
                      ? 'bg-gray-300 cursor-not-allowed' 
                      : 'bg-orange-500 hover:bg-orange-600 text-white'
                  }`}
                  disabled={isSending}
                >
                  <FaPaperPlane className={isSending ? 'animate-pulse' : ''} />
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500 bg-gray-50">
            <div className="text-center">
              <FaComments className="text-6xl text-gray-300 mb-4" />
              <p className="text-lg">{t('dashboard.messages.selectChat')}</p>
            </div>
          </div>
        )}
      </div>

      {/* Mobile View - Show only chat list or chat area */}
      <div className="md:hidden flex-1 flex flex-col bg-white">
        {selectedChat ? (
          <>
            {/* Mobile Chat Header */}
            <div className="p-4 border-b bg-white sticky top-0 z-10 flex items-center justify-between">
              <div className="flex items-center">
                <button 
                  onClick={() => setSelectedChat(null)}
                  className="mr-2 text-gray-600"
                >
                  ←
                </button>
                <div className="relative">
                  <img
                    src={profile}
                    alt="Profile"
                    className="w-10 h-10 rounded-full mr-4 object-cover border-2 border-orange-500"
                  />
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></span>
                </div>
                <div>
                  <h2 className="font-semibold text-gray-800">
                    {users.find(u => u.id === selectedChat.participants.find(p => p !== auth.currentUser?.uid))?.username}
                  </h2>
                  <p className="text-xs text-gray-500">Online</p>
                </div>
              </div>
            </div>

            {/* Mobile Messages */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
              {messages.map(message => (
                <div
                  key={message.id}
                  className={`flex ${message.senderId === auth.currentUser?.uid ? 'justify-end' : 'justify-start'} mb-4`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl p-3 shadow-sm ${
                      message.senderId === auth.currentUser?.uid
                        ? 'bg-orange-500 text-white rounded-tr-none'
                        : 'bg-white text-gray-800 rounded-tl-none'
                    }`}
                  >
                    <p className="text-sm">{message.text}</p>
                    <span className={`text-xs ${message.senderId === auth.currentUser?.uid ? 'text-orange-100' : 'text-gray-500'}`}>
                      {message.timestamp?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Mobile Message Input */}
            <form onSubmit={handleSendMessage} className="p-4 border-t bg-white">
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={t('dashboard.messages.typeMessage')}
                  className="flex-1 p-3 border rounded-full focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all"
                  disabled={isSending}
                />
                <button
                  type="submit"
                  className={`p-3 rounded-full transition-colors ${
                    isSending 
                      ? 'bg-gray-300 cursor-not-allowed' 
                      : 'bg-orange-500 hover:bg-orange-600 text-white'
                  }`}
                  disabled={isSending}
                >
                  <FaPaperPlane className={isSending ? 'animate-pulse' : ''} />
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500 bg-gray-50">
            <div className="text-center">
              <FaComments className="text-6xl text-gray-300 mb-4" />
              <p className="text-lg">{t('dashboard.messages.selectChat')}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Messages; 