import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
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

// Check for missing config
if (!firebaseConfig.apiKey || !firebaseConfig.authDomain) {
  throw new Error("❌ One or more Firebase ENV variables are missing!");
}

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Optional: getAnalytics only if in browser
let analytics;
if (typeof window !== 'undefined') {
  import("firebase/analytics").then(({ getAnalytics }) => {
    analytics = getAnalytics(app);
    console.log("📊 Firebase Analytics initialized");
  });
}

const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

console.log("✅ Firebase initialized");

export { app, auth, db, storage };
