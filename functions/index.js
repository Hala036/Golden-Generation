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

// ... existing code ... 