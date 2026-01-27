# Firebase Emulator OAuth Configuration Guide

## Problem Overview

When using Firebase Authentication with emulators, a hard dependency on `localhost` can cause the application to fail when the emulator isn't running, resulting in "Site can't be reached" errors instead of gracefully falling back to production.

## Root Cause Analysis

### Why the App Fails Instead of Falling Back

1. **Permanent SDK Lock-in**: Once `connectAuthEmulator()` is called, the Firebase Auth SDK permanently configures itself to use the emulator endpoint (`http://localhost:9099`) for **all** authentication operations, including OAuth redirects.

2. **No Runtime Validation**: The original implementation checked environment variables at build time but didn't verify if the emulator was actually running:
   ```javascript
   // ❌ PROBLEMATIC: No runtime check
   if (import.meta.env.DEV && import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true') {
     connectAuthEmulator(auth, 'http://localhost:9099');
   }
   ```

3. **OAuth Redirect Failure**: When `signInWithPopup()` is called with emulator mode enabled but emulator not running:
   - Google OAuth redirects to `http://localhost:9099/__/auth/handler`
   - Browser can't reach localhost:9099 → Connection refused
   - User sees "Site can't be reached" error
   - No fallback to production domain

## Solution Implemented

### Automatic Emulator Detection with Graceful Fallback

The updated configuration in `src/firebase/firebaseConfig.js` implements:

#### 1. **Runtime Availability Check**
```javascript
async function detectAndConnectEmulators() {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 2000);
  
  const response = await fetch('http://localhost:9099', {
    method: 'GET',
    signal: controller.signal,
    mode: 'no-cors',
  });
  
  // Only connect if emulator responds
  connectAuthEmulator(auth, 'http://localhost:9099');
}
```

#### 2. **Timeout Protection**
- Uses `AbortController` with 2-second timeout
- Prevents hanging if emulator is unreachable
- Quickly falls back to production

#### 3. **Graceful Degradation**
```javascript
try {
  // Try emulator
  await detectEmulator();
  console.log('✅ Using emulators');
} catch (error) {
  // Fall back to production
  console.log('🌐 Using production Firebase');
}
```

## How It Works

### Flow Diagram

```
Application Start
       ↓
Check DEV mode + VITE_USE_FIREBASE_EMULATOR
       ↓
       ├─→ Production Mode → Use production OAuth
       │
       └─→ Dev Mode with flag
             ↓
        Fetch localhost:9099 (2s timeout)
             ↓
             ├─→ Success → Connect to emulators
             │                ↓
             │           Use http://localhost:9099
             │
             └─→ Failure/Timeout → Use production
                                     ↓
                                Use authDomain from .env
```

### Key Benefits

✅ **Automatic Detection**: No manual switching needed  
✅ **Fast Fallback**: 2-second timeout prevents delays  
✅ **Zero Downtime**: Works whether emulator is running or not  
✅ **Developer Friendly**: Just start/stop emulator as needed  
✅ **Production Safe**: Never connects to emulator in production builds

## Environment Configuration

### Development with Emulators

**.env file:**
```bash
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=hoas-65dee.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=hoas-65dee
VITE_FIREBASE_STORAGE_BUCKET=hoas-65dee.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id

# Enable emulator detection (optional in dev)
VITE_USE_FIREBASE_EMULATOR=true
```

### Development WITHOUT Emulators

Simply set:
```bash
VITE_USE_FIREBASE_EMULATOR=false
```

Or remove the variable entirely - app will use production Firebase.

### Production

**Production should always use production Firebase:**
```bash
VITE_USE_FIREBASE_EMULATOR=false
# Or omit the variable completely
```

**Important**: Vite's `import.meta.env.DEV` is automatically `false` in production builds, providing an additional safety layer.

## Best Practices

### 1. **Environment-Based Configuration**

```javascript
// ✅ GOOD: Environment-aware with runtime detection
const shouldTryEmulator = import.meta.env.DEV && 
                         import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true';

if (shouldTryEmulator) {
  await detectAndConnectEmulators();
}
```

```javascript
// ❌ BAD: Always connects without checking
connectAuthEmulator(auth, 'http://localhost:9099');
```

### 2. **Timeout Configuration**

```javascript
// Short timeout for quick fallback
const EMULATOR_DETECTION_TIMEOUT = 2000; // 2 seconds

// Don't use excessive timeouts
// ❌ BAD: const timeout = 30000; // User waits 30s!
```

### 3. **Clear Logging**

Always log which mode is active:
```javascript
console.log('🔧 Using Firebase Emulators');
// or
console.log('🌐 Using Production Firebase');
console.log('📍 Auth Domain:', firebaseConfig.authDomain);
```

### 4. **Error Handling**

```javascript
try {
  await detectAndConnectEmulators();
} catch (error) {
  // Silent fallback - don't throw errors
  // App should work in production mode
}
```

### 5. **Emulator Ports Configuration**

Keep ports consistent across `firebase.json` and your code:

