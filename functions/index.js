import { https } from "firebase-functions";
import { initializeApp, firestore } from "firebase-admin";
const cors = require("cors")({ origin: true }); // Allow all origins (or customize as needed)

initializeApp();

export const registerUserData = https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method !== "POST") {
      return res.status(405).send("Method Not Allowed");
    }

    try {
      const { uid, username, role, displayName } = req.body;

      if (!uid || !username || !role || !displayName) {
        return res.status(400).send("Missing required fields");
      }

      const db = firestore();

      await db.collection("users").doc(uid).set({
        uid,
        username,
        role,
        displayName,
        createdAt: firestore.FieldValue.serverTimestamp(),
      });

      await db.collection("usernames").doc(username).set({
        uid,
      });

      if (role === "veteran") {
        await db.collection("veterans").doc(uid).set({
          uid,
          username,
          displayName,
          createdAt: firestore.FieldValue.serverTimestamp(),
        });
      }

      return res.status(200).send("User registered successfully");
    } catch (error) {
      console.error("Error registering user:", error);
      return res.status(500).send("Internal Server Error");
    }
  });
});
