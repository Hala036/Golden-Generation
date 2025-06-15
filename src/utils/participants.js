//participants.js

import { doc, setDoc, deleteDoc, getDocs, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

// Join an event
export const joinEvent = async (eventId, userId, status = 'confirmed') => {
  await setDoc(doc(db, `events/${eventId}/participants`, userId), {
    uid: userId,
    joinedAt: serverTimestamp(),
    status
  });
};

// Leave an event
export const leaveEvent = async (eventId, userId) => {
  await deleteDoc(doc(db, `events/${eventId}/participants`, userId));
};

// Get all participants
export const getEventParticipants = async (eventId) => {
  const snapshot = await getDocs(collection(db, `events/${eventId}/participants`));
  return snapshot.docs.map(doc => doc.data());
};
