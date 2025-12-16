import admin from "firebase-admin";
import { createRequire } from "module";

// 1. Initialize the SDK
// We need 'createRequire' to import the JSON file in ES Modules
const require = createRequire(import.meta.url);
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential:admin.credential.cert(serviceAccount)
});

// The emails you provided
const adminEmails = [
  "faziyashaik81@gmail.com",
  "ramasaiahemanth@gmail.com"
];

async function makeUsersAdmins() {
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
      console.error(`❌ Error setting admin for ${email}:`, error.message);
    }
  }
}

makeUsersAdmins()
  .then(() => {
    console.log("Process complete.");
    process.exit();
  });