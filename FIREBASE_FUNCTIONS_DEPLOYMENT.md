# Firebase Functions Deployment Guide

## Prerequisites

1. **Install Firebase CLI**
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase**
   ```bash
   firebase login
   ```

3. **Initialize Firebase Project**
   ```bash
   firebase init
   ```
   - Select **Functions** and **Hosting**
   - Choose your Firebase project
   - Use JavaScript/TypeScript (this project uses ES modules)
   - Install dependencies: Yes

## Project Setup

### 1. Update Firebase Project ID

Edit `.firebaserc` and replace `YOUR_PROJECT_ID` with your actual Firebase project ID:

```json
{
  "projects": {
    "default": "your-actual-project-id"
  }
}
```

### 2. Copy Service Account Key

Copy your Firebase Admin SDK service account key to the functions directory:

```bash
cp serviceAccountKey.json functions/serviceAccountKey.json
```

> **Important**: Never commit `serviceAccountKey.json` to version control!

### 3. Install Functions Dependencies

```bash
cd functions
npm install
cd ..
```

## Development

### Run Firebase Emulators (Local Testing)

```bash
# Start all emulators
firebase emulators:start

# Or start only functions emulator
firebase emulators:start --only functions
```

The emulator UI will be available at: `http://localhost:4000`

### Update Frontend for Emulator

Add to your `.env` file:

```
VITE_USE_FIREBASE_EMULATOR=true
```

This will make your frontend connect to local emulators instead of production.

## Deployment

### 1. Build Frontend

```bash
npm run build
```

### 2. Deploy Functions Only

```bash
firebase deploy --only functions
```

### 3. Deploy Hosting Only

```bash
firebase deploy --only hosting
```

### 4. Deploy Everything

```bash
firebase deploy
```

## Environment Variables

### Frontend (.env)

```env
# Firebase Config
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Emulator (for development)
VITE_USE_FIREBASE_EMULATOR=false
```

## Firestore Security Rules

Update your Firestore security rules to work with Cloud Functions:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      // Anyone authenticated can read their own profile
      allow read: if request.auth != null && request.auth.uid == userId;
      
      // Users can create their own profile on signup
      allow create: if request.auth != null && 
                      request.auth.uid == userId &&
                      request.resource.data.role in ['student', 'warden', 'management'];
      
      // Only allow updates through Cloud Functions or for non-critical fields
      allow update: if request.auth != null && 
                      request.auth.uid == userId &&
                      // Users can update these fields only
                      request.resource.data.diff(resource.data).affectedKeys()
                        .hasOnly(['phone', 'fullName', 'updatedAt']);
      
      // Admins can read all profiles (checked in backend)
      allow read: if request.auth != null;
      
      // Prevent direct deletes (must go through Cloud Functions)
      allow delete: if false;
    }
  }
}
```

## Testing Cloud Functions

### Test Approve User

```javascript
import { httpsCallable } from 'firebase/functions';
import { functions } from './firebase/firebaseConfig';

const approveUser = httpsCallable(functions, 'approveUser');
const result = await approveUser({ 
  userId: 'user_id_here',
  approverRole: 'owner'
});
console.log(result.data);
```

### Test Health Check

```javascript
import { healthCheck } from './firebase/cloudFunctions';

const result = await healthCheck();
console.log(result); // { success: true, timestamp: "...", service: "HOAS Cloud Functions" }
```

## Available Cloud Functions

### User Management
- `approveUser(userId, approverRole)` - Approve a user
- `denyUser(userId, reason)` - Deny a user
- `getCollegeUsers(collegeId, role, status)` - Get users for a college
- `getAllManagementUsers()` - Get all management users (admin only)

### College Management
- `deleteCollege(collegeId)` - Delete college and all users (admin only)
- `getCollegeStats(collegeId)` - Get college statistics

### Admin Functions
- `setAdminClaim(email, isAdmin)` - Set admin custom claim
- `getUserProfile(userId)` - Get user profile
- `updateUserProfile(profileData, userId)` - Update user profile

### Utility
- `healthCheck()` - Check if functions are working

## Monitoring & Logs

### View Function Logs

```bash
# Stream logs
firebase functions:log

# Filter by function
firebase functions:log --only approveUser

# View last 100 lines
firebase functions:log -n 100
```

### View Logs in Firebase Console

1. Go to Firebase Console
2. Navigate to **Functions** section
3. Click on **Logs** tab
4. Filter by function name or severity

## Cost Optimization

### Free Tier Limits
- 2M invocations/month
- 400,000 GB-seconds compute time
- 200,000 CPU-seconds
- 5GB outbound networking

### Tips to Stay Within Free Tier
1. Use Firestore listeners for real-time updates (already implemented)
2. Only call functions for write operations
3. Cache function results when possible
4. Use batching for multiple operations

## Troubleshooting

### Function Deployment Fails

```bash
# Check Firebase CLI version
firebase --version

# Re-authenticate
firebase login --reauth

# Clear cache and redeploy
rm -rf functions/node_modules
cd functions && npm install && cd ..
firebase deploy --only functions
```

### CORS Errors

The functions are configured with CORS support. If you encounter issues:

1. Check the function's CORS configuration in `index.js`
2. Ensure you're calling from an allowed origin
3. Check browser console for specific error messages

### Permission Denied Errors

1. Verify the user is authenticated
2. Check if the user has the required role/permissions
3. Review Firestore security rules
4. Check function logs for detailed error messages

### Cold Start Issues

Cloud Functions may have cold starts (1-2 second delay). To minimize:
- Keep functions warm with scheduled pings (if needed)
- Use lower-tier instances for development
- Consider Cloud Run for production if cold starts are critical

## Rollback

If a deployment causes issues:

```bash
# View deployment history
firebase deploy:history

# Rollback to previous version
firebase rollback functions:functionName <version_id>
```

## Production Checklist

Before deploying to production:

- [ ] Update `.firebaserc` with production project ID
- [ ] Set proper Firestore security rules
- [ ] Remove `VITE_USE_FIREBASE_EMULATOR` from `.env`
- [ ] Test all functions in emulator
- [ ] Review and optimize function costs
- [ ] Set up error monitoring/alerting
- [ ] Document any API changes
- [ ] Test frontend with production functions
- [ ] Create backup of current deployment

## Next Steps

1. Set up email notifications in Cloud Functions (using SendGrid/Mailgun)
2. Add rate limiting for function calls
3. Implement caching layer (Redis)
4. Set up CI/CD pipeline for automated deployments
5. Add comprehensive error tracking (Sentry)
6. Create admin dashboard for monitoring function usage
