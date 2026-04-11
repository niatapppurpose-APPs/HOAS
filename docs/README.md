# HOAS — Hostel Operations Accountability System

> A full-stack hostel management platform with hierarchical role-based access control, real-time dashboards, and Firebase Cloud Functions backend.

[![Version](https://img.shields.io/badge/version-2.1.0-blue.svg)](https://github.com/niatapppurpose-APPs/HOAS)
[![React](https://img.shields.io/badge/React-19.2.0-61dafb.svg)](https://reactjs.org/)
[![Firebase](https://img.shields.io/badge/Firebase-12.6.0-orange.svg)](https://firebase.google.com/)
[![Node](https://img.shields.io/badge/Node.js-22-green.svg)](https://nodejs.org/)
[![Vite](https://img.shields.io/badge/Vite-7.2.4-646CFF.svg)](https://vitejs.dev/)
[![Tailwind](https://img.shields.io/badge/Tailwind_CSS-4.1.18-38BDF8.svg)](https://tailwindcss.com/)

---

## 📋 Overview

**HOAS** is an enterprise-grade hostel management system purpose-built for educational institutions. It automates the entire hostel lifecycle — from student registration and warden approvals to complaint resolution and leave management — through a clean, four-tier role hierarchy:

**Owner (Super Admin) → Management (Principal) → Warden → Student**

Every role gets a dedicated, feature-rich dashboard tailored to their responsibilities. The platform is built on **React 19** and **Firebase**, delivering real-time data synchronization, intelligent approval workflows, and a premium user interface with dark and light theme support.

### Why HOAS?

- **End-to-end automation** — eliminates paper-based hostel processes entirely
- **Granular permission control** — every action is governed by role and approval status
- **Real-time everything** — Firestore listeners push updates instantly to all connected users
- **Multi-institution support** — a single Owner can oversee multiple colleges, each with their own management, wardens, and students
- **Beautiful, role-tailored dashboards** — every user sees only what matters to them, designed with modern UI/UX best practices

---

## ✨ Features

### 🔐 Authentication & Authorization

HOAS uses a robust, multi-layered authentication system. The **Owner (Super Admin)** signs in using **Google OAuth**, while **Management**, **Warden**, and **Student** users authenticate with **email and password**. All access is governed by **Role-Based Access Control (RBAC)** through Firebase custom claims, ensuring every user can only see and do what their role permits.

New user registrations are not automatically granted access — they enter an **approval workflow** where higher-level users must accept or deny the request. This prevents unauthorized access and gives administrators complete control over who joins the platform. Auth state is persisted across sessions with automatic route protection, so users stay logged in and are always redirected to the correct dashboard.

---

### 👑 Owner Dashboard (Super Admin)

The Owner Dashboard is the command center for the entire HOAS ecosystem. It gives the Super Admin a bird's-eye view of all colleges, management users, wardens, and students across the platform.

**User Management** — The Owner can add, approve, or deny Management (Principal) accounts. When a Management account is approved, it unlocks that college's branch in the hierarchy, allowing wardens and students to register under it. The Owner also has the power to **cascade-delete an entire college** — which removes the Management account and every warden and student linked to it in a single action.

**System Settings** — A dedicated six-card configuration panel lets the Owner control platform-wide behavior, including role and access control rules, complaint escalation settings, notification preferences, security policies, appearance defaults, and system controls like maintenance mode or registration toggles.

**Analytics & Reports** — Interactive charts visualize user trends, college distribution, and role approval rates over time. The Owner can also generate and download **JSON and PDF reports** of user data across the platform using server-side PDFKit generation.

**Support Tickets** — A centralized ticketing system lets the Owner track, respond to, and resolve support requests submitted by any user. Each ticket has a status workflow with visual indicators.

**Bulk Operations** — The Owner can import students in bulk from Excel spreadsheets, with automatic account creation and email notifications sent to each new student.

---

### 🏫 Management Dashboard (Principal)

The Management Dashboard is designed for college principals or administrators who oversee their institution's hostel operations.

**Approvals & User Management** — When wardens or students register under a college, their accounts appear as pending. Management can quickly approve or deny them through a streamlined quick-approval panel. Real-time KPI cards show pending counts, total wardens, total students, and other key metrics at a glance.

**Hostel Administration** — Management can add new hostels, view hostel details, and remove hostels as needed. Each hostel becomes part of the college's organizational structure.

**Complaint Oversight** — Management has visibility into all complaints filed within their college. They can view, filter, and search complaints, see detailed complaint history with timelines, and monitor escalation status. When a complaint is escalated or disputed by a student, Management is notified immediately.

**Leave Request Visibility** — Management receives notifications for new leave requests, giving them oversight of student movements without needing to handle approvals directly (which are managed by wardens).

The dashboard features a modern glassmorphism UI with purple-blue gradients, status visualization through circular progress indicators, and a recent activity timeline.

---

### 🛡️ Warden Dashboard

The Warden Dashboard is a comprehensive workspace for hostel wardens responsible for day-to-day operations.

**Overview & Quick Actions** — The main dashboard greets wardens with a welcome banner, quick-action buttons for common tasks (Complaints, Students, Notice Board, Attendance), a real-time complaint activity feed, and a warden information card.

**Student Directory** — A real-time, searchable list of all students in the warden's hostel. Wardens can sort students by name, room number, or hostel, filter by status, and click on any student to view their complete profile in a detail modal.

**Complaint Management** — Wardens receive, review, and resolve student complaints through a rich interface. Each complaint can be moved through statuses — pending, in-progress, warden-resolved, resolved, or rejected. If a student disagrees with a resolution, they can **dispute** it, which sends the complaint back to the warden with the student's dispute reason prominently displayed. Wardens can then re-resolve and send it back for student confirmation.

**Announcements** — Full CRUD capabilities for hostel announcements. Wardens can create notices with four priority levels (Urgent, Important, Normal, Info), pin important notices to the top, and search through past announcements. Students receive browser notifications instantly when a new announcement is posted.

**Leave Request Review** — All student leave requests within the hostel appear here. Wardens can view details including leave type, dates, destination, and contact information, then approve or deny each request with a single click.

**Settings** — Wardens can toggle between dark and light themes, change their password with Firebase re-authentication, and fine-tune **six notification preferences**: new complaints, complaint status changes, leave requests, new student registrations, sound alerts, and system alerts.

**Help & Support** — A built-in help center with 16 warden-specific FAQs organized across 5 categories, plus the ability to submit support tickets directly to the Owner and quick contact actions.

---

### 🎓 Student Dashboard

The Student Dashboard provides students with everything they need to interact with their hostel administration.

**Overview & Quick Actions** — Students are greeted with a personalized welcome banner and quick-action cards — File a Complaint, View My Complaints, Apply for Leave, and Notice Board. A recent activity feed shows their latest interactions, and a profile summary card displays their key information.

**Complaint System** — Students can file complaints with a detailed form that supports image uploads via drag-and-drop. Every complaint is tracked in real-time — students can see when it's been acknowledged, when it's in progress, and when the warden marks it resolved. If a student feels the issue wasn't truly fixed, they can **dispute** the resolution, which reopens the complaint and notifies the warden with the student's reason.

**Leave Requests** — Students can submit leave or outing requests by choosing from seven leave types (Home Visit, Medical, Family Emergency, Academic, Personal, Day Outing, Other), selecting date ranges, providing their destination and emergency contact details. Each request is tracked in real-time with status updates, and students can cancel pending requests if plans change.

**Announcements** — A real-time notice board that displays all hostel announcements with priority badges, pinned notices at the top, and search and filter capabilities. Students receive browser notifications whenever a new announcement is posted.

**Settings** — Students can toggle their theme preference, change their password securely through Firebase re-authentication, and control five notification preferences: complaint updates, leave request updates, new announcements, system alerts, and sound alerts.

**Help & Support** — 12 searchable FAQs organized in 4 categories cover the most common student questions. Students can also submit support tickets that go directly to the Owner for resolution.

---

### 🌐 Platform-Wide Capabilities

Beyond the role-specific dashboards, HOAS includes several capabilities that enhance the experience for every user:

**Dark & Light Theme** — Users can choose their preferred theme or let the platform auto-detect their system preference. The theme is consistent across every page and component.

**Real-Time Notifications** — HOAS uses a comprehensive browser notification system powered by Firebase Cloud Messaging and Firestore real-time listeners. There are 16 active notification channels covering every significant event across all four roles — from new complaints and leave requests to escalated issues and user registrations. Each listener respects user preferences, skips initial page load to prevent duplicate alerts, and updates both the native browser notification and the in-app notification bell. See the **Notification System** section below for the complete coverage matrix.

**Toast Notifications** — In-app toast messages with four styles (Success, Error, Warning, Info) provide immediate feedback for every user action, with smooth entrance and exit animations.

**Interactive Onboarding** — First-time users are guided through their dashboard with an interactive tour built on Shepherd.js, highlighting key areas and explaining functionality step by step.

**Fully Responsive Design** — Every page is designed mobile-first and works beautifully on phones, tablets, and desktops. The layout adapts from single-column on mobile to multi-column grids on larger screens.

**Server Health Monitoring** — The platform automatically detects when the backend is unavailable and shows a clean fallback UI, preventing confusing error states for users.

**Internationalization** — Multi-language support is built in through i18next, with AI-powered translation available for wardens.

**Data Visualization** — Charts and graphs powered by Recharts give administrators clear visual insights into trends, distributions, and approval rates.

---

## 🔔 Notification System

HOAS implements one of its most critical features through a **comprehensive real-time notification system**. Three layers work together to ensure no important event goes unnoticed:

**NotificationContext** — The central React context provider that manages all notification state, FCM token registration, permission requests, and 16 real-time Firestore snapshot listeners.

**Notification Service** — A service layer that handles requesting browser notification permission, obtaining Firebase Cloud Messaging device tokens, and displaying native browser notifications with sound.

**Service Worker** — A background worker that catches push notifications even when the app is not actively open, displays them as native OS notifications, and handles click-to-open navigation.

### Complete Coverage

**Student Notifications** — Students are notified when their complaint status changes, when their leave request is approved or denied, when new announcements are posted to their hostel, and when their support ticket is updated. Sound alerts can be toggled on or off.

**Warden Notifications** — Wardens receive alerts for new complaints filed by students, when a student disputes a resolution, new pending leave requests, new student registrations in their hostel, and new announcements. Each category can be individually enabled or disabled through six toggle switches in Settings.

**Management Notifications** — Management is notified when new complaints are filed in their college, when a complaint is escalated (automatically or manually), when a student disputes a warden's resolution, when new students or wardens register and need approval, and when new leave requests come in.

**Owner (Admin) Notifications** — The Owner receives notifications for pending management account approvals and new support tickets filed by any user across the platform.

Every notification listener follows a consistent pattern: it guards against the wrong role, skips the initial data load to prevent false alerts, respects user preference settings, triggers a native browser notification with sound, and updates the in-app notification bell count.

---

## 🛠️ Technology Stack

### Frontend

**React 19.2.0** serves as the UI framework, built and served through **Vite 7.2.4** for fast development and optimized production builds. Styling uses **Tailwind CSS 4.1.18** with CSS variables for theme switching. Navigation is handled by **React Router 7.10.1**, and the entire Firebase ecosystem (**SDK 12.6.0**) powers authentication, database, storage, and messaging on the client side.

The interface uses **Lucide React** for icons, **Framer Motion 12.27.5** for smooth animations and page transitions, **Recharts 3.6.0** for data visualization, **Shepherd.js 14.5.1** for onboarding tours, **react-colorful** for theme customization, **i18next 25.8.0** for internationalization, and **XLSX** for parsing Excel files during bulk student uploads.

### Backend

The server runs on **Node.js 22** with **Firebase Cloud Functions v2** (7.0.6) providing a serverless architecture. The **Firebase Admin SDK 13.6.0** handles server-side authentication verification and database operations. **Express 5.2.1** is used as HTTP middleware for CORS handling. Reports are generated as PDFs using **PDFKit 0.15.0**, email notifications are dispatched through **Nodemailer 8.0.1**, and **XLSX** handles Excel file parsing for the bulk student import feature.

### Infrastructure

The platform relies entirely on Firebase services: **Firebase Authentication** for Google OAuth and email/password login, **Cloud Firestore** as the real-time NoSQL database, **Firebase Cloud Functions** deployed to us-central1 as the serverless backend, **Firebase Storage** for profile photos and file uploads, **Firebase Cloud Messaging** for push notifications, and **Firebase Hosting** for frontend deployment.

### Development Tools

Code quality is maintained with **ESLint**, development runs client and server simultaneously using **Concurrently**, and local testing is done through the **Firebase Emulator Suite**.

---

## 🔗 Cloud Functions API

The backend exposes **10 callable functions** and **2 HTTP endpoints**, all deployed to the **us-central1** region. Additionally, **5 Firestore triggers** fire automatically on database events.

### Callable Functions

| Function | Description |
|----------|-------------|
| **approveUser** | Approves a pending user registration and sets their role via custom claims |
| **denyUser** | Denies a pending user registration and removes their account |
| **getAllManagementUsers** | Returns a list of all management-role users across the platform |
| **createManagement** | Creates a new management user with email/password credentials |
| **createWarden** | Creates a new warden user linked to a specific management account |
| **deleteCollege** | Cascade-deletes a college along with all its wardens and students |
| **getSystemSettings** | Fetches the global system configuration settings |
| **updateSystemSettings** | Updates one or more global system settings |
| **checkCollegeCapacity** | Checks whether a college has reached its configured user limits |
| **bulkCreateStudents** | Creates multiple student accounts from Excel spreadsheet data |

### HTTP Endpoints

| Endpoint | Description |
|----------|-------------|
| **downloadReportJson** | Exports user data as a downloadable JSON file |
| **downloadReportPdf** | Exports user data as a formatted PDF document via PDFKit |

### Firestore Triggers

| Trigger | Fires When |
|---------|------------|
| **onNewCollegeApproval** | A new college management account needs approval |
| **onNewSupportTicket** | A user submits a new support ticket |
| **onSupportTicketUpdate** | A support ticket's status changes |
| **onNewWardenRegistration** | A new warden registers under a college |
| **sendCustomNotification** | A manual notification is dispatched by an admin |

---

## 🏗️ Architecture

### System Flow

The frontend is a **React 19** single-page application built with Vite and Tailwind CSS. It communicates with the backend through HTTPS callable functions and HTTP endpoints. All real-time data flows through **Firestore listeners** that push updates instantly to the UI, while **Firebase Cloud Messaging** handles push notifications through a registered service worker.

The backend is a set of **Firebase Cloud Functions v2** running on Node.js 22. Every function verifies the caller's authentication token before processing requests. Functions are organized into focused modules — user management, college management, system settings, reports, notifications, and bulk upload — keeping the codebase maintainable and testable.

All data is stored in **Cloud Firestore** collections with security rules enforcing role-based access at the database level. **Firebase Storage** handles file uploads like profile photos, and **Firebase Authentication** manages both Google OAuth and email/password identity providers.

### Role Hierarchy

The permission model follows a strict tree structure. The **Owner (Super Admin)** sits at the top with full platform access and Google OAuth login. Below them, each **Management (Principal)** account controls a single college with email/password login. Within each college, one or more **Wardens** manage day-to-day operations, and under each warden, **Students** interact with the hostel system.

Each level can only see and manage data within its own branch of the tree. A warden in College A cannot see students from College B, and a student can only see their own data plus hostel-wide announcements.

### Context Architecture

The application manages global state through **five React Context providers**:

| Context | Responsibility |
|---------|---------------|
| **AuthContext** | Firebase authentication state, current user data, role detection, login and logout |
| **ThemeContext** | Dark and light mode management with automatic system preference detection |
| **ModalContext** | Centralized modal lifecycle management across all dashboards |
| **ErrorContext** | Global error handling, Firestore error logging, and email-based error reporting |
| **NotificationContext** | Push notification state, FCM token management, and all 16 real-time Firestore listeners |

---

## 🎨 Design System

### Theme

HOAS supports **dark and light modes** with automatic detection of the user's system preference. Themes are implemented through CSS custom properties and Tailwind CSS 4, ensuring every component — from buttons to modals to charts — adapts seamlessly when the theme is toggled.

### Visual Language

| Color | Usage |
|-------|-------|
| **Purple (#8B5CF6)** | Warden elements, primary action buttons |
| **Blue (#3B82F6)** | Student elements, secondary actions |
| **Orange (#FB923C)** | Pending items, attention-required indicators |
| **Green (#10B981)** | Approved states, success confirmations |
| **Red (#EF4444)** | Denial actions, danger confirmations |

### UI Patterns

The interface uses **glassmorphism** effects (backdrop-blur on cards and modals) for a modern, layered appearance. Page transitions and list animations are powered by **Framer Motion**, creating a fluid, app-like experience. Layouts follow a **responsive grid** system — single column on mobile, two columns on tablet, and three columns on desktop. **Sticky action bars** with unsaved-changes indicators ensure users never accidentally lose their work.

---

## 🚀 Getting Started

### Prerequisites

You will need **Node.js 22 or later**, the **Firebase CLI** (install with `npm install -g firebase-tools`), **Git** for version control, and a **Firebase project** with Firestore, Authentication, and Storage enabled in the Firebase Console.

### Installation

1. **Clone the repository** and navigate into it
2. **Install dependencies** at the root level, then install separately in the `client` folder and the `server/functions` folder
3. **Configure Firebase** by adding your Firebase web app configuration to `client/src/firebase/firebaseConfig.js` and placing your service account key at `server/serviceAccountKey.json`
4. **Start developing** by running the dev script at the root level, which launches both the client (Vite dev server) and the Firebase emulators concurrently

### Available Scripts

| Script | What It Does |
|--------|-------------|
| **dev** | Starts both the client dev server and Firebase emulators simultaneously |
| **dev:client** | Starts only the Vite development server for frontend work |
| **build** | Creates an optimized production build of the client application |
| **deploy:functions** | Deploys the cloud functions to Firebase |

> For detailed Firebase configuration, service account setup, environment variables, and emulator instructions, see the [Developer Setup Guide](docs/DEVELOPER_SETUP.md).

---

## 🔄 Development History

### Phase 1 — Foundation (December 2024)
Established the authentication foundation with Google OAuth via Firebase, persistent auth state management through AuthContext, and role-based routing protection that automatically redirects users to their designated dashboards.

### Phase 2 — Core Dashboards (December 2024 – January 2025)
Built the Owner Dashboard with user management, approval and denial workflows, and statistics cards. Implemented cascade-delete functionality for colleges that cleanly removes the entire hierarchy. Created the Owner Profile page and the Management Dashboard for principals with warden and student management capabilities.

### Phase 3 — Backend Architecture (January 2025)
Restructured the project into a clean client/server/docs monorepo layout. Modularized Cloud Functions into focused modules for user management, college operations, and report generation. Added server-side authorization verification on every endpoint and implemented JSON and PDF report generation.

### Phase 4 — UX Polish (January 2025)
Replaced all browser alert dialogs with a custom Toast notification system. Added pagination and bulk approve/deny operations. Built the dark and light theme system with automatic system preference detection. Integrated an interactive dashboard tour using Shepherd.js, added server offline detection with fallback UI, and implemented internationalization through i18next.

### Phase 5 — Management Dashboard Redesign (January 2025)
Overhauled the Management Dashboard with a glassmorphism design language, gradient themes, KPI cards, a quick approval panel, and a real-time activity timeline.

### Phase 6 — UI/UX Refinements (January 2025)
Redesigned the login page and addressed various bugs and performance optimizations across the platform.

### Phase 7 — Platform Features (January 2026)
Fixed Firebase Hosting deployment issues, consolidated documentation, added empty-state components, built the Global System Settings module with enforcement hooks, and improved theme consistency across all pages.

### Phase 8 — Advanced Features (January – February 2026)
Introduced the college profile and logo upload system, optimized the Google OAuth flow, made the homepage dynamic with auth-aware calls to action, integrated the developer team section, built the support ticketing system with a resolution workflow, and added premium error reporting with Firestore logging and email fallback.

### Phase 9 — Cleanup & Optimization (February 2026)
Removed 17 unused cloud functions from both server and client. Deleted deprecated modules. Streamlined the system settings module from 952 lines to 217 and the cloud functions client from 468 lines to 195. Redesigned the settings page into a six-card grid layout and enhanced the Owner Profile with photo upload and password change capabilities.

### Phase 10 — Dashboard Feature Completion (March 2026)
Fully implemented four new pages each for the Student Dashboard (Leave Requests, Announcements, Settings, Help & Support) and the Warden Dashboard (Student Directory, Announcements CRUD, Leave Requests, Settings, Help & Support). All new pages use real-time Firestore listeners, consistent CSS variable-based theming, and responsive layouts.

### Phase 11 — Comprehensive Notification System (March 2026 — Current)
Expanded the notification system from basic announcement alerts to a full 16-listener architecture covering every significant event across all four roles. Added Management notifications for escalated complaints, disputed resolutions, new registrations, and leave requests. Added Warden notifications for disputed complaints and new student registrations. Added Student notifications for support ticket updates and a sound alerts toggle. Every listener follows a consistent, robust pattern.

---

## 📊 Project at a Glance

| Metric | Value |
|--------|-------|
| **Active Development** | December 2024 – Present |
| **Current Version** | 2.1.0 |
| **Total Pull Requests** | 27+ |
| **Documentation Files** | 28 comprehensive guides |
| **Backend Functions** | 15 (10 callable + 2 HTTP + 3 Firestore triggers) |
| **Real-Time Notification Listeners** | 16 across all roles |
| **User Roles** | 4 (Owner, Management, Warden, Student) |
| **Dashboard Pages** | 20+ |
| **React Context Providers** | 5 |

---

## 📚 Documentation

Comprehensive guides are available in the [`docs/`](docs/) folder:

| Guide | Description |
|-------|-------------|
| [Quick Start](docs/QUICK_START.md) | Get running in 5 minutes |
| [Developer Setup](docs/DEVELOPER_SETUP.md) | Firebase config, env vars, emulators |
| [Complete Documentation](docs/HOAS_COMPLETE_DOCUMENTATION.md) | Full system documentation |
| [Cloud Functions API](docs/CLOUD_FUNCTIONS_API.md) | Backend API reference |
| [Architecture Diagrams](docs/ARCHITECTURE_DIAGRAMS.md) | System and data flow diagrams |
| [Context Architecture](docs/CONTEXT_ARCHITECTURE.md) | React context providers guide |
| [Routing & Context](docs/ROUTING_AND_CONTEXT.md) | Route protection and navigation |
| [Firebase Emulators](docs/FIREBASE_EMULATOR_SETUP.md) | Local development with emulators |
| [Deployment Checklist](docs/DEPLOYMENT_CHECKLIST.md) | Production deployment steps |
| [Notifications](docs/Notification.md) | Push notification setup |
| [Reports](docs/REPORTS.md) | Report generation guide |
| [Changelog](docs/CHANGELOG.md) | Version history |

---

## 🔮 Future Roadmap

- SMS integration for critical alerts
- Native mobile app using React Native
- Hostel inventory and asset management
- Fee payment integration
- Automated room allocation
- Parent portal for visibility into student activities
- Comprehensive audit logging and activity history
- Scheduled data export and backup

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