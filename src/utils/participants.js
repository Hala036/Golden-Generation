//participants.js

import { doc, setDoc, deleteDoc, getDoc, getDocs, collection, serverTimestamp, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../firebase';

// Join an event
export const joinEvent = async (eventId, userId, status = 'confirmed') => {
  // Add participant to the event's subcollection
  await setDoc(doc(db, `events/${eventId}/participants`, userId), {
    uid: userId,
    joinedAt: serverTimestamp(),
    status
  });

  // Add event to the user's registeredEvents list
  const userDocRef = doc(db, 'users', userId);
  await updateDoc(userDocRef, {
    registeredEvents: arrayUnion(eventId)
  });

  // Add user to the event's participants array in the main event document
  const eventDocRef = doc(db, 'events', eventId);
  await updateDoc(eventDocRef, {
    participants: arrayUnion(userId)
  });
};

// Leave an event
export const leaveEvent = async (eventId, userId) => {
  // Remove participant from the event's subcollection
  await deleteDoc(doc(db, `events/${eventId}/participants`, userId));

  // Remove event from the user's registeredEvents list
  const userDocRef = doc(db, 'users', userId);
  await updateDoc(userDocRef, {
    registeredEvents: arrayRemove(eventId)
  });

  // Remove user from the event's participants array in the main event document
  const eventDocRef = doc(db, 'events', eventId);
  await updateDoc(eventDocRef, {
    participants: arrayRemove(userId)
  });
};

// Get all participants (from main event document)
export const getEventParticipants = async (eventId) => {
  const eventDoc = await getDoc(doc(db, 'events', eventId));
  const data = eventDoc.exists() ? eventDoc.data() : {};
  // Return as array of objects for compatibility
  return (data.participants || []).map(uid => ({ uid }));
};
