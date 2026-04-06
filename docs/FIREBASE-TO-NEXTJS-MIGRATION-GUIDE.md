# Firebase to Next.js + MongoDB Migration Guide
## HOAS - Hostel Operations Accountability System

**Document Version:** 1.0  
**Date:** April 6, 2026  
**Project:** HOAS Backend Migration

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Current Firebase Architecture](#current-firebase-architecture)
3. [Target Next.js + MongoDB Architecture](#target-architecture)
4. [Migration Strategy](#migration-strategy)
5. [Step-by-Step Migration Plan](#migration-plan)
6. [Challenges & Solutions](#challenges)
7. [Timeline & Effort Estimation](#timeline)
8. [Risk Assessment](#risks)
9. [Post-Migration Checklist](#checklist)

---

## 1. Executive Summary

### Migration Overview

**Current Stack:**
- Backend: Firebase Cloud Functions (Node.js 22, asia-south1)
- Database: Firestore (NoSQL)
- Auth: Firebase Authentication (Google OAuth + Email/Password)
- Storage: Firebase Cloud Storage
- Notifications: Firebase Cloud Messaging (FCM)
- Real-time: Firestore onSnapshot listeners

**Target Stack:**
- Backend: Next.js 15 API Routes (Node.js runtime)
- Database: MongoDB Atlas (NoSQL)
- Auth: NextAuth.js v5 or Clerk
- Storage: AWS S3 / Cloudinary / Vercel Blob
- Notifications: OneSignal / FCM Web Push API
- Real-time: Socket.IO or MongoDB Change Streams

### Why Migrate?

**Reasons to Consider:**
✅ Cost optimization (Firebase pricing vs MongoDB Atlas free tier)
✅ Better control over backend logic and deployment
✅ Unified codebase (frontend + backend in one repo)
✅ Enhanced SEO with Next.js SSR capabilities
✅ Vendor lock-in reduction

**Reasons to Reconsider:**
⚠️ Firebase provides integrated, managed services
⚠️ Migration requires significant development effort (~6-8 weeks)
⚠️ Risk of introducing bugs during migration
⚠️ Learning curve for new tech stack

---

## 2. Current Firebase Architecture

### Services in Use

| Service | Usage | Complexity |
|---------|-------|------------|
| **Firestore** | 15+ collections, 200+ queries | ⚠️ HIGH |
| **Cloud Functions** | 20+ functions (HTTP + triggers + scheduled) | ⚠️ HIGH |
| **Authentication** | Google OAuth, Email/Password, RBAC (5 roles) | 🟡 MEDIUM |
| **Cloud Storage** | Avatars, logos, bulk uploads | 🟢 LOW |
| **Cloud Messaging** | 10+ notification types, service worker | 🟡 MEDIUM |
| **Emulators** | Local development environment | 🟢 LOW |

### Database Collections (15 total)

```
users                    → User accounts & profiles (role, status, fcmToken)
hostels                  → Hostel blocks (capacity, wardenId, students[])
hostels/{id}/students    → Student assignments (subcollection)
complaints               → Support tickets (status workflow)
notifications            → In-app notification feed
systemSettings           → Feature flags & configuration
systemSettingsAudit      → Audit trail for settings
collegeLimits            → Per-college capacity constraints
bulkUploads              → Upload history tracking
supportTickets           → Help desk system
ManagementData           → College/management profile data
announcements            → System-wide announcements
reports                  → Generated report metadata
students                 → Student-specific data
wardens                  → Warden-specific data
```

### Cloud Functions Breakdown

**HTTP Endpoints (8):**
- `approveUser` → POST approval workflow
- `denyUser` → POST denial workflow
- `getCollegeUsers` → GET filtered users
- `getAllManagementUsers` → GET all management accounts
- `createManagement/Warden/Student` → POST create users
- `deleteUserAccount` → POST cascade delete
- `downloadReportJson/Pdf` → GET report generation

**Firestore Triggers (5):**
- `onNewCollegeApproval` → Send notifications
- `onNewSupportTicket` → Alert management
- `onSupportTicketUpdate` → Notify creator
- `onNewWardenRegistration` → Welcome email
- `onComplaintUpdated` → Multi-party notifications

**Scheduled Functions (1):**
- `autoEscalateComplaints` → Runs every 60 minutes

### Authentication System

**Providers:**
- Google OAuth (primary)
- Email/Password (fallback)

**Custom Claims (RBAC):**
```javascript
{
  role: 'owner' | 'admin' | 'management' | 'warden' | 'student',
  admin: boolean,
  managementId: string,
  wardenId: string
}
```

**Middleware:**
- `verifyAdmin()` → Check admin role
- `verifyManagementAccess()` → Tenant isolation

### Real-Time Features

**Live Listeners (15+ active):**
- User profile sync
- Notification feed (per role)
- Dashboard statistics (students, wardens, complaints)
- Announcement updates
- Complaint status changes

**Latency:** ~50-200ms (Firestore real-time sync)

---

## 3. Target Next.js + MongoDB Architecture

### Stack Components

#### Backend: Next.js 15 App Router

**API Routes:** `/app/api/[...routes]/route.js`

```javascript
// Example structure
/app/api/
  auth/
    [...nextauth]/route.js      → NextAuth.js
    register/route.js           → User registration
  users/
    [id]/route.js               → CRUD operations
    approve/route.js            → Approval workflow
  colleges/
    route.js                    → List colleges
    [id]/route.js               → College details
  complaints/
    route.js                    → List complaints
    [id]/route.js               → Update complaint
  notifications/
    route.js                    → Fetch notifications
  reports/
    json/route.js               → JSON export
    pdf/route.js                → PDF generation
```

**Features:**
- Edge runtime for faster cold starts
- Middleware for auth checks
- Server Actions for mutations
- API routes for external integrations

#### Database: MongoDB Atlas

**Connection:**
```javascript
import { MongoClient } from 'mongodb';

const client = new MongoClient(process.env.MONGODB_URI);
const db = client.db('hoas');
```

**Collections (same structure as Firestore):**
```javascript
users                → { _id, email, role, status, fcmToken, ... }
hostels              → { _id, name, capacity, wardenId, students: [] }
complaints           → { _id, studentId, status, timestamp, ... }
notifications        → { _id, userId, title, body, read, ... }
systemSettings       → { _id: 'global', features: {...}, ... }
```

**Indexes Required:**
```javascript
users:        [{ email: 1 }, { role: 1, managementId: 1 }]
complaints:   [{ status: 1, timestamp: -1 }, { studentId: 1 }]
notifications: [{ userId: 1, read: 1, timestamp: -1 }]
hostels:      [{ managementId: 1 }]
```

#### Authentication: NextAuth.js v5

```javascript
// /app/api/auth/[...nextauth]/route.js
import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    CredentialsProvider({
      credentials: { email: {}, password: {} },
      authorize: async (credentials) => {
        // Custom auth logic with MongoDB
      },
    }),
  ],
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.role = user.role;
        token.managementId = user.managementId;
      }
      return token;
    },
    session: async ({ session, token }) => {
      session.user.role = token.role;
      session.user.managementId = token.managementId;
      return session;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
```

#### File Storage: Vercel Blob Storage

```javascript
import { put, del } from '@vercel/blob';

// Upload
const blob = await put('avatars/user123.jpg', file, {
  access: 'public',
  token: process.env.BLOB_READ_WRITE_TOKEN,
});

// URL: blob.url
```

**Alternatives:**
- AWS S3 (more control, cheaper at scale)
- Cloudinary (image optimization included)
- DigitalOcean Spaces (S3-compatible)

#### Real-Time: Socket.IO

```javascript
// Server: /server.js
import { Server } from 'socket.io';

const io = new Server(server, {
  cors: { origin: process.env.CLIENT_URL },
});

io.on('connection', (socket) => {
  socket.on('join-role', (role) => {
    socket.join(role);
  });
});

// Emit to specific role
io.to('warden').emit('new-complaint', data);

// Client: useSocket hook
const socket = io(process.env.NEXT_PUBLIC_API_URL);
socket.on('new-complaint', (data) => {
  // Update UI
});
```

**Alternative:** MongoDB Change Streams (built-in real-time)

---

## 4. Migration Strategy

### Approach: Phased Migration (Recommended)

**Option A: Big Bang (NOT recommended)**
- Migrate everything at once
- High risk, long downtime
- Difficult to rollback

**Option B: Phased Migration (RECOMMENDED) ✅**
- Migrate module by module
- Run Firebase + Next.js in parallel
- Gradual rollout with feature flags
- Easy rollback per module

### Migration Phases

**Phase 1: Foundation (Week 1-2)**
1. Set up Next.js project structure
2. Configure MongoDB Atlas cluster
3. Implement NextAuth.js authentication
4. Migrate user data (read-only test)

**Phase 2: Core Features (Week 3-4)**
1. Migrate user management APIs
2. Migrate college/hostel management
3. Implement file upload to Vercel Blob
4. Migrate database queries

**Phase 3: Advanced Features (Week 5-6)**
1. Migrate complaint system
2. Implement real-time notifications
3. Migrate scheduled jobs (cron)
4. Migrate report generation

**Phase 4: Testing & Deployment (Week 7-8)**
1. Integration testing
2. Performance testing
3. Security audit
4. Production deployment
5. Monitoring setup

---

## 5. WHERE TO START: Getting Started Guide

### STEP 1: Set Up Development Environment (Day 1)

```bash
# Create new Next.js project
npx create-next-app@latest hoas-nextjs --typescript --app --tailwind

cd hoas-nextjs

# Install core dependencies
npm install mongodb mongoose
npm install next-auth@beta
npm install bcryptjs
npm install socket.io socket.io-client

# Install utilities
npm install @vercel/blob
npm install nodemailer pdfkit
npm install dotenv
```

### STEP 2: Set Up MongoDB Atlas (Day 1)

1. Go to https://cloud.mongodb.com
2. Create free account
3. Create new cluster (M0 Free tier - 512MB)
4. Database Access → Add new user
5. Network Access → Add IP: 0.0.0.0/0 (allow all)
6. Get connection string
7. Create `.env.local`:

```env
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/hoas?retryWrites=true&w=majority
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=run_this_command: openssl rand -base64 32
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

### STEP 3: Export Firebase Data (Day 2)

Create `scripts/export-firestore.js`:

```javascript
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

admin.initializeApp({
  credential: admin.credential.cert(require('../server/serviceAccountKey.json'))
});

const db = admin.firestore();

async function exportCollection(collectionName) {
  console.log(`Exporting ${collectionName}...`);
  const snapshot = await db.collection(collectionName).get();
  
  const data = [];
  snapshot.forEach(doc => {
    const docData = doc.data();
    // Convert Firebase Timestamps to ISO strings
    Object.keys(docData).forEach(key => {
      if (docData[key] && docData[key].toDate) {
        docData[key] = docData[key].toDate().toISOString();
      }
    });
    data.push({ _id: doc.id, ...docData });
  });
  
  const backupDir = path.join(__dirname, '../backup');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir);
  }
  
  fs.writeFileSync(
    path.join(backupDir, `${collectionName}.json`),
    JSON.stringify(data, null, 2)
  );
  
  console.log(`✅ Exported ${collectionName}: ${data.length} documents`);
}

async function exportAll() {
  const collections = [
    'users',
    'hostels',
    'complaints',
    'notifications',
    'systemSettings',
    'ManagementData',
    'supportTickets',
    'bulkUploads',
    'announcements',
    'collegeLimits'
  ];
  
  for (const col of collections) {
    try {
      await exportCollection(col);
    } catch (error) {
      console.error(`❌ Error exporting ${col}:`, error);
    }
  }
  
  console.log('\n✅ Export complete!');
  process.exit(0);
}

exportAll();
```

Run export:
```bash
node scripts/export-firestore.js
```

### STEP 4: Import to MongoDB (Day 2)

Create `scripts/import-mongodb.js`:

```javascript
const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

const MONGODB_URI = process.env.MONGODB_URI;

async function importCollection(collectionName) {
  console.log(`Importing ${collectionName}...`);
  
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  
  const db = client.db('hoas');
  const collection = db.collection(collectionName);
  
  // Read JSON file
  const filePath = path.join(__dirname, '../backup', `${collectionName}.json`);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  
  if (data.length > 0) {
    // Convert ISO strings back to Date objects
    data.forEach(doc => {
      Object.keys(doc).forEach(key => {
        if (typeof doc[key] === 'string' && /^d{4}-d{2}-d{2}T/.test(doc[key])) {
          doc[key] = new Date(doc[key]);
        }
      });
    });
    
    await collection.deleteMany({}); // Clear existing data
    await collection.insertMany(data);
    console.log(`✅ Imported ${collectionName}: ${data.length} documents`);
  } else {
    console.log(`⚠️ Skipped ${collectionName}: no data`);
  }
  
  await client.close();
}

async function importAll() {
  const collections = [
    'users',
    'hostels',
    'complaints',
    'notifications',
    'systemSettings',
    'ManagementData',
    'supportTickets',
    'bulkUploads',
    'announcements',
    'collegeLimits'
  ];
  
  for (const col of collections) {
    try {
      await importCollection(col);
    } catch (error) {
      console.error(`❌ Error importing ${col}:`, error);
    }
  }
  
  console.log('\n✅ Import complete!');
}

importAll();
```

Run import:
```bash
MONGODB_URI="your_connection_string" node scripts/import-mongodb.js
```

### STEP 5: Create Basic Next.js Structure (Day 3)

```
hoas-nextjs/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   └── [...nextauth]/route.js
│   │   ├── users/
│   │   │   ├── route.js
│   │   │   ├── [id]/route.js
│   │   │   └── approve/route.js
│   │   ├── complaints/
│   │   │   ├── route.js
│   │   │   └── [id]/route.js
│   │   └── notifications/
│   │       └── route.js
│   ├── dashboard/
│   │   └── page.js
│   └── layout.js
├── lib/
│   ├── mongodb.js
│   ├── auth.js
│   └── utils.js
├── components/
├── public/
├── .env.local
└── package.json
```

### STEP 6: Create MongoDB Connection Utility (Day 3)

Create `lib/mongodb.js`:

```javascript
import { MongoClient } from 'mongodb';

if (!process.env.MONGODB_URI) {
  throw new Error('Please add your MONGODB_URI to .env.local');
}

const uri = process.env.MONGODB_URI;
const options = {};

let client;
let clientPromise;

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  // In production mode, create a new client
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export default clientPromise;

// Helper to get database
export async function getDatabase() {
  const client = await clientPromise;
  return client.db('hoas');
}
```

### STEP 7: Implement Authentication (Day 4-5)

See full NextAuth.js implementation in Section 5 above.

---

## 6. Major Challenges & Solutions

### Challenge 1: Real-Time Functionality ⚠️ HIGH PRIORITY

**Firebase:** Built-in `onSnapshot` listeners with automatic updates

**MongoDB:** Requires custom implementation

**Solutions:**

**Option 1: Socket.IO (RECOMMENDED)**
- Best for instant updates
- Works in all browsers
- Requires custom server

```javascript
// Custom server: server.js
import { createServer } from 'http';
import { Server } from 'socket.io';
import next from 'next';

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    handle(req, res);
  });

  const io = new Server(server);
  
  io.on('connection', (socket) => {
    console.log('User connected');
    
    socket.on('join-role', (role) => {
      socket.join(role);
    });
  });

  // Make io globally available
  global.io = io;

  server.listen(3000);
});
```

**Option 2: MongoDB Change Streams**
- Native MongoDB feature
- Requires replica set (Atlas M10+ or local replica set)

```javascript
const changeStream = db.collection('complaints').watch();
changeStream.on('change', (change) => {
  // Emit via Socket.IO or webhook
  io.to('warden').emit('complaint-update', change.fullDocument);
});
```

**Option 3: Polling (FALLBACK)**
- Simple to implement
- Higher latency (1-5 seconds)
- More database load

---

### Challenge 2: Authentication & Sessions 🟡 MEDIUM PRIORITY

**Firebase:** JWT tokens with automatic refresh

**Solution: NextAuth.js v5**

Full implementation in Section 5.

**Key Features:**
- Google OAuth support
- Email/Password support
- Role-based access control
- Session management

---

### Challenge 3: File Storage 🟢 LOW PRIORITY

**Firebase Storage → Vercel Blob**

```javascript
// Upload API: /app/api/upload/route.js
import { put } from '@vercel/blob';

export async function POST(request) {
  const formData = await request.formData();
  const file = formData.get('file');
  
  const blob = await put(`avatars/${Date.now()}-${file.name}`, file, {
    access: 'public',
  });
  
  return Response.json({ url: blob.url });
}
```

**Cost Comparison:**
- Firebase Storage: $0.026/GB
- Vercel Blob: $0.15/GB (first 500GB included on Pro)
- AWS S3: $0.023/GB (cheapest, more complex)

---

### Challenge 4: Scheduled Functions 🟡 MEDIUM PRIORITY

**Firebase Scheduled Functions → Vercel Cron**

Create `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/escalate-complaints",
      "schedule": "0 * * * *"
    }
  ]
}
```

Create `/app/api/cron/escalate-complaints/route.js`:

```javascript
import { getDatabase } from '@/lib/mongodb';

