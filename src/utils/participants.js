//participants.js

import { doc, setDoc, deleteDoc, getDocs, collection, serverTimestamp, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
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
};

// Get all participants
export const getEventParticipants = async (eventId) => {
  const snapshot = await getDocs(collection(db, `events/${eventId}/participants`));
  return snapshot.docs.map(doc => doc.data());
};
