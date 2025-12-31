import admin from "firebase-admin";
import { createRequire } from "module";

// Check if we are running against the emulator
if (process.env.FIREBASE_AUTH_EMULATOR_HOST) {
  console.log("Firebase emulator detected. Connecting to emulators...");
  admin.initializeApp({
    projectId: "hoas-65dee", // Using the project ID from .firebaserc
  });
} else {
  console.log("No Firebase emulator detected. Connecting to production...");
  // We need 'createRequire' to import the JSON file in ES Modules
  const require = createRequire(import.meta.url);
  try {
    const serviceAccount = require("./serviceAccountKey.json");
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log("Connected to production Firebase.");
  } catch (error) {
    if (error.code === 'MODULE_NOT_FOUND') {
        console.error("Error: 'serviceAccountKey.json' not found. This file is required for production use.");
        console.error("Please download it from your Firebase project settings and place it in the root directory.");
    } else {
        console.error("Error connecting to production Firebase:", error.message);
    }
    process.exit(1);
  }
}

// The emails you provided
const adminEmails = [
  "faziyashaik81@gmail.com",
  "ramasaiahemanth@gmail.com"
];

async function makeUsersAdmins() {
  console.log("Attempting to make users admins...");
  for (const email of adminEmails) {
    try {
      const user = await admin.auth().getUserByEmail(email);
      const currentClaims = user.customClaims || {};
      
      await admin.auth().setCustomUserClaims(user.uid, {
        ...currentClaims,
        admin: true
      });

      console.log(`✅ Success: ${email} is now an admin.`);
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        console.warn(`User with email ${email} not found. Skipping.`);
      } else {
        console.error(`❌ Error setting admin for ${email}:`, error.message);
      }
    }
  }
}

makeUsersAdmins()
  .then(() => {
    console.log("Process complete.");
  });