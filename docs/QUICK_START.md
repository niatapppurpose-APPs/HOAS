# Quick Start: HOAS with Firebase Functions

## 🚀 Getting Started (5 Minutes)

### Prerequisites
- Node.js 20+ installed
- Firebase account
- Git installed

### Step 1: Install Firebase CLI (1 min)
```bash
npm install -g firebase-tools
firebase login
```

### Step 2: Configure Project (1 min)

1. Edit `.firebaserc` - replace with your project ID:
```json
{
  "projects": {
    "default": "your-firebase-project-id"
  }
}
```

2. Copy service account key:
```bash
cp serviceAccountKey.json functions/serviceAccountKey.json
```

### Step 3: Install Dependencies (2 min)
```bash
# Install frontend dependencies
npm install

# Install functions dependencies
cd functions
npm install
cd ..
```

### Step 4: Test Locally (1 min)
```bash
# Terminal 1: Start Firebase Emulators
firebase emulators:start

# Terminal 2: Start frontend
npm run dev
```

Add to `.env`:
```
VITE_USE_FIREBASE_EMULATOR=true
```

Visit: `http://localhost:5173`

### Step 5: Deploy to Production
```bash
# Build frontend
npm run build

# Deploy everything
firebase deploy
```

---

## 🎯 What's New?

### Backend Features
✅ **10 Cloud Functions** for secure operations  
✅ **Authorization** on every backend call  
✅ **Server-side validation**  
✅ **Audit logging** (ready for implementation)  
✅ **Email/SMS** (ready for implementation)  

### Frontend Updates
✅ All dashboards now call Cloud Functions  
✅ Better error handling  
✅ User feedback on operations  
✅ Real-time listeners for reads (performance)  

---

## 📖 Documentation

| Document | Purpose |
|----------|---------|
| [BACKEND_MIGRATION.md](./BACKEND_MIGRATION.md) | Migration summary & what changed |
| [FIREBASE_FUNCTIONS_DEPLOYMENT.md](./FIREBASE_FUNCTIONS_DEPLOYMENT.md) | Detailed deployment guide |
| [CLOUD_FUNCTIONS_API.md](./CLOUD_FUNCTIONS_API.md) | Complete API reference |
| [PROJECT_DOCUMENTATION.md](./PROJECT_DOCUMENTATION.md) | Full project documentation |

---

## 🔥 Available Cloud Functions

### User Management
```javascript
import * as cloudFunctions from './firebase/cloudFunctions';

// Approve user
await cloudFunctions.approveUser(userId, 'owner');

// Deny user
await cloudFunctions.denyUser(userId, 'Invalid');

// Get college users
const { users } = await cloudFunctions.getCollegeUsers(collegeId);
```

### College Management
```javascript
// Delete college (cascade)
await cloudFunctions.deleteCollege(collegeId);

// Get stats
const { stats } = await cloudFunctions.getCollegeStats(collegeId);
```

### Admin
```javascript
// Set admin claim
await cloudFunctions.setAdminClaim('user@example.com', true);

// Get profile
const { profile } = await cloudFunctions.getUserProfile(userId);

// Update profile
await cloudFunctions.updateUserProfile({ fullName: 'New Name' });
```

---

## ⚡ Quick Commands

```bash
# Development
npm run dev                          # Start frontend
firebase emulators:start            # Start backend locally

# Deployment
npm run build                        # Build frontend
firebase deploy --only functions    # Deploy backend only
firebase deploy                      # Deploy everything

# Monitoring
firebase functions:log              # View function logs
firebase emulators:start --ui       # Emulator UI (http://localhost:4000)

# Troubleshooting
cd functions && npm install && cd ..  # Reinstall functions deps
firebase logout && firebase login     # Re-authenticate
```

---

## 🐛 Common Issues

### "Permission denied"
→ Run: `node setAdmin.js` to set admin claims

### "Functions not found"
→ Check `.firebaserc` has correct project ID  
→ Run: `firebase deploy --only functions`

### "CORS error"
→ Functions include CORS support  
→ Check you're calling from correct domain

---

## 💡 Tips

1. **Always test with emulators first**
2. **Monitor function logs** after deployment
3. **Keep Firestore rules updated**
4. **Check Firebase Console** for usage/costs
5. **Use TypeScript** for better type safety (future)

---

## 📞 Need Help?

1. Check [BACKEND_MIGRATION.md](./BACKEND_MIGRATION.md)
2. Review [CLOUD_FUNCTIONS_API.md](./CLOUD_FUNCTIONS_API.md)
3. Check function logs: `firebase functions:log`
4. Review Firebase Console errors

---

**Ready to deploy?** Follow [FIREBASE_FUNCTIONS_DEPLOYMENT.md](./FIREBASE_FUNCTIONS_DEPLOYMENT.md) for detailed instructions!

---

**Version:** 1.0.0  
**Last Updated:** December 22, 2025
