const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();
const db = admin.firestore();
const auth = admin.auth();

// Cloud Function to create admin user without signing in
exports.createAdminUser = functions.https.onCall(async (data, context) => {
  // Security: Only allow superadmins
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }
  
  // Check if user is superadmin by looking up their role in Firestore
  try {
    const userDoc = await db.collection('users').doc(context.auth.uid).get();
    if (!userDoc.exists || userDoc.data().role !== 'superadmin') {
      throw new functions.https.HttpsError('permission-denied', 'Only superadmins can create admin users.');
    }
  } catch (error) {
    console.error('Error checking user permissions:', error);
    throw new functions.https.HttpsError('permission-denied', 'Unable to verify user permissions.');
  }
  
  const { email, username, phone, settlement } = data;
  
  if (!email || !username || !phone || !settlement) {
    throw new functions.https.HttpsError('invalid-argument', 'Email, username, phone, and settlement are required');
  }
  
  try {
    // 1. Create user in Firebase Auth
    const tempPassword = email + '_Temp123';
    const userRecord = await auth.createUser({
      email: email,
      password: tempPassword,
      displayName: username,
    });
    
    // 2. Send password reset email
    await auth.generatePasswordResetLink(email);
    
    // 3. Create user in Firestore
    await db.collection('users').doc(userRecord.uid).set({
      credentials: { email, username, phone },
      role: 'admin',
      settlement: settlement,
      createdAt: new Date().toISOString(),
      profileComplete: false,
    });
    
    // 4. Create username document
    await db.collection('usernames').doc(username.toLowerCase()).set({
      uid: userRecord.uid,
      username: username,
    });
    
    // 5. Update availableSettlements
    await db.collection('availableSettlements').doc(settlement).set({
      name: settlement,
      available: true,
      createdAt: new Date().toISOString(),
      adminId: userRecord.uid,
      adminEmail: email,
      adminUsername: username,
      adminPhone: phone,
    }, { merge: true });
    
    console.log('Admin user created successfully:', userRecord.uid);
    return { 
      success: true, 
      uid: userRecord.uid,
      message: 'Admin created and password reset email sent'
    };
  } catch (error) {
    console.error('Error creating admin user:', error);
    throw new functions.https.HttpsError('internal', 'Failed to create admin user: ' + error.message);
  }
});

// Cloud Function to delete a user from Firebase Auth by UID
exports.deleteUserByUid = functions.https.onCall(async (data, context) => {
  // Security: Only allow superadmins
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }
  
  // Check if user is superadmin by looking up their role in Firestore
  try {
    const userDoc = await db.collection('users').doc(context.auth.uid).get();
    if (!userDoc.exists || userDoc.data().role !== 'superadmin') {
      throw new functions.https.HttpsError('permission-denied', 'Only superadmins can delete users.');
    }
  } catch (error) {
    console.error('Error checking user permissions:', error);
    throw new functions.https.HttpsError('permission-denied', 'Unable to verify user permissions.');
  }
  
  const { uid } = data;
  if (!uid) {
    throw new functions.https.HttpsError('invalid-argument', 'UID is required');
  }
  try {
    await auth.deleteUser(uid);
    console.log('Successfully deleted user from Auth:', uid);
    return { success: true };
  } catch (error) {
    console.error('Error deleting user:', error);
    throw new functions.https.HttpsError('internal', 'Failed to delete user: ' + error.message);
  }
});

