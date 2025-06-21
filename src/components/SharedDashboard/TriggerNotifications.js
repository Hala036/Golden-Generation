import { addDoc, collection, serverTimestamp, getDocs, query, where, updateDoc, doc, arrayUnion } from "firebase/firestore";
import { db } from "../../firebase";

// Function to add notification to user profiles
const addNotificationToUsers = async (notificationId, target) => {
  try {
    let userIds = [];

    if (target === "everyone" || target === "admins" || target === "retirees") {
      // Fetch users based on the target group
      const q = query(
        collection(db, "users"),
        where("role", "==", target === "everyone" ? "user" : target) // Adjust query for group
      );
      const snapshot = await getDocs(q);
      userIds = snapshot.docs.map((doc) => doc.id); // Extract user IDs
    } else {
      // If target is an array of specific user IDs
      userIds = target;
    }

    // Add notification ID to each user's profile
    const userUpdates = userIds.map((uid) =>
      updateDoc(doc(db, "users", uid), {
        notifs: arrayUnion({ id: notificationId, read: false })
      })
    );
    await Promise.all(userUpdates);
  } catch (err) {
    console.error("Failed to add notification to users", err);
  }
};

// Trigger notification function
export const triggerNotification = async ({ message, target, link, createdBy, type }) => {
  try {
    // Create the notification in the global notifications collection
    const notificationRef = await addDoc(collection(db, "notifications"), {
      message,
      target,
      type, // Add the type field
      createdAt: serverTimestamp(),
      link: link || null,
      createdBy: createdBy || "system"
    });

    // Add the notification to user profiles
    await addNotificationToUsers(notificationRef.id, target);
  } catch (err) {
    console.error("Failed to trigger notification", err);
  }
};
