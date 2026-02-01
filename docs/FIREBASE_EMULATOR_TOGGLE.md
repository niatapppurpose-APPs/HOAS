# Firebase Emulator Toggle Feature 🔧

## Overview
The HOAS application now includes a **Firebase Mode Toggle Button** that allows you to easily switch between Firebase Emulator and Production modes without needing to modify environment variables or restart the development server.

## What Was Fixed

### 1. **Enhanced Firebase Configuration** (`firebaseConfig.js`)
- Added support for localStorage-based emulator mode preference
- The app now checks `localStorage` for `VITE_USE_FIREBASE_EMULATOR` setting
- Falls back to `.env` file setting if localStorage is not set
- Allows dynamic switching without code changes

### 2. **Improved Firebase Mode Indicator** (`FirebaseModeIndicator.jsx`)
- Repositioned to avoid overlapping with the language selector (now at `bottom-20` instead of `bottom-4`)
- Added a prominent **Toggle Mode** button
- Shows current mode with visual indicators:
  - 🔧 Orange button = Emulator Mode
  - 🌐 Green button = Production Mode
- Displays loading state when switching modes

### 3. **Better User Experience**
- One-click switching between modes
- Automatic page reload after mode change
- Clear visual feedback during the transition
- Helpful warnings and instructions

## How to Use

### Viewing Current Mode
Look at the bottom-right corner of your app (just above the language selector). You'll see a button showing:
- **🔧 Emulator** - You're using Firebase Emulators (local development)
- **🌐 Production** - You're using Production Firebase services

### Switching Modes

**Method 1: Quick Toggle (Recommended)**
1. Click on the Firebase mode indicator button (bottom-right)
2. In the expanded panel, click the large **"Switch to Production"** or **"Switch to Emulator"** button
3. The page will automatically reload with the new mode

**Method 2: Using Debug Console**
In the browser console, you can use:
```javascript
// Check current mode
firebaseDebug.getMode()

// View full debug information
firebaseDebug.debug()

// Force production mode
firebaseDebug.forceProduction()

// Clear production override
firebaseDebug.clearProduction()
```

## Important Notes

### ⚠️ Emulator Mode
When using **Emulator Mode** (🔧):
- All data is stored **locally** on your machine
- Data will be **reset** when you restart Firebase emulators
- Perfect for testing without affecting production data
- Make sure Firebase emulators are running: `firebase emulators:start`

### 🌐 Production Mode
When using **Production Mode** (🌐):
- Connected to **real Firebase services**
- All changes affect **live data**
- User authentication uses real Google accounts
- Be careful with data modifications

## Verifying Emulator Connection

### Check if Emulators are Running
Open your terminal where you ran `firebase emulators:start` and verify you see:
```
┌─────────────────────────────────────────────────────────────┐
│ ✔  All emulators ready! It is now safe to connect your app. │
└─────────────────────────────────────────────────────────────┘

┌────────────────┬────────────────┬─────────────────────────────────┐
│ Emulator       │ Host:Port      │ View in Emulator UI             │
├────────────────┼────────────────┼─────────────────────────────────┤
│ Authentication │ 127.0.0.1:9099 │ http://127.0.0.1:4000/auth      │
│ Firestore      │ 127.0.0.1:8080 │ http://127.0.0.1:4000/firestore │
│ Functions      │ 127.0.0.1:5001 │ http://127.0.0.1:4000/functions │
│ Storage        │ 127.0.0.1:9199 │ http://127.0.0.1:4000/storage   │
└────────────────┴────────────────┴─────────────────────────────────┘
```

### Check Connection in App
1. Click the Firebase mode indicator button
2. The expanded panel shows each service:
   - 🔐 Authentication
   - 📦 Firestore
   - ⚡ Functions
   - 💾 Storage
3. Each shows **EMULATOR** or **PRODUCTION** with endpoints

### Using Debug Tools
Click **"Full Debug"** button to see:
- Environment variables
- Current mode for each service
- OAuth redirect URLs
- Current user information

## Troubleshooting

### Emulators Not Connecting?
1. **Check if emulators are running**: Look for the Firebase emulator UI at `http://localhost:4000`
2. **Verify ports**: Make sure ports 9099, 8080, 5001, and 9199 are not in use
3. **Check console**: Open browser DevTools and look for Firebase connection logs
4. **Toggle to production**: If emulators aren't working, switch to production mode temporarily

### Mode Not Changing?
1. **Hard refresh**: Press `Ctrl + Shift + R` (or `Cmd + Shift + R` on Mac)
2. **Clear cache**: Clear browser cache and reload
3. **Check localStorage**: Open DevTools → Application → Local Storage → Check for `VITE_USE_FIREBASE_EMULATOR`

### Data Not Persisting?
- In **Emulator Mode**: This is expected! Data resets when emulators restart
- In **Production Mode**: Check your Firebase console for data

## Configuration Files

### `.env` File (Client)
```env
VITE_USE_FIREBASE_EMULATOR=true  # Default mode (can be overridden by toggle)
```

### localStorage Override
The toggle button sets:
```javascript
localStorage.setItem('VITE_USE_FIREBASE_EMULATOR', 'true' | 'false')
```

Priority: `localStorage` > `.env` file

## Development Workflow Recommendations

### For Local Development
1. Start Firebase emulators: `firebase emulators:start`
2. Start dev server: `npm run dev`
3. Use **Emulator Mode** (🔧)
4. Test features without affecting production

### For Testing Production Features
1. Switch to **Production Mode** (🌐) using the toggle
2. Test with real Firebase services
3. Switch back to emulator when done

### Before Deployment
1. Ensure `.env` has `VITE_USE_FIREBASE_EMULATOR=false`
2. Or remove the localStorage override
3. Test in production mode locally
4. Deploy with confidence

## Features of the Toggle Panel

### Main Information
- **Environment**: Shows if running in development or production
- **Service Status**: Individual status for Auth, Firestore, Functions, Storage
- **Endpoints**: Shows which URLs are being used

### Actions
- **Toggle Mode**: Switch between emulator and production
- **Log Details**: View mode information in panel
- **Full Debug**: Comprehensive debug information

### Visual Indicators
- **Orange/🔧**: Emulator mode active
- **Green/🌐**: Production mode active
- **🔄**: Switching in progress

## Support

If you encounter issues:
1. Check the browser console for errors
2. Use the "Full Debug" button to get diagnostic information
3. Verify Firebase emulators are running (if using emulator mode)
4. Check network tab for failed requests

## Summary of Changes

### Files Modified:
1. `client/src/firebase/firebaseConfig.js` - Added localStorage support
2. `client/src/components/FirebaseModeIndicator.jsx` - Added toggle button and improved UI
3. `client/src/App.jsx` - Already had the indicator (no changes needed)

### New Feature:
- **One-click toggle** between Firebase modes
- **Persistent preference** (survives page reloads)
- **Visual feedback** for current mode
- **Automatic reconnection** after mode change

---

**Version**: 1.0.0  
**Last Updated**: 2026-02-01  
**Compatibility**: HOAS v1.2.0+
