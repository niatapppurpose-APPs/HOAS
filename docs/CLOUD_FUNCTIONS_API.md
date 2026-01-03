# HOAS Backend - Cloud Functions API Reference

## Overview

This document provides a comprehensive reference for all Firebase Cloud Functions used in the HOAS (Hostel Operations Accountability System) backend.

**Base URL (Development):** `http://localhost:5001/YOUR_PROJECT_ID/us-central1/`  
**Base URL (Production):** `https://us-central1-YOUR_PROJECT_ID.cloudfunctions.net/`

All functions are callable via Firebase SDK's `httpsCallable` method.

---

## Authentication

All functions require Firebase Authentication. Include the ID token in your requests automatically via the Firebase SDK.

```javascript
import { httpsCallable } from 'firebase/functions';
import { functions } from './firebase/firebaseConfig';

const myFunction = httpsCallable(functions, 'functionName');
const result = await myFunction(data);
```

---

## User Management Functions

### 1. approveUser

Approve a pending user (Management, Warden, or Student).

**Authorization:**
- Management users: Requires admin (Owner)
- Warden/Student: Requires admin OR parent Management user

**Request:**
```javascript
{
  userId: string,        // Required: UID of user to approve
  approverRole: string   // Optional: 'owner', 'management', 'warden'
}
```

**Response:**
```javascript
{
  success: true,
  message: "User approved successfully"
}
```

**Errors:**
- `unauthenticated`: User not logged in
- `permission-denied`: Insufficient permissions
- `not-found`: User not found
- `invalid-argument`: Missing userId

**Example:**
```javascript
import { approveUser } from './firebase/cloudFunctions';

try {
  const result = await approveUser('user_uid_123', 'owner');
  console.log(result.message);
} catch (error) {
  console.error(error.message);
}
```

---

### 2. denyUser

Deny a user's registration request.

**Authorization:** Same as `approveUser`

**Request:**
```javascript
{
  userId: string,   // Required: UID of user to deny
  reason: string    // Optional: Reason for denial
}
```

**Response:**
```javascript
{
  success: true,
  message: "User denied successfully"
}
```

**Errors:** Same as `approveUser`

**Example:**
```javascript
import { denyUser } from './firebase/cloudFunctions';

const result = await denyUser('user_uid_123', 'Invalid credentials');
```

---

### 3. getCollegeUsers

Get all users (Wardens and Students) for a specific college.

**Authorization:** Requires admin OR Management user of the specified college

**Request:**
```javascript
{
  collegeId: string,   // Required: UID of Management user (college)
  role: string,        // Optional: Filter by role ('warden' or 'student')
  status: string       // Optional: Filter by status ('pending', 'approved', 'denied')
}
```

**Response:**
```javascript
{
  success: true,
  users: [
    {
      id: string,
      uid: string,
      email: string,
      displayName: string,
      role: string,
      status: string,
      managementId: string,
      collegeName: string,
      // ... other user fields
    }
  ]
}
```

**Example:**
```javascript
import { getCollegeUsers } from './firebase/cloudFunctions';

// Get all pending students
const result = await getCollegeUsers('college_uid', 'student', 'pending');
console.log(result.users);
```

---

### 4. getAllManagementUsers

Get all Management (Principal) users across all colleges.

**Authorization:** Requires admin (Owner only)

**Request:**
```javascript
// No parameters required
{}
```

**Response:**
```javascript
{
  success: true,
  users: [
    {
      id: string,
      uid: string,
      email: string,
      displayName: string,
      role: 'management',
      status: string,
      collegeName: string,
      address: string,
      // ... other fields
    }
  ]
}
```

**Example:**
```javascript
import { getAllManagementUsers } from './firebase/cloudFunctions';

const result = await getAllManagementUsers();
const colleges = result.users;
```

---

## College Management Functions

### 5. deleteCollege

Delete a college (Management user) and all associated Wardens and Students (cascade delete).

**Authorization:** Requires admin (Owner only)

**Request:**
```javascript
{
  collegeId: string   // Required: UID of Management user to delete
}
```

**Response:**
```javascript
{
  success: true,
  message: "College deleted successfully",
  stats: {
    wardensDeleted: number,
    studentsDeleted: number
  }
}
```

**Errors:**
- `not-found`: College not found
- `invalid-argument`: Not a management user

**Example:**
```javascript
import { deleteCollege } from './firebase/cloudFunctions';

const result = await deleteCollege('college_uid');
console.log(`Deleted ${result.stats.wardensDeleted} wardens and ${result.stats.studentsDeleted} students`);
```

---

### 6. getCollegeStats

Get statistics for a specific college (warden and student counts by status).

**Authorization:** Requires admin OR Management user of the specified college

**Request:**
```javascript
{
  collegeId: string   // Required: UID of Management user
}
```

**Response:**
```javascript
{
  success: true,
  stats: {
    wardens: {
      total: number,
      pending: number,
      approved: number,
      denied: number
    },
    students: {
      total: number,
      pending: number,
      approved: number,
      denied: number
    }
  }
}
```

**Example:**
```javascript
import { getCollegeStats } from './firebase/cloudFunctions';

const result = await getCollegeStats('college_uid');
console.log(`Total students: ${result.stats.students.total}`);
console.log(`Pending approvals: ${result.stats.students.pending}`);
```

---

## Admin Functions

### 7. setAdminClaim

Set or revoke admin custom claim for a user (Owner role).

**Authorization:** Requires admin (existing Owner)

