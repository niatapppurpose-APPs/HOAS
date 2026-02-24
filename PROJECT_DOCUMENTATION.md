# HOAS — Hostel Operations Accountability System

## 📌 Project Documentation

---

## 1. Project Overview

**HOAS (Hostel Operations Accountability System)** is a full-stack web application built to digitize and streamline hostel management operations in educational institutions.

### The Problem It Solves

Managing hostels in colleges and universities is still largely a manual process — paper-based registrations, verbal approvals, no clear accountability chain, and zero visibility across the hierarchy. HOAS replaces this chaos with a structured, role-based digital platform where every action is tracked, every approval is logged, and every stakeholder has their own dashboard.

### Who It's For

- **Hostel Owners / Super Admins** — who oversee multiple colleges
- **Management / Principals** — who manage wardens and students at individual colleges
- **Wardens** — who handle day-to-day student interactions
- **Students** — who need visibility into their hostel status, complaints, and announcements

### Core Value Proposition

> One platform, four roles, real-time sync, zero paperwork.

---

## 2. Features List

### Authentication & Access Control
- Google OAuth sign-in via Firebase Authentication
- Role-Based Access Control (RBAC) using Firebase custom claims
- Hierarchical permission chain: **Owner → Management → Warden → Student**
- Approval workflow for new user registrations
- Persistent login with automatic route protection

### Owner (Super Admin) Dashboard
- Manage all Management/Principal users across colleges
- Approve or deny pending management account requests
- Cascade delete — removing a college deletes all wardens and students under it
- Real-time KPI cards (total users, pending approvals, etc.)
- Support ticket management with resolution tracking
- Global system settings panel:
  - Registration toggles, maintenance mode, feature flags
  - Role permission templates
  - Approval workflow configuration
  - Per-college user capacity limits

### Management (Principal) Dashboard
- View and manage wardens and students for a specific college
- Approve/deny pending warden and student requests
- Quick approval panel, status visualizations, recent activity feed
- Bulk student upload via Excel spreadsheets
- Create wardens with auto-generated credentials
- Glassmorphism UI with purple-blue gradient theme

### Warden Dashboard
- Monitor assigned students and hostel operations
- AI-powered translation system (multilingual support)
- Manage student statuses, complaints, announcements
- Real-time notifications and alerts

### Student Dashboard
- View hostel information and personal profile
- Submit complaints and leave requests
- View announcements and approval status
- Settings and help/support section

### Platform-Wide Features
- 🎨 Modern dark theme with glassmorphism effects and smooth animations
- 📊 JSON and PDF report generation and export
- 🔔 Custom toast notification system (4 types: Success, Error, Warning, Info)
- 🌐 Internationalization (i18n) with AI-powered translation
- 🎭 Interactive onboarding tour using Shepherd.js
- 🌓 Auto-detect system theme or manual dark/light toggle
- 📱 Fully responsive, mobile-first design
- ⚡ Real-time data sync via Firestore listeners
- 🔍 Search, filter, and pagination across dashboards
- 🚫 Server offline detection with fallback UI
- 📂 Bulk student upload from Excel files
- 🗂️ Support ticketing system with Firestore-backed tracking
- 🛡️ Error boundary with global error modal and email fallback

---

## 3. Tech Stack

### Frontend

| Technology          | Version   | Purpose                              |
|---------------------|-----------|--------------------------------------|
| React               | 19.2.0    | UI framework (modern hooks, Suspense)|
| Vite                | 7.2.4     | Build tool and dev server            |
| Tailwind CSS        | 4.1.18    | Utility-first CSS framework          |
| React Router        | 7.10.1    | Client-side routing                  |
| Firebase SDK        | 12.6.0    | Auth, Firestore, Functions, Storage  |
| Framer Motion       | 12.27.5   | Animations and transitions           |
| Lucide React        | 0.561.0   | Icon library                         |
| Recharts            | 3.6.0     | Data visualization / charts          |
| i18next             | 25.8.0    | Internationalization                 |
| Shepherd.js         | 14.5.1    | Interactive onboarding tours         |
| XLSX                | 0.18.5    | Excel file parsing (bulk upload)     |
| Lottie React        | -         | Animated illustrations               |
| react-colorful      | 5.6.1     | Color picker component               |

