# HOAS - Hostel Operations Accountability System

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


<!-- This All Work Completed the two day of planing This Work is done All thing are getting Ready -->

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
- [x] **Owner Profile Page** (`/owner-profile`)
  - Profile icon button in header for quick access
  - View and edit display name, phone, and organization
  - Profile photo display (from Google OAuth)
  - Account status and creation date info
  - Save profile data to Firestore (`admins` collection)
  - Logout functionality from profile page
  - Admin verification badge

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
│       ├── header.jsx          # Owner dashboard header with profile icon
│       └── OwnerProfile.jsx    # Owner profile page
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

## 📚 Code Explanation (Complex Concepts)

### 1. Firestore `onSnapshot` - Real-time Listener

```javascript
const unsubscribe = onSnapshot(usersQuery, (snapshot) => {
  const usersData = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  }));
  setAllUsers(usersData);
}, (error) => {
  console.error("Error:", error);
});

return () => unsubscribe(); // Cleanup on unmount
```

**What it does:**
- `onSnapshot` creates a **real-time connection** to Firestore
- Unlike `getDocs()` which fetches data once, `onSnapshot` **listens continuously**
- Whenever data changes in Firestore (add/update/delete), callback runs automatically
- `snapshot.docs` contains array of all matching documents
- `doc.id` = document ID, `doc.data()` = document fields
- **IMPORTANT:** Returns `unsubscribe` function - must call in cleanup to prevent memory leaks

**Why use it:**
- Owner approves a user → Dashboard updates instantly without refresh
- Multiple admins working → Everyone sees changes in real-time

---

### 2. Firestore `query` and `where` - Filtering Data

```javascript
const usersQuery = query(
  collection(db, "users"),
  where("role", "==", "management")
);
```

**What it does:**
- `collection(db, "users")` - Reference to the "users" collection
- `query()` - Creates a filtered query
- `where("role", "==", "management")` - Only fetch documents where `role` field equals "management"

**Multiple conditions:**
```javascript
const wardensQuery = query(
  collection(db, "users"),
  where("role", "==", "warden"),
  where("managementId", "==", college.id)
);
```
This fetches wardens that belong to a specific college.

---

### 3. Firestore `writeBatch` - Atomic Operations

```javascript
const batch = writeBatch(db);

// Queue multiple delete operations
wardensSnap.docs.forEach((docSnap) => {
  batch.delete(doc(db, "users", docSnap.id));
});

studentsSnap.docs.forEach((docSnap) => {
  batch.delete(doc(db, "users", docSnap.id));
});

batch.delete(doc(db, "users", collegeId));

// Execute all at once
await batch.commit();
```

**What it does:**
- `writeBatch` groups multiple write operations (create/update/delete)
- Operations are queued but **NOT executed** until `commit()`
- `batch.commit()` executes **ALL operations atomically**
- Either ALL succeed or ALL fail (no partial updates)

**Why use it:**
- Deleting a college must delete wardens + students + college together
- If deleting students fails, we don't want college already deleted
- Ensures data consistency

---

### 4. `useEffect` with Dependencies

```javascript
useEffect(() => {
  if (!adminChecked || !user || !isAdmin) return;
  
  // Fetch data here...
  const unsubscribe = onSnapshot(...);
  
  return () => unsubscribe(); // Cleanup
}, [user, isAdmin, adminChecked]);
```

**What it does:**
- `useEffect` runs **after** component renders
- **Dependency array** `[user, isAdmin, adminChecked]`:
  - Effect runs when ANY of these values change
  - Empty `[]` = runs only once on mount
  - No array = runs on every render (bad!)
- **Cleanup function** (return) runs when:
  - Component unmounts
  - Before effect runs again (if dependencies change)

**Why the conditions:**
- Don't fetch data until we confirm user is admin
- Prevents unnecessary API calls

---

### 5. `getDocs` vs `onSnapshot`

| Feature | `getDocs` | `onSnapshot` |
|---------|-----------|--------------|
| Fetches data | Once | Continuously |
| Real-time updates | ❌ No | ✅ Yes |
| Use case | One-time read | Live dashboards |
| Returns | Promise | Unsubscribe function |

```javascript
// One-time fetch
const snapshot = await getDocs(query);

// Real-time listener
const unsubscribe = onSnapshot(query, callback);
```

