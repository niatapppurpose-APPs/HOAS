# 🎯 Deployment Checklist

Use this checklist to ensure successful deployment of your HOAS full-stack application.

---

## 📋 Pre-Deployment Checklist

### 1. Environment Setup
- [ ] Node.js 20+ installed
- [ ] Firebase CLI installed (`npm install -g firebase-tools`)
- [ ] Logged into Firebase (`firebase login`)
- [ ] Firebase project created in console

### 2. Project Configuration
- [ ] `.firebaserc` updated with correct project ID
- [ ] `.env` file created from `.env.example`
- [ ] All Firebase credentials added to `.env`
- [ ] Service account key copied to `functions/serviceAccountKey.json`
- [ ] `functions/serviceAccountKey.json` added to `.gitignore`

### 3. Dependencies
- [ ] Frontend dependencies installed (`npm install`)
- [ ] Functions dependencies installed (`cd functions && npm install && cd ..`)
- [ ] No dependency errors or warnings

### 4. Code Review
- [ ] All console.logs removed or minimized
- [ ] No hardcoded credentials
- [ ] Error handling in place
- [ ] Loading states implemented

---

## 🧪 Local Testing Checklist

### 1. Emulator Testing
- [ ] Emulators start successfully (`firebase emulators:start`)
- [ ] Functions listed in emulator UI (http://localhost:4000)
- [ ] Frontend connects to emulators (`VITE_USE_FIREBASE_EMULATOR=true`)

### 2. Function Testing
- [ ] `healthCheck` function works
- [ ] `approveUser` function works (Owner → Management)
- [ ] `approveUser` function works (Management → Warden)
- [ ] `approveUser` function works (Management → Student)
- [ ] `denyUser` function works
- [ ] `deleteCollege` function works (cascade delete verified)
- [ ] `getCollegeStats` function works
- [ ] `getAllManagementUsers` function works (admin only)
- [ ] `getUserProfile` function works
- [ ] `updateUserProfile` function works
- [ ] `setAdminClaim` function works

### 3. Frontend Testing
- [ ] Login works (Google OAuth)
- [ ] Role selection works
- [ ] Waiting approval page displays correctly
- [ ] Owner dashboard loads
- [ ] Management dashboard loads
- [ ] Warden dashboard loads
- [ ] Student dashboard loads
- [ ] Real-time updates work
- [ ] Error messages display properly
- [ ] Loading states show correctly

### 4. User Flow Testing
- [ ] New user can register
- [ ] New user selects role
- [ ] New user sees waiting approval page
- [ ] Owner can approve/deny management
- [ ] Management can approve/deny wardens
- [ ] Management can approve/deny students
- [ ] Warden can approve/deny students
- [ ] Approved user can access dashboard
- [ ] Denied user sees denial message
- [ ] Logout works correctly

### 5. Authorization Testing
- [ ] Non-admin cannot approve management users
- [ ] Management cannot approve users from other colleges
- [ ] Warden cannot approve users from other colleges
- [ ] Student cannot access admin functions
- [ ] Proper error messages for unauthorized actions

---

## 🚀 Deployment Checklist

### 1. Pre-Deployment
- [ ] All local tests passing
- [ ] Git committed all changes
- [ ] Removed emulator flag from `.env` (`VITE_USE_FIREBASE_EMULATOR=false`)
- [ ] Production Firebase credentials in `.env`
- [ ] No sensitive data in code

### 2. Build
- [ ] Frontend builds successfully (`npm run build`)
- [ ] No build errors or warnings
- [ ] Build output in `dist/` folder
- [ ] Assets properly bundled

### 3. Functions Deployment
- [ ] Functions deploy successfully (`firebase deploy --only functions`)
- [ ] All 12 functions listed in Firebase Console
- [ ] Function logs show no errors
- [ ] Check function quotas in Firebase Console

### 4. Hosting Deployment
- [ ] Hosting configured in `firebase.json`
- [ ] Deploy hosting (`firebase deploy --only hosting`)
- [ ] Site accessible at Firebase hosting URL
- [ ] All routes work correctly
- [ ] Assets load properly

### 5. Firestore Setup
- [ ] Firestore database created
- [ ] Security rules deployed (see below)
- [ ] Indexes created (if needed)
- [ ] Test data created (if needed)

---

## 🔐 Security Checklist

### 1. Firestore Security Rules
Deploy these security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      // Users can read their own profile
      allow read: if request.auth != null && request.auth.uid == userId;
      
      // Users can create their own profile
      allow create: if request.auth != null && 
                      request.auth.uid == userId &&
                      request.resource.data.role in ['student', 'warden', 'management'];
      
      // Users can update limited fields on their own profile
      allow update: if request.auth != null && 
                      request.auth.uid == userId &&
                      request.resource.data.diff(resource.data).affectedKeys()
                        .hasOnly(['phone', 'fullName', 'updatedAt']);
      
      // Admins can read all (backend will verify)
      allow read: if request.auth != null;
      
      // No direct deletes (must go through Cloud Functions)
      allow delete: if false;
    }
  }
}
```

- [ ] Security rules deployed
- [ ] Rules tested in Firebase Console
- [ ] Direct writes blocked (except create/limited update)
- [ ] Direct deletes blocked

### 2. Admin Claims
- [ ] Admin emails set in `setAdmin.js`
- [ ] Run `node setAdmin.js` for production
- [ ] Verify admin status in Firebase Console
- [ ] Test admin access in production

### 3. API Keys & Secrets
- [ ] `.env` not committed to Git
- [ ] `.gitignore` includes `.env`
- [ ] Service account key not committed
- [ ] Environment variables set in production

---

## 📊 Post-Deployment Checklist

### 1. Functionality Verification
- [ ] Visit production URL
- [ ] Login works
- [ ] Owner dashboard accessible
- [ ] Management dashboard accessible
- [ ] Warden dashboard accessible
- [ ] Student dashboard accessible
- [ ] Real-time updates work
- [ ] All CRUD operations work

### 2. Performance
- [ ] Initial load time < 3 seconds
- [ ] Function cold start acceptable
- [ ] No console errors
- [ ] No network errors

### 3. Monitoring Setup
- [ ] Firebase Console: Functions logs monitored
- [ ] Firebase Console: Firestore usage checked
- [ ] Firebase Console: Authentication working
- [ ] Set up billing alerts (if using paid tier)

### 4. Cost Monitoring
- [ ] Check current usage in Firebase Console
- [ ] Verify staying within free tier limits
- [ ] Set up budget alerts
- [ ] Monitor function invocations

---

## 🔍 Testing in Production

### 1. Create Test Accounts
- [ ] Create test Owner account
- [ ] Create test Management account
- [ ] Create test Warden account
- [ ] Create test Student account

### 2. Test Full User Flow
- [ ] New Management user registers
- [ ] Owner approves Management
- [ ] Management creates college profile
- [ ] New Warden registers under college
- [ ] Management approves Warden
- [ ] New Student registers under college
- [ ] Warden/Management approves Student
- [ ] All users can access their dashboards

### 3. Test Critical Operations
- [ ] Approve user
- [ ] Deny user
- [ ] Delete college (with test data)
- [ ] Update profile
- [ ] Logout and re-login
- [ ] Real-time updates across devices

---

## 📝 Documentation Checklist

- [ ] README.md updated with production URL
- [ ] Team members have access to:
  - [ ] Firebase Console
  - [ ] GitHub repository
  - [ ] Documentation files
- [ ] Admin credentials securely shared
- [ ] Deployment process documented
- [ ] Troubleshooting guide reviewed

---

## 🐛 Troubleshooting Verification

### Common Issues Tested
- [ ] "Permission denied" - Admin claims set correctly
- [ ] "Function not found" - All functions deployed
- [ ] "CORS error" - Functions include CORS headers
- [ ] "Cold start delay" - Expected behavior documented
- [ ] "Database permission denied" - Security rules correct

---

## 🎯 Success Criteria

Deployment is successful when ALL of these are true:

- [ ] ✅ All 12 Cloud Functions deployed and working
- [ ] ✅ Frontend accessible at production URL
- [ ] ✅ Owner can approve Management users
- [ ] ✅ Management can approve Wardens/Students
- [ ] ✅ Wardens can approve Students
- [ ] ✅ Real-time updates working
- [ ] ✅ No errors in Firebase Console logs
- [ ] ✅ No console errors in browser
- [ ] ✅ All user roles tested
- [ ] ✅ Security rules deployed
- [ ] ✅ Costs within expected range
- [ ] ✅ Performance acceptable

---

## 📞 Emergency Rollback

If issues occur after deployment:

### Functions Rollback
```bash
# View deployment history
firebase deploy:history