### Backend

| Technology           | Version | Purpose                              |
|----------------------|---------|--------------------------------------|
| Node.js              | 20+     | JavaScript runtime                   |
| Firebase Functions   | v2 (7.x)| Serverless cloud functions           |
| Firebase Admin SDK   | 13.6.0  | Server-side Firebase operations      |
| Firestore            | -       | NoSQL real-time database             |
| Express.js           | 5.2.1   | HTTP middleware (for report routes)   |
| PDFKit               | 0.15.0  | PDF report generation                |
| Nodemailer           | 8.0.1   | Email notifications (bulk upload)    |
| CORS                 | 2.8.5   | Cross-origin resource sharing        |

### Development & DevOps

| Tool                 | Purpose                              |
|----------------------|--------------------------------------|
| Firebase Emulator    | Local development environment        |
| ESLint               | Code linting                         |
| Concurrently         | Run client + server simultaneously   |
| Git                  | Version control                      |

---

## 4. Architecture / Folder Structure

```
HOAS/
├── client/                              # React Frontend (Vite)
│   ├── public/                          # Static assets (favicon, etc.)
│   ├── src/
│   │   ├── App.jsx                      # Root component (offline check, routing)
│   │   ├── main.jsx                     # Entry point (Context providers tree)
│   │   ├── index.css                    # Global styles
│   │   │
│   │   ├── components/                  # Shared/reusable components
│   │   │   ├── Routes/index.jsx         # All route definitions
│   │   │   ├── OwnerServices/           # Owner-specific UI (Avatar, StatsCard, etc.)
│   │   │   ├── Toast/                   # Custom toast notification system
│   │   │   ├── ThemeToggle/             # Dark/light mode toggle
│   │   │   ├── ServerOffline/           # Offline detection UI
│   │   │   ├── ErrorBoundary.jsx        # React error boundary
│   │   │   ├── ErrorModal.jsx           # Global error reporting modal
│   │   │   ├── FirebaseModeIndicator    # Dev-mode emulator indicator
│   │   │   ├── LocationAutocomplete     # Address autocomplete
│   │   │   └── ProfileBanner.jsx        # Profile header banner
│   │   │
│   │   ├── context/                     # React Context providers
│   │   │   ├── AuthContext.jsx          # Auth state + custom claims
│   │   │   ├── ThemeContext.jsx          # Theme management
│   │   │   ├── ModalContext.jsx          # Global modal management
│   │   │   ├── ErrorContext.jsx          # Error state management
│   │   │   └── NotificationContext.jsx   # Real-time notifications
│   │   │
│   │   ├── DashBoards/                  # Role-specific dashboards
│   │   │   ├── Student-DashBoard/       # Student dashboard + sub-pages
│   │   │   ├── Warden-Dashboard/        # Warden dashboard + sub-pages
│   │   │   ├── Management-Dashboard/    # Management dashboard + sub-pages
│   │   │   └── Principal-Dashbord/      # Legacy principal dashboard
│   │   │
│   │   ├── Pages/                       # Top-level pages
│   │   │   ├── HOME/                    # Landing/homepage
│   │   │   ├── LoginPage/               # Login page
│   │   │   ├── Dashboard/               # Smart router (redirects by role)
│   │   │   ├── OwnersDashboard/         # Owner dashboard + sub-pages
│   │   │   ├── ProfilePage/             # Profile pages
│   │   │   ├── WaitingApproval/         # Approval pending screen
│   │   │   └── NotFound/               # 404 page
│   │   │
│   │   ├── firebase/                    # Firebase client configuration
│   │   │   ├── firebaseConfig.js        # Firebase init + emulator setup
│   │   │   ├── cloudFunctions.js        # Cloud Functions API wrappers
│   │   │   └── debugUtils.js            # Debug utilities
│   │   │
│   │   ├── hooks/                       # Custom React hooks
│   │   │   ├── useServerStatus.js       # Server health monitoring
│   │   │   ├── useSystemSettings.js     # System settings enforcement
│   │   │   └── useTranslation.js        # i18n translation hook
│   │   │
│   │   ├── data/                        # Static data files
│   │   └── assets/                      # Images, icons, animations
│   │
│   ├── index.html                       # HTML entry point
│   ├── vite.config.js                   # Vite configuration
│   ├── package.json                     # Frontend dependencies
│   └── eslint.config.js                 # ESLint config
│
├── server/                              # Firebase Backend
│   ├── functions/
│   │   ├── index.js                     # Entry — re-exports all modules
│   │   ├── package.json                 # Backend dependencies
│   │   └── src/
│   │       ├── config.js               # Firebase Admin init, CORS, region
│   │       ├── helpers.js              # Auth verification utilities
│   │       ├── admin.js                # Admin ops (setRole, profile CRUD)
│   │       ├── userManagement.js       # User CRUD (approve, deny, create)
│   │       ├── collegeManagement.js    # College ops (cascade delete, stats)
│   │       ├── reports.js              # JSON/PDF report generation
│   │       ├── systemSettings.js       # Global settings, permissions, limits
│   │       ├── notifications.js        # Push notifications (FCM triggers)
│   │       ├── bulkUpload.js           # Bulk student creation from Excel
│   │       ├── triggers.js             # Firestore document triggers
│   │       └── utility.js             # Health check endpoint
│   │
│   ├── firebase.json                    # Firebase hosting/functions config
│   ├── storage.rules                    # Firebase Storage security rules
│   ├── serviceAccountKey.json           # Service account (gitignored)
│   ├── setAdmin.js                      # One-time admin setup script
│   └── setup-iam.js                     # IAM role setup utility
│
├── docs/                                # 25 documentation files
├── package.json                         # Root workspace config
├── .env                                 # Environment variables
└── README.md                            # Project README
```

