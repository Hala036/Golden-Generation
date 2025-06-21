import React, { useState, useEffect, useRef } from 'react';
import { db, auth } from '../../firebase';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, getDocs, updateDoc, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { useLanguage } from '../../context/LanguageContext';
import { FaPaperPlane, FaSearch, FaEllipsisV, FaPhone, FaVideo, FaComments, FaMicrophone, FaMicrophoneSlash, FaPhoneSlash } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import profile from '../../assets/profile.jpeg';
import { useTheme } from '../../context/ThemeContext';

// Ringtone audio URL
const RINGTONE_URL = '/ringtone.mp3';

// Firestore Call State Management
const CALLS_COLLECTION = 'calls';

// Function to initiate a call (caller)
const initiateCall = async (currentUser, otherUser) => {
  if (!currentUser || !otherUser) return;
  const channelName = [currentUser.uid, otherUser.id].sort().join('_');
  const callDoc = {
    participants: [currentUser.uid, otherUser.id],
    caller: {
      uid: currentUser.uid,
      username: currentUser.displayName || currentUser.email,
      avatarUrl: currentUser.photoURL || '',
    },
    callee: {
      uid: otherUser.id,
      username: otherUser.username,
      avatarUrl: otherUser.avatarUrl || '',
    },
    channelName,
    status: 'calling', // 'calling', 'ringing', 'active', 'ended', 'rejected', 'missed'
    startedAt: serverTimestamp(),
    acceptedAt: null,
    endedAt: null,
  };
  const docRef = await addDoc(collection(db, CALLS_COLLECTION), callDoc);
  return docRef.id;
};

