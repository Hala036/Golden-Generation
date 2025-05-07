import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, setDoc, collection, getDocs, deleteDoc } from "firebase/firestore";
import { getStorage } from "firebase/storage";

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

// Now you can safely log to confirm
console.log("FIREBASE CONFIG:", {
  apiKey: firebaseConfig.apiKey,
  authDomain: firebaseConfig.authDomain,
  projectId: firebaseConfig.projectId
});

const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

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
    console.log(`Settlement "${settlementName}" added successfully`);
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
    console.log(`Settlement "${settlementName}" removed successfully`);
    return true;
  } catch (error) {
    console.error("Error removing settlement:", error);
    return false;
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
  removeSettlement 
};