**Request:**
```javascript
{
  email: string,      // Required: Email of user to modify
  isAdmin: boolean    // Required: true to grant, false to revoke
}
```

**Response:**
```javascript
{
  success: true,
  message: "Admin status granted for user@example.com"
}
```

**Example:**
```javascript
import { setAdminClaim } from './firebase/cloudFunctions';

// Grant admin access
await setAdminClaim('newadmin@example.com', true);

// Revoke admin access
await setAdminClaim('oldadmin@example.com', false);
```

---

### 8. getUserProfile

Get detailed profile information for a user.

**Authorization:**
- Own profile: Any authenticated user
- Other profiles: Requires admin

**Request:**
```javascript
{
  userId: string   // Optional: UID of user (defaults to current user)
}
```

**Response:**
```javascript
{
  success: true,
  profile: {
    id: string,
    uid: string,
    email: string,
    displayName: string,
    photoURL: string,
    role: string,
    status: string,
    createdAt: string,
    updatedAt: string,
    // ... role-specific fields
  } | null   // null if profile doesn't exist
}
```

**Example:**
```javascript
import { getUserProfile } from './firebase/cloudFunctions';

// Get own profile
const myProfile = await getUserProfile();

// Get another user's profile (admin only)
const userProfile = await getUserProfile('other_user_uid');
```

---

### 9. updateUserProfile

Update user profile information.

**Authorization:**
- Own profile: Can update limited fields
- Other profiles: Requires admin

**Allowed Fields (Non-Admin):**
- fullName
- phone
- designation
- address
- rollNumber
- roomNumber
- collegeName

**Request:**
```javascript
{
  userId: string,        // Optional: UID of user to update (defaults to current user)
  profileData: {
    fullName: string,
    phone: string,
    designation: string,
    address: string,
    rollNumber: string,
    roomNumber: string,
    collegeName: string
  }
}
```

**Response:**
```javascript
{
  success: true,
  message: "Profile updated successfully"
}
```

**Example:**
```javascript
import { updateUserProfile } from './firebase/cloudFunctions';

const result = await updateUserProfile({
  fullName: 'John Doe',
  phone: '+1234567890',
  roomNumber: '101'
});
```

---

## Utility Functions

### 10. healthCheck

Check if Cloud Functions are operational.

**Authorization:** None required

**Request:**
```javascript
// No parameters required
{}
```

**Response:**
```javascript
{
  success: true,
  timestamp: "2025-12-22T10:30:00.000Z",
  service: "HOAS Cloud Functions",
  version: "1.0.0"
}
```

**Example:**
```javascript
import { healthCheck } from './firebase/cloudFunctions';

const result = await healthCheck();
console.log(`Service: ${result.service} - Status: OK`);
```

---

## Firestore Triggers

These functions run automatically in response to Firestore changes.

### onUserCreated

**Trigger:** When a new user document is created in `/users/{userId}`

**Actions:**
- Logs user creation
- TODO: Send notification to admin/management
- TODO: Create audit log entry

**No client-side interaction required**

---

### onUserStatusChanged

**Trigger:** When a user's status field is updated

**Actions:**
- Detects status changes (pending → approved/denied)
- Logs status change
- TODO: Send email notification to user
- TODO: Send push notification
- TODO: Create audit log entry

**No client-side interaction required**

---

## Error Handling

All functions return consistent error format:

```javascript
{
  code: string,           // Error code (e.g., 'permission-denied')
  message: string,        // Human-readable error message
  details: object         // Optional: Additional error details
}
```

### Common Error Codes

| Code | Description |
|------|-------------|
| `unauthenticated` | User not logged in |
| `permission-denied` | Insufficient permissions |
| `not-found` | Requested resource not found |
| `invalid-argument` | Missing or invalid parameters |
| `already-exists` | Resource already exists |
| `internal` | Internal server error |

### Error Handling Example

```javascript
import { approveUser } from './firebase/cloudFunctions';

try {
  const result = await approveUser('user_id');
  console.log('Success:', result.message);
} catch (error) {
  switch (error.code) {
    case 'permission-denied':
      alert('You do not have permission to perform this action');
      break;
    case 'not-found':
      alert('User not found');
      break;
    default:
      alert(`Error: ${error.message}`);
  }
}
```

---

## Rate Limits

Current rate limits (can be adjusted):
- **Default:** 1000 requests/minute per user
- **Admin functions:** 100 requests/minute per user

Exceeded limits return `429 Too Many Requests` error.

---

## Best Practices

1. **Always handle errors** - Use try/catch blocks
2. **Show user feedback** - Display success/error messages
3. **Validate input** - Check data before calling functions
4. **Use TypeScript** - For type safety (recommended)
5. **Cache when possible** - Don't call functions unnecessarily
6. **Monitor usage** - Check Firebase Console for function metrics

---

## Migration from Direct Firestore Access

### Before (Direct Firestore)
```javascript
import { doc, updateDoc } from 'firebase/firestore';

await updateDoc(doc(db, 'users', userId), {
  status: 'approved',
  approvedBy: currentUser.uid
});
```

### After (Cloud Functions)
```javascript
import { approveUser } from './firebase/cloudFunctions';

await approveUser(userId, 'owner');
```

**Benefits:**
- Server-side validation
- Proper authorization checks
- Audit logging
- Consistent error handling
- Future extensibility (emails, notifications, etc.)

---

## Support

For issues or questions:
1. Check function logs: `firebase functions:log`
2. Review this documentation
3. Test with emulators first
4. Contact development team

---

**Last Updated:** December 22, 2025  
**Version:** 1.0.0
