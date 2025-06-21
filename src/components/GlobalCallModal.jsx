import React from 'react';
import { FaPhone, FaPhoneSlash, FaMicrophone, FaMicrophoneSlash } from 'react-icons/fa';
import { useCall } from '../context/callContext';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../hooks/useAuth';
import profile from '../assets/profile.jpeg';

const GlobalCallModal = () => {
  const { 
    callState, 
    inCall, 
    isMuted, 
    callError, 
    callDuration, 
    formatDuration, 
    isSpeaker,
    acceptCall, 
    rejectCall, 
    endCall, 
    toggleMute, 
    handleToggleSpeaker 
  } = useCall();
  const { theme } = useTheme();
  const { currentUser } = useAuth();

  // Don't render if no call state
  if (!callState) return null;

  const isCaller = callState.caller?.uid === currentUser?.uid;
  const peer = isCaller ? callState.callee : callState.caller;

  // Outgoing call (caller)
  if (callState.status === 'calling' && isCaller) {
    return (
      <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black bg-opacity-80">
        <img 
          src={peer?.avatarUrl || profile} 
          alt={peer?.username} 
          className="w-32 h-32 rounded-full mb-6 object-cover border-4 border-orange-500" 
        />
        <div className="text-2xl font-bold mb-2 text-white">{peer?.username}</div>
        <div className="text-lg text-gray-300 mb-8">Calling...</div>
        <div className="flex gap-8">
          <button 
            onClick={endCall} 
            className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center text-white text-3xl shadow-lg hover:bg-red-700 transition-colors"
          >
            <FaPhoneSlash />
          </button>
        </div>
      </div>
    );
  }

  // Incoming call (callee)
  if (callState.status === 'calling' && !isCaller) {
    return (
      <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black bg-opacity-80">
        <img 
          src={peer?.avatarUrl || profile} 
          alt={peer?.username} 
          className="w-32 h-32 rounded-full mb-6 object-cover border-4 border-orange-500" 
        />
        <div className="text-2xl font-bold mb-2 text-white">{peer?.username}</div>
        <div className="text-lg text-gray-300 mb-8">is calling you...</div>
        <div className="flex gap-8">
          <button 
            onClick={acceptCall} 
            className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center text-white text-3xl shadow-lg hover:bg-green-600 transition-colors"
          >
            <FaPhone />
          </button>
          <button 
            onClick={rejectCall} 
            className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center text-white text-3xl shadow-lg hover:bg-red-700 transition-colors"
          >
            <FaPhoneSlash />
          </button>
        </div>
      </div>
    );
  }

  // Active call (both sides)
  if (callState.status === 'active') {
    return (
      <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black bg-opacity-80">
        <img 
          src={peer?.avatarUrl || profile} 
          alt={peer?.username} 
          className="w-32 h-32 rounded-full mb-6 object-cover border-4 border-orange-500" 
        />
        <div className="text-2xl font-bold mb-2 text-white">{peer?.username}</div>
        <div className="text-lg text-gray-300 mb-2">{formatDuration(callDuration)}</div>
        <div className="flex gap-8 mt-6">
          <button 
            onClick={toggleMute} 
            className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl shadow-lg transition-colors ${
              isMuted 
                ? 'bg-gray-400 text-white hover:bg-gray-500' 
                : 'bg-orange-500 text-white hover:bg-orange-600'
            }`}
          >
            {isMuted ? <FaMicrophoneSlash /> : <FaMicrophone />}
          </button>
          <button 
            onClick={handleToggleSpeaker} 
            className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl shadow-lg transition-colors ${
              isSpeaker 
                ? 'bg-orange-400 text-white hover:bg-orange-500' 
                : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
            }`}
          >
            🔊
          </button>
          <button 
            onClick={endCall} 
            className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center text-white text-3xl shadow-lg hover:bg-red-700 transition-colors"
          >
            <FaPhoneSlash />
          </button>
        </div>
        {callError && (
          <div className="text-red-400 mt-4 text-center max-w-md px-4">
            {callError}
          </div>
        )}
      </div>
    );
  }

  // No modal for other states
  return null;
};

export default GlobalCallModal; 