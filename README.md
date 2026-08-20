# HOAS

Hostel Operations Accountability System. This repository contains the React web client, the MongoDB/Express backend, and the legacy Firebase Functions implementation used before the MongoDB migration.

## MongoDB Migration Status

**Audit date:** 2026-08-20

| Category | Count | Status |
|---|---:|---|
| MongoDB backend feature domains | 16 | Complete |
| End-to-end assertions in `hoas-backend/scripts/e2e.mjs` | 35 | Implemented |
| Missing backend feature domains | 0 | None identified |
| Migration hardening items | 4 | Remaining |

The `16/16` count is based on the registered MongoDB API domains in `hoas-backend/src/app.js` and the backend API overview. It means the feature functionality exists in the migrated backend; it does not mean production cutover and legacy-code cleanup are finished.

## Completed Features

1. Authentication, profiles, roles, and notifications
2. User approval, denial, role management, and cascade deletion
3. Student creation, bulk upload, and scoped student lists
4. College management and statistics
5. Hostel management and warden assignment
6. Complaint workflow, SLA tracking, disputes, reviews, and escalation
7. Leave requests and approval decisions
8. Outing requests, approval, return tracking, and history analytics
9. Fee upload, student proof, and two-step verification
10. Emergency location sharing, monitoring, updates, and history
11. Context-based chat with Socket.IO realtime delivery
12. Announcements, scheduling, recurring publishing, and read tracking
13. In-app notifications, FCM notifications, and custom broadcasts
14. Support tickets and resolution
15. System settings, capacity checks, and audit logs
16. JSON and PDF reports

Supporting migrated infrastructure is also present for Firebase token verification, Mongoose models, role/scope enforcement, validation, rate limiting, email, Socket.IO, and background schedulers.

## Remaining Work

These are migration and release tasks, not additional feature domains:

1. Complete production cutover from the legacy Firebase Functions deployment to `hoas-backend`.
2. Run production-like validation with real Firebase accounts, MongoDB data, file storage, SMTP, FCM, and Socket.IO.
3. Decide whether the legacy `server/functions` Firestore implementation should be removed or retained as an archive, then update deployment scripts accordingly.
4. Add and document the production deployment, rollback, backup, and MongoDB migration procedures.

## Architecture

```text
React/Vite client
        |
        | REST + Firebase ID token
        v
Express API (`hoas-backend`)
        |
        +--> MongoDB / Mongoose
        +--> Firebase Auth verification and FCM
        +--> Socket.IO realtime events
        +--> SMTP email
```

The client API adapters in `client/src/firebase/cloudFunctions.js` and `client/src/firebase/hostelApi.js` call the REST API. Firebase is still used for authentication and notification services; application data is stored in MongoDB by the migrated backend.

## Repository Structure

| Path | Purpose |
|---|---|
| `client/` | React/Vite web application and role-based dashboards |
| `hoas-backend/` | Express, MongoDB, Socket.IO, schedulers, and E2E checks |
| `server/functions/` | Legacy Firebase Functions implementation |
| `server/` | Firebase configuration and deployment helpers |

## Local Development

Requirements: Node.js 20 or newer.

Install dependencies:

```bash
npm install
npm run install:client
cd hoas-backend
npm install
```

Start the MongoDB backend. If `MONGODB_URI` is not configured, the backend can use an in-memory MongoDB instance in development:

```bash
cd hoas-backend
npm run seed
npm run dev
```

Start the client in another terminal:

```bash
npm run client
```

Set `VITE_API_URL` in the client environment when the API is not served from the same origin. See [`hoas-backend/README.md`](hoas-backend/README.md) for backend environment variables, demo accounts, authentication, seed data, and API details.

## Verification

Run the migrated backend end-to-end checks from `hoas-backend`:

```bash
node scripts/e2e.mjs
```

The test starts temporary MongoDB/server processes and exercises complaint, leave, outing, fee, emergency, chat, announcement, notification, support, settings, reporting, authorization, audit, and Socket.IO flows.

## Security Notes

Do not commit service account keys or production `.env` files. The repository currently contains Firebase credential files that should be rotated and removed from version control if they are real credentials.
