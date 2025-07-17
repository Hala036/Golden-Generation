import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { db, auth } from '../firebase';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, getDocs, updateDoc, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import AgoraRTC from 'agora-rtc-sdk-ng';
import profile from '../assets/profile.jpeg';
import useAuth from '../hooks/useAuth';

// Ringtone audio URL
const RINGTONE_URL = '/ringtone.mp3';

// Agora audio call hook
function useAgoraAudioCall() {
  const [inCall, setInCall] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [callError, setCallError] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);
  const clientRef = useRef(null);
  const localAudioTrackRef = useRef(null);

  const startCall = async ({ channelName, uid }) => {
    setCallError(null);
    clientRef.current = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
    try {
      // Get token from backend
      const res = await fetch('/api/agora/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channelName, uid }),
      });
      const data = await res.json();

      if (!data.token || !data.appId) {
        throw new Error(data.error || 'Failed to get Agora token from backend');
      }

      await clientRef.current.join(data.appId, channelName, data.token, uid);
      localAudioTrackRef.current = await AgoraRTC.createMicrophoneAudioTrack();
      await clientRef.current.publish([localAudioTrackRef.current]);

      // Listen for user joining (incoming call)
      clientRef.current.on('user-joined', (user) => {
        setIncomingCall({
          uid: user.uid,
          channelName,
        });
      });

      clientRef.current.on('user-published', async (user, mediaType) => {
        await clientRef.current.subscribe(user, mediaType);
        if (mediaType === 'audio') {
          user.audioTrack.play();
        }
      });

      setInCall(true);
    } catch (err) {
      console.error('Error starting call:', err);
      setCallError(err.message || 'Failed to start call');
      setInCall(false);
    }
  };

  const acceptCall = async () => {
    if (!incomingCall) return;
    try {
      const { channelName, uid } = incomingCall;
      await startCall({ channelName, uid });
      setIncomingCall(null);
    } catch (err) {
      console.error('Error accepting call:', err);
      setCallError(err.message || 'Failed to accept call');
    }
  };

  const rejectCall = async () => {
    if (!incomingCall) return;
    try {
      if (clientRef.current) {
        await clientRef.current.leave();
      }
      setIncomingCall(null);
    } catch (err) {
      console.error('Error rejecting call:', err);
    }
  };

  const leaveCall = async () => {
    try {
      if (localAudioTrackRef.current) {
        localAudioTrackRef.current.close();
      }
      if (clientRef.current) {
        await clientRef.current.leave();
      }
    } catch {}
    setInCall(false);
    setIsMuted(false);
    setIncomingCall(null);
  };

  const toggleMute = async () => {
    if (localAudioTrackRef.current) {
      if (isMuted) {
        await localAudioTrackRef.current.setEnabled(true);
        setIsMuted(false);
      } else {
        await localAudioTrackRef.current.setEnabled(false);
        setIsMuted(true);
      }
    }
  };

  return { inCall, startCall, leaveCall, isMuted, toggleMute, callError, incomingCall, acceptCall, rejectCall };
}

// Firestore Call State Management
const CALLS_COLLECTION = 'calls';

function useCallSignaling({ currentUser }) {
  const [callState, setCallState] = useState(null);
  const [callDocId, setCallDocId] = useState(null);

  // Listen for incoming/outgoing call state
  useEffect(() => {
    if (!currentUser) return;
    const q = query(
      collection(db, CALLS_COLLECTION),
      where('participants', 'array-contains', currentUser.uid),
      where('status', 'in', ['calling', 'ringing', 'active'])
    );
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      // DEBUG LOG
      console.log('[CallContext] useCallSignaling listener fired:', { currentUser, docs: snapshot.docs.map(doc => doc.data()) });
      if (!snapshot.empty) {
        const callDoc = snapshot.docs[0];
        const data = callDoc.data();
        // Only show modal for recent calls (e.g., within 30 seconds)
        if (data.status === 'calling' && data.callee?.uid === currentUser.uid && data.startedAt) {
          const now = Date.now();
          const startedAt = data.startedAt.seconds * 1000;
          const age = now - startedAt;
          if (age > 30 * 1000) { // 30 seconds
            // Mark as missed
            await updateDoc(doc(db, CALLS_COLLECTION, callDoc.id), {
              status: 'missed',
              endedAt: serverTimestamp(),
            });
            setCallState(null);
            setCallDocId(null);
            return;
          }
        }
        setCallState({ id: callDoc.id, ...data });
        setCallDocId(callDoc.id);
      } else {
        setCallState(null);
        setCallDocId(null);
      }
    });
    return () => unsubscribe();
  }, [currentUser]);

  // Accept call (callee)
  const acceptCall = async () => {
    if (!callDocId) return;
    await updateDoc(doc(db, CALLS_COLLECTION, callDocId), {
      status: 'active',
      acceptedAt: serverTimestamp(),
    });
  };

  // Reject call (callee)
  const rejectCall = async () => {
    if (!callDocId) return;
    await updateDoc(doc(db, CALLS_COLLECTION, callDocId), {
      status: 'rejected',
      endedAt: serverTimestamp(),
    });
  };

  // End call (either side)
  const endCall = async () => {
    if (!callDocId) return;
    await updateDoc(doc(db, CALLS_COLLECTION, callDocId), {
      status: 'ended',
      endedAt: serverTimestamp(),
    });
  };

  // Cleanup call doc if ended
  useEffect(() => {
    if (callState && ['ended', 'rejected', 'missed'].includes(callState.status) && callDocId) {
      setTimeout(() => {
        deleteDoc(doc(db, CALLS_COLLECTION, callDocId));
      }, 10000);
    }
  }, [callState, callDocId]);

  return { callState, acceptCall, rejectCall, endCall };
}