export async function GET(request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const db = await getDatabase();
  
  const settings = await db.collection('systemSettings').findOne({ _id: 'global' });
  const slaHours = settings?.complaintSlaHours || 48;
  
  const cutoffTime = new Date(Date.now() - slaHours * 60 * 60 * 1000);
  
  const result = await db.collection('complaints').updateMany(
    {
      status: 'pending',
      timestamp: { $lt: cutoffTime }
    },
    {
      $set: { status: 'escalated', escalatedAt: new Date() }
    }
  );
  
  return Response.json({ 
    escalated: result.modifiedCount,
    timestamp: new Date().toISOString()
  });
}
```

---

### Challenge 5: Push Notifications 🟡 MEDIUM PRIORITY

**Firebase FCM → OneSignal (RECOMMENDED)**

1. Sign up at https://onesignal.com (free up to 10K users)
2. Install SDK:

```bash
npm install react-onesignal
```

3. Initialize in layout:

```javascript
// app/layout.js
import OneSignal from 'react-onesignal';

export default function RootLayout({ children }) {
  useEffect(() => {
    OneSignal.init({
      appId: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID,
    });
  }, []);
  
  return <html>{children}</html>;
}
```

4. Send from backend:

```javascript
import * as OneSignal from '@onesignal/node-onesignal';

