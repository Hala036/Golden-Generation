import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../../firebase";

export const triggerNotification = async ({ message, target, link, createdBy, type }) => {
  try {
    await addDoc(collection(db, "notifications"), {
      message,
      target,
      type, // Add the type field
      createdAt: serverTimestamp(),
      link: link || null,
      createdBy: createdBy || "system"
    });
  } catch (err) {
    console.error("Failed to trigger notification", err);
  }
};