### Architectural Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                     BROWSER (Client)                         │
│                                                              │
│  React 19 + Vite + Tailwind CSS                              │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────────┐     │
│  │  Auth        │  │  Dashboard  │  │  Shared           │     │
│  │  Context     │  │  Components │  │  Components       │     │
│  └──────┬──────┘  └──────┬──────┘  └────────┬─────────┘     │
│         │                │                   │               │
│  ┌──────▼────────────────▼───────────────────▼──────────┐    │
│  │          Firebase Client SDK (v12.6.0)                │    │
│  │   Auth  ·  Firestore (reads/listeners)  ·  Functions  │    │
│  └──────────────────────┬───────────────────────────────┘    │
└─────────────────────────┼────────────────────────────────────┘
                          │
                          ▼  HTTPS (callable / onRequest)
┌──────────────────────────────────────────────────────────────┐
│               FIREBASE CLOUD FUNCTIONS (v2)                  │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │ User Mgmt    │  │ College Mgmt │  │ Reports      │       │
│  │ (approve,    │  │ (cascade     │  │ (JSON, PDF)  │       │
│  │  deny, CRUD) │  │  delete,     │  │              │       │
│  │              │  │  stats)      │  │              │       │
│  ├──────────────┤  ├──────────────┤  ├──────────────┤       │
│  │ System       │  │ Notifications│  │ Bulk Upload  │       │
│  │ Settings     │  │ (FCM +       │  │ (Excel →     │       │
│  │ (15+ APIs)   │  │  Firestore)  │  │  Auth+DB)    │       │
│  ├──────────────┤  ├──────────────┤  ├──────────────┤       │
│  │ Admin Ops    │  │ Triggers     │  │ Health Check │       │
│  │ (roles,      │  │ (onCreate,   │  │              │       │
│  │  profiles)   │  │  onUpdate)   │  │              │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
│                                                              │
│  Authorization: verifyAdmin() / verifyManagementAccess()     │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────┐
│                    FIREBASE PLATFORM                         │
│                                                              │
│  ┌───────────┐  ┌──────────────┐  ┌──────────┐  ┌────────┐ │
│  │ Firestore │  │ Auth (OAuth  │  │ Cloud    │  │Storage │ │
│  │ Database  │  │ + Custom     │  │ Messaging│  │        │ │
│  │ (NoSQL)   │  │   Claims)    │  │ (FCM)    │  │        │ │
│  └───────────┘  └──────────────┘  └──────────┘  └────────┘ │
└──────────────────────────────────────────────────────────────┘
```

---

## 5. Important Modules & Their Responsibilities

### Backend Modules (`server/functions/src/`)

| Module                  | Responsibility                                                                                         |
|-------------------------|---------------------------------------------------------------------------------------------------------|
| `config.js`             | Firebase Admin SDK initialization, CORS configuration, Firestore/Auth exports, emulator detection       |
| `helpers.js`            | Authorization utilities — `verifyAdmin()` (checks custom claims + fallback), `verifyManagementAccess()` |
| `userManagement.js`     | User lifecycle — `approveUser`, `denyUser`, `getCollegeUsers`, `getAllManagementUsers`, `createManagement`, `createWarden` |
| `collegeManagement.js`  | College operations — `deleteCollege` (cascade deletes wardens + students via batch), `getCollegeStats`  |
| `admin.js`              | Admin operations — `setRole` (custom claims), `getUserProfile`, `updateUserProfile`                     |
| `reports.js`            | Report generation — `downloadReportJson`, `downloadReportPdf` (PDFKit with watermarks, styled layout)  |
| `systemSettings.js`     | 15+ APIs for global settings — toggles, role permission templates, approval workflows, college limits   |
| `notifications.js`      | Push notifications via FCM + Firestore — triggers on new colleges, support tickets, warden registrations|
| `bulkUpload.js`         | Bulk student creation from Excel data — creates Auth users + Firestore docs, sends email summary        |
| `triggers.js`           | Firestore document triggers — `onUserCreated`, `onUserStatusChanged` (audit logging placeholders)       |
| `utility.js`            | `healthCheck` — simple server liveness endpoint                                                         |

### Frontend Modules (`client/src/`)

| Module                          | Responsibility                                                                                    |
|----------------------------------|---------------------------------------------------------------------------------------------------|
| `context/AuthContext.jsx`        | Core auth state management — Google OAuth, custom claims check, Firestore user doc sync, login/logout |
| `context/ThemeContext.jsx`       | Dark/light theme toggle with system preference auto-detection                                     |
| `context/ModalContext.jsx`       | Global modal state (used for delete confirmations, etc.)                                          |
| `context/ErrorContext.jsx`       | Global error state for error modal display                                                        |
| `context/NotificationContext.jsx`| Real-time notification state from Firestore + FCM token management                                |
| `firebase/firebaseConfig.js`    | Firebase SDK initialization — emulator/production toggle, auth persistence, mode switch detection  |
| `firebase/cloudFunctions.js`    | 30+ wrapper functions for calling Cloud Functions via `httpsCallable`                              |
| `components/Routes/index.jsx`   | All route definitions — lazy-loaded dashboards with `Suspense` fallback                           |
| `hooks/useServerStatus.js`      | Server health monitoring — calls `healthCheck` periodically, shows offline UI                     |
| `hooks/useSystemSettings.js`    | System settings enforcement hooks (FeatureGate, MaintenanceGate, RegistrationGate)                |
| `components/Toast/`             | Custom toast notification system — 4 types with gradient backgrounds, auto-dismiss, progress bar  |
| `components/ErrorBoundary.jsx`  | React error boundary — catches render errors, shows fallback UI                                   |
| `components/ErrorModal.jsx`     | Error reporting — Firestore submission + fallback email option                                    |

---

## 6. API Endpoints (Cloud Functions)

All backend APIs are Firebase Cloud Functions (v2). Callable functions use `httpsCallable`, report endpoints use `onRequest`.

### User Management

| Function               | Type       | Auth Required | Description                                      |
|------------------------|------------|---------------|--------------------------------------------------|
| `approveUser`          | `onCall`   | Admin / Management | Approve a pending user (sets status to "approved") |
| `denyUser`             | `onCall`   | Admin / Management | Deny a user with optional reason                  |
| `getCollegeUsers`      | `onCall`   | Management    | Get wardens/students for a specific college        |
| `getAllManagementUsers` | `onCall`   | Admin         | List all management users across all colleges      |
| `createManagement`     | `onCall`   | Admin         | Create a new management user (Auth + Firestore)    |
| `createWarden`         | `onCall`   | Management    | Create a new warden (Auth + Firestore)             |

### College Management

| Function               | Type       | Auth Required | Description                                      |
|------------------------|------------|---------------|--------------------------------------------------|
| `deleteCollege`        | `onCall`   | Admin         | Cascade delete — removes college + all wardens + students |
| `getCollegeStats`      | `onCall`   | Management    | Stats breakdown (wardens/students by status)       |

### Admin Operations

| Function               | Type       | Auth Required | Description                                      |
|------------------------|------------|---------------|--------------------------------------------------|
| `setRole`              | `onCall`   | Admin         | Set custom claim (role) on a Firebase Auth user    |
| `getUserProfile`       | `onCall`   | Self / Admin  | Get user's Firestore profile                       |
| `updateUserProfile`    | `onCall`   | Self / Admin  | Update allowed profile fields                      |

### Reports

| Function               | Type        | Auth Required | Description                                     |
|------------------------|-------------|---------------|--------------------------------------------------|
| `downloadReportJson`   | `onRequest` | Bearer token  | Generate and download college report as JSON      |
| `downloadReportPdf`    | `onRequest` | Bearer token  | Generate and download college report as branded PDF|

### System Settings (15+ endpoints)

| Function                       | Type     | Auth Required | Description                                  |
|--------------------------------|----------|---------------|----------------------------------------------|
| `getSystemSettings`           | `onCall` | Any auth      | Get global system settings                    |
| `updateSystemSettings`        | `onCall` | Admin         | Update global toggles, limits, feature flags  |
| `getRolePermissionTemplates`  | `onCall` | Admin         | List all role permission templates             |
| `saveRolePermissionTemplate`  | `onCall` | Admin         | Create or update a permission template         |
| `deleteRolePermissionTemplate`| `onCall` | Admin         | Delete a permission template                   |
| `getApprovalWorkflows`        | `onCall` | Admin         | List approval workflow configs                 |
| `saveApprovalWorkflow`        | `onCall` | Admin         | Create or update a workflow                    |
| `deleteApprovalWorkflow`      | `onCall` | Admin         | Delete a workflow                              |
| `getCollegeLimits`            | `onCall` | Admin         | Get user limits for all colleges               |
| `setCollegeLimits`            | `onCall` | Admin         | Set capacity limits for a college              |
| `checkRegistrationAllowed`    | `onCall` | Any           | Check if new registrations are enabled         |
| `checkCollegeCapacity`        | `onCall` | Any auth      | Verify college hasn't exceeded user limits     |
| `getSystemStatus`             | `onCall` | Any           | Get maintenance mode, feature flags status     |
| `initializeSystemSettings`    | `onCall` | Admin         | Initialize defaults for first-time setup       |

### Notifications (Firestore Triggers)

| Function                    | Type              | Trigger                              | Description                           |
|-----------------------------|-------------------|--------------------------------------|---------------------------------------|
| `onNewCollegeApproval`     | `onDocumentCreated`| `ManagementData/{collegeId}`         | Push notification for new college request |
| `onNewSupportTicket`       | `onDocumentCreated`| `supportTickets/{ticketId}`          | Notify owner of new support ticket     |
| `onSupportTicketUpdate`    | `onDocumentUpdated`| `supportTickets/{ticketId}`          | Notify on ticket escalation to urgent  |
| `onNewWardenRegistration`  | `onDocumentCreated`| `users/{userId}`                     | Notify owner of new warden registration|
| `onUserCreated`            | `onDocumentCreated`| `users/{userId}`                     | Log new user creation                  |
| `onUserStatusChanged`      | `onDocumentUpdated`| `users/{userId}`                     | Log status changes (approve/deny)      |

### Bulk Upload

| Function               | Type     | Auth Required | Description                                      |
|------------------------|----------|---------------|--------------------------------------------------|
| `bulkCreateStudents`   | `onCall` | Management    | Batch create students from Excel data (300s timeout)|

### Utility

| Function               | Type     | Auth Required | Description                                      |
|------------------------|----------|---------------|--------------------------------------------------|
| `healthCheck`          | `onCall` | None          | Returns server status + timestamp                 |

---

## 7. Database Structure (Firestore)

### Collection: `users`

The primary collection — stores all user types (admin, management, warden, student).

```
users/{userId}
├── uid: string                    # Firebase Auth UID
├── email: string                  # User email
├── displayName: string            # Display name
├── photoURL: string               # Google profile photo
├── role: string                   # "admin" | "management" | "warden" | "student"
├── status: string                 # "pending" | "approved" | "denied"
├── collegeName: string            # Associated college name
├── managementId: string           # UID of management user (for wardens/students)
├── hostelBlock: string            # (warden) Assigned hostel block
├── fullName: string               # Full name
├── phone: string                  # Phone number
├── collegeLogo: string            # Logo URL (management)
├── isOnline: boolean              # Online status
├── fcmToken: string               # FCM push notification token
├── approvedAt: string             # ISO timestamp of approval
├── approvedBy: string             # UID of approver
├── deniedAt: string               # ISO timestamp of denial
├── denialReason: string           # Reason for denial
├── createdBy: string              # UID of creator
├── createdAt: string              # ISO timestamp
├── updatedAt: string              # ISO timestamp
└── bulkUploaded: boolean          # Was this user created via bulk upload?
```

### Collection: `managementCredentials`

Stores generated credentials for management users (owner-only access).

```
managementCredentials/{userId}
├── managementId: string
├── email: string
├── collegeName: string
├── password: string               # Temporary, viewable once by owner
├── createdBy: string
├── createdAt: string
└── isViewed: boolean
```

### Collection: `systemSettings`

Global system configuration (single document).

```
systemSettings/global
├── registrationEnabled: boolean
├── approvalsEnabled: boolean
├── maintenanceMode: boolean
├── maintenanceMessage: string
├── defaultStudentLimit: number
├── defaultWardenLimit: number
├── defaultHostelLimit: number
├── features: {
│   ├── notifications: boolean
│   ├── reports: boolean
│   ├── analytics: boolean
│   └── bulkOperations: boolean
│ }
├── version: number
├── updatedAt: string
└── updatedBy: string
```

### Collection: `rolePermissionTemplates`

Configurable permission sets per role.

```
rolePermissionTemplates/{templateId}
├── name: string
├── role: string
├── permissions: {
│   ├── canViewReports: boolean
│   ├── canManageStudents: boolean
│   ├── canManageWardens: boolean
│   ├── canApproveUsers: boolean
│   ├── canManageHostels: boolean
│   ├── canAccessAnalytics: boolean
│   ├── canBulkOperations: boolean
│   ├── canExportData: boolean
│   ├── canViewNotifications: boolean
│   └── canSendNotifications: boolean
│ }
├── isDefault: boolean
├── createdAt: string
├── updatedAt: string
└── createdBy: string
```

### Collection: `approvalWorkflows`

Configurable approval sequences.

```
approvalWorkflows/{workflowId}
├── name: string
├── targetRole: string
├── steps: array
├── requireAllApprovals: boolean
├── autoApprove: boolean
├── createdAt: string
├── updatedAt: string
└── createdBy: string
```

### Collection: `collegeLimits`

Per-college user capacity constraints.

```
collegeLimits/{collegeId}
├── collegeId: string
├── collegeName: string
├── maxStudents: number
├── maxWardens: number
├── maxHostels: number
├── currentStudents: number
├── currentWardens: number
├── currentHostels: number
├── customSettings: object
├── updatedAt: string
└── updatedBy: string
```

### Collection: `supportTickets`

User-submitted support/issue tickets.

```
supportTickets/{ticketId}
├── subject: string
├── description: string
├── userName: string
├── userId: string
├── priority: string               # "low" | "medium" | "high" | "urgent"
├── status: string                 # "open" | "in_progress" | "resolved" | "closed"
├── createdAt: timestamp
└── resolvedAt: timestamp
```

### Collection: `notifications`

In-app notification records.

```
notifications/{notificationId}
├── title: string
├── body: string
├── type: string
├── userId: string                 # Target user
├── read: boolean
├── timestamp: server_timestamp
└── link: string                   # Deep link to relevant page
```

### Collection: `bulkUploadRecords`

Audit trail for bulk student imports.

```
bulkUploadRecords/{recordId}
├── uploadedBy: string
├── uploadedByEmail: string
├── managementId: string
├── collegeName: string
├── totalStudents: number
├── created: number
├── failed: number
├── skipped: number
├── errors: array
├── createdStudents: array         # Names, emails, generated passwords
└── uploadedAt: string
```

---

## 8. Setup & Installation

### Prerequisites

- **Node.js** 20+ — [Download](https://nodejs.org/)
- **npm** package manager (comes with Node.js)
- **Firebase CLI** — `npm install -g firebase-tools`
- **Git** — [Download](https://git-scm.com/)
- A **Firebase project** with Firestore and Authentication enabled

### Step-by-Step Installation

```bash
# 1. Clone the repository
git clone https://github.com/niatapppurpose-APPs/HOAS.git
cd HOAS

