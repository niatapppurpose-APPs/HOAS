# HOAS - Hostel Operations Accountability System

> A comprehensive full-stack web application for streamlined hostel/dormitory management with hierarchical role-based access control.

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/niatapppurpose-APPs/HOAS)
[![Firebase](https://img.shields.io/badge/Firebase-v12.6.0-orange.svg)](https://firebase.google.com/)
[![React](https://img.shields.io/badge/React-19.2.0-61dafb.svg)](https://reactjs.org/)
[![Node](https://img.shields.io/badge/Node.js-20+-green.svg)](https://nodejs.org/)

---

## 📋 Project Overview

**HOAS (Hostel Operations Accountability System)** is a modern, enterprise-grade hostel management platform designed for educational institutions. It automates hostel operations from student registration to administrative approvals with a hierarchical permission system spanning four user roles: **Owner (Super Admin)**, **Management (Principal/Co-Admin)**, **Warden**, and **Student**.

Built with cutting-edge web technologies including **React 19**, **Firebase Cloud Functions**, **Firestore**, and **Tailwind CSS**, the platform delivers real-time data synchronization, intelligent approval workflows, and role-specific dashboards for efficient hostel administration.

### 🎯 Project Objectives

- **Streamline Hostel Management**: Automate and digitize hostel operations end-to-end
- **Hierarchical Access Control**: Implement granular permission systems with approval workflows
- **Real-Time Synchronization**: Provide instant updates across all interfaces using Firestore listeners
- **Scalability**: Support multiple colleges/hostels under unified super admin control
- **Modern UX**: Deliver intuitive, professional interfaces tailored to each user role

---

## ✨ Features

### Authentication & Authorization
- 🔐 **Google OAuth Integration** via Firebase Authentication
- 👤 **Role-Based Access Control (RBAC)** with custom claims
- 🔑 **Hierarchical Permissions** (Owner → Management → Warden → Student)
- ⏳ **Approval Workflow System** for new user registrations
- 🚪 **Persistent Auth State** with automatic route protection

### Dashboard Features

#### 🔷 Owner Dashboard (Super Admin)
- Manage all Management (Principal) users across colleges
- Approve/Deny pending management account requests
- **Cascade Delete Colleges** - Remove entire college hierarchies (Management → Wardens → Students)
- Real-time statistics and KPI cards
- Profile management with organization details
- Bulk operations and pagination support
- **Support Ticket System** - Centralized management of user-reported issues with resolution tracking and status animations.
- **Global System Settings** - Configure system-wide settings including:
  - Global toggles (registration, approvals, maintenance mode)
  - Role permission templates with customizable permissions
  - Approval workflow configuration
  - User limits per college/hostel with capacity management
  - Maintenance mode with custom messages

#### 🔷 Management Dashboard (Principal/Co-Admin)
- View and manage Wardens and Students linked to specific college
- Approve/Deny pending Warden/Student requests
- KPI cards with pending approvals counter
- Quick approval panel for immediate actions
- Status visualization with circular progress indicators
- Recent activity timeline
- Glassmorphism UI with purple-blue gradient theme

#### 🔷 Warden Dashboard
- Monitor assigned students and hostel operations
- AI-powered translation system (multilingual support)
- Update student statuses and manage hostel activities
- Real-time notifications and alerts

#### 🔷 Student Dashboard
- View hostel information and personal profile
- Submit requests and view approval status
- Access hostel rules and announcements

### Additional Features
- 🎨 **Modern UI/UX**: Dark theme with glassmorphism effects, smooth animations
- 📊 **Report Generation**: Export JSON and PDF reports for analytics
- 🔔 **Toast Notification System**: Beautiful themed notifications with 4 types (Success, Error, Warning, Info)
- 🌐 **Internationalization**: Multi-language support with i18next
- 🎭 **Interactive Dashboard Tour**: Onboarding tutorial using Shepherd.js
- 🌓 **Theme Toggle**: Auto-detect system theme or manual dark/light mode
- 📱 **Fully Responsive**: Mobile-first design with breakpoints for all devices
- ⚡ **Real-time Updates**: Firestore listeners for instant data synchronization
- 🔍 **Search & Filter**: Advanced filtering across dashboards
- 📄 **Pagination**: Efficient data loading with page state preservation
- 🚫 **Server Offline Detection**: Automatic fallback UI when backend is unavailable

---

## 🛠️ Tech Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 19.2.0 | UI framework with modern hooks |
| **Vite** | 7.2.4 | Lightning-fast build tool |
| **Tailwind CSS** | 4.1.18 | Utility-first CSS framework |
| **React Router** | 7.10.1 | Client-side routing |
| **Firebase SDK** | 12.6.0 | Authentication & Firestore client |
| **Lucide React** | 0.561.0 | Modern icon library |
| **Framer Motion** | 12.27.5 | Animation library |
| **Recharts** | 3.6.0 | Data visualization |
| **i18next** | 25.8.0 | Internationalization |
| **Shepherd.js** | 14.5.1 | User onboarding tours |

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| **Node.js** | 20+ | JavaScript runtime |
| **Firebase Functions** | v2 | Serverless cloud functions |
| **Firebase Admin SDK** | Latest | Server-side Firebase operations |
| **Express.js** | - | HTTP middleware (within functions) |
| **Firestore** | - | NoSQL real-time database |
| **Firebase Auth** | - | Authentication service |

### Development Tools
- **ESLint** - Code linting and quality
- **Concurrently** - Run multiple npm scripts
- **Firebase Emulator Suite** - Local development environment

---

## 📁 Folder Structure

```
HOAS/
├── client/                          # Frontend Application (React + Vite)
│   ├── public/                      # Static assets
│   ├── src/
│   │   ├── assets/                  # Images, icons, animations
│   │   ├── components/
│   │   │   ├── FirebaseModeIndicator.jsx
│   │   │   ├── OwnerServices/       # Owner/Admin components
│   │   │   │   ├── Avatar.jsx
│   │   │   │   ├── DeleteConfirmModal.jsx
│   │   │   │   └── (AdminLogin.jsx removed — admin uses /login)
│   │   │   │   ├── GlobalDeleteModal.jsx
│   │   │   │   ├── header.jsx
│   │   │   │   ├── OwnerProfile.jsx
│   │   │   │   ├── Sidebar.jsx
│   │   │   │   ├── StatsCard.jsx
│   │   │   │   └── StatusBadge.jsx
│   │   │   ├── Routes/
│   │   │   │   └── index.jsx        # App routing configuration
│   │   │   ├── ServerOffline/       # Offline detection component
│   │   │   ├── ThemeToggle/         # Dark/Light mode toggle
│   │   │   ├── Toast/               # Notification system
│   │   │   │   ├── Toast.jsx
│   │   │   │   ├── Toast.css
│   │   │   │   ├── ToastContainer.jsx
│   │   │   │   └── README.md
│   │   │   └── UserServices/        # (role self-selection removed; admin provisioning)
│   │   ├── context/
│   │   │   ├── AuthContext.jsx      # Firebase auth state
│   │   │   ├── ModalContext.jsx     # Modal management
│   │   │   └── ThemeContext.jsx     # Theme management
│   │   ├── DashBoards/
│   │   │   ├── Management-Dashboard/
│   │   │   │   ├── index.jsx
│   │   │   │   ├── ManagementDashboard.jsx
│   │   │   │   ├── ManagementDashboard.css
│   │   │   │   ├── README.md
│   │   │   │   └── QUICK_START.md
│   │   │   ├── Principal-Dashbord/
│   │   │   │   └── PrincipalDashboard.jsx
│   │   │   ├── Student-DashBoard/
│   │   │   │   └── StudentDashboard.jsx
│   │   │   └── Warden-Dashboard/
│   │   │       └── WardenDashboard.jsx
│   │   ├── firebase/
│   │   │   ├── cloudFunctions.js    # Cloud Functions API client
│   │   │   ├── debugUtils.js
│   │   │   └── firebaseConfig.js
│   │   ├── hooks/
│   │   │   ├── useServerStatus.js
│   │   │   ├── useSystemSettings.js # System settings enforcement hooks
│   │   │   └── useTranslation.js
│   │   ├── Pages/
│   │   │   ├── Dashboard/
│   │   │   ├── HOME/
│   │   │   ├── LoginPage/
│   │   │   ├── NotFound/
│   │   │   ├── OwnersDashboard/
│   │   │   ├── ProfilePage/
│   │   │   └── WaitingApproval/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── eslint.config.js
│
├── server/                          # Backend (Firebase Functions)
│   ├── functions/
│   │   ├── src/
│   │   │   ├── admin.js             # Admin operations
│   │   │   ├── collegeManagement.js # College CRUD operations
│   │   │   ├── config.js            # Configuration
│   │   │   ├── helpers.js           # Utility functions
│   │   │   ├── reports.js           # Report generation
│   │   │   ├── systemSettings.js    # Global system settings APIs
│   │   │   ├── triggers.js          # Firestore triggers
│   │   │   ├── userManagement.js    # User CRUD operations
│   │   │   └── utility.js           # Utility endpoints
│   │   ├── index.js                 # Functions entry point
│   │   └── package.json
│   ├── firebase.json                # Firebase configuration
│   ├── serviceAccountKey.json       # Firebase credentials (gitignored)
│   └── setAdmin.js                  # Admin setup utility
│
├── docs/                            # Comprehensive Documentation
│   ├── ARCHITECTURE_DIAGRAMS.md
│   ├── BACKEND_MIGRATION.md
│   ├── CHANGELOG.md
│   ├── CLOUD_FUNCTIONS_API.md
│   ├── CONTEXT_ARCHITECTURE.md
│   ├── CONVERSION_SUMMARY.md
│   ├── DEPLOYMENT_CHECKLIST.md
│   ├── DOCUMENTATION_INDEX.md
│   ├── EMULATOR_QUICK_REFERENCE.md
│   ├── FIREBASE_EMULATOR_SETUP.md
│   ├── FIREBASE_FUNCTIONS_DEPLOYMENT.md
│   ├── FIREBASE_MODE_INDICATOR.md
│   ├── HOAS_COMPLETE_DOCUMENTATION.md
│   ├── Notification.md
│   ├── OAUTH_IMPLEMENTATION_SUMMARY.md
│   ├── PROJECT_DOCUMENTATION.md
│   ├── QUICK_REFERENCE.md
│   ├── QUICK_START.md
│   ├── REPORTS.md
│   └── ROUTING_AND_CONTEXT.md
│
├── package.json                     # Root workspace configuration
└── README.md                        # This file
```

---

## 🚀 Setup & Installation

### Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** 20 or higher ([Download](https://nodejs.org/))
- **npm** or **yarn** package manager
- **Firebase CLI** (`npm install -g firebase-tools`)
- **Git** ([Download](https://git-scm.com/))
- A **Firebase project** with Firestore and Authentication enabled
```

Firebase setup instructions (project config, service account key and client firebaseConfig examples) have been moved to `docs/DEVELOPER_SETUP.md` so the GitHub project page stays concise. In short: enable Firestore and Authentication in your Firebase project, then add your web app credentials to `client/src/firebase/firebaseConfig.js`. See `docs/DEVELOPER_SETUP.md` for the exact commands and example configuration.


## 🔄 Pull Requests & Development History

### Development Timeline & Major Features

The HOAS project has evolved through systematic development iterations. Below is a chronological summary of merged changes and feature implementations:

#### **Phase 1: Foundation & Authentication (December 2024)**

**PR #1: Initial Authentication System**
- Implemented Google OAuth login via Firebase Authentication
- Created persistent auth state with AuthContext
- Set up role-based routing protection
- Added admin authentication via custom claims
- **Related Files**: `LoginPage/`, `AuthContext.jsx`, `firebaseConfig.js`

**PR #2: Role Selection (legacy — removed)**
- Role self-selection has been removed from the client; roles are now provisioned by Owner/Management.
- See `WaitingApproval/` and Owner provisioning workflows for user setup.

#### **Phase 2: Core Dashboard Development (December 2024 - January 2025)**

**PR #3: Owner Dashboard Implementation**
- Created Owner (Super Admin) dashboard with complete user management
- Implemented approval/denial system for Management users
- Added statistics cards showing total, pending, and approved counts
- Built tab filtering (All/Pending/Approved)
- Real-time updates via Firestore onSnapshot listeners
- **Commit**: `ded9060` - "Complete HOAS user management system with role-based access control"

**PR #4: Cascade Delete & College Management**
- Implemented cascade delete feature for colleges
- Delete Management account removes all associated Wardens and Students
- Added confirmation modal displaying user counts before deletion
- Enhanced data integrity with batch operations
- **Related Files**: `OwnersDashboard/`, `DeleteConfirmModal.jsx`, `GlobalDeleteModal.jsx`

**PR #5: Owner Profile Page**
- Created dedicated Owner Profile page (`/owner-profile`)
- Profile editing: display name, phone, organization
- Profile photo display from Google OAuth
- Account status and creation date display
- Logout functionality from profile page
- **Commit**: `6c24483` - "Add Owner Profile page with edit and logout functionality"
- **Related Files**: `OwnerProfile.jsx`, `header.jsx`

**PR #6: Management (Principal) Dashboard**
- Built Co-Admin dashboard for college Principals
- View and manage Wardens and Students by college
- Approve/Deny pending Warden/Student requests
- Smart sorting with pending requests prioritized
- Tab switching between Wardens and Students
- **Related Files**: `Principal-Dashbord/PrincipalDashboard.jsx`

#### **Phase 3: Backend Migration & Refactoring (January 2025)**

**PR #7: Full-Stack Architecture Restructure**
- Reorganized project into client/server/docs structure
- Separated frontend and backend codebases
- Updated build scripts and workspace configuration
- **Commits**:
  - `62d55c3` - "Restructure: Organize into full-stack architecture"
  - `d2ef263` - "Complete full-stack restructure and code cleanup"
- **Related Files**: Root `package.json`, workspace restructure

**PR #8: Firebase Cloud Functions Modularization**
- Refactored backend into modular Cloud Functions structure
- Created dedicated modules: admin.js, userManagement.js, collegeManagement.js, reports.js
- Implemented authorization on every backend endpoint
- Added server-side validation and error handling
- **Commit**: `247e590` - "Refactor Cloud Functions into modular structure"
- **Related Files**: `server/functions/src/*`

**PR #9: Report Generation System**
- Implemented JSON and PDF report exports
- Created BackendReports service for data export
- Added download functionality for user analytics
- **Commits**:
  - `5772112` - "feat(reports): add BackendReports service for JSON/PDF exports"
  - `54d57fd` - "implement report download functionality and concurrent dev scripts"
- **Related Files**: `server/functions/src/reports.js`, `Pages/Reports/`

#### **Phase 4: UX Enhancements & Polish (January 2025)**

**PR #10: Toast Notification System**
- Replaced all browser `alert()` calls with modern toast notifications
- Created custom Toast component with 4 types (Success, Error, Warning, Info)
- Gradient backgrounds matching app theme
- Smooth animations with auto-dismiss and progress bar
- **Commit**: `9ff1888` - "implement toast notifications, routing improvements, and comprehensive documentation"
- **Related Files**: `components/Toast/`, Toast integration across dashboards

**PR #11: Pagination & Bulk Operations**
- Added pagination support to Owner Dashboard
- Implemented bulk approve/deny operations
- Enhanced UX with loading states and confirmations
- Page state preservation when navigating
- **Commits**:
  - `b95bc37` - "Add pagination, bulk operations, and enhanced UX to Owner Dashboard"
  - `fd93f41` - "Add page state preservation when navigating to/from Owner Profile"
- **Related Files**: `OwnersDashboard/ownersdashbord.jsx`

**PR #12: Theme System & Dashboard Tour**
- Implemented auto-detect system theme mode
- Created manual dark/light theme toggle
- Added interactive dashboard tour using Shepherd.js
- Onboarding guide for new users
- **Commits**:
  - `c4abcca` - "Implement Dashboard Tour and Auto-System Theme Mode"
  - `726f4bf` - "Add customizable theme pickers and apply background in layout"
- **Related Files**: `ThemeToggle/`, `context/ThemeContext.jsx`

**PR #13: Server Offline Detection**
- Created ServerOffline component with custom UI
- Automatic detection when Firebase backend is unavailable
- User-friendly error messages and retry logic
- **Commit**: `299350a` - "Changed UI and styles, added Not Found page and Server Offline page"
- **Related Files**: `ServerOffline/ServerOffline.jsx`, `hooks/useServerStatus.js`

**PR #14: Internationalization (i18n)**
- Integrated i18next for multi-language support
- AI-powered translation system for Warden Dashboard
- Language detection and switcher
- Translation files for multiple locales
- **Commits**:
  - `43d71ea` - "Add Language Translations and fixed issues, added content in Owner Dashboard"
  - `874b066` - "Implement and fix AI-powered translation system for Warden Dashboard"
- **Related Files**: `hooks/useTranslation.js`, locale files

#### **Phase 5: Management Dashboard Redesign (January 2025)**

**PR #15: Premium Management Dashboard**
- Complete redesign with glassmorphism effects
- Dark theme with purple-blue gradient backgrounds
- KPI cards for Wardens, Students, Pending Approvals, Hostels
- Quick approval panel with user avatars
- Recent activity section with horizontal cards
- Status visualization with circular progress indicators
- Fully responsive with mobile-first design
- **Commit**: `09235c5` - "managemntdaschboard changed"
- **Related Files**: `Management-Dashboard/ManagementDashboard.jsx`, `Management-Dashboard/README.md`

#### **Phase 6: UI/UX Refinements (January 2025)**

**PR #16: Login Page Interface Update**
- Redesigned login page interface
- Updated routes and navigation paths
- Improved user flow and authentication experience
- **Commit**: `e65f70b` - "the login page interface was changed by me and some routes path were added"

**PR #17: Small Changes & Bug Fixes** _(Multiple Commits)_
- Various UI improvements and bug fixes
- Code cleanup and optimization
- Loader screen enhancements
- Sidebar and header refinements
- App logo additions

#### **Phase 7: Recent Updates (January 2026)**

**PR #18: Deployment & Hosting Fixes**
- Resolved Firebase hosting deployment errors
- Updated .gitignore for environment files
- Improved OwnersDashboard responsiveness
- **Commits**:
  - `5cae3cf` - "fix: resolve Firebase hosting deployment error"
  - `848e52b` - "Update OwnersDashboard responsiveness and fix .gitignore"

**PR #19: Documentation Consolidation** (`15ecb17`)
- Merged all README files into comprehensive root documentation
- Created unified documentation structure

**PR #20: Empty States Enhancement** (`591867e`)
- Added Empty State components in OwnersDashboard
- Implemented Empty State for Wardens List page

**PR #21: Global System Settings Module** (`c85afd5`)
- Created a comprehensive Global System Settings module for Owner-only admin panel
- Added global toggles for registration, approvals, and maintenance mode
- Implemented role permission templates with customizable permissions
- Created approval workflow configuration system
- Added user limits per college/hostel with capacity management
- Implemented complete DB schema with Firestore collections
- Built 15+ Cloud Functions APIs for settings management
- Added enforcement logic with React hooks (FeatureGate, MaintenanceGate, RegistrationGate)
- Created useSystemSettings hook for real-time settings enforcement across the app

**PR #22: UI/UX Improvements** (`99dbc07`)
- Added perfect themes with consistent styling
- Implemented animated videos/graphics for empty states
- Enhanced "Not Found" page visuals

**PR #23: Minor Fixes** (`4c001d0`)
- Small UI/UX refinements
- Bug fixes and code cleanup

#### **Phase 8: Advanced Refinement & Authentication (January - February 2026)**

**PR #24: College Profile & Logo System**
- Implemented college logo upload infrastructure for management users
- Added animated profile preview transition with automated redirection
- Enhanced college identity management within the platform
- **Related Files**: `ProfilePage/`, `ManagementDashboard.jsx`

**PR #25: Google OAuth & Auth Flow Optimization**
- Streamlined Google OAuth authentication process
- Improved persistent session handling and role-based initial redirection
- Fixed authentication race conditions during startup
- **Related Files**: `AuthContext.jsx`, `LoginPage/`

**PR #26: Dynamic Homepage & Team Integration**
- Refactored homepage logic for context-aware call-to-action buttons
- Implemented smart "Sign In" vs "Dashboard" visibility based on auth state
- Integrated dynamic developer team data with local image assets
- **Related Files**: `HOME/`, team data configurations

**PR #27: Support Ticketing & Premium Error System** (Today)
- **Support Ticket Management**: Built a complete Firestore-backed ticketing system for Owners to track and resolve user issues in real-time.
- **Resolution Workflow**: Implemented interactive status management (Mark Resolved, In Progress, Delete) with localized loading animations and automatic dashboard transitions.
- **Dual Reporting Mechanism**: Redesigned `ErrorModal` to offer both instant Firestore submission and a fallback "Report via Email" option.
- **Premium UI Scaling**: Upgraded the error reporting interface to a massive `max-w-4xl` "Dashboard" style with glassmorphism and modern squircle aesthetics.
- **Bug Fixes**: Resolved critical state management errors in `SupportTickets.jsx` and fixed a `getoleLabel` typo in the `Wardens.jsx` management view.
- **Related Files**: `SupportTickets.jsx`, `ErrorModal.jsx`, `Sidebar.jsx`, `Wardens.jsx`, `Routes/index.jsx`

### Summary Statistics

- **Total Commits**: 110+
- **Active Development Period**: December 2024 - February 2026
- **Major Features**: 27+
- **Documentation Files**: 22+
- **Lines of Code**: 13,000+ (estimated)

### Notable Refactoring Events

1. **Component Modularization** (`d302b66`): Refactored OwnersDashboard into reusable components (Avatar, StatsCard, StatusBadge)
2. **Analytics Removal**: Removed analytics page as per requirements, focusing on core management features
3. **Cloud Functions Migration**: Moved from client-side Firestore writes to secure Cloud Functions architecture
4. **Global System Settings** (`c85afd5`): Added comprehensive admin settings module with enforcement hooks

---

## 👥 Contributors

This project is developed and maintained by:

- **niatapppurpose-APPs** - Lead Developer & Architect

### Contribution Guidelines

We welcome contributions! To contribute:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Make your changes** with clear, descriptive commit messages
4. **Test thoroughly** using Firebase emulators
5. **Commit your changes**
   ```bash
   git commit -m 'feat: Add amazing feature'
   ```
6. **Push to your branch**
   ```bash
   git push origin feature/amazing-feature
   ```
7. **Open a Pull Request** with detailed description of changes

### Commit Message Convention

Follow conventional commits format:
- `feat:` - New features
- `fix:` - Bug fixes
- `refactor:` - Code refactoring
- `docs:` - Documentation updates
- `style:` - Code style changes (formatting, etc.)
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

---

## 📄 License

This project is **private and confidential**. All rights reserved.

**© 2024-2026 niatapppurpose-APPs**

Unauthorized copying, distribution, or use of this software is strictly prohibited.

---

## 📞 Support & Contact

### Getting Help

- 📚 **Documentation**: See the [`docs/`](docs/) folder for comprehensive guides
- 🐛 **Bug Reports**: Open an issue on GitHub
- 💡 **Feature Requests**: Submit via GitHub Issues
- 📧 **Email Support**: Contact the development team

### Useful Links

| Resource | Link |
|----------|------|
| Quick Start Guide | [docs/QUICK_START.md](docs/QUICK_START.md) |
| Complete Documentation | [docs/HOAS_COMPLETE_DOCUMENTATION.md](docs/HOAS_COMPLETE_DOCUMENTATION.md) |
| API Reference | [docs/CLOUD_FUNCTIONS_API.md](docs/CLOUD_FUNCTIONS_API.md) |
| Deployment Guide | [docs/FIREBASE_FUNCTIONS_DEPLOYMENT.md](docs/FIREBASE_FUNCTIONS_DEPLOYMENT.md) |
| Architecture Diagrams | [docs/ARCHITECTURE_DIAGRAMS.md](docs/ARCHITECTURE_DIAGRAMS.md) |
| Changelog | [docs/CHANGELOG.md](docs/CHANGELOG.md) |

---

## 🏗️ Architecture Overview

### System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                      │
│  - React 19 + Vite                                      │
│  - Tailwind CSS                                         │
│  - Firebase SDK                                         │
│  - Real-time Firestore listeners (reads)               │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│           FIREBASE CLOUD FUNCTIONS (Backend)             │
│  - User Management APIs                                 │
│  - College Management APIs                              │
│  - Admin Operations                                     │
│  - Authorization & Validation                           │
│  - Report Generation (JSON/PDF)                        │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│                FIREBASE SERVICES                         │
│  ┌──────────────┬──────────────┬──────────────┐        │
│  │   Firestore  │  Auth (OAuth)│   Functions  │        │
│  │   Database   │  & Custom    │   Runtime    │        │
│  │              │  Claims      │              │        │
│  └──────────────┴──────────────┴──────────────┘        │
└─────────────────────────────────────────────────────────┘
```

### User Hierarchy

```
┌─────────────────────────────────────────┐
│          OWNER (Super Admin)            │
│  - Full system access                   │
│  - Manage all Management users          │
│  - Custom claims via Firebase Admin SDK │
└──────────────┬──────────────────────────┘
               │
               ├── Management User 1 (College A)
               │   ├── Warden 1
               │   │   └── Student 1, 2, 3...
               │   └── Warden 2
               │       └── Student 4, 5, 6...
               │
               └── Management User 2 (College B)
                   ├── Warden 3
                   └── Student 7, 8, 9...
```

---

## 🎨 UI Screenshots

> **Note**: Screenshots to be updated with latest UI designs

### Key Color Scheme

| Color | Hex | Usage |
|-------|-----|-------|
| Purple | `#8B5CF6` | Wardens, Primary actions |
| Blue | `#3B82F6` | Students, Secondary actions |
| Orange | `#FB923C` | Pending/Attention items |
| Green | `#10B981` | Approved/Success states |
| Red | `#EF4444` | Deny/Logout actions |

---

## 🔮 Future Enhancements

- [ ] Email notifications for approvals/rejections
- [ ] SMS integration for critical alerts
- [ ] Advanced analytics and reporting dashboards
- [ ] Bulk import/export functionality (CSV/Excel)
- [ ] Mobile app (React Native)
- [ ] Hostel inventory management
- [ ] Fee payment integration
- [ ] Complaint/Ticket system
- [ ] Room allocation automation
- [ ] Attendance tracking
- [ ] Parent portal
- [ ] Push notifications
- [ ] Audit logging and activity history
- [ ] Advanced search with filters
- [ ] Data export scheduling

---

## 🙏 Acknowledgments

- Firebase for providing excellent backend infrastructure
- React community for continuous innovation
- Tailwind CSS for making styling effortless
- Lucide for beautiful, consistent icons
- All open-source contributors whose libraries power this project

---

<div align="center">

**Built with ❤️ for Educational Institutions**

**HOAS - Simplifying Hostel Management, One Dashboard at a Time**

[⬆ Back to Top](#hoas---hostel-operations-accountability-system)

</div>