---

### 6. `doc` vs `collection` Reference

```javascript
// Reference to a COLLECTION (multiple documents)
collection(db, "users")

// Reference to a SINGLE DOCUMENT
doc(db, "users", "abc123")  // users/abc123
```

**Operations:**
- `collection` → use with `getDocs`, `onSnapshot`, `query`
- `doc` → use with `getDoc`, `updateDoc`, `deleteDoc`, `setDoc`

---

### 7. `updateDoc` - Update Specific Fields

```javascript
const userRef = doc(db, "users", userId);
await updateDoc(userRef, {
  status: "approved",
  updatedAt: new Date().toISOString(),
  approvedBy: user.uid,
});
```

**What it does:**
- Updates ONLY the specified fields
- Other fields remain unchanged
- If document doesn't exist, throws error (use `setDoc` with merge for upsert)

---

### 8. Firestore Timestamp vs JavaScript Date

```javascript
// Firestore Timestamp (stored in DB)
createdAt: Timestamp

// Converting to JavaScript Date
userData.createdAt?.toDate?.()?.toLocaleDateString()
```

**Why `?.` (optional chaining):**
- `createdAt` might be undefined
- `toDate` might not exist if it's already a string
- Prevents "Cannot read property of undefined" errors

---

### 9. Promise.all - Parallel Queries

```javascript
const [wardensSnap, studentsSnap] = await Promise.all([
  getDocs(wardensQuery),
  getDocs(studentsQuery)
]);
```

**What it does:**
- Runs both queries **simultaneously** (parallel)
- Waits for BOTH to complete
- Returns results in same order as input array

**Without Promise.all (slower):**
```javascript
const wardensSnap = await getDocs(wardensQuery);  // Wait...
const studentsSnap = await getDocs(studentsQuery); // Then wait again...
```

---

### 10. Component State Flow in OwnersDashboard

```
1. Component mounts
   ↓
2. useEffect checks: loading? adminChecked? isAdmin?
   ↓
3. If admin → Start onSnapshot listener
   ↓
4. Firestore sends data → setAllUsers(data)
   ↓
5. Component re-renders with user list
   ↓
6. User clicks "Approve" → updateDoc()
   ↓
7. Firestore updates → onSnapshot triggers → UI updates automatically
```

---

### 11. Avatar Component - Deep Dive

The Avatar component displays user profile pictures with a smart fallback to initials when image is unavailable.

#### Why We Need It:
- Google profile images may fail to load (blocked, deleted, privacy settings)
- Some users may not have profile pictures
- We need a consistent, visually appealing fallback

#### Code Breakdown:

**1. Size Classes (Responsive Sizing)**
```javascript
const sizeClasses = {
  sm: "w-8 h-8 text-xs",    // 32px - for small lists
  md: "w-10 h-10 text-sm",  // 40px - default/header
  lg: "w-12 h-12 text-base", // 48px - user cards
  xl: "w-16 h-16 text-xl",  // 64px - profile pages
};

```
- Uses Tailwind CSS classes for width, height, and text size
- Allows reusing same component at different sizes: `<Avatar size="lg" />`

**2. Color Array (Visual Variety)**
```javascript
const colors = [
  "bg-blue-500",
  "bg-green-500",
  "bg-purple-500",
  // ... 8 colors total
];
```
- Different users get different background colors
- Makes the UI more visually interesting
- Helps distinguish users quickly

**3. getColorFromName Function (Consistent Color Assignment)**
```javascript
const getColorFromName = (name) => {
  if (!name) return colors[0];
  const index = name.charCodeAt(0) % colors.length;
  return colors[index];
};
```

**What it does:**
- Takes first character of name: `"John"` → `"J"`
- Gets ASCII code: `"J".charCodeAt(0)` → `74`
- Uses modulo to get array index: `74 % 8` → `2`
- Returns: `colors[2]` → `"bg-purple-500"`

**Why this approach:**
- Same name ALWAYS gets same color (consistent across sessions)
- "John" will always be purple, "Alice" always blue
- No need to store color in database

**Visual Example:**
```
"Alice" → A (65) % 8 = 1 → bg-green-500 (green)
"Bob"   → B (66) % 8 = 2 → bg-purple-500 (purple)
"John"  → J (74) % 8 = 2 → bg-purple-500 (purple)
"Zara"  → Z (90) % 8 = 2 → bg-purple-500 (purple)
```

