// This is a one-time migration script for Firestore.
// It iterates through all documents in the 'events' collection.
// For each event, it finds the user who created it via the 'createdBy' field.
// It then retrieves that user's 'role' from the 'users' collection (defaulting to 'retiree' if not found).
// Finally, it updates the event document with a new 'role' field, setting it to the creator's role.
// This is intended to be run once from a Node.js environment to backfill role data for existing events.

// Firestore migration script to add the creator's role to each event document
// Run this script in a Node.js environment with Firebase Admin SDK configured

import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

initializeApp({
  credential: applicationDefault(),
});

const db = getFirestore();

async function migrateEventsAddRole() {
  const eventsSnapshot = await db.collection('events').get();
  for (const eventDoc of eventsSnapshot.docs) {
    const eventData = eventDoc.data();
    if (!eventData.createdBy) continue;
    const userDoc = await db.collection('users').doc(eventData.createdBy).get();
    if (!userDoc.exists) continue;
    const userRole = userDoc.data().role || 'retiree';
    await eventDoc.ref.update({ role: userRole });
    console.log(`Updated event ${eventDoc.id} with role: ${userRole}`);
  }
  console.log('Migration complete.');
}

migrateEventsAddRole().catch(console.error);