const client = new OneSignal.DefaultApi();

await client.createNotification({
  app_id: process.env.ONESIGNAL_APP_ID,
  headings: { en: "New Complaint" },
  contents: { en: "You have a new complaint" },
  include_player_ids: [userId],
});
```

---

## 7. Timeline & Effort Estimation

| Week | Focus | Deliverables | Status |
|------|-------|--------------|--------|
| **Week 1** | Setup & Data Export | Dev environment, MongoDB cluster, data backup | 🟢 START HERE |
| **Week 2** | Authentication | NextAuth.js working, login/register | 🔵 |
| **Week 3** | User Management | User CRUD, approval workflow | 🔵 |
| **Week 4** | College & Hostel Management | College/hostel APIs, student assignment | 🔵 |
| **Week 5** | Complaints & Notifications | Complaint system, push notifications | 🔵 |
| **Week 6** | Real-time & File Upload | Socket.IO, file storage | 🔵 |
| **Week 7** | Testing & Bug Fixes | Integration tests, load testing | 🔵 |
| **Week 8** | Deployment & Monitoring | Production deployment, rollback plan | 🔵 |

**Total Effort:** 6-8 weeks (1 full-stack developer)

---

## 8. Risk Assessment & Mitigation

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Data loss during migration | 🔴 Critical | 🟡 Medium | Multiple backups, checksums, dry-run |
| Downtime during cutover | 🔴 Critical | 🟢 Low | Parallel run, DNS switching |
| Auth bugs | 🔴 Critical | 🟡 Medium | Extensive testing, gradual rollout |
| Real-time lag | 🟡 Medium | 🟡 Medium | Load testing, Socket.IO clustering |
| Cost overruns | 🟢 Low | 🟢 Low | MongoDB M0 free, Vercel Hobby plan |

**Rollback Plan:**
1. Keep Firebase running for 30 days post-migration
2. DNS-based switching (< 5 minutes rollback time)
3. Automated health checks trigger rollback
4. Data sync from MongoDB → Firebase (one-way)

---

## 9. Cost Comparison

### Current Firebase Costs (Estimated for 1000 active users)

| Service | Usage | Monthly Cost |
|---------|-------|--------------|
| Firestore | 500K reads, 200K writes | $1.08 |
| Cloud Functions | 1M invocations, 400K GB-sec | $20 |
| Cloud Storage | 5GB stored, 10GB egress | $1.30 |
| Authentication | 1K MAU | Free |
| Cloud Messaging | 10K messages | Free |
| **TOTAL** | | **~$25-50/month** |

### Target Next.js + MongoDB Costs

| Service | Usage | Monthly Cost |
|---------|-------|--------------|
| MongoDB Atlas M0 | 512MB, shared | **FREE** |
| Vercel Hobby | 100GB bandwidth | **FREE** |
| Vercel Blob | 5GB | $0.75 |
| OneSignal | < 10K users | **FREE** |
| **TOTAL** | | **~$0-5/month** |

**Savings: ~80-90%**

---

## 10. Post-Migration Checklist

### Pre-Launch ✅

- [ ] All data migrated and verified (run checksums)
- [ ] Authentication tested (Google OAuth + Email/Password)
- [ ] All API endpoints tested (Postman collection)
- [ ] Real-time features working (Socket.IO connections stable)
- [ ] File uploads functional (Vercel Blob working)
- [ ] Scheduled jobs running (Vercel Cron logs)
- [ ] Email notifications sending (SMTP configured)
- [ ] Push notifications working (OneSignal sending)
- [ ] Performance tested (load testing with k6)
- [ ] Security audit complete (OWASP checklist)
- [ ] Backup strategy implemented (automated MongoDB backups)
- [ ] Monitoring configured (Sentry for errors, Vercel Analytics)
- [ ] Rollback plan documented and tested

### Week 1 Post-Launch 📊

- [ ] Monitor error rates (< 1% target)
- [ ] Check database performance (query latency < 100ms)
- [ ] Verify user feedback (NPS score)
- [ ] Validate cost projections (actual vs estimate)
- [ ] Test notification delivery rates (> 95%)
- [ ] Benchmark API latency (p95 < 200ms)
- [ ] Review security logs (no critical alerts)

### Month 1 Post-Launch 🎉

- [ ] Decommission Firebase (after 30-day grace period)
- [ ] Archive Firebase data (long-term backup)
- [ ] Update documentation (API docs, runbooks)
- [ ] Conduct retrospective (lessons learned)
- [ ] Optimize MongoDB indexes (based on slow query logs)
- [ ] Review cost vs. projections (adjust if needed)

---

## 11. Key Recommendations

### Should You Migrate?

**✅ MIGRATE IF:**
- Cost is a major concern (>80% savings)
- You need full control over backend logic
- You want unified codebase (monorepo benefits)
- You're comfortable with Next.js ecosystem
- You have 6-8 weeks development time

**❌ STAY WITH FIREBASE IF:**
- You value managed infrastructure (zero devops)
- Real-time features are critical (Firebase is simpler)
- You have limited development resources
- Migration risk > cost savings
- You're satisfied with current Firebase costs

### Success Metrics

**Technical:**
- ✅ 99.9% uptime
- ✅ <200ms API latency (p95)
- ✅ <5s real-time update latency
- ✅ Zero data loss

**Business:**
- ✅ 80% cost reduction
- ✅ <1% user churn during migration
- ✅ Feature parity within 8 weeks

---

## 12. Quick Start Commands

### Setup
```bash
# Create Next.js project
npx create-next-app@latest hoas-nextjs --typescript --app