**firebase.json:**
```json
{
  "emulators": {
    "auth": { "port": 9099 },
    "firestore": { "port": 8080 },
    "functions": { "port": 5001 }
  }
}
```

**firebaseConfig.js:**
```javascript
const AUTH_EMULATOR_URL = 'http://localhost:9099';
const FIRESTORE_EMULATOR_PORT = 8080;
const FUNCTIONS_EMULATOR_PORT = 5001;
```

## Common Issues & Solutions

### Issue 1: "Site can't be reached" on Login

**Cause**: Emulator connection established but emulator stopped  
**Solution**: Our automatic detection prevents this - restart the dev server

### Issue 2: Auth Works in Emulator but Not Production

**Cause**: OAuth redirect URIs not configured in Firebase Console  
**Solution**: Add authorized domains:
1. Go to Firebase Console → Authentication → Settings
2. Add `your-domain.com` to Authorized Domains
3. For Google OAuth: Also add to Google Cloud Console OAuth consent screen

### Issue 3: Emulator Data Not Persisting

**Cause**: Emulators reset on restart  
**Solution**: 
```bash
# Export emulator data
firebase emulators:export ./emulator-data

# Start with saved data
firebase emulators:start --import=./emulator-data
```

### Issue 4: Still Connecting to Emulator in Production

**Cause**: Environment variable leaked to production  
**Solution**: 
- Never commit `.env` to version control
- Use `.env.production` for production builds
- Verify `import.meta.env.DEV` is `false` in production

## Testing the Setup

### Test 1: Emulator Running
```bash
# Terminal 1: Start emulator
firebase emulators:start

# Terminal 2: Start dev server
npm run dev

# Expected: Console shows "✅ Using emulators"
```

### Test 2: Emulator Not Running
```bash
# Just start dev server (no emulator)
npm run dev

# Expected: Console shows "🌐 Using production Firebase"
# Login should work with production OAuth
```

### Test 3: Production Build
```bash
npm run build
npm run preview

# Expected: Always uses production, even if emulator running
```

## Additional Configuration Options

### Custom Emulator Detection Function

For more control, you can extend the detection logic:

```javascript
async function detectAndConnectEmulators() {
  // Check environment
  if (!import.meta.env.DEV || import.meta.env.VITE_USE_FIREBASE_EMULATOR !== 'true') {
    return false; // Use production
  }

  // Check localStorage override (useful for debugging)
  if (localStorage.getItem('forceProductionFirebase') === 'true') {
    console.log('🔒 Production Firebase forced via localStorage');
    return false;
  }

  try {
    // Parallel check for faster detection
    const checks = [
      fetch('http://localhost:9099', { mode: 'no-cors', signal: timeoutSignal }),
      fetch('http://localhost:8080', { mode: 'no-cors', signal: timeoutSignal }),
    ];
    
    await Promise.race(checks);
    
    // Connect all emulators
    connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
    connectFirestoreEmulator(db, '127.0.0.1', 8080);
    connectFunctionsEmulator(functions, 'localhost', 5001);
    
    return true; // Using emulators
  } catch {
    return false; // Using production
  }
}
```

## Security Considerations

### 1. **Never Expose Emulator Ports Publicly**
```javascript
// ✅ GOOD: localhost only
connectAuthEmulator(auth, 'http://localhost:9099');

// ❌ BAD: External IP
connectAuthEmulator(auth, 'http://192.168.1.100:9099');
```

### 2. **Validate Environment Mode**
```javascript
// ✅ GOOD: Double-check DEV mode
if (import.meta.env.DEV && shouldUseEmulator) {
  // ...
}

// ❌ BAD: Only check flag
if (shouldUseEmulator) { // Might be true in production!
  // ...
}
```

### 3. **Protect Service Account Keys**
Never commit `serviceAccountKey.json` - add to `.gitignore`:
```
serviceAccountKey.json
.env
.env.local
```

## Debugging Tips

### Enable Verbose Firebase Logging
```javascript
import { setLogLevel } from 'firebase/app';

if (import.meta.env.DEV) {
  setLogLevel('debug');
}
```

### Check Current Firebase Mode
Add a debug function:
```javascript
export function getFirebaseMode() {
  const authUrl = auth.config.emulator?.url || 'production';
  return {
    authMode: authUrl,
    isDevelopment: import.meta.env.DEV,
    emulatorFlag: import.meta.env.VITE_USE_FIREBASE_EMULATOR,
  };
}

// Use in console
console.log(getFirebaseMode());
```

## Summary

The automatic emulator detection solution provides:

✅ **Zero Configuration Switching**: Works automatically  
✅ **Fast Fallback**: 2-second timeout for quick production fallback  
✅ **Developer Experience**: Start/stop emulator freely  
✅ **Production Safety**: Never uses emulator in production  
✅ **Robust Error Handling**: Gracefully handles all failure modes  

Your app now seamlessly transitions between emulator and production OAuth without manual intervention or configuration changes.