// Cloud Function to automatically update past events to completed status
exports.updatePastEvents = functions.pubsub.schedule('every 1 hours').onRun(async (context) => {
  try {
    console.log('Starting past events update check...');
    
    const now = new Date();
    const eventsRef = db.collection('events');
    
    // Get all active and pending events
    const activeEventsQuery = eventsRef.where('status', 'in', ['active', 'pending']);
    const snapshot = await activeEventsQuery.get();
    
    let updatedCount = 0;
    const batch = db.batch();
    
    snapshot.docs.forEach(doc => {
      const event = doc.data();
      let eventDate;
      
      // Parse event date (handle both DD-MM-YYYY and YYYY-MM-DD formats)
      if (event.endDate && event.endDate.includes('-')) {
        const parts = event.endDate.split('-');
        if (parts.length === 3) {
          if (parts[0].length === 2) {
            // DD-MM-YYYY
            const [day, month, year] = parts;
            eventDate = new Date(year, month - 1, day);
          } else {
            // YYYY-MM-DD
            const [year, month, day] = parts;
            eventDate = new Date(year, month - 1, day);
          }
        }
      }
      
      if (!eventDate || isNaN(eventDate.getTime())) {
        console.log(`Skipping event ${doc.id}: Invalid date format`);
        return;
      }
      
      // Set event time (use timeTo if available, otherwise timeFrom, otherwise end of day)
      if (event.timeTo) {
        const [hours, minutes] = event.timeTo.split(':').map(Number);
        eventDate.setHours(hours, minutes, 0, 0);
      } else if (event.timeFrom) {
        const [hours, minutes] = event.timeFrom.split(':').map(Number);
        eventDate.setHours(hours, minutes, 0, 0);
      } else {
        eventDate.setHours(23, 59, 59, 999);
      }
      
      // Check if event is in the past
      if (eventDate < now) {
        console.log(`Updating past event: ${doc.id} - ${event.title}`);
        batch.update(doc.ref, { 
          status: 'completed',
          completedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        updatedCount++;
      }
    });
    
    if (updatedCount > 0) {
      await batch.commit();
      console.log(`Successfully updated ${updatedCount} past events to completed status`);
    } else {
      console.log('No past events found to update');
    }
    
    return { success: true, updatedCount };
  } catch (error) {
    console.error('Error updating past events:', error);
    throw error;
  }
});

// Manual trigger function for updating past events (for testing)
exports.manualUpdatePastEvents = functions.https.onCall(async (data, context) => {
  // Security: Only allow admins and superadmins
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }
  
  try {
    const userDoc = await db.collection('users').doc(context.auth.uid).get();
    if (!userDoc.exists || !['admin', 'superadmin'].includes(userDoc.data().role)) {
      throw new functions.https.HttpsError('permission-denied', 'Only admins and superadmins can manually update events.');
    }
  } catch (error) {
    console.error('Error checking user permissions:', error);
    throw new functions.https.HttpsError('permission-denied', 'Unable to verify user permissions.');
  }
  
  try {
    console.log('Manual past events update triggered...');
    
    const now = new Date();
    const eventsRef = db.collection('events');
    
    // Get all active and pending events
    const activeEventsQuery = eventsRef.where('status', 'in', ['active', 'pending']);
    const snapshot = await activeEventsQuery.get();
    
    let updatedCount = 0;
    const batch = db.batch();
    
    snapshot.docs.forEach(doc => {
      const event = doc.data();
      let eventDate;
      
      // Parse event date (handle both DD-MM-YYYY and YYYY-MM-DD formats)
      if (event.endDate && event.endDate.includes('-')) {
        const parts = event.endDate.split('-');
        if (parts.length === 3) {
          if (parts[0].length === 2) {
            // DD-MM-YYYY
            const [day, month, year] = parts;
            eventDate = new Date(year, month - 1, day);
          } else {
            // YYYY-MM-DD
            const [year, month, day] = parts;
            eventDate = new Date(year, month - 1, day);
          }
        }
      }
      
      if (!eventDate || isNaN(eventDate.getTime())) {
        console.log(`Skipping event ${doc.id}: Invalid date format`);
        return;
      }
      
      // Set event time (use timeTo if available, otherwise timeFrom, otherwise end of day)
      if (event.timeTo) {
        const [hours, minutes] = event.timeTo.split(':').map(Number);
        eventDate.setHours(hours, minutes, 0, 0);
      } else if (event.timeFrom) {
        const [hours, minutes] = event.timeFrom.split(':').map(Number);
        eventDate.setHours(hours, minutes, 0, 0);
      } else {
        eventDate.setHours(23, 59, 59, 999);
      }
      
      // Check if event is in the past
      if (eventDate < now) {
        console.log(`Updating past event: ${doc.id} - ${event.title}`);
        batch.update(doc.ref, { 
          status: 'completed',
          completedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        updatedCount++;
      }
    });
    
    if (updatedCount > 0) {
      await batch.commit();
      console.log(`Successfully updated ${updatedCount} past events to completed status`);
    } else {
      console.log('No past events found to update');
    }
    
    return { success: true, updatedCount };
  } catch (error) {
    console.error('Error updating past events:', error);
    throw new functions.https.HttpsError('internal', 'Failed to update past events: ' + error.message);
  }
});

// ... existing code ... 