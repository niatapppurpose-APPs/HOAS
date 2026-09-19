# HOAS — Hostel Operations Accountability System

[![React](https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-7-purple?style=for-the-badge&logo=vite)](https://vitejs.dev/)
[![Express](https://img.shields.io/badge/Express-5-black?style=for-the-badge&logo=express)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Database-emerald?style=for-the-badge&logo=mongodb)](https://www.mongodb.com/)
[![Firebase](https://img.shields.io/badge/Firebase-Auth-amber?style=for-the-badge&logo=firebase)](https://firebase.google.com/)
[![PWA](https://img.shields.io/badge/PWA-Offline--Ready-gradient?style=for-the-badge&logo=pwa)](https://web.dev/explore/progressive-web-apps)

A professional, role-based, real-time hostel management platform. HOAS turns registers, paper complaints, phone-call approvals and WhatsApp groups into a **Hostel Intelligence Platform** for students, wardens, management and owners.

**Live Web App:** [https://hoas-client-4n13.vercel.app/](https://hoas-client-4n13.vercel.app/)

---

## ⚡ Role-Based Operational Architecture (New)

The platform runs on a **four-plane control architecture** with one identity layer and real-time sync:

1. **Owner Control Plane (`/OwnersDashboard`)**:
   - Global colleges, users, analytics, reports, support tickets and **System Settings**.
   - Every toggle on the Settings page is enforced: registration, approvals, maintenance mode, security, complaint SLA/escalation, notifications (Email / SMS-SIM / Critical / Activity), feature flags and default limits.
2. **Real-Time Sync Plane**:
   - Socket.IO rooms (`user:<uid>`, college, hostel, `admins`) push complaints, leave, announcements, emergency SOS and notifications in milliseconds.
   - Firebase Cloud Messaging delivers foreground + background push via `firebase-messaging-sw.js`.
3. **Approval-Gated Identity Plane**:
   - Firebase Authentication proves *who you are*; the Node/MongoDB backend profile decides *what you can do* (`userData.role`, `status`).
   - Pending/denied accounts are pinned to `/waiting-approval`; forced password reset and auto-logout are driven by System Settings.
4. **PWA Offline Shell**:
   - Installable manifest + service workers (`sw.js`) keep the shell fast and resilient during Render cold-starts and flaky networks, with a WakeUp + offline gate in `App.jsx`.

---

## The Hostel Operations Journey

This project replaces manual hostel workflows that break at scale:

### Phase 1: Paper & Spreadsheets
* **Core:** Physical registers, Excel sheets, phone calls.
* **Limitations:** Lost records, delayed approvals, zero accountability, no history.

### Phase 2: Chat-Group Management
* **Core:** WhatsApp/Telegram groups for complaints and announcements.
* **Limitations:** Unstructured, unsearchable, no SLA, no role separation, emergencies drown in noise.

### Phase 3: Single-Dashboard Digitization (Naive)
* **Core:** One login for everyone, direct DB writes.
* **Limitations:** Students see admin data, no approval flow, no audit trail, notification spam.

### Phase 4: HOAS Role Planes + Settings Control (Current Production)
* **Core:** Four isolated dashboards (Student / Warden / Management / Owner) behind `ProtectedRoute` + `FeatureGate`, backed by Express + MongoDB + Firebase Admin verification.
* **Hardening:** 30-second stale-while-revalidate API cache, vendor chunk-splitting, chunk-error auto-recovery, audit logs for every settings change.
* **Control:** The Owner Settings page is the single source of truth — maintenance message, SLA hours, escalation targets, notification channels and feature flags all persist to `SystemSetting (key=global)` and are enforced by schedulers, guards and the notification service.

---

## Smart Platform & Backend Optimizations

1. **Single-Token Auth Protocol:** Every client call attaches a fresh Firebase ID token (`Authorization: Bearer`). The backend verifies it once, then joins sockets to scoped rooms. No parallel auth systems.
2. **Cached API Client:** `cloudFunctions.js` caches GETs for 30s, skips realtime endpoints, and busts the cache on any mutation — instant repeat visits with background revalidation.
3. **Scheduler-Driven Automation:** Complaint auto-escalation (SLA + overdue), fee auto-verification (23h warning → 24h verify), and complaint reminders run on intervals and respect System Settings (`autoEscalation`, `escalateToOwner`, `feesAutoVerify`, email master switch).
4. **System Settings Control Plane:** Canonical nested storage (`notifications.{email,sms,criticalAlerts,activity}`, `features.{notifications,reports,analytics,bulkOperations,outings,announcements,feesAutoVerify}`, `limits.{maxStudentsPerCollege,maxWardensPerCollege,maxHostelsPerCollege}`) with flat UI aliases (`emailNotifications`, `smsNotifications`, `defaultStudentLimit`…). The **SMS/SIM switch now works end-to-end**: it persists, gates escalation SMS + FCM/in-app delivery via `notification.service.js`, and is mirrored by `useSystemSettings().isSmsEnabled()` on the client.

---

## Software Features

* **👑 Owner Dashboard:** colleges, management accounts, user activation/suspend, platform analytics, reports & downloads, global notifications, support tickets, access requests, **System Settings** (security, role & access, complaint & escalation, notifications, system controls, appearance, danger zone).
* **🏢 Management Dashboard:** wardens, students, hostels, complaints, leave oversight, emergency map, analytics, reports, bulk student registration, announcements.
* **🛡️ Warden Dashboard:** block-wise students, complaint resolution, leave approvals, fee verification, announcements, emergency response, analytics (gated).
* **🎓 Student Dashboard:** raise/track complaints, leave requests, outing requests, fees, announcements, emergency SOS with live location, profile + settings.
* **🔔 Real-Time Communication:** complaint/leave/outing status, announcements, emergency alerts and admin updates over Socket.IO + FCM, gated by feature flags and notification preferences.
* **🚨 Emergency Management:** one-tap SOS with geolocation, instant warden/management alerts, live emergency map.
* **📊 Analytics & Reports:** registration trends, complaint analytics, occupancy, approval rates, fee insights with PDF/Excel export.
* **🎨 Modern UX:** Tailwind v4 theming, dark/light/system modes, Framer Motion, guided tours (Driver.js/Shepherd), i18n, mobile-first PWA.