# Install dependencies
npm install mongodb next-auth@beta bcryptjs socket.io @vercel/blob

# Create MongoDB cluster (manual step at cloud.mongodb.com)

# Export Firebase data
node scripts/export-firestore.js

# Import to MongoDB
MONGODB_URI="..." node scripts/import-mongodb.js
```

### Development
```bash
# Run Next.js dev server
npm run dev

# Test API endpoints
curl http://localhost:3000/api/users

# Check MongoDB connection
node -e "const {MongoClient}=require('mongodb');new MongoClient(process.env.MONGODB_URI).connect().then(()=>console.log('✅ Connected'))"
```

### Deployment
```bash
# Deploy to Vercel
vercel deploy --prod

# Set environment variables
vercel env add MONGODB_URI
vercel env add NEXTAUTH_SECRET
vercel env add GOOGLE_CLIENT_ID
```

---

## 13. Support & Resources

### Documentation
- **Next.js:** https://nextjs.org/docs
- **MongoDB:** https://www.mongodb.com/docs/
- **NextAuth.js:** https://next-auth.js.org/
- **Socket.IO:** https://socket.io/docs/
- **Vercel:** https://vercel.com/docs

### Tools
- **MongoDB Compass:** GUI for MongoDB (https://www.mongodb.com/products/compass)
- **Postman:** API testing (https://www.postman.com/)
- **k6:** Load testing (https://k6.io/)
- **Sentry:** Error tracking (https://sentry.io/)

### Community
- Next.js Discord: https://nextjs.org/discord
- MongoDB Community: https://www.mongodb.com/community/forums/

---

**FINAL RECOMMENDATION:**

Start with **Week 1 tasks** (Setup & Data Export). This is low-risk and gives you hands-on experience with the new stack. You can evaluate whether to proceed with full migration after testing the basic setup.

**Next Steps:**
1. ✅ Read this document thoroughly
2. ✅ Set up MongoDB Atlas (free tier)
3. ✅ Export Firebase data to backup folder
4. ✅ Create basic Next.js project
5. ✅ Test MongoDB connection
6. ⏸️ Pause and evaluate before full migration

---

**Document Version:** 1.0  
**Last Updated:** April 6, 2026  
**Author:** AI Migration Assistant
**Status:** Ready for Implementation

---

**END OF DOCUMENT**
