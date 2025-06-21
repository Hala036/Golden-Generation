import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, setDoc, collection, getDocs, deleteDoc, initializeFirestore, enableNetwork, disableNetwork } from "firebase/firestore";
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

// Initialize Firestore with better offline handling
const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  useFetchStreams: false,
  // Add offline persistence settings
  cacheSizeBytes: 50 * 1024 * 1024, // 50MB cache
});

// Network state management
let isOnline = navigator.onLine;

// Listen for online/offline events
window.addEventListener('online', () => {
  isOnline = true;
  console.log('App is online');
  enableNetwork(db);
});

window.addEventListener('offline', () => {
  isOnline = false;
  console.log('App is offline');
  disableNetwork(db);
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
    
    // Check if it's an offline error
    if (error.message && error.message.includes('offline')) {
      console.warn("User is offline, cannot fetch data");
      return null;
    }
    
    return null;
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
