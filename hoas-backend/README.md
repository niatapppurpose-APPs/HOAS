# HOAS Backend

Node.js + Express + MongoDB + Socket.IO backend for the Hostel Operations Accountability System. One backend serving both the web app and the future mobile app.

## Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js >= 20 |
| API | Express 5 (REST) |
| Database | MongoDB (Mongoose ODM) |
| Realtime | Socket.IO (rooms: `user:{id}`, `college:{id}`, `hostel:{id}`, `admins`) |
| Auth | Firebase Auth (ID token verification) |
| Push | FCM (firebase-admin) |
| Email | nodemailer (SMTP) |
| Validation | Zod |
| Rate limiting | express-rate-limit |

## Run it (3 steps)

### 1. Start MongoDB

Option A — Docker (recommended):

```bash
docker compose up -d
```

Option B — no Docker? The backend falls back to an in-memory MongoDB automatically when `MONGODB_URI` is not set:

```bash
node scripts/dev-mongo.js
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env`:
- `MONGODB_URI` — leave empty to use in-memory Mongo, or point at Atlas/your local instance
- `FIREBASE_SERVICE_ACCOUNT_PATH` — path to your Firebase service account key (defaults to the existing `../HOAS/server/serviceAccountKey.json`)
- `FIREBASE_DEV_MODE=true` — enables dev tokens (see below); set `false` in production
- `SMTP_USER` / `SMTP_PASSWORD` — optional; emails log to console when missing

### 3. Install, seed, start

```bash
npm install
npm run seed
npm run dev
```

Server starts at `http://localhost:4000`. Verify: `curl localhost:4000/api/health`

## Authentication

The backend verifies Firebase ID tokens and loads the user profile from MongoDB (`users`). Roles are enforced server-side: `owner`, `admin`, `management`, `warden`, `student`.

Firebase is used for authentication only. MongoDB still stores app data such as the user's backend profile, role, status, college, hostel, complaints, leaves, fees, and notifications. If MongoDB is deleted, Firebase login can succeed but protected backend routes will return `USER_NOT_FOUND` until the Firebase account is imported into MongoDB.

To restore an admin account after clearing MongoDB:

```bash
npm run make:admin
```

That command restores the default admin accounts `ramasaiahemanth@gmail.com` and `faziyashaik81@gmail.com`. It finds each user in Firebase Auth, creates the matching MongoDB profile if missing, marks it approved, grants the `admin` role, and sets the Firebase custom claim. You can also pass a specific email or uid:

```bash
npm run make:admin -- your-admin-email@example.com
```

To import every Firebase Auth account as a MongoDB user profile:

```bash
npm run migrate:firebase-users
```

In dev mode (`FIREBASE_DEV_MODE=true`) you can mint test tokens for the seeded users:

```bash
curl -X POST localhost:4000/api/dev/token -H "Content-Type: application/json" -d '{"uid":"seed-warden"}'
# or
npm run test:token -- seed-warden
```

Use it as: `Authorization: Bearer <token>`

## Seeded demo data

| Role | uid | email |
|---|---|---|
| Owner | `seed-owner` | owner@hoas.test |
| Management | `seed-management` | principal@demo.test |
| Warden | `seed-warden` | warden@demo.test |
| Student 1 | `seed-student-1` | student1@demo.test |
| Student 2 | `seed-student-2` | student2@demo.test |
| Student 3 | `seed-student-3` | student3@demo.test |

## API overview

| Prefix | Features |
|---|---|
| `/api/auth` | Me, profile, notifications, password |
| `/api/users` | Approve/deny, management & warden creation, cascade delete |
| `/api/students` | Single + bulk create, role-scoped lists |
| `/api/colleges` | CRUD, stats, cascade delete |
| `/api/hostels` | CRUD, warden assignment |
| `/api/complaints` | Create, SLA, status flow, dispute/review, escalation |
| `/api/leaves` | Request, approve/deny |
| `/api/outings` | Request, approve (24h max), return, history analytics |
| `/api/fees` | Upload, 2-step verify (management → warden), proof |
| `/api/emergency` | SOS share/update/stop, active monitor, history |
| `/api/chat` | Context chat (complaint/leave/outing/emergency) |
| `/api/announcements` | CRUD, scheduled/recurring publish |
| `/api/notifications` | In-app + FCM, custom broadcasts |
| `/api/support` | Tickets, resolve |
| `/api/settings` | System settings, capacity, audit logs |
| `/api/reports` | JSON + PDF reports |

## Background schedulers

| Job | Interval |
|---|---|
| Complaint SLA auto-escalation + overdue | 60 min |
| Auto-mark late outings | 10 min |
| Complaint reminder emails | 6 h |
| Fee auto-verification (24h) | 1 h |
| Emergency location cleanup | 30 min |
| Scheduled/recurring announcements | 5 min |

## End-to-end tests

```bash
npm install socket.io-client
node scripts/e2e.mjs
```

Starts in-memory Mongo + the server, seeds, and runs 35 assertions across every feature including a live Socket.IO delivery test.

## Multi-college scoping

Every document carries `collegeId` (and `hostelId` where relevant). Middleware and scope helpers (`src/utils/scope.js`) enforce that a warden only sees their hostel, management only their college, and owners see everything. The backend never trusts roles or scopes sent by clients.

## Project structure

```
src/
├── config/        env, database, firebase
├── models/        Mongoose schemas (15 collections)
├── routes/        REST route definitions
├── controllers/   HTTP handlers
├── services/      business logic, notifications, email, socket, audit
├── middleware/    auth, roles, validation, rate limit, errors
├── schedulers/    cron-style background jobs
├── sockets/       Socket.IO setup
└── utils/         helpers, scope rules
```
