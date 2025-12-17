# HOAS - Hostel Owner Admin System

## Project Overview
A comprehensive hostel management system with role-based access control, user approval workflows, and hierarchical administration.

---

## 🏗️ Architecture

### User Hierarchy
```
Owner (Super Admin)
    └── Management (Principal/Co-Admin)
            ├── Wardens
            └── Students
```

### Roles & Permissions

| Role | Description | Approved By |
|------|-------------|-------------|
| **Owner** | Super Admin with full system access | Firebase Admin SDK |
| **Management** | College/Hostel Principal (Co-Admin) | Owner |
| **Warden** | Hostel Warden | Management |
| **Student** | Hostel Student | Management |

---

## ✅ Features Implemented

### 1. Authentication System
- [x] Google OAuth login via Firebase Auth
- [x] Persistent auth state with AuthContext
- [x] Role-based routing protection
- [x] Admin authentication via custom claims

### 2. Role Selection Flow
- [x] New users select their role (Student/Warden/Management)
- [x] **College Selection Dropdown** - Students & Wardens must select their college during registration
- [x] `managementId` field links users to their Principal
- [x] Automatic redirect to waiting approval page

### 3. Owner Dashboard (`/owner-dashboard`)
- [x] View all Management (Principal) users
- [x] Approve/Deny pending management requests
- [x] Stats cards showing total, pending, and approved counts
- [x] Tab filtering (All/Pending/Approved)
- [x] **Delete College Feature** - Cascade delete removes:
  - The Management account
  - All Wardens under that college
  - All Students under that college
- [x] Confirmation modal with user count before deletion
- [x] Real-time updates via Firestore onSnapshot

### 4. Co-Admin Dashboard (Principal) (`/dashboard/management`)
- [x] View Wardens and Students linked to their college
- [x] Approve/Deny pending warden/student requests
- [x] Stats cards with pending counts
- [x] Tab switching between Wardens and Students
- [x] Smart sorting (Pending requests appear first)
- [x] Real-time updates via Firestore onSnapshot

### 5. Waiting Approval Page
- [x] Shows user profile and role
- [x] Real-time status listener
- [x] Automatic redirect when approved
- [x] Progress indicators (Account created → Profile submitted → Waiting)

### 6. Student Dashboard (`/dashboard/student`)
- [x] Basic dashboard structure
- [x] Protected route (requires approved student role)

### 7. Warden Dashboard (`/dashboard/warden`)
- [x] Basic dashboard structure
- [x] Protected route (requires approved warden role)

---

## 📁 File Structure

```
src/
├── components/
│   ├── Routes/
│   │   └── index.jsx           # App routing configuration
│   ├── UserServices/
│   │   ├── userrole.jsx        # Role selection with college dropdown
│   │   └── userrole.css
│   └── OwnerServices/
│       └── header.jsx
├── context/
│   └── AuthContext.jsx         # Firebase auth state management
├── DashBoards/
│   ├── Principal-Dashbord/
│   │   ├── index.jsx
│   │   └── PrincipalDashboard.jsx  # Management dashboard
│   ├── Student-DashBoard/
│   │   ├── index.jsx
│   │   └── StudentDashboard.jsx
│   └── Warden-Dashboard/
│       ├── index.jsx
│       └── WardenDashboard.jsx
├── firebase/
│   └── firebaseConfig.js       # Firebase configuration
├── Pages/
│   ├── AdminLogin/
│   │   └── AdminLogin.jsx      # Owner login page
│   ├── Dashboard/
│   │   ├── Dashboard.jsx
│   │   └── dashboard.css
│   ├── HOME/
│   │   ├── home.jsx
│   │   └── home.css
│   ├── LoginPage/
│   │   ├── Login.jsx
│   │   ├── LoginButton.jsx
│   │   └── LogoutButton.jsx
│   ├── OwnersDashboard/
│   │   └── ownersdashbord.jsx  # Owner dashboard with delete feature
│   ├── ProfilePage/
│   │   ├── Profile.jsx
│   │   └── Profile.css
│   └── WaitingApproval/
│       └── WaitingApproval.jsx # Approval waiting page
└── App.jsx
```

---

## 🔥 Firestore Data Structure

### Users Collection (`/users/{userId}`)
```javascript
{
  uid: "firebase-user-id",
  email: "user@example.com",
  displayName: "User Name",
  photoURL: "https://...",
  role: "student" | "warden" | "management",
  status: "pending" | "approved" | "denied",
  managementId: "principal-uid",  // For students & wardens only
  collegeName: "College Name",     // For students & wardens only
  createdAt: Timestamp,
  updatedAt: Timestamp,
  approvedBy: "approver-uid",      // When approved
  approvedAt: "ISO-date-string"    // When approved
}
```

---

## 🔧 Technical Details

### Status Handling
- All status comparisons are case-insensitive (handles "pending", "PENDING", "Pending")
- Status values stored in lowercase for consistency

### Real-time Updates
- Firestore `onSnapshot` listeners for live data
- Automatic UI updates when data changes
- Proper cleanup of listeners on component unmount

### Cascade Delete (Owner)
- Uses Firestore `writeBatch` for atomic operations
- Queries all related wardens and students by `managementId`
- Deletes all in single transaction

---

## 🚀 How to Run

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

---

## 📝 Environment Variables

Create a `.env` file with your Firebase config:
```
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-auth-domain
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-storage-bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

---

## 📅 Version History

### v1.0.2 (December 17, 2025)
**Code Cleanup & Documentation**
- Removed unused components from OwnersDashboard:
  - `UserListItem` - was for accordion warden/student list (never used)
  - `CollegeDetails` - accordion content section (never rendered)
  - `CollegeRow` - expandable college row (never called)
- Removed unused icon imports: `GraduationCap`, `Shield`, `ChevronDown`, `ChevronUp`, `MapPin`, `RefreshCw`
- Fixed Avatar component image display:
  - Corrected `imageError` state logic for fallback to initials
  - Added `referrerPolicy="no-referrer"` for Google profile image compatibility
- Added descriptive comments for each component explaining its purpose
- Reduced ownersdashbord.jsx by ~170 lines of dead code

### v1.0.1 (December 16, 2025)
- Bug fixes and minor improvements

### v1.0.0 (December 16, 2025)
- Initial implementation
- User authentication with Google OAuth
- Role-based access control
- Owner, Management, Warden, Student dashboards
- Approval workflow system
- College selection for students/wardens
- Cascade delete feature for Owner

---

## 🔮 Future Enhancements (TODO)
- [ ] Room allocation system
- [ ] Complaint management
- [ ] Fee payment tracking
- [ ] Attendance system
- [ ] Leave request management
- [ ] Notifications system
- [ ] Reports and analytics