**4. getInitials Function (Name to Initials)**
```javascript
const getInitials = (name) => {
  if (!name) return "?";
  return name
    .split(" ")           // "John Doe" → ["John", "Doe"]
    .map((n) => n[0])     // ["John", "Doe"] → ["J", "D"]
    .join("")             // ["J", "D"] → "JD"
    .toUpperCase()        // "jd" → "JD"
    .slice(0, 2);         // "JDX" → "JD" (max 2 chars)
};
```

**Examples:**
```
"John Doe"           → "JD"
"Alice"              → "A"
"Mary Jane Watson"   → "MJ" (only first 2)
""                   → "?"
null                 → "?"
```

**5. GetImage Component (Image with Fallback)**
```javascript
const GetImage = ({ image, name, size }) => {
  const [imageError, setImageError] = useState(false)

  return (
    <>
      {imageError ? (
        // FALLBACK: Show colored circle with initials
        <div className={`${sizeClasses[size]} ${getColorFromName(name)} ...`}>
          {getInitials(name)}
        </div>
      ) : (
        // PRIMARY: Try to show the image
        <img
          src={image}
          referrerPolicy="no-referrer"  // Required for Google images
          onError={() => setImageError(true)}  // Switch to fallback on error
          ...
        />
      )}
    </>
  )
}
```

**Flow:**
```
1. Component renders with imageError = false
   ↓
2. Tries to load <img src={image} />
   ↓
3a. Image loads successfully → Shows profile picture ✓
   
3b. Image fails (404, blocked, etc.)
    ↓
    onError triggers → setImageError(true)
    ↓
    Component re-renders → Shows initials fallback ✓
```

**Why `referrerPolicy="no-referrer"`:**
- Google blocks image requests that include referrer header
- Without this, Google profile images show as broken
- This tells browser: "Don't send referrer info with this request"

#### Complete Visual Flow:

```
┌─────────────────────────────────────────────────────────-┐
│                    Avatar Component                      │
├─────────────────────────────────────────────────────────-┤
│                                                          │
│   Props: image="https://...", name="John Doe", size="lg" │
│                          ↓                               │
│   ┌──────────────────────────────────────────┐           │
│   │ Try loading image...                     |           │
│   └──────────────────────────────────────────┘           │
│              ↓                    ↓                      │
│         SUCCESS                 FAILED                   │
│            ↓                      ↓                      │
│   ┌──────────────┐      ┌──────────────────┐             │
│   │              │      │    ┌────────┐    │             │
│   │  [Photo]     │      │    │   JD   │    │             │
│   │              │      │    └────────┘    │             │
│   └──────────────┘      │  (purple bg)     │             │
│                         └──────────────────┘             │
│                                                          │
└─────────────────────────────────────────────────────────-┘
```

#### Usage in Dashboard:
```jsx
// In header (small)
<Avatar image={user?.photoURL} name={user?.displayName} size="md" />

// In user list (larger)
<Avatar image={userData.photoURL} name={userData.displayName} size="lg" />
```

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


<!-- From 17th Dec 2025 The Work is the -->


=> 3 Days Work


=> For Owners DashBaord I will Hand Over By 20th Dec With All work Modal features. And Futher Future What features I will add also I will tell in here.


=> I will Build the Profile Page where the Owner, student, warden, prinipal can see there Profile pages.

=> And I will Build one Setting page for  Owner, student, warden, prinipal They want setting page for there DashBoards

 In that I will add this Featutures

 => Where User can chnage the Mode of color
 Example : Light, Dark Mode Buttons

 => NOTE: This feature is for only Owners.

       Where They Can give color theme for student, warden, CO-Admin Dashboard from starting where the admin are give this app to collage the theme will be where the collage have one color theme the owner will select that theme. After hanover the APP to collage.

=> NOTE: This feature is for only Student dashboard where i have mentioned on sarting onwards. 
       the Fearture is student can send the Anonymous Complaint through there dashboard.
       Where they are enabled only.



=>Issuse


=> When We go to Home Page there is a button on Get Start After Clicking it I will redirect to Role after they select the respicitive role and there will see there selected role profile page and they select theere respcitive collage and ask the premission for.



           