# 2. Install all dependencies (root, client, and server)
npm run install:all

# 3. Set up environment variables
# Copy the .env file at the root and update Firebase config values
# The client also has a .env at client/.env

# 4. Firebase setup
# Log in to Firebase CLI
firebase login

# 5. Set up the admin user (one-time)
cd server
node setAdmin.js
cd ..

# 6. Start the development environment
npm run dev
# This runs both client (Vite on port 5173) and server (Firebase emulators) concurrently
```

### Individual Commands

| Command               | What it does                                    |
|-----------------------|--------------------------------------------------|
| `npm run client`      | Start only the frontend (Vite dev server)        |
| `npm run server`      | Start only Firebase emulators                    |
| `npm run dev`         | Start both client + server concurrently          |
| `npm run build`       | Build the frontend for production                |
| `npm run deploy`      | Deploy Cloud Functions to Firebase               |
| `npm run install:all` | Install dependencies for both client and server  |

### Firebase Emulator Configuration

The project supports seamless switching between emulator and production modes:

- Set `VITE_USE_FIREBASE_EMULATOR=true` in `.env` for emulator mode
- The client auto-connects to emulators on ports: Auth (9099), Firestore (8080), Functions (5001), Storage (9199)
- A `FirebaseModeIndicator` component shows current mode during development
- Debug utilities available via `debugUtils.js`

---

## 9. How the Project Works (Flow)

### User Authentication Flow

```
User visits HOAS → Homepage (/)
        │
        ├─ Clicks "Sign In" → Login Page (/login)
        │       │
        │       └─ Google OAuth (Firebase Auth)
        │               │
        │               ├─ First-time user? → AuthContext checks claims
        │               │       │
        │               │       ├─ Has admin claim? → Create admin profile → /OwnersDashboard
        │               │       └─ No admin claim? → Awaiting provisioning
        │               │
        │               └─ Returning user? → Check Firestore profile
        │                       │
        │                       ├─ admin → /OwnersDashboard
        │                       ├─ management (approved) → /dashboard/management
        │                       ├─ warden (approved) → /dashboard/warden
        │                       ├─ student (approved) → /dashboard/student
        │                       └─ Any role (pending/denied) → /waiting-approval
        │
        └─ Not logged in → Stays on homepage
