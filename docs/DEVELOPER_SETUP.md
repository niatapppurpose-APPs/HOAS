# Developer setup — Firebase configuration (moved from README)

This file contains the detailed Firebase setup and example configuration that used to be in the root `README.md`. The README now links here so the project page stays concise.

---

## 1) Configure Firebase project

Edit `.firebaserc` and replace with your Firebase project ID:

```json
{
  "projects": {
    "default": "your-firebase-project-id"
  }
}
```

## 2) Add service account key (functions)

1. Go to Firebase Console → Project Settings → Service Accounts
2. Click **Generate New Private Key**
3. Save the downloaded JSON file as `server/serviceAccountKey.json`

```bash
# Ensure the file is in the correct location
cp /path/to/downloaded/key.json server/serviceAccountKey.json
```

> Note: Never commit service account keys to source control.

## 3) Update client Firebase config

Edit `client/src/firebase/firebaseConfig.js` with your Firebase web app credentials:

```javascript
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};
```

---

If you want these instructions removed entirely or moved into another docs file, tell me which option you prefer.