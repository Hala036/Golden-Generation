import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, deleteUser } from "firebase/auth";
import { getFirestore, doc, setDoc, collection, getDocs, deleteDoc, initializeFirestore, enableNetwork, disableNetwork, updateDoc } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_API_KEY,
  authDomain: import.meta.env.VITE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_APP_ID,
  measurementId: import.meta.env.VITE_MEASUREMENT_ID
};

// Only initialize if there are no apps already
const app = !getApps().length
  ? initializeApp(firebaseConfig)
  : getApp();

const analytics = getAnalytics(app);
const auth = getAuth(app);
const storage = getStorage(app);

// Initialize Firestore
const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  useFetchStreams: false,
});

// User Management Functions
/**
 * Get user data from Firestore
 * @param {string} uid - The user's ID
 * @returns {Promise<Object|null>} User data object or null if not found
 */
const getUserData = async (uid) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      return userDoc.data();
    }
    console.warn("No user document found for UID:", uid);
    return null;
  } catch (error) {
    console.error("Error fetching user data:", error);
    return null; // Simply return null on any error
  }
};

// Settlement Management Functions
/**
 * Add a new settlement to available settlements
 * @param {string} settlementName - The name of the settlement to add
 * @returns {Promise<void>}
 */
const addSettlement = async (settlementName) => {
  try {
    await setDoc(doc(db, 'availableSettlements', settlementName), { 
      name: settlementName,
      available: true,
      createdAt: new Date().toISOString() 
    });
    return true;
  } catch (error) {
    console.error("Error adding settlement:", error);
    return false;
  }
};

/**
 * Get all available settlements
 * @returns {Promise<Array>} - Array of settlement objects with name, available, etc.
 */
const getAvailableSettlements = async () => {
  try {
    const settlementsSnapshot = await getDocs(collection(db, 'availableSettlements'));
    const settlements = [];
    settlementsSnapshot.forEach((doc) => {
      settlements.push({ id: doc.id, ...doc.data() });
    });
    return settlements;
  } catch (error) {
    console.error("Error getting settlements:", error);
    return [];
  }
};

/**
 * Remove a settlement from available settlements
 * @param {string} settlementName - The name of the settlement to remove
 * @returns {Promise<boolean>} - True if successful, false otherwise
 */
const removeSettlement = async (settlementName) => {
  try {
    await deleteDoc(doc(db, 'availableSettlements', settlementName));
    return true;
  } catch (error) {
    console.error("Error removing settlement:", error);
    return false;
  }
};

/**
 * Fetch users by settlement
 * @param {string} settlement - The settlement name
 * @returns {Promise<Array>} - Array of user objects
 */
export const getUsersBySettlement = async (settlement) => {
  try {
    const usersRef = collection(db, "users"); // Use the Firestore instance `db`
    const snapshot = await getDocs(usersRef);
    const users = snapshot.docs
      .map((doc) => doc.data())
      .filter((user) => user.idVerification?.settlement === settlement); // Filter by settlement
    return users;
  } catch (error) {
    console.error("Error fetching users by settlement:", error);
    throw error;
  }
};

/**
 * Assign an admin to a settlement and update both documents
 * @param {string} settlementName - The name of the settlement
 * @param {string} adminUserId - The UID of the admin user
 */
export const assignAdminToSettlement = async (settlementName, adminUserId) => {
  // Update the settlement document
  await updateDoc(doc(db, 'availableSettlements', settlementName), {
    adminId: adminUserId,
    available: true,
  });
  // Update the admin user document
  await updateDoc(doc(db, 'users', adminUserId), {
    role: 'Admin',
    settlement: settlementName,
  });
};

/**
 * Fetch only available settlements with an assigned admin
 * @returns {Promise<Array>} - Array of settlement objects
 */
export const getAvailableSettlementsForSignup = async () => {
  const settlementsRef = collection(db, 'availableSettlements');
  const snapshot = await getDocs(settlementsRef);
  return snapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() }))
    .filter(settlement => settlement.available && settlement.adminId);
};

/**
 * Delete a Firebase Auth user by UID (must be signed in as that user or use Admin SDK on server)
 * @param {object} user - The user object (firebase.User)
 * @returns {Promise<void>}
 */
export const deleteAuthUser = async (user) => {
  try {
    await deleteUser(user);
  } catch (error) {
    console.error('Error deleting Auth user:', error);
  }
};

export { 
  app, 
  analytics, 
  auth, 
  db, 
  storage, 
  addSettlement, 
  getAvailableSettlements, 
  removeSettlement,
  getUserData
};