const Messages = () => {
  const [conversations, setConversations] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [isSending, setIsSending] = useState(false);
  const [friendRequests, setFriendRequests] = useState([]);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const messagesEndRef = useRef(null);
  const { t } = useLanguage();
  const { theme } = useTheme();
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [typing, setTyping] = useState(false);

  // Fetch friend requests
  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, 'friendRequests'),
      where('receiverId', '==', auth.currentUser.uid),
      where('status', '==', 'pending')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const requests = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setFriendRequests(requests);
    });

    return () => unsubscribe();
  }, []);

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

  // Check if users are friends
  const areUsersFriends = async (userId1, userId2) => {
    const friendsRef = collection(db, 'friends');
    const q = query(
      friendsRef,
      where('users', 'array-contains', [userId1, userId2].sort().join('_'))
    );
    const snapshot = await getDocs(q);
    return !snapshot.empty;
  };

  // Check if request already exists
  const checkExistingRequest = async (senderId, receiverId) => {
    const requestsRef = collection(db, 'friendRequests');
    const q = query(
      requestsRef,
      where('senderId', 'in', [senderId, receiverId]),
      where('receiverId', 'in', [senderId, receiverId]),
      where('status', '==', 'pending')
    );
    const snapshot = await getDocs(q);
    return !snapshot.empty;
  };

  // Send friend request
  const sendFriendRequest = async (receiverId) => {
    try {
      // Check if request already exists
      const requestExists = await checkExistingRequest(auth.currentUser.uid, receiverId);
      if (requestExists) {
        toast.error('A friend request already exists');
        setShowRequestModal(false);
        return;
      }

      const requestData = {
        senderId: auth.currentUser.uid,
        receiverId,
        status: 'pending',
        timestamp: serverTimestamp()
      };
      await addDoc(collection(db, 'friendRequests'), requestData);
      toast.success('Friend request sent successfully');
      setShowRequestModal(false);
    } catch (error) {
      console.error('Error sending friend request:', error);
      toast.error('Failed to send friend request');
    }
  };

  // Accept friend request
  const acceptFriendRequest = async (requestId, senderId) => {
    try {
      // Update request status
      await updateDoc(doc(db, 'friendRequests', requestId), {
        status: 'accepted'
      });

      // Add to friends collection
      const friendData = {
        users: [auth.currentUser.uid, senderId].sort().join('_'),
        timestamp: serverTimestamp()
      };
      await addDoc(collection(db, 'friends'), friendData);

      // Create new conversation
      const conversationData = {
        participants: [auth.currentUser.uid, senderId],
        lastMessageTime: serverTimestamp(),
        lastMessage: '',
        createdAt: serverTimestamp()
      };
      const docRef = await addDoc(collection(db, 'conversations'), conversationData);

      // Update both users' conversations in real-time
      const conversation = { id: docRef.id, ...conversationData };
      setSelectedChat(conversation);

      toast.success('Friend request accepted');
    } catch (error) {
      console.error('Error accepting friend request:', error);
      toast.error('Failed to accept friend request');
    }
  };

  // Reject friend request
  const rejectFriendRequest = async (requestId) => {
    try {
      await updateDoc(doc(db, 'friendRequests', requestId), {
        status: 'rejected'
      });
      toast.success('Friend request rejected');
    } catch (error) {
      console.error('Error rejecting friend request:', error);
      toast.error('Failed to reject friend request');
    }
  };

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
    setLoadingMessages(true);
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
      setLoadingMessages(false);
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

  // Modified startNewChat function
  const startNewChat = async (userId) => {
    try {
      const isFriend = await areUsersFriends(auth.currentUser.uid, userId);
      const hasPendingRequest = await checkExistingRequest(auth.currentUser.uid, userId);
      
      if (!isFriend) {
        if (hasPendingRequest) {
          toast('A friend request is already pending');
          return;
        }
        setSelectedUser(users.find(u => u.id === userId));
        setShowRequestModal(true);
        return;
      }

      // If they are friends, find or create conversation
      const existing = conversations.find(conv =>
        conv.participants.length === 2 &&
        conv.participants.includes(auth.currentUser.uid) &&
        conv.participants.includes(userId)
      );

      if (existing) {
        setSelectedChat(existing);
        return;
      }

      // Create new conversation if it doesn't exist
      const conversationData = {
        participants: [auth.currentUser.uid, userId],
        lastMessageTime: serverTimestamp(),
        lastMessage: '',
        createdAt: serverTimestamp()
      };
      const docRef = await addDoc(collection(db, 'conversations'), conversationData);
      setSelectedChat({ id: docRef.id, ...conversationData });
    } catch (error) {
      console.error('Error in startNewChat:', error);
      toast.error('Failed to start chat');
    }
  };

  const filteredUsers = users.filter(user => 
    (user.username || '').toLowerCase().includes(searchQuery.toLowerCase()) &&
    user.id !== auth.currentUser?.uid
  );  

  // Find the other user in the selected chat
  const otherUser = selectedChat && users.find(u => u.id === selectedChat.participants.find(p => p !== auth.currentUser?.uid));

  // Handle initiating a call
  const handleInitiateCall = async () => {
    if (!otherUser) return;
    try {
      await initiateCall(auth.currentUser, otherUser);
    } catch (error) {
      console.error('Error initiating call:', error);
      toast.error('Failed to initiate call');
    }
  };

  // --- Friend Request Modal ---
  const FriendRequestModal = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop with blur */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowRequestModal(false)} />
      {/* Modal content */}
      <div className={`relative w-full max-w-md mx-4 transform transition-all duration-300 ease-out ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-2xl overflow-hidden`}>
        {/* Modal header */}
        <div className={`p-6 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}> 
          <div className="flex items-center space-x-4">
            <div className="relative">
              <img 
                src={selectedUser?.avatarUrl || profile} 
                alt={selectedUser?.username} 
                className="w-16 h-16 rounded-full object-cover border-2 border-orange-500"
              />
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white"></div>
            </div>
            <div>
              <h2 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>{selectedUser?.username}</h2>
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{selectedUser?.email}</p>
            </div>
          </div>
        </div>
        {/* Modal body */}
        <div className="p-6">
          <p className={`text-center mb-6 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>You need to be friends with {selectedUser?.username} to start a conversation.</p>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setShowRequestModal(false)}
              className={`px-6 py-2.5 rounded-lg transition-colors ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'}`}
            >
              Cancel
            </button>
            <button
              onClick={() => sendFriendRequest(selectedUser?.id)}
              className="px-6 py-2.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white transition-colors flex items-center gap-2"
            >
              <span>Send Request</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // --- Friend Requests List ---
  const FriendRequestsList = () => (
    <div className={`absolute top-12 right-2 w-80 rounded-xl shadow-2xl transform transition-all duration-300 ease-out ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
      {/* Header */}
      <div className={`p-4 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex items-center justify-between">
          <h3 className={`font-semibold text-lg ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>Friend Requests</h3>
          <span className={`px-2.5 py-1 rounded-full text-sm font-medium ${theme === 'dark' ? 'bg-orange-500/20 text-orange-400' : 'bg-orange-100 text-orange-600'}`}>{friendRequests.length} new</span>
        </div>
      </div>
      {/* Requests list */}
      <div className="max-h-96 overflow-y-auto">
        {friendRequests.map(request => {
          const sender = users.find(u => u.id === request.senderId);
          return (
            <div key={request.id} className={`p-4 border-b last:border-b-0 ${theme === 'dark' ? 'border-gray-700 hover:bg-gray-700/50' : 'border-gray-200 hover:bg-gray-50'} transition-colors`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <img src={sender?.avatarUrl || profile} alt={sender?.username} className="w-12 h-12 rounded-full object-cover border-2 border-orange-500" />
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                  </div>
                  <div>
                    <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>{sender?.username}</p>
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{sender?.email}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => acceptFriendRequest(request.id, request.senderId)} className="px-4 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-white transition-colors flex items-center gap-1.5">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Accept</span>
                  </button>
                  <button onClick={() => rejectFriendRequest(request.id)} className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors flex items-center gap-1.5">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span>Reject</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className={`flex h-[calc(100vh-200px)] rounded-lg shadow-lg overflow-hidden ${theme === 'dark' ? 'bg-gray-900 text-gray-100' : 'bg-white'}`}>
      {/* Friend Requests Badge */}
      {friendRequests.length > 0 && (
        <div className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium shadow-lg animate-bounce">
          {friendRequests.length}
        </div>
      )}

      {/* Friend Request Modal */}
      {showRequestModal && selectedUser && <FriendRequestModal />}

      {/* Friend Requests List */}
      {friendRequests.length > 0 && <FriendRequestsList />}

      {/* Chat List */}
      <div className={`w-full md:w-1/3 lg:w-1/4 border-r ${theme === 'dark' ? 'border-gray-700 bg-gray-800' : 'bg-gray-50'}`}>
        {/* Search Bar */}
        <div className={`p-4 border-b sticky top-0 z-10 ${theme === 'dark' ? 'bg-gray-900 border-gray-700' : 'bg-white'}`}>
          <div className="relative">
            <input
              type="text"
              placeholder={t('dashboard.messages.search')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-10 pr-4 py-3 border rounded-full focus:outline-none focus:ring-2 focus:ring-orange-200 transition-all ${
                theme === 'dark' 
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-[#FFD966]' 
                  : 'border-gray-300 bg-white placeholder-gray-500 focus:border-orange-500'
              }`}
            />
            <FaSearch className={`absolute left-4 top-1/2 transform -translate-y-1/2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-400'}`} />
          </div>
        </div>

        {/* Users List */}
        <div className="overflow-y-auto h-[calc(100%-80px)]">
          {searchQuery ? (
            filteredUsers.map(user => (
              <div
                key={user.id}
                onClick={() => startNewChat(user.id)}
                className={`flex items-center p-4 cursor-pointer transition-colors duration-200 border-b ${
                  theme === 'dark' 
                    ? 'hover:bg-gray-700 border-gray-700' 
                    : 'hover:bg-gray-100 border-gray-100'
                }`}
              >
                <div className="relative">
                  <img src={profile} alt={user.username} className="w-12 h-12 rounded-full mr-4 object-cover border-2 border-orange-500" />
                  <span className="absolute bottom-0 right-4 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></span>
                </div>
                <div className="flex-1">
                  <h3 className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>{user.username}</h3>
                  <p className={`text-sm truncate ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{user.email}</p>
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
                  className={`flex items-center p-4 cursor-pointer transition-colors duration-200 border-b ${
                    theme === 'dark' 
                      ? 'border-gray-700 hover:bg-gray-700' 
                      : 'border-gray-100 hover:bg-gray-100'
                  } ${
                    selectedChat?.id === conv.id 
                      ? (theme === 'dark' ? 'bg-gray-700' : 'bg-orange-50') 
                      : ''
                  }`}
                >
                  <div className="relative">
                    <img src={profile} alt={otherUser?.username} className="w-12 h-12 rounded-full mr-4 object-cover border-2 border-orange-500" />
                    <span className="absolute bottom-0 right-4 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <h3 className={`font-semibold truncate ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>{otherUser?.username}</h3>
                      <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                        {conv.lastMessageTime?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className={`text-sm truncate ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{conv.lastMessage}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className={`hidden md:flex flex-1 flex-col ${theme === 'dark' ? 'bg-gray-900' : 'bg-white'}`}>
        {selectedChat ? (
          <>
            {/* Chat Header */}
            <div className={`p-4 border-b sticky top-0 z-10 flex items-center justify-between shadow-sm ${theme === 'dark' ? 'bg-gray-900 border-gray-700' : 'bg-white'}`}>
              <div className="flex items-center">
                <div className="relative">
                  <img
                    src={otherUser?.avatarUrl || profile}
                    alt="Profile"
                    className="w-10 h-10 rounded-full mr-4 object-cover border-2 border-orange-500"
                  />
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></span>
                </div>
                <div>
                  <h2 className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                    {otherUser?.username}
                  </h2>
                  <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Online</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <button className={`p-2 transition-colors ${theme === 'dark' ? 'text-gray-400 hover:text-[#FFD966]' : 'text-gray-600 hover:text-orange-500'}`} onClick={handleInitiateCall} title="Start Audio Call">
                  <FaPhone />
                </button>
                <button className={`p-2 transition-colors ${theme === 'dark' ? 'text-gray-400 hover:text-[#FFD966]' : 'text-gray-600 hover:text-orange-500'}`}>
                  <FaEllipsisV />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className={`flex-1 overflow-y-auto p-4 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'}`}>
              {loadingMessages ? (
                <div className={`flex items-center justify-center h-full ${theme === 'dark' ? 'text-gray-400' : 'text-gray-400'}`}>Loading messages...</div>
              ) : messages.length === 0 ? (
                <div className={`flex items-center justify-center h-full ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                  {t('dashboard.messages.noMessages')}
                </div>
              ) : (
                messages.map(message => {
                  const isMe = message.senderId === auth.currentUser?.uid;
                  const sender = isMe ? auth.currentUser : otherUser;
                  return (
                    <div
                      key={message.id}
                      className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-4 items-end`}
                    >
                      {!isMe && (
                        <img src={otherUser?.avatarUrl || profile} alt="avatar" className="w-8 h-8 rounded-full mr-2 border border-orange-300" />
                      )}
                      <div
                        className={`max-w-[70%] rounded-2xl p-3 shadow-sm ${
                          isMe
                            ? 'bg-orange-500 text-white rounded-tr-none'
                            : theme === 'dark' 
                              ? 'bg-gray-700 text-gray-200 border-gray-600 rounded-tl-none' 
                              : 'bg-white text-gray-800 border-orange-100 rounded-tl-none'
                        }`}
                      >
                        <p className="text-sm break-words">{message.text}</p>
                        <span className={`block text-xs mt-1 ${isMe ? 'text-orange-100' : (theme === 'dark' ? 'text-gray-400' : 'text-gray-500')}`}>
                          {message.timestamp?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      {isMe && (
                        <img src={profile} alt="avatar" className="w-8 h-8 rounded-full ml-2 border border-orange-300" />
                      )}
                    </div>
                  );
                })
              )}
              {typing && (
                <div className={`flex items-center gap-2 text-xs mt-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-400'}`}>
                  <span className="animate-pulse">{otherUser?.username} is typing...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <form onSubmit={handleSendMessage} className={`p-4 border-t ${theme === 'dark' ? 'bg-gray-900 border-gray-700' : 'bg-white'}`}>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={t('dashboard.messages.typeMessage')}
                  className={`flex-1 p-3 border rounded-full focus:outline-none focus:ring-2 focus:ring-orange-200 transition-all ${
                    theme === 'dark' 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-[#FFD966]' 
                      : 'border-gray-300 bg-white placeholder-gray-500 focus:border-orange-500'
                  }`}
                  disabled={isSending}
                />
                <button
                  type="submit"
                  className={`p-3 rounded-full transition-colors ${isSending ? 'bg-gray-300 cursor-not-allowed' : 'bg-orange-500 hover:bg-orange-600 text-white'}`}
                  disabled={isSending}
                >
                  <FaPaperPlane className={isSending ? 'animate-pulse' : ''} />
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className={`flex-1 flex items-center justify-center ${theme === 'dark' ? 'bg-gray-800 text-gray-400' : 'bg-gray-50 text-gray-500'}`}>
            <div className="text-center">
              <FaComments className={`text-6xl mb-4 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-300'}`} />
              <p className="text-lg">{t('dashboard.messages.selectChat')}</p>
            </div>
          </div>
        )}
      </div>

      {/* Mobile View - Show only chat list or chat area */}
      <div className={`md:hidden flex-1 flex flex-col ${theme === 'dark' ? 'bg-gray-900' : 'bg-white'}`}>
        {selectedChat ? (
          <>
            {/* Mobile Chat Header */}
            <div className={`p-4 border-b sticky top-0 z-10 flex items-center justify-between ${theme === 'dark' ? 'bg-gray-900 border-gray-700' : 'bg-white'}`}>
              <div className="flex items-center">
                <button 
                  onClick={() => setSelectedChat(null)}
                  className={`mr-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}
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
                  <h2 className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                    {otherUser?.username}
                  </h2>
                  <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Online</p>
                </div>
              </div>
            </div>

            {/* Mobile Messages */}
            <div className={`flex-1 overflow-y-auto p-4 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'}`}>
              {messages.map(message => (
                <div
                  key={message.id}
                  className={`flex ${message.senderId === auth.currentUser?.uid ? 'justify-end' : 'justify-start'} mb-4`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl p-3 shadow-sm ${
                      message.senderId === auth.currentUser?.uid
                        ? 'bg-orange-500 text-white rounded-tr-none'
                        : theme === 'dark' 
                          ? 'bg-gray-700 text-gray-200 rounded-tl-none' 
                          : 'bg-white text-gray-800 rounded-tl-none'
                    }`}
                  >
                    <p className="text-sm">{message.text}</p>
                    <span className={`text-xs ${message.senderId === auth.currentUser?.uid ? 'text-orange-100' : (theme === 'dark' ? 'text-gray-400' : 'text-gray-500')}`}>
                      {message.timestamp?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Mobile Message Input */}
            <form onSubmit={handleSendMessage} className={`p-4 border-t ${theme === 'dark' ? 'bg-gray-900 border-gray-700' : 'bg-white'}`}>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={t('dashboard.messages.typeMessage')}
                  className={`flex-1 p-3 border rounded-full focus:outline-none focus:ring-2 focus:ring-orange-200 transition-all ${
                    theme === 'dark' 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-[#FFD966]' 
                      : 'border-gray-300 bg-white placeholder-gray-500 focus:border-orange-500'
                  }`}
                  disabled={isSending}
                />
                <button
                  type="submit"
                  className={`p-3 rounded-full transition-colors ${isSending ? 'bg-gray-300 cursor-not-allowed' : 'bg-orange-500 hover:bg-orange-600 text-white'}`}
                  disabled={isSending}
                >
                  <FaPaperPlane className={isSending ? 'animate-pulse' : ''} />
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className={`flex-1 flex items-center justify-center ${theme === 'dark' ? 'bg-gray-800 text-gray-400' : 'bg-gray-50 text-gray-500'}`}>
            <div className="text-center">
              <FaComments className={`text-6xl mb-4 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-300'}`} />
              <p className="text-lg">{t('dashboard.messages.selectChat')}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Messages;