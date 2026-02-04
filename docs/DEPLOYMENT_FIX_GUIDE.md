# Firebase Deployment Fix Guide

## Issues Fixed

### ✅ 1. CORS Configuration (FIXED IN CODE)
The CORS errors have been permanently resolved by:
- Configuring proper CORS headers in `server/functions/src/config.js`
- Adding allowed origins for localhost and production domains
- Upgrading to latest firebase-functions version

### ⚠️ 2. Firebase Billing & Deployment (REQUIRES MANUAL ACTION)

## How to Fix the Billing/Deployment Error

The error you're seeing:
```
Write access to project 'hoas-65dee' was denied: please check billing account associated and retry
```

This happens because your Firebase project needs an active billing account to deploy Cloud Functions.

### Steps to Enable Billing:

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/
   - Select your project: `hoas-65dee`

2. **Enable Billing**
   - Click on the menu (☰) → "Billing"
   - If no billing account exists, click "Link a billing account"
   - Follow the prompts to create a billing account
   - You'll need to add a credit/debit card (Google offers free tier)

3. **Verify APIs are Enabled**
   Visit: https://console.cloud.google.com/apis/library
   
   Ensure these APIs are enabled:
   - Cloud Functions API
   - Cloud Build API
   - Artifact Registry API
   - Cloud Run Admin API

4. **Check App Engine**
   - Visit: https://console.cloud.google.com/appengine
   - If not set up, create an App Engine instance
   - Select region: `us-central` (to match your functions region)

### After Enabling Billing:

1. **Deploy Functions**
   ```powershell
   cd server
   firebase deploy --only functions
   ```

2. **Verify Deployment**
   ```powershell
   firebase functions:list
   ```

## Free Tier Information

Google Cloud offers a generous free tier:
- **Cloud Functions**: 2 million invocations/month
- **Firestore**: 1 GB storage, 50K reads/day
- **Storage**: 5 GB storage
- **Authentication**: Unlimited

**Note**: You only pay if you exceed these limits, which is unlikely during development.

## Alternative: Use Emulators for Development

If you don't want to enable billing right now, you can use Firebase Emulators:

1. **Start Emulators**
   ```powershell
   cd server
   firebase emulators:start
   ```

2. **Enable Emulator Mode in Frontend**
   - Open browser console on your app (http://localhost:5173)
   - Run: `localStorage.setItem('VITE_USE_FIREBASE_EMULATOR', 'true')`
   - Refresh the page

3. **Verify Emulator Connection**
   - Check console for: "🔧 Using Firebase Emulator for Cloud Functions"

## Testing After Fix

1. **Test CORS**
   - Try approving/denying a user from the OwnersDashboard
   - Should work without CORS errors

2. **Check Console**
   - No CORS errors should appear
   - Function calls should succeed

## Troubleshooting

### Still Getting CORS Errors?
1. Clear browser cache and localStorage
2. Hard refresh (Ctrl+Shift+R)
3. Check if emulator is running if using emulator mode

### Deployment Still Failing?
1. Verify billing is enabled: https://console.cloud.google.com/billing
2. Check project permissions in Firebase Console
3. Ensure you're logged in: `firebase login`
4. Check current project: `firebase projects:list`

### Production Domain Different?
If your production domain is different, update allowed origins in:
`server/functions/src/config.js`

```javascript
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://your-actual-domain.com',  // Add your domain here
  'https://hoas-65dee.web.app',
  'https://hoas-65dee.firebaseapp.com'
];
```

## Need Help?

1. Check Firebase Console: https://console.firebase.google.com/
2. View function logs: `firebase functions:log`
3. Check emulator UI: http://localhost:4000 (when emulators running)

---

**Last Updated**: February 4, 2026
**Status**: CORS Fixed ✅ | Billing Setup Required ⚠️
