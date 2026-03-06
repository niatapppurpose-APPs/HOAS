# HOAS — Hostel Operations Accountability System

> A full-stack hostel management platform with hierarchical role-based access control, real-time dashboards, and Firebase Cloud Functions backend.

[![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)](https://github.com/niatapppurpose-APPs/HOAS)
[![React](https://img.shields.io/badge/React-19.2.0-61dafb.svg)](https://reactjs.org/)
[![Firebase](https://img.shields.io/badge/Firebase-12.6.0-orange.svg)](https://firebase.google.com/)
[![Node](https://img.shields.io/badge/Node.js-22-green.svg)](https://nodejs.org/)
[![Vite](https://img.shields.io/badge/Vite-7.2.4-646CFF.svg)](https://vitejs.dev/)
[![Tailwind](https://img.shields.io/badge/Tailwind_CSS-4.1.18-38BDF8.svg)](https://tailwindcss.com/)

---

## 📋 Overview

**HOAS** is an enterprise-grade hostel management system for educational institutions. It automates operations from student registration to administrative approvals through a four-role hierarchy: **Owner (Super Admin)** → **Management (Principal)** → **Warden** → **Student**.

Built with **React 19**, **Firebase Cloud Functions v2**, **Firestore**, and **Tailwind CSS 4**, the platform provides real-time data synchronization, intelligent approval workflows, and role-specific dashboards.

### Key Objectives

- Automate and digitize hostel operations end-to-end
- Enforce granular permission systems with approval workflows
- Deliver real-time updates via Firestore listeners
- Support multiple colleges/hostels under unified super admin control
- Provide intuitive, role-tailored interfaces with dark/light theme support

---

## ✨ Features

### Authentication & Authorization
- **Google OAuth** for Owner sign-in via Firebase Authentication
- **Email/Password** login for Management, Warden, and Student roles
- **Role-Based Access Control (RBAC)** with Firebase custom claims
- **Hierarchical Permissions** (Owner → Management → Warden → Student)
- **Approval Workflows** — new user registrations require admin approval
- **Persistent Auth State** with automatic route protection

### Owner Dashboard (Super Admin)
- Manage all Management (Principal) users across colleges
- Approve/Deny pending management account requests
- **Cascade Delete Colleges** — remove entire college hierarchies (Management → Wardens → Students)
- Real-time statistics and KPI cards
- Profile management with photo upload & password change
- Bulk operations and pagination support
- **Support Ticket System** — centralized tracking, resolution workflow, status animations
- **Global System Settings** — six-card grid configuration panel:
  - Role & Access Control
  - Complaint & Escalation Settings
  - Notification Preferences
  - Security & Platform Settings
  - Appearance Configuration
  - System Controls (maintenance mode, registration toggles)
- **Analytics Dashboard** — charts for user trends, college distribution, role approvals
- **Bulk Student Upload** — import students from Excel spreadsheets with email notifications
- **Report Generation** — export JSON & PDF reports via PDFKit

### Management Dashboard (Principal)
- View and manage Wardens/Students linked to assigned college
- Approve/Deny pending Warden/Student requests
- KPI cards with pending approvals counter
- Quick approval panel for immediate actions
- Status visualization with circular progress indicators
- Recent activity timeline
- Glassmorphism UI with purple-blue gradient theme

### Warden Dashboard
- **Warden Overview** — welcome banner, quick actions, real-time complaint feed, warden info card
- **Student Directory** — real-time student list with search, sort (name/room/hostel), status filter, and student detail modal
- **Complaint Management** — view, manage, and update complaint statuses with notification logic
- **Announcements (CRUD)** — create, edit, delete announcements with 4 priority levels (Urgent/Important/Normal/Info), pin-to-top, and search
- **Leave Request Review** — view and manage incoming student leave requests
- **Settings** — theme toggle (dark/light), password change with Firebase re-authentication, 6 notification toggles (new complaints, sound alerts, leave requests, etc.)
- **Help & Support** — 16 warden-specific FAQs across 5 categories, support ticket submission, quick contact actions
- **Profile** — view warden profile information
- AI-powered translation system (multilingual support via i18next)
- Real-time notifications and alerts

### Student Dashboard
- **Student Overview** — welcome banner, quick actions (File Complaint, My Complaints, Apply Leave, Notice Board), recent activity feed, profile summary card
- **Complaint System** — file, view, and track complaints with image uploads, drag-and-drop, and detailed complaint views
- **Leave Requests** — submit leave/outing requests (7 types: Home Visit, Medical, Family Emergency, Academic, Personal, Day Outing, Other) with date range, destination, contact info, real-time status tracking, and cancel pending requests
- **Announcements** — real-time notice board with priority badges, pinned notices, search & filter, expandable detail views
- **Settings** — theme toggle, password change with Firebase re-authentication, notification preference toggles, account info display
- **Help & Support** — 12 searchable FAQs in 4 categories, support ticket submission to Firestore, quick contact actions
- **Profile** — view and edit profile information

### Platform-Wide Features
- 🎨 **Dark/Light Theme** — auto-detect system preference or manual toggle
- 🔔 **Toast Notifications** — 4 types (Success, Error, Warning, Info) with animations
- 🎭 **Interactive Dashboard Tour** — onboarding via Shepherd.js
- 📱 **Fully Responsive** — mobile-first design with all breakpoints
- ⚡ **Real-time Updates** — Firestore listeners for instant synchronization
- 🔍 **Search & Filter** — advanced filtering across all dashboards
- 📄 **Pagination** — efficient data loading with page state preservation
- 🚫 **Server Offline Detection** — automatic fallback UI when backend is unavailable
- 🌐 **Internationalization** — multi-language support with i18next
- 📊 **Data Visualization** — charts and graphs powered by Recharts
- 🔔 **Push Notifications** — Firebase Cloud Messaging with Firestore triggers
- 📢 **Announcement Browser Notifications** — real-time browser push notifications for any new announcement (Student & Warden)
- 📋 **Leave Request Notifications** — students notified on status changes; wardens notified on new requests

---

## 🛠️ Tech Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19.2.0 | UI framework with hooks |
| Vite | 7.2.4 | Build tool & dev server |
| Tailwind CSS | 4.1.18 | Utility-first CSS with CSS variables |
| React Router | 7.10.1 | Client-side routing |
| Firebase SDK | 12.6.0 | Auth, Firestore, Storage, Messaging |
| Lucide React | 0.561.0 | Icon library |
| Framer Motion | 12.27.5 | Animations & transitions |
| Recharts | 3.6.0 | Data visualization |
| i18next | 25.8.0 | Internationalization |
| Shepherd.js | 14.5.1 | User onboarding tours |
| react-colorful | 5.6.1 | Color picker (theme customization) |
| XLSX | 0.18.5 | Excel file parsing (bulk upload) |

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | 22 | JavaScript runtime |
| Firebase Functions v2 | 7.0.6 | Serverless cloud functions |
| Firebase Admin SDK | 13.6.0 | Server-side Firebase operations |
| Express | 5.2.1 | HTTP middleware (CORS) |
| PDFKit | 0.15.0 | PDF report generation |
| Nodemailer | 8.0.1 | Email notifications |
| XLSX | 0.18.5 | Excel parsing for bulk uploads |

### Infrastructure
| Service | Purpose |
|---------|---------|
| Firebase Authentication | Google OAuth & email/password auth |
| Cloud Firestore | NoSQL real-time database |
| Firebase Cloud Functions | Serverless backend (us-central1) |
| Firebase Storage | Profile photos & file uploads |
| Firebase Cloud Messaging | Push notifications |
| Firebase Hosting | Frontend deployment |

### Development Tools
- **ESLint** — code linting and quality
- **Concurrently** — run client + server in parallel
- **Firebase Emulator Suite** — local development environment

---

## 📁 Project Structure

```
HOAS/
├── client/                              # Frontend (React + Vite)
│   ├── public/
│   │   └── firebase-messaging-sw.js     # FCM service worker
│   ├── src/
│   │   ├── assets/                      # Images & developer photos
│   │   ├── components/
│   │   │   ├── AnimatedLogoutButton/    # Animated logout component
│   │   │   ├── ErrorBoundary.jsx        # React error boundary
│   │   │   ├── ErrorModal.jsx           # Error reporting (Firestore + email)
│   │   │   ├── FirebaseModeIndicator.jsx# Emulator vs production badge
│   │   │   ├── LocationAutocomplete.jsx # Location search input
│   │   │   ├── ProfileBanner.jsx        # Profile header banner
│   │   │   ├── OwnerServices/           # Owner layout components
│   │   │   │   ├── Avatar.jsx
│   │   │   │   ├── DeleteConfirmModal.jsx
│   │   │   │   ├── EmptyState.jsx
│   │   │   │   ├── GlobalDeleteModal.jsx
│   │   │   │   ├── header.jsx
│   │   │   │   ├── NotificationBell.jsx
│   │   │   │   ├── OwnerProfile.jsx     # Photo upload + password change
│   │   │   │   ├── Sidebar.jsx
│   │   │   │   ├── StatsCard.jsx
│   │   │   │   └── StatusBadge.jsx
│   │   │   ├── Routes/                  # App routing configuration
│   │   │   ├── ThemeToggle/             # Dark/Light mode toggle
│   │   │   ├── Toast/                   # Toast notification system
│   │   │   └── UserServices/            # Role-based UI utilities
│   │   ├── context/
│   │   │   ├── AuthContext.jsx          # Firebase auth state & role management
│   │   │   ├── ErrorContext.jsx         # Global error handling
│   │   │   ├── ModalContext.jsx         # Modal state management
│   │   │   ├── NotificationContext.jsx  # Push notification state
│   │   │   └── ThemeContext.jsx         # Dark/light theme management
│   │   ├── DashBoards/
│   │   │   ├── Management-Dashboard/    # Principal/Co-Admin dashboard
│   │   │   ├── Principal-Dashbord/      # Principal view
│   │   │   ├── Student-DashBoard/       # Student view
│   │   │   │   ├── StudentDashboard.jsx          # Main dashboard
│   │   │   │   └── components/
│   │   │   │       ├── layout/
│   │   │   │       │   ├── StudentLayout.jsx     # Layout wrapper
│   │   │   │       │   ├── StudentSidebar.jsx    # Navigation sidebar
│   │   │   │       │   └── StudentHeader.jsx     # Top header bar
│   │   │   │       └── pages/
│   │   │   │           ├── StudentComplaints.jsx  # Complaint filing & tracking
│   │   │   │           ├── StudentLeaveRequests.jsx # Leave/outing applications ✨NEW
│   │   │   │           ├── StudentAnnouncements.jsx # Notice board viewer ✨NEW
│   │   │   │           ├── StudentSettings.jsx    # Preferences & security ✨NEW
│   │   │   │           ├── StudentHelpSupport.jsx # FAQs & support tickets ✨NEW
│   │   │   │           └── StudentProfile.jsx     # Profile management
│   │   │   └── Warden-Dashboard/        # Warden view
│   │   │       ├── WardenDashboard.jsx           # Main dashboard
│   │   │       └── components/
│   │   │           ├── layout/
│   │   │           │   ├── WardenLayout.jsx      # Layout wrapper
│   │   │           │   ├── WardenSidebar.jsx     # Navigation sidebar
│   │   │           │   └── WardenHeader.jsx      # Top header bar
│   │   │           └── pages/
│   │   │               ├── WardenStudents.jsx     # Student directory ✨NEW
│   │   │               ├── WardenComplaints.jsx   # Complaint management
│   │   │               ├── WardenAnnouncements.jsx # Announcement CRUD ✨NEW
│   │   │               ├── WardenSettings.jsx     # Preferences & security ✨NEW
│   │   │               ├── WardenHelpSupport.jsx  # FAQs & support tickets ✨NEW
│   │   │               └── WardenProfile.jsx      # Profile view
│   │   ├── firebase/
│   │   │   ├── cloudFunctions.js        # Backend API client (11 functions)
│   │   │   ├── debugUtils.js            # Debug/logging utilities
│   │   │   ├── firebaseConfig.js        # Firebase app initialization
│   │   │   └── notificationService.js   # FCM notification handlers
│   │   ├── hooks/
│   │   │   ├── useServerStatus.js       # Backend health monitoring
│   │   │   └── useSystemSettings.jsx    # System settings enforcement
│   │   ├── Pages/
│   │   │   ├── Dashboard/               # Dashboard router
│   │   │   ├── HOME/                    # Landing page
│   │   │   ├── LoginPage/               # Login, logout, redirect
│   │   │   ├── NotFound/                # 404 page
│   │   │   ├── OwnersDashboard/         # Owner admin panel
│   │   │   │   ├── ownersdashbord.jsx   # Main dashboard
│   │   │   │   ├── OwnersLayout.jsx     # Layout wrapper
│   │   │   │   ├── tourConfig.js        # Shepherd.js tour setup
│   │   │   │   ├── Pages/
│   │   │   │   │   ├── Analytics.jsx    # Analytics dashboard
│   │   │   │   │   ├── AnalyticsComponents/  # Chart components
│   │   │   │   │   ├── GlobalSystemSettings.jsx  # 6-card settings panel
│   │   │   │   │   ├── Help.jsx
│   │   │   │   │   ├── Notifications.jsx
│   │   │   │   │   ├── Reports.jsx
│   │   │   │   │   ├── Students.jsx     # Student management + bulk upload
│   │   │   │   │   ├── SupportTickets.jsx
│   │   │   │   │   └── Wardens.jsx      # Warden management
│   │   │   │   └── components/          # Shared UI components
│   │   │   ├── ProfilePage/             # User profile
│   │   │   └── WaitingApproval/         # Pending approval screen
│   │   ├── data/
│   │   │   └── college_data.json        # College reference data
│   │   ├── App.jsx                      # Root component
│   │   ├── App.css
│   │   ├── main.jsx                     # Entry point
│   │   └── index.css                    # Global styles
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── eslint.config.js
│
├── server/                              # Backend (Firebase Cloud Functions)
│   ├── functions/
│   │   ├── src/
│   │   │   ├── config.js               # Firebase Admin init, CORS, region config
│   │   │   ├── helpers.js              # Auth verification middleware
│   │   │   ├── userManagement.js       # User CRUD (approve, deny, create)
│   │   │   ├── collegeManagement.js    # College operations (delete, stats)
│   │   │   ├── systemSettings.js       # Settings API (get, update, capacity)
│   │   │   ├── reports.js              # PDF & JSON report generation
│   │   │   ├── notifications.js        # Firestore triggers for notifications
│   │   │   └── bulkUpload.js           # Bulk student creation from Excel
│   │   ├── index.js                    # Functions entry point
│   │   └── package.json
│   ├── firebase.json
│   ├── storage.rules
│   ├── serviceAccountKey.json          # Firebase credentials (gitignored)
│   └── setAdmin.js                     # Admin setup utility
│
├── docs/                               # Documentation (28 guides)
│   ├── QUICK_START.md
│   ├── DEVELOPER_SETUP.md
│   ├── HOAS_COMPLETE_DOCUMENTATION.md
│   ├── ARCHITECTURE_DIAGRAMS.md
│   ├── CLOUD_FUNCTIONS_API.md
│   ├── CONTEXT_ARCHITECTURE.md
│   ├── ROUTING_AND_CONTEXT.md
│   ├── FIREBASE_EMULATOR_SETUP.md
│   ├── DEPLOYMENT_CHECKLIST.md
│   ├── CHANGELOG.md
│   └── ... (18 more)
│
├── package.json                        # Root workspace configuration
└── README.md
```

---

## 🔗 Cloud Functions API

The backend exposes **11 callable functions** and **2 HTTP endpoints**, all deployed to `us-central1`:

### Callable Functions (via `cloudFunctions.js`)

| Function | Module | Description |
|----------|--------|-------------|
| `approveUser` | userManagement | Approve a pending user registration |
| `denyUser` | userManagement | Deny a pending user registration |
| `getAllManagementUsers` | userManagement | List all management-role users |
| `createManagement` | userManagement | Create a new management user |
| `createWarden` | userManagement | Create a new warden user |
| `deleteCollege` | collegeManagement | Cascade-delete a college and all its users |
| `getSystemSettings` | systemSettings | Fetch global system settings |
| `updateSystemSettings` | systemSettings | Update global system settings |
| `checkCollegeCapacity` | systemSettings | Check if a college has reached user limits |
| `bulkCreateStudents` | bulkUpload | Bulk-create students from Excel data |

### HTTP Endpoints

| Endpoint | Module | Description |
|----------|--------|-------------|
| `downloadReportJson` | reports | Export user data as JSON |
| `downloadReportPdf` | reports | Export user data as PDF (via PDFKit) |

### Firestore Triggers (server-only)

| Trigger | Module | Fires On |
|---------|--------|----------|
| `onNewCollegeApproval` | notifications | New college approval request |
| `onNewSupportTicket` | notifications | Support ticket created |
| `onSupportTicketUpdate` | notifications | Support ticket status change |
| `onNewWardenRegistration` | notifications | New warden registration |
| `sendCustomNotification` | notifications | Manual notification dispatch |

---

## 🚀 Setup & Installation

### Prerequisites

- **Node.js 22+** ([Download](https://nodejs.org/))
- **Firebase CLI** (`npm install -g firebase-tools`)
- **Git** ([Download](https://git-scm.com/))
- A **Firebase project** with Firestore, Authentication, and Storage enabled

### Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/niatapppurpose-APPs/HOAS.git
cd HOAS

# 2. Install all dependencies (root + client + server)
npm install
cd client && npm install && cd ..
cd server/functions && npm install && cd ../..

# 3. Configure Firebase
#    - Add your Firebase web app config to client/src/firebase/firebaseConfig.js
#    - Place your service account key at server/serviceAccountKey.json

# 4. Start development (client + emulators)
npm run dev

# 5. Or start client only
npm run dev:client

# 6. Build for production
npm run build
```

### Available Scripts (Root)

| Script | Command | Description |
|--------|---------|-------------|
| `dev` | `concurrently` | Run client + server concurrently |
| `dev:client` | `npm run dev --prefix client` | Start Vite dev server |
| `build` | `npm run build --prefix client` | Production build |
| `deploy:functions` | Firebase deploy | Deploy cloud functions |

> See [docs/DEVELOPER_SETUP.md](docs/DEVELOPER_SETUP.md) for detailed Firebase configuration, service account setup, and environment variables.

---

## 🏗️ Architecture

### System Overview

```
┌──────────────────────────────────────────────────────────┐
│                   FRONTEND (React 19)                     │
│  Vite 7 · Tailwind CSS 4 · Firebase SDK 12               │
│  Real-time Firestore listeners · FCM push notifications   │
└───────────────────┬──────────────────────────────────────┘
                    │  HTTPS callable / HTTP
                    ▼
┌──────────────────────────────────────────────────────────┐
│          FIREBASE CLOUD FUNCTIONS v2 (Node 22)            │
│  userManagement · collegeManagement · systemSettings      │
│  reports · notifications · bulkUpload                     │
│  Auth verification · CORS · Input validation              │
└───────────────────┬──────────────────────────────────────┘
                    │
                    ▼
┌──────────────────────────────────────────────────────────┐
│                  FIREBASE SERVICES                        │
│  ┌────────────┬─────────────┬──────────┬──────────────┐  │
│  │ Firestore  │ Auth (OAuth │ Storage  │ Cloud        │  │
│  │ Database   │ + Password) │ (Files)  │ Messaging    │  │
│  └────────────┴─────────────┴──────────┴──────────────┘  │
└──────────────────────────────────────────────────────────┘
```

### User Role Hierarchy

```
Owner (Super Admin)
├── Google OAuth login
├── Full system access & global settings
│
├── Management (College A) ← Email/Password login
│   ├── Warden 1 ← Email/Password login
│   │   └── Students 1, 2, 3…
│   └── Warden 2
│       └── Students 4, 5, 6…
│
└── Management (College B)
    └── Warden 3
        └── Students 7, 8, 9…
```

### Context Architecture

The app uses **5 React Context providers** for global state:

| Context | Purpose |
|---------|---------|
| `AuthContext` | Firebase auth state, user role, login/logout |
| `ThemeContext` | Dark/light mode, system preference detection |
| `ModalContext` | Global modal state management |
| `ErrorContext` | Centralized error handling & reporting |
| `NotificationContext` | Push notification state & FCM tokens |

---

## 🎨 Design System

### Theme

The app supports **dark and light modes** with automatic system preference detection. Themes are managed via CSS variables and Tailwind CSS 4.

### Color Palette

| Color | Hex | Usage |
|-------|-----|-------|
| Purple | `#8B5CF6` | Wardens, primary actions |
| Blue | `#3B82F6` | Students, secondary actions |
| Orange | `#FB923C` | Pending/attention items |
| Green | `#10B981` | Approved/success states |
| Red | `#EF4444` | Deny/danger actions |

### UI Patterns
- **Glassmorphism** — backdrop-blur effects on cards and modals
- **Framer Motion** — page transitions, list animations, hover effects
- **Responsive Grid** — 1-col (mobile) → 2-col (tablet) → 3-col (desktop)
- **Sticky Action Bars** — bottom-fixed save buttons with unsaved-changes indicator

---

## 🔄 Development History

### Phase 1: Foundation (Dec 2024)
- Google OAuth authentication via Firebase
- Persistent auth state with `AuthContext`
- Role-based routing protection

### Phase 2: Core Dashboards (Dec 2024 – Jan 2025)
- Owner Dashboard with user management, approval/denial, stats cards
- Cascade delete for colleges (Management → Wardens → Students)
- Owner Profile page with edit capabilities
- Management Dashboard for Principals (Warden/Student management)

### Phase 3: Backend Architecture (Jan 2025)
- Restructured into `client/server/docs` monorepo
- Modularized Cloud Functions (user, college, reports modules)
- Server-side authorization on every endpoint
- JSON & PDF report generation

### Phase 4: UX Polish (Jan 2025)
- Custom Toast notification system (replaced all `alert()` calls)
- Pagination & bulk approve/deny operations
- Dark/light theme with system auto-detection
- Interactive dashboard tour (Shepherd.js)
- Server offline detection with fallback UI
- Internationalization (i18next)

### Phase 5: Management Dashboard Redesign (Jan 2025)
- Glassmorphism UI overhaul with gradient themes
- KPI cards, quick approval panel, activity timeline

### Phase 6: UI/UX Refinements (Jan 2025)
- Login page redesign
- Various bug fixes and optimization

### Phase 7: Platform Features (Jan 2026)
- Firebase hosting deployment fixes
- Documentation consolidation
- Empty state components
- Global System Settings module with enforcement hooks
- Enhanced theme consistency

### Phase 8: Advanced Features (Jan – Feb 2026)
- College profile & logo upload system
- Google OAuth flow optimization
- Dynamic homepage with auth-aware CTAs
- Developer team integration
- Support ticketing system with resolution workflow
- Premium error reporting (Firestore + email fallback)

### Phase 9: Cleanup & Optimization
- Removed unused cloud functions (17 functions cleaned from server & client)
- Deleted deprecated modules (`admin.js`, `triggers.js`, `utility.js`)
- Streamlined `systemSettings.js` (952 → 217 lines)
- Streamlined `cloudFunctions.js` (468 → 195 lines)
- Settings page redesigned to 6-card grid layout
- Enhanced Owner Profile with photo upload & password change modal

### Phase 10: Dashboard Feature Completion & Notifications (Current — March 2026)
- **Student Dashboard** — fully implemented 4 new pages:
  - **Leave Requests** — submit leave/outing requests (7 types), date range picker, destination, contacts, real-time status tracking, cancel pending
  - **Announcements** — real-time notice board with priority badges, pinned notices, expandable details, search & filter
  - **Settings** — theme toggle, password change (Firebase re-auth), notification preference toggles, account info
  - **Help & Support** — 12 searchable FAQs in 4 categories, support ticket submission, quick contact actions
- **Warden Dashboard** — fully implemented 4 new pages:
  - **Student Directory** — real-time Firestore student list, search/sort/filter, student detail modal with full info
  - **Announcements (CRUD)** — create, edit, delete hostel notices with 4 priority levels, pin-to-top, search
  - **Settings** — theme toggle, password change, 6 warden-specific notification toggles (new complaints, leave requests, sound alerts, etc.)
  - **Help & Support** — 16 warden-specific FAQs in 5 categories, support ticket submission, quick actions
- **Browser Push Notifications** — real-time browser notifications for:
  - 📢 New announcements (Student & Warden) — triggers on any announcement posted to their college
  - 📋 Leave request status updates (Student) — notified when approved, denied, or cancelled
  - 📋 New leave requests (Warden) — notified when students submit pending leave requests
- All new pages use real-time Firestore `onSnapshot` listeners, consistent UI design with CSS variables, responsive layouts

### Summary
- **Active Development**: December 2024 – Present
- **Total PRs**: 27+
- **Documentation Files**: 28
- **Backend Functions**: 15 (10 callable + 2 HTTP + 3 triggers + helpers)
- **Notification Listeners**: 10 real-time Firestore listeners for push notifications across all roles

---

## 📚 Documentation

Comprehensive guides are available in the [`docs/`](docs/) folder:

| Guide | Description |
|-------|-------------|
| [Quick Start](docs/QUICK_START.md) | Get running in 5 minutes |
| [Developer Setup](docs/DEVELOPER_SETUP.md) | Firebase config, env vars, emulators |
| [Complete Docs](docs/HOAS_COMPLETE_DOCUMENTATION.md) | Full system documentation |
| [Cloud Functions API](docs/CLOUD_FUNCTIONS_API.md) | Backend API reference |
| [Architecture Diagrams](docs/ARCHITECTURE_DIAGRAMS.md) | System & data flow diagrams |
| [Context Architecture](docs/CONTEXT_ARCHITECTURE.md) | React context providers guide |
| [Routing & Context](docs/ROUTING_AND_CONTEXT.md) | Route protection & navigation |
| [Firebase Emulators](docs/FIREBASE_EMULATOR_SETUP.md) | Local development with emulators |
| [Deployment Checklist](docs/DEPLOYMENT_CHECKLIST.md) | Production deployment steps |
| [Notifications](docs/Notification.md) | Push notification setup |
| [Reports](docs/REPORTS.md) | Report generation guide |
| [Changelog](docs/CHANGELOG.md) | Version history |

---

## 👥 Contributors

Developed and maintained by **niatapppurpose-APPs**.

### Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make changes with descriptive commits
4. Test using Firebase emulators
5. Push and open a Pull Request

**Commit convention**: `feat:`, `fix:`, `refactor:`, `docs:`, `style:`, `chore:`

---

## 🔮 Future Enhancements

- [ ] SMS integration for critical alerts
- [ ] Mobile app (React Native)
- [ ] Hostel inventory management
- [ ] Fee payment integration
- [ ] Room allocation automation
- [x] ~~Attendance tracking~~ (dashboard quick action available)
- [ ] Parent portal
- [ ] Audit logging and activity history
- [ ] Data export scheduling
- [x] ~~Student leave request system~~ ✅ Implemented
- [x] ~~Announcement system with browser notifications~~ ✅ Implemented
- [x] ~~Warden student directory~~ ✅ Implemented
- [x] ~~Settings pages for Student & Warden~~ ✅ Implemented
- [x] ~~Help & Support with FAQs~~ ✅ Implemented

---

## 📄 License

This project is **private and confidential**. All rights reserved.

**© 2024–2026 niatapppurpose-APPs**

Unauthorized copying, distribution, or use of this software is strictly prohibited.

---

<div align="center">

**Built with ❤️ for Educational Institutions**

**HOAS — Simplifying Hostel Management, One Dashboard at a Time**

[⬆ Back to Top](#hoas--hostel-operations-accountability-system)

</div>