```

### User Provisioning Flow

```
Owner creates Management user
    │
    ├─ Cloud Function (createManagement)
    │   ├─ Creates Firebase Auth user with email/password
    │   ├─ Creates Firestore user document (status: approved)
    │   ├─ Stores credentials in managementCredentials collection
    │   └─ Generates password reset link
    │
    └─ Management now logs in → /dashboard/management

Management creates Warden
    │
    ├─ Cloud Function (createWarden)
    │   ├─ Creates Firebase Auth user
    │   └─ Creates Firestore document (status: approved)
    │
    └─ Warden now logs in → /dashboard/warden

Management bulk uploads Students
    │
    ├─ Excel parsed on frontend (xlsx library)
    ├─ Cloud Function (bulkCreateStudents)
    │   ├─ Creates Auth users with generated passwords
    │   ├─ Creates Firestore documents
    │   ├─ Stores upload record for audit
    │   └─ Sends email summary via Nodemailer
    │
    └─ Students log in → /dashboard/student
```

### Approval Workflow

```
Pending user request arrives
    │
    ├─ Management user pending → Owner sees in /OwnersDashboard
    ├─ Warden/Student pending → Management sees in /dashboard/management
    │
    ├─ Approve button clicked →  approveUser Cloud Function
    │   ├─ Verifies caller permissions
    │   ├─ Updates status to "approved" in Firestore
    │   └─ Returns success
    │
    └─ Deny button clicked → denyUser Cloud Function
        ├─ Verifies caller permissions
        ├─ Updates status to "denied" with reason
        └─ Returns success