const CallContext = createContext();

export const useCall = () => {
  const context = useContext(CallContext);
  if (!context) {
    throw new Error('useCall must be used within a CallProvider');
  }
  return context;
};

export const CallProvider = ({ children }) => {
  const [callDuration, setCallDuration] = useState(0);
  const [isSpeaker, setIsSpeaker] = useState(false);
  const callTimerRef = useRef(null);
  const ringtoneRef = useRef(null);
  // const { currentUser } = useAuth();
  const currentUser = auth.currentUser; // Use Firebase's currentUser directly

  // Agora call functionality
  const {
    inCall: agoraInCall,
    startCall: agoraStartCall,
    leaveCall: agoraLeaveCall,
    isMuted: agoraIsMuted,
    toggleMute: agoraToggleMute,
    callError: agoraCallError
  } = useAgoraAudioCall();

  // Call signaling
  const {
    callState,
    acceptCall: acceptSignalingCall,
    rejectCall: rejectSignalingCall,
    endCall: endSignalingCall
  } = useCallSignaling({ currentUser });

  // --- ADDED: initiateCall function to create Firestore call doc ---
  const initiateCall = async (calleeUser) => {
    if (!currentUser || !calleeUser) {
      // DEBUG LOG
      console.error('[CallContext] initiateCall: missing user', { currentUser, calleeUser });
      if (!currentUser) toast.error('No current user in call context!');
      if (!calleeUser) toast.error('No callee user provided!');
      return;
    }
    const channelName = [currentUser.uid, calleeUser.id].sort().join('_');
    const callDoc = {
      participants: [currentUser.uid, calleeUser.id],
      caller: {
        uid: currentUser.uid,
        username: currentUser.displayName || currentUser.email,
        avatarUrl: currentUser.photoURL || '',
      },
      callee: {
        uid: calleeUser.id,
        username: calleeUser.username,
        avatarUrl: calleeUser.avatarUrl || '',
      },
      channelName,
      status: 'calling',
      startedAt: serverTimestamp(),
      acceptedAt: null,
      endedAt: null,
    };
    // DEBUG LOG
    console.log('[CallContext] initiateCall: creating call doc', { currentUser, calleeUser, callDoc });
    await addDoc(collection(db, 'calls'), callDoc);
  };
  // --- END ADDED ---

  // Start/stop call timer
  useEffect(() => {
    if (callState && callState.status === 'active') {
      setCallDuration(0);
      callTimerRef.current = setInterval(() => {
        setCallDuration((d) => d + 1);
      }, 1000);
    } else {
      clearInterval(callTimerRef.current);
      setCallDuration(0);
    }
    return () => clearInterval(callTimerRef.current);
  }, [callState && callState.status === 'active']);

  // Join/leave Agora channel based on call state
  useEffect(() => {
    if (callState && callState.status === 'active') {
      if (!agoraInCall) {
        agoraStartCall({ channelName: callState.channelName, uid: Number(currentUser?.uid) });
      }
    } else if (agoraInCall && (!callState || ['ended', 'rejected', 'missed'].includes(callState.status))) {
      agoraLeaveCall();
    }
  }, [callState?.status, agoraInCall, currentUser?.uid]);

  // Play/stop ringtone for incoming calls
  useEffect(() => {
    if (!ringtoneRef.current) {
      ringtoneRef.current = new Audio(RINGTONE_URL);
      ringtoneRef.current.loop = true;
    }
    
    const isIncoming = callState && 
      callState.status === 'calling' && 
      callState.callee && 
      callState.callee.uid === currentUser?.uid && 
      !agoraInCall;
    
    if (isIncoming) {
      ringtoneRef.current.play().catch(() => {});
    } else {
      ringtoneRef.current.pause();
      ringtoneRef.current.currentTime = 0;
    }
    
    return () => {
      if (ringtoneRef.current) {
        ringtoneRef.current.pause();
        ringtoneRef.current.currentTime = 0;
      }
    };
  }, [callState?.status, callState?.callee?.uid, currentUser?.uid, agoraInCall]);

  // Format call duration
  const formatDuration = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // Speaker toggle
  const handleToggleSpeaker = () => {
    setIsSpeaker((s) => !s);
    toast('Speaker toggle is not supported on this device/browser.');
  };

  const value = {
    callState,
    inCall: agoraInCall,
    isMuted: agoraIsMuted,
    callError: agoraCallError,
    callDuration,
    formatDuration,
    isSpeaker,
    acceptCall: acceptSignalingCall,
    rejectCall: rejectSignalingCall,
    endCall: endSignalingCall,
    toggleMute: agoraToggleMute,
    handleToggleSpeaker,
    startCall: initiateCall // <-- Expose initiateCall as startCall
  };

  return (
    <CallContext.Provider value={value}>
      {children}
    </CallContext.Provider>
  );
}; 