# Rollback specific function
firebase rollback functions:approveUser <version_id>
```

### Frontend Rollback
```bash
# Redeploy previous build
firebase deploy --only hosting
```

### Database Rollback
- [ ] Firestore has no automatic rollback
- [ ] Restore from backup (if configured)
- [ ] Manually revert changes

---

## 🎊 Launch Checklist

Ready to go live?

- [ ] All testing complete
- [ ] Team trained on system
- [ ] Documentation complete
- [ ] Support process in place
- [ ] Monitoring configured
- [ ] Backup strategy defined
- [ ] Communication plan ready
- [ ] Launch announcement prepared

---

## 📅 Post-Launch Tasks

### Within 24 Hours
- [ ] Monitor function logs for errors
- [ ] Check user feedback
- [ ] Verify all dashboards working
- [ ] Monitor Firebase usage/costs

### Within 1 Week
- [ ] Review function performance
- [ ] Optimize slow operations
- [ ] Address any user issues
- [ ] Update documentation based on feedback

### Within 1 Month
- [ ] Review analytics
- [ ] Plan feature enhancements
- [ ] Optimize costs
- [ ] Scale infrastructure if needed

---

## ✅ Sign-Off

Deployment completed by: _______________  
Date: _______________  
Version deployed: 1.0.0  
Production URL: _______________  

Verified by: _______________  
Date: _______________  

---

**Status:** Ready for deployment when all checkboxes are completed!

**Good luck! 🚀**