```

### Real-Time Data Flow

```
Firestore Database ←──→ Cloud Functions (writes)
        │
        ├─ onSnapshot listeners (reads)
        │       │
        │       └─ React Context providers
        │               │
        │               └─ Dashboard components re-render automatically
        │
        └─ Document triggers
                │
                ├─ onUserCreated → Log event
                ├─ onUserStatusChanged → Notify user
                ├─ onNewSupportTicket → Push to owner
                └─ onNewCollegeApproval → Push to owner
```

---

## 10. Challenges Faced & Solutions

### Challenge 1: Firebase Emulator ↔ Production Mode Switching

**Problem:** When switching from emulator to production, cached auth tokens from the emulator are invalid against real Firebase Auth, causing silent login failures.

**Solution:** Implemented mode detection in `firebaseConfig.js` that tracks the last Firebase mode in `localStorage`. When a switch from emulator → production is detected, it automatically signs out the stale session and clears credentials before allowing a fresh login.

### Challenge 2: Admin Verification Failing on Mobile

**Problem:** The `auth.getUser()` call to verify admin status frequently fails on mobile because the Identity Toolkit API is disabled or restricted.

**Solution:** Implemented a two-tier verification in `verifyAdmin()`. First, check custom claims directly from the auth token (no network call). Only fall back to `auth.getUser()` if the token says non-admin — this handles the case where claims were recently updated but the client token hasn't refreshed yet.

### Challenge 3: Cascade Delete Consistency

**Problem:** Deleting a management user needs to remove all associated wardens and students. Individual deletes are slow and risk partial failures.

**Solution:** Used Firestore batch operations in `deleteCollege()`. Query all wardens and students by `managementId`, add them all to a batch, and commit in a single atomic operation.

### Challenge 4: CORS Issues with Cloud Functions v2

**Problem:** Callable functions worked in the emulator but failed in production due to CORS origin restrictions, especially from mobile devices that don't send origin headers.

**Solution:** Set `cors: true` globally for callable functions (safe because auth is enforced via Firebase tokens, not origin). Created a separate, more restrictive CORS handler for `onRequest` endpoints (report downloads) that validates specific origins.

### Challenge 5: Context Provider Nesting and Load Order

**Problem:** Multiple context providers (Auth, Theme, Toast, Error, Notification, Modal) needed correct nesting order — `ErrorModal` must render outside `ErrorBoundary` but inside `ErrorProvider`.

**Solution:** Carefully structured the provider tree in `main.jsx` with `ErrorModal` placed between `ErrorProvider` and `ErrorBoundary`, ensuring error reporting works even when the main app tree crashes.

### Challenge 6: Lazy Loading Dashboard Performance

**Problem:** Loading all four role-specific dashboards upfront was slow, especially on mobile.

**Solution:** Used React `lazy()` + `Suspense` to code-split each dashboard and its sub-pages. Only core pages (Home, Login, Dashboard router) are loaded eagerly; everything else loads on demand with a branded loading spinner.

---

## 11. Future Improvements

- [ ] **Email notifications** — Send emails for approval/rejection status changes
- [ ] **SMS integration** — Critical alerts via SMS for wardens and management
- [ ] **Advanced analytics** — Charts and dashboards with trends over time (Recharts expansion)
- [ ] **CSV/Excel bulk export** — Download filtered user data as spreadsheets
- [ ] **Mobile app** — React Native version for wardens and students
- [ ] **Hostel inventory management** — Track rooms, beds, furniture
- [ ] **Fee payment integration** — Payment gateway for hostel fees
- [ ] **Room allocation automation** — Auto-assign rooms based on availability
- [ ] **Attendance tracking** — Daily attendance with warden verification
- [ ] **Parent portal** — Read-only access for parents to view student info
- [ ] **Push notifications** — Full FCM integration for all user roles (currently Owner-only)
- [ ] **Audit logging** — Complete activity history for compliance
- [ ] **Data export scheduling** — Automated periodic report generation
- [ ] **Offline mode** — Service worker for basic offline functionality
- [ ] **Rate limiting** — Protect Cloud Functions from abuse
- [ ] **Unit/Integration tests** — Jest + React Testing Library coverage

---

*Last updated: February 2026*
*Version: 1.0.0*
*Active Development: December 2024 — Present*
