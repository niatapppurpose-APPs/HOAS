# 🔄 Complete Backend Migration: Firebase → Next.js + MongoDB
## HOAS - Hostel Operations Accountability System

**Document Version:** 1.0  
**Date:** April 6, 2026  
**Migration Type:** Full Backend Replacement  
**Status:** Planning & Implementation Guide

---

## 📑 Table of Contents

- [Executive Summary](#executive-summary)
- [Current vs Target Architecture](#architecture-comparison)
- [Where to Start](#where-to-start)
- [Step-by-Step Migration Plan](#step-by-step-plan)
- [Major Challenges & Solutions](#challenges)
- [Timeline & Effort](#timeline)
- [Cost Analysis](#cost-analysis)
- [Risk Assessment](#risks)
- [Decision Matrix](#decision-matrix)
- [Quick Start Checklist](#quick-start)

---

## 📊 Executive Summary

### Current Stack (Firebase-based)

```
┌─────────────────────────────────────────────┐
│         FIREBASE ECOSYSTEM                  │
├─────────────────────────────────────────────┤
│ • Backend: Cloud Functions (Node.js 22)    │
│ • Database: Firestore (15 collections)     │
│ • Auth: Firebase Authentication            │
│ • Storage: Firebase Cloud Storage          │
│ • Notifications: Firebase Cloud Messaging  │
│ • Real-time: Firestore onSnapshot          │
│ • Hosting: Firebase Hosting                │
│ • Emulators: Local development suite       │
└─────────────────────────────────────────────┘
```

**Current Costs:** $25-50/month for 1000 users

### Target Stack (Next.js-based)

```
┌─────────────────────────────────────────────┐
│      NEXT.JS + MONGODB ECOSYSTEM            │
├─────────────────────────────────────────────┤
│ • Backend: Next.js API Routes              │
│ • Database: MongoDB Atlas                   │
│ • Auth: NextAuth.js v5                     │
│ • Storage: Vercel Blob / AWS S3            │
│ • Notifications: OneSignal / Web Push      │
│ • Real-time: Socket.IO / MongoDB Streams   │
│ • Hosting: Vercel                          │
│ • Dev: Next.js built-in dev server         │
└─────────────────────────────────────────────┘
```

**Target Costs:** $0-10/month for 1000 users (80-90% reduction)

---

## 🏗️ Architecture Comparison {#architecture-comparison}

### Current Firebase Architecture

```
┌──────────────────┐
│  React Client    │
│  (Vite + React)  │
└────────┬─────────┘
         │
         ├─────────────► Firebase Auth (Google OAuth, Email/Pass)
         │
         ├─────────────► Firestore Database (Real-time listeners)
         │                  └─ users, hostels, complaints, notifications
         │
         ├─────────────► Cloud Storage (Avatars, logos, bulk uploads)
         │
         ├─────────────► Cloud Functions (20+ serverless functions)
         │                  ├─ HTTP endpoints: approveUser, createStudent
         │                  ├─ Firestore triggers: onComplaintUpdated
         │                  └─ Scheduled: autoEscalateComplaints (hourly)
         │
         └─────────────► FCM (Push notifications)
```

### Target Next.js Architecture

```
┌──────────────────────────────────────────┐
│       Next.js 15 Full-Stack App          │
├──────────────────────────────────────────┤
│  Frontend: React Server Components       │
│  Backend: API Routes + Server Actions    │
└─────────┬────────────────────────────────┘
          │
          ├─────────────► NextAuth.js (Google OAuth, Credentials)
          │                  └─ JWT tokens, session management
          │
          ├─────────────► MongoDB Atlas (NoSQL database)
          │                  └─ users, hostels, complaints, notifications
          │                     + Indexes for performance
          │
          ├─────────────► Vercel Blob Storage (or AWS S3)
          │                  └─ Avatars, logos, bulk uploads
          │
          ├─────────────► Socket.IO Server (Real-time)
          │                  └─ Replaces Firestore onSnapshot
          │
          ├─────────────► Vercel Cron Jobs
          │                  └─ autoEscalateComplaints (hourly)
          │
          └─────────────► OneSignal (Push notifications)
                             └─ Web push, mobile support
```

**Key Differences:**
1. ✅ **Single codebase** instead of client + server split
2. ✅ **API routes** replace Cloud Functions
3. ✅ **MongoDB** replaces Firestore (similar NoSQL structure)
4. ✅ **NextAuth** replaces Firebase Auth
5. ✅ **Socket.IO** replaces Firestore real-time
6. ✅ **Vercel Cron** replaces Cloud Scheduler
7. ✅ **OneSignal** replaces FCM

---

## 🚀 Where to Start {#where-to-start}

### Prerequisites Check

Before starting, ensure you have:

- [x] Node.js 18+ installed
- [x] Basic Next.js knowledge
- [x] MongoDB basics (similar to Firestore)
- [x] 6-8 weeks development time
- [x] Current Firebase project export access

### Migration Sequence (Recommended Order)

```
Week 1: Setup & Data Export
   ↓
Week 2: Authentication (NextAuth.js)
   ↓
Week 3-4: Core APIs (Users, Colleges, Hostels)
   ↓
Week 5: Real-time (Socket.IO) + Notifications
   ↓
Week 6: File Storage + Scheduled Jobs
   ↓
Week 7: Testing & Bug Fixes
   ↓
Week 8: Deployment & Monitoring
```

---

## 📋 Step-by-Step Migration Plan {#step-by-step-plan}

### Phase 1: Setup & Environment (Week 1)

#### Task 1.1: Create Next.js Project

```bash
# Create new Next.js 15 app with TypeScript
npx create-next-app@latest hoas-nextjs \
  --typescript \
  --app \
  --tailwind \
  --eslint

cd hoas-nextjs

# Install core dependencies
npm install mongodb mongoose
npm install next-auth@beta
npm install bcryptjs jsonwebtoken
npm install socket.io socket.io-client
npm install @vercel/blob
npm install nodemailer pdfkit
npm install swr
```

**Project Structure:**

```
hoas-nextjs/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── register/
│   ├── (dashboard)/
│   │   ├── owner/
│   │   ├── admin/
│   │   ├── management/
│   │   ├── warden/
│   │   └── student/
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts
│   │   ├── users/
│   │   ├── colleges/
│   │   ├── hostels/
│   │   ├── complaints/
│   │   ├── notifications/
│   │   ├── upload/
│   │   └── cron/
│   ├── layout.tsx
│   └── page.tsx
├── components/
├── lib/
│   ├── mongodb.ts
│   ├── auth.ts
│   ├── utils.ts
│   └── socket.ts
├── server.js (Socket.IO server)
├── .env.local
├── next.config.js
├── vercel.json
└── package.json
```

#### Task 1.2: Setup MongoDB Atlas

**Steps:**

1. Go to https://cloud.mongodb.com
2. Create free account
3. Create cluster:
   - Cluster Tier: **M0 Sandbox (FREE)**
   - Provider: AWS
   - Region: Choose closest to users (e.g., ap-south-1 for India)
4. Security:
   - Database Access → Create user
   - Network Access → Add IP: `0.0.0.0/0` (allow all) or specific IPs
5. Get connection string
6. Create `.env.local`:

```env
# MongoDB
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/hoas?retryWrites=true&w=majority

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<generate-with-openssl-rand-base64-32>

# Google OAuth (reuse from Firebase)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Email (for nodemailer)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# Vercel Blob
BLOB_READ_WRITE_TOKEN=vercel_blob_token

# OneSignal
ONESIGNAL_APP_ID=your_onesignal_app_id
ONESIGNAL_API_KEY=your_onesignal_api_key

# Cron Secret (for Vercel Cron)
CRON_SECRET=<generate-random-string>
```

#### Task 1.3: Export Firebase Data

**Script: `scripts/export-firestore.js`**

```javascript
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(
    require('../server/serviceAccountKey.json')
  )
});

const db = admin.firestore();

// Collections to export
const COLLECTIONS = [
  'users',
  'hostels',
  'complaints',
  'notifications',
  'systemSettings',
  'ManagementData',
  'supportTickets',
  'bulkUploads',
  'announcements',
  'collegeLimits',
  'wardens',
  'students'
];

async function exportCollection(collectionName) {
  console.log(`📦 Exporting ${collectionName}...`);
  
  const snapshot = await db.collection(collectionName).get();
  const data = [];
  
  snapshot.forEach(doc => {
    const docData = doc.data();
    
    // Convert Firebase Timestamps to ISO strings
    Object.keys(docData).forEach(key => {
      if (docData[key] && typeof docData[key].toDate === 'function') {
        docData[key] = docData[key].toDate().toISOString();
      }
    });
    
    data.push({
      _id: doc.id,  // Preserve Firebase doc ID as MongoDB _id
      ...docData
    });
  });
  
  // Create backup directory
  const backupDir = path.join(__dirname, '../backup');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  
  // Write to JSON file
  const filePath = path.join(backupDir, `${collectionName}.json`);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  
  console.log(`✅ Exported ${collectionName}: ${data.length} documents`);
  return data.length;
}

async function exportAll() {
  console.log('🚀 Starting Firestore export...\n');
  
  let totalDocs = 0;
  
  for (const collection of COLLECTIONS) {
    try {
      const count = await exportCollection(collection);
      totalDocs += count;
    } catch (error) {
      console.error(`❌ Error exporting ${collection}:`, error.message);
    }
  }
  
  console.log(`\n✅ Export complete! Total documents: ${totalDocs}`);
  console.log(`📁 Backup location: ${path.join(__dirname, '../backup')}`);
  
  process.exit(0);
}

exportAll();
```

**Run export:**

```bash
cd /path/to/HOAS
node scripts/export-firestore.js
```

#### Task 1.4: Import to MongoDB

**Script: `scripts/import-mongodb.js`**

```javascript
const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not found in .env.local');
  process.exit(1);
}

async function importCollection(collectionName) {
  console.log(`📥 Importing ${collectionName}...`);
  
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db('hoas');
    const collection = db.collection(collectionName);
    
    // Read JSON file
    const filePath = path.join(__dirname, '../backup', `${collectionName}.json`);
    
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️ Skipped ${collectionName}: file not found`);
      return 0;
    }
    
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    if (data.length === 0) {
      console.log(`⚠️ Skipped ${collectionName}: no data`);
      return 0;
    }
    
    // Convert ISO strings back to Date objects
    data.forEach(doc => {
      Object.keys(doc).forEach(key => {
        if (typeof doc[key] === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(doc[key])) {
          doc[key] = new Date(doc[key]);
        }
      });
    });
    
    // Clear existing data (optional - remove if you want to preserve)
    // await collection.deleteMany({});
    
    // Insert documents
    const result = await collection.insertMany(data, { ordered: false });
    
    console.log(`✅ Imported ${collectionName}: ${result.insertedCount} documents`);
    return result.insertedCount;
    
  } catch (error) {
    console.error(`❌ Error importing ${collectionName}:`, error.message);
    return 0;
  } finally {
    await client.close();
  }
}

async function createIndexes() {
  console.log('\n📊 Creating database indexes...');
  
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db('hoas');
  
  try {
    // Users indexes
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    await db.collection('users').createIndex({ role: 1, managementId: 1 });
    await db.collection('users').createIndex({ status: 1 });
    
    // Complaints indexes
    await db.collection('complaints').createIndex({ status: 1, timestamp: -1 });
    await db.collection('complaints').createIndex({ studentId: 1 });
    await db.collection('complaints').createIndex({ managementId: 1 });
    
    // Notifications indexes
    await db.collection('notifications').createIndex({ userId: 1, read: 1, timestamp: -1 });
    
    // Hostels indexes
    await db.collection('hostels').createIndex({ managementId: 1 });
    await db.collection('hostels').createIndex({ wardenId: 1 });
    
    console.log('✅ Indexes created successfully');
    
  } catch (error) {
    console.error('❌ Error creating indexes:', error.message);
  } finally {
    await client.close();
  }
}

async function importAll() {
  console.log('🚀 Starting MongoDB import...\n');
  
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
    'collegeLimits',
    'wardens',
    'students'
  ];
  
  let totalDocs = 0;
  
  for (const collection of collections) {
    const count = await importCollection(collection);
    totalDocs += count;
  }
  
  console.log(`\n✅ Import complete! Total documents: ${totalDocs}`);
  
  await createIndexes();
  
  console.log('\n🎉 Migration ready! Your MongoDB database is set up.');
}

importAll();
```

**Run import:**

```bash
cd /path/to/hoas-nextjs
node scripts/import-mongodb.js
```

---

### Phase 2: Authentication (Week 2)

#### Task 2.1: Setup NextAuth.js

**File: `app/api/auth/[...nextauth]/route.ts`**

```typescript
import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { MongoClient } from "mongodb";
import bcrypt from "bcryptjs";

const client = new MongoClient(process.env.MONGODB_URI!);

export const authOptions: NextAuthOptions = {
  providers: [
    // Google OAuth (same as Firebase)
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    
    // Email/Password credentials
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Missing credentials');
        }
        
        await client.connect();
        const db = client.db('hoas');
        
        const user = await db.collection('users').findOne({
          email: credentials.email
        });
        
        if (!user) {
          throw new Error('No user found with this email');
        }
        
        if (user.status === 'denied') {
          throw new Error('Your account has been denied');
        }
        
        if (user.status === 'pending') {
          throw new Error('Your account is pending approval');
        }
        
        // Verify password
        const isValid = await bcrypt.compare(credentials.password, user.password);
        
        if (!isValid) {
          throw new Error('Invalid password');
        }
        
        return {
          id: user._id.toString(),
          email: user.email,
          name: user.displayName,
          image: user.photoURL,
          role: user.role,
          managementId: user.managementId,
          wardenId: user.wardenId,
        };
      }
    })
  ],
  
  callbacks: {
    async jwt({ token, user, account }) {
      // Add custom claims to JWT
      if (user) {
        token.role = user.role;
        token.managementId = user.managementId;
        token.wardenId = user.wardenId;
        token.userId = user.id;
      }
      
      return token;
    },
    
    async session({ session, token }) {
      // Pass custom claims to session
      if (session.user) {
        session.user.role = token.role;
        session.user.managementId = token.managementId;
        session.user.wardenId = token.wardenId;
        session.user.id = token.userId;
      }
      
      return session;
    },
    
    async signIn({ user, account, profile }) {
      // For Google OAuth, create/update user in MongoDB
      if (account?.provider === 'google') {
        await client.connect();
        const db = client.db('hoas');
        
        const existingUser = await db.collection('users').findOne({
          email: user.email
        });
        
        if (!existingUser) {
          // Create new user (pending approval)
          await db.collection('users').insertOne({
            email: user.email,
            displayName: user.name,
            photoURL: user.image,
            role: 'student', // Default role
            status: 'pending',
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        } else {
          // Update last login
          await db.collection('users').updateOne(
            { email: user.email },
            { $set: { lastLogin: new Date() } }
          );
        }
      }
      
      return true;
    }
  },
  
  pages: {
    signIn: '/login',
    error: '/auth/error',
  },
  
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
```

#### Task 2.2: Create Auth Middleware

**File: `middleware.ts`**

```typescript
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;
    
    // Role-based access control
    if (path.startsWith('/owner') && token?.role !== 'owner') {
      return NextResponse.redirect(new URL('/unauthorized', req.url));
    }
    
    if (path.startsWith('/admin') && !['owner', 'admin'].includes(token?.role)) {
      return NextResponse.redirect(new URL('/unauthorized', req.url));
    }
    
    if (path.startsWith('/management') && !['owner', 'admin', 'management'].includes(token?.role)) {
      return NextResponse.redirect(new URL('/unauthorized', req.url));
    }
    
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ req, token }) => {
        // Require authentication for all dashboard routes
        if (req.nextUrl.pathname.startsWith('/dashboard')) {
          return !!token;
        }
        return true;
      },
    },
  }
);

export const config = {
  matcher: ['/dashboard/:path*', '/api/:path*', '/owner/:path*', '/admin/:path*', '/management/:path*'],
};
```

---

### Phase 3: Core APIs (Week 3-4)

#### Task 3.1: MongoDB Connection Utility

**File: `lib/mongodb.ts`**

```typescript
import { MongoClient, Db } from 'mongodb';

if (!process.env.MONGODB_URI) {
  throw new Error('Please add MONGODB_URI to .env.local');
}

const uri = process.env.MONGODB_URI;
const options = {};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

if (process.env.NODE_ENV === 'development') {
  // In development, use global variable to preserve connection
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  // In production, create new client
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export default clientPromise;

// Helper to get database
export async function getDatabase(): Promise<Db> {
  const client = await clientPromise;
  return client.db('hoas');
}

// Helper to get collection
export async function getCollection<T = any>(name: string) {
  const db = await getDatabase();
  return db.collection<T>(name);
}
```

#### Task 3.2: User Management API

**File: `app/api/users/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { getCollection } from '@/lib/mongodb';
import bcrypt from 'bcryptjs';

// GET /api/users - List users with filters
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const { searchParams } = new URL(request.url);
  const role = searchParams.get('role');
  const managementId = searchParams.get('managementId');
  const status = searchParams.get('status');
  
  const filter: any = {};
  if (role) filter.role = role;
  if (managementId) filter.managementId = managementId;
  if (status) filter.status = status;
  
  const users = await getCollection('users');
  const result = await users
    .find(filter)
    .sort({ createdAt: -1 })
    .toArray();
  
  return NextResponse.json(result);
}

// POST /api/users - Create new user
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session || !['admin', 'owner'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  
  const body = await request.json();
  const { email, password, role, displayName, managementId } = body;
  
  const users = await getCollection('users');
  
  // Check if user exists
  const existingUser = await users.findOne({ email });
  if (existingUser) {
    return NextResponse.json({ error: 'User already exists' }, { status: 400 });
  }
  
  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);
  
  const newUser = {
    email,
    password: hashedPassword,
    role,
    displayName,
    managementId: managementId || null,
    status: 'pending',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  
  const result = await users.insertOne(newUser);
  
  return NextResponse.json({ id: result.insertedId }, { status: 201 });
}
```

**File: `app/api/users/[id]/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { getCollection } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// GET /api/users/[id] - Get single user
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const users = await getCollection('users');
  const user = await users.findOne({ _id: new ObjectId(params.id) });
  
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }
  
  return NextResponse.json(user);
}

// PATCH /api/users/[id] - Update user
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  
  if (!session || !['admin', 'owner'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  
  const body = await request.json();
  
  const users = await getCollection('users');
  const result = await users.updateOne(
    { _id: new ObjectId(params.id) },
    { 
      $set: { 
        ...body, 
        updatedAt: new Date() 
      } 
    }
  );
  
  if (result.matchedCount === 0) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }
  
  return NextResponse.json({ success: true });
}

// DELETE /api/users/[id] - Delete user
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  
  if (!session || !['admin', 'owner'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  
  const users = await getCollection('users');
  const result = await users.deleteOne({ _id: new ObjectId(params.id) });
  
  if (result.deletedCount === 0) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }
  
  return NextResponse.json({ success: true });
}
```

---

### Phase 4: Real-Time Features (Week 5)

#### Task 4.1: Setup Socket.IO Server

**File: `server.js`** (Custom Next.js server)

```javascript
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  // Socket.IO setup
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:3000',
      methods: ['GET', 'POST']
    },
    path: '/socket.io'
  });

  io.on('connection', (socket) => {
    console.log('✅ Client connected:', socket.id);
    
    // User joins their role room
    socket.on('join-role', (role) => {
      socket.join(role);
      console.log(`👤 User joined ${role} room`);
    });
    
    // User joins their personal notification room
    socket.on('join-user', (userId) => {
      socket.join(`user-${userId}`);
      console.log(`👤 User joined personal room: user-${userId}`);
    });
    
    socket.on('disconnect', () => {
      console.log('❌ Client disconnected:', socket.id);
    });
  });

  // Make io available globally
  global.io = io;

  server.listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
```

**Update `package.json`:**

```json
{
  "scripts": {
    "dev": "node server.js",
    "build": "next build",
    "start": "NODE_ENV=production node server.js"
  }
}
```

#### Task 4.2: Socket.IO Helper

**File: `lib/socket.ts`**

```typescript
import { Server as SocketIOServer } from 'socket.io';

// Get global Socket.IO instance
export function getIO(): SocketIOServer | null {
  if (typeof global.io !== 'undefined') {
    return global.io as SocketIOServer;
  }
  return null;
}

// Emit to specific user
export function emitToUser(userId: string, event: string, data: any) {
  const io = getIO();
  if (io) {
    io.to(`user-${userId}`).emit(event, data);
  }
}

// Emit to specific role
export function emitToRole(role: string, event: string, data: any) {
  const io = getIO();
  if (io) {
    io.to(role).emit(event, data);
  }
}

// Emit to all connected clients
export function emitToAll(event: string, data: any) {
  const io = getIO();
  if (io) {
    io.emit(event, data);
  }
}
```

#### Task 4.3: Client-Side Socket Hook

**File: `hooks/useSocket.ts`**

```typescript
'use client';

import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useSession } from 'next-auth/react';

export function useSocket() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const { data: session } = useSession();

  useEffect(() => {
    if (!session) return;

    const socketInstance = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000', {
      path: '/socket.io',
      transports: ['websocket', 'polling']
    });
    
    socketInstance.on('connect', () => {
      console.log('✅ Socket connected');
      setConnected(true);
      
      // Join role and user rooms
      if (session.user.role) {
        socketInstance.emit('join-role', session.user.role);
      }
      if (session.user.id) {
        socketInstance.emit('join-user', session.user.id);
      }
    });
    
    socketInstance.on('disconnect', () => {
      console.log('❌ Socket disconnected');
      setConnected(false);
    });
    
    setSocket(socketInstance);
    
    return () => {
      socketInstance.disconnect();
    };
  }, [session]);

  return { socket, connected };
}
```

#### Task 4.4: Complaint API with Real-Time

**File: `app/api/complaints/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { getCollection } from '@/lib/mongodb';
import { emitToRole, emitToUser } from '@/lib/socket';

// POST /api/complaints - Create complaint
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const body = await request.json();
  const { title, description } = body;
  
  const complaints = await getCollection('complaints');
  
  const newComplaint = {
    studentId: session.user.id,
    title,
    description,
    status: 'pending',
    timestamp: new Date(),
    managementId: session.user.managementId,
    wardenId: session.user.wardenId,
  };
  
  const result = await complaints.insertOne(newComplaint);
  
  // Real-time notification to wardens
  emitToRole('warden', 'new-complaint', {
    id: result.insertedId,
    ...newComplaint
  });
  
  return NextResponse.json({ id: result.insertedId }, { status: 201 });
}
```

---

### Phase 5: File Storage (Week 6)

#### Task 5.1: Vercel Blob Upload API

**File: `app/api/upload/route.ts`**

```typescript
import { put } from '@vercel/blob';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { getCollection } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const formData = await request.formData();
  const file = formData.get('file') as File;
  const type = formData.get('type') as string; // 'avatar' | 'logo' | 'bulk'
  
  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }
  
  // Upload to Vercel Blob
  const blob = await put(`${type}/${session.user.id}-${Date.now()}-${file.name}`, file, {
    access: 'public',
    token: process.env.BLOB_READ_WRITE_TOKEN,
  });
  
  // Update user profile if avatar
  if (type === 'avatar') {
    const users = await getCollection('users');
    await users.updateOne(
      { _id: new ObjectId(session.user.id) },
      { $set: { photoURL: blob.url, updatedAt: new Date() } }
    );
  }
  
  return NextResponse.json({ url: blob.url });
}
```

---

### Phase 6: Scheduled Jobs (Week 6)

#### Task 6.1: Vercel Cron Configuration

**File: `vercel.json`**

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

**File: `app/api/cron/escalate-complaints/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getCollection } from '@/lib/mongodb';
import { emitToRole } from '@/lib/socket';

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const complaints = await getCollection('complaints');
  const settings = await getCollection('systemSettings');
  
  const config = await settings.findOne({ _id: 'global' });
  const slaHours = config?.complaintSlaHours || 48;
  
  const cutoffTime = new Date(Date.now() - slaHours * 60 * 60 * 1000);
  
  const result = await complaints.updateMany(
    {
      status: 'pending',
      timestamp: { $lt: cutoffTime }
    },
    {
      $set: { 
        status: 'escalated', 
        escalatedAt: new Date() 
      }
    }
  );
  
  // Notify management
  if (result.modifiedCount > 0) {
    emitToRole('management', 'complaints-escalated', {
      count: result.modifiedCount
    });
  }
  
  return NextResponse.json({ 
    escalated: result.modifiedCount,
    timestamp: new Date().toISOString()
  });
}
```

---

## 🚧 Major Challenges & Solutions {#challenges}

### Challenge 1: Real-Time Features ⚠️ **HIGH COMPLEXITY**

**Problem:** Firebase onSnapshot provides automatic real-time updates. MongoDB doesn't.

**Solutions:**

| Solution | Pros | Cons | Recommendation |
|----------|------|------|----------------|
| **Socket.IO** | ✅ Best browser support<br>✅ Easy to implement<br>✅ Bi-directional | ⚠️ Requires custom server<br>⚠️ Not edge-compatible | ✅ **RECOMMENDED** |
| **MongoDB Change Streams** | ✅ Native MongoDB feature<br>✅ No polling | ⚠️ Requires replica set (M10+)<br>⚠️ Not free tier | 🟡 Use if M10+ |
| **Polling** | ✅ Simple to implement | ❌ Higher latency<br>❌ More DB load | ❌ Fallback only |

**Implementation:** See Phase 4 above.

---

### Challenge 2: Authentication Migration 🟡 **MEDIUM COMPLEXITY**

**Problem:** Firebase Auth provides built-in Google OAuth and session management.

**Solution:** NextAuth.js v5

**Benefits:**
- ✅ Drop-in Google OAuth support (reuse same client ID)
- ✅ Custom credentials provider for email/password
- ✅ JWT-based sessions (stateless)
- ✅ Role-based access control via callbacks

**Implementation:** See Phase 2 above.

---

### Challenge 3: File Storage Migration 🟢 **LOW COMPLEXITY**

**Problem:** Firebase Storage provides integrated file hosting.

**Solutions:**

| Solution | Cost | Pros | Cons |
|----------|------|------|------|
| **Vercel Blob** | $0.15/GB | ✅ Easy Next.js integration<br>✅ Global CDN | ⚠️ More expensive |
| **AWS S3** | $0.023/GB | ✅ Cheapest<br>✅ Most features | ⚠️ More complex setup |
| **Cloudinary** | Free tier 25GB | ✅ Image transformations<br>✅ Optimization | ⚠️ Limited free tier |

**Recommendation:** Start with Vercel Blob, migrate to S3 if costs grow.

---

### Challenge 4: Push Notifications 🟡 **MEDIUM COMPLEXITY**

**Problem:** Firebase Cloud Messaging is tightly integrated.

**Solution:** OneSignal (free up to 10K users)

**Migration:**
1. Sign up at https://onesignal.com
2. Install \`react-onesignal\`
3. Replace FCM tokens with OneSignal player IDs
4. Update notification sending logic

**Alternative:** Keep using FCM Web Push API (Firebase-free)

---

### Challenge 5: Scheduled Functions 🟢 **LOW COMPLEXITY**

**Problem:** Firebase Cloud Scheduler runs cron jobs.

**Solution:** Vercel Cron (free on all plans)

**Configuration:** See Phase 6 above.

---

## ⏱️ Timeline & Effort {#timeline}

| Week | Focus | Tasks | Hours | Deliverables |
|------|-------|-------|-------|--------------|
| **1** | Setup & Data | Export Firebase, setup MongoDB, import data | 20h | Working MongoDB with data |
| **2** | Authentication | NextAuth.js, middleware, login/register | 20h | Auth working |
| **3** | Core APIs | Users, colleges, hostels, complaints | 30h | CRUD operations complete |
| **4** | Core APIs | Reports, notifications, bulk upload | 20h | All APIs done |
| **5** | Real-Time | Socket.IO setup, complaint updates, notifications | 25h | Real-time working |
| **6** | Storage & Cron | File uploads, scheduled jobs | 15h | Feature parity achieved |
| **7** | Testing | Integration tests, bug fixes, load testing | 25h | Production-ready |
| **8** | Deployment | Vercel deployment, monitoring, rollback plan | 15h | Live in production |

**Total Effort:** ~170 hours (6-8 weeks for 1 developer)

---

## 💰 Cost Analysis {#cost-analysis}

### Current Firebase Costs (1000 active users)

| Service | Usage | Cost/Month |
|---------|-------|------------|
| Firestore | 500K reads, 200K writes | $1.08 |
| Cloud Functions | 1M invocations | $20.00 |
| Cloud Storage | 5GB + 10GB egress | $1.30 |
| Cloud Messaging | 10K messages | Free |
| **TOTAL** | | **$25-50** |

### Target Next.js + MongoDB Costs

| Service | Usage | Cost/Month |
|---------|-------|------------|
| MongoDB Atlas M0 | 512MB shared | **FREE** |
| Vercel Hobby | 100GB bandwidth | **FREE** |
| Vercel Blob | 5GB | $0.75 |
| OneSignal | <10K users | **FREE** |
| **TOTAL** | | **$0-5** |

**Savings: 80-90% reduction**

---

## ⚠️ Risk Assessment {#risks}

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| **Data loss during migration** | 🔴 Critical | 🟡 Medium | Multiple backups, checksums, test imports |
| **Downtime during cutover** | 🔴 Critical | 🟢 Low | Parallel run for 1 week, DNS switching |
| **Authentication bugs** | 🔴 Critical | 🟡 Medium | Extensive testing, phased rollout |
| **Real-time lag** | 🟡 Medium | 🟡 Medium | Load testing, Socket.IO optimization |
| **Cost overruns** | 🟢 Low | 🟢 Low | MongoDB M0 free tier, Vercel Hobby plan |
| **Learning curve** | 🟡 Medium | 🟡 Medium | Documentation, training, community support |

### Rollback Plan

**Trigger Conditions:**
- Error rate > 5%
- User complaints > 10%
- Critical security vulnerability

**Rollback Steps:**
1. Switch DNS back to Firebase Hosting
2. Pause MongoDB write operations
3. Verify Firebase data is current
4. Resume Firebase services
5. Post-mortem analysis

**Rollback Time:** <30 minutes

---

## 🤔 Decision Matrix {#decision-matrix}

### Should You Migrate?

#### ✅ **MIGRATE IF:**

- **Cost is a major concern** (save 80-90%)
- **You need full backend control** (custom logic, debugging)
- **You want a unified codebase** (monorepo benefits)
- **You're comfortable with Next.js** (React Server Components, API routes)
- **You have 6-8 weeks development time** (not urgent)
- **Your team can handle Socket.IO** (real-time complexity)

#### ❌ **STAY WITH FIREBASE IF:**

- **You value managed infrastructure** (zero devops)
- **Real-time is mission-critical** (Firebase onSnapshot is simpler)
- **You have limited development resources** (can't spare 170 hours)
- **Migration risk > cost savings** (can't afford downtime)
- **You're satisfied with Firebase costs** (<$50/month is acceptable)
- **You need to ship features fast** (migration blocks new development)

---

## ✅ Quick Start Checklist {#quick-start}

### Pre-Migration (1 day)

- [ ] Read this entire document
- [ ] Discuss with team (get buy-in)
- [ ] Create MongoDB Atlas account
- [ ] Create Vercel account
- [ ] Backup Firebase project
- [ ] Set aside 6-8 weeks development time

### Week 1 (Setup)

- [ ] Create Next.js project
- [ ] Setup MongoDB Atlas M0 cluster
- [ ] Export Firestore data to JSON
- [ ] Import JSON to MongoDB
- [ ] Create database indexes
- [ ] Test MongoDB connection

### Week 2 (Auth)

- [ ] Implement NextAuth.js
- [ ] Setup Google OAuth (reuse Firebase client ID)
- [ ] Create login/register pages
- [ ] Test authentication flow
- [ ] Implement middleware for protected routes

### Weeks 3-4 (APIs)

- [ ] Create user management APIs
- [ ] Create college/hostel APIs
- [ ] Create complaint APIs
- [ ] Create notification APIs
- [ ] Create report generation APIs
- [ ] Test all endpoints with Postman

### Week 5 (Real-Time)

- [ ] Setup Socket.IO custom server
- [ ] Create client-side hooks
- [ ] Implement real-time complaint updates
- [ ] Implement real-time notifications
- [ ] Test Socket.IO connections

### Week 6 (Storage & Cron)

- [ ] Setup Vercel Blob
- [ ] Create upload API
- [ ] Migrate file uploads to Blob
- [ ] Create Vercel Cron jobs
- [ ] Test scheduled functions

### Week 7 (Testing)

- [ ] Integration testing
- [ ] Load testing (k6 or Artillery)
- [ ] Security audit (OWASP checklist)
- [ ] Bug fixes
- [ ] Performance optimization

### Week 8 (Deployment)

- [ ] Deploy to Vercel
- [ ] Setup environment variables
- [ ] Configure custom domain
- [ ] Setup monitoring (Sentry)
- [ ] Parallel run with Firebase (1 week)
- [ ] DNS cutover
- [ ] Monitor errors
- [ ] Decommission Firebase (after 30 days)

---

## 📚 Additional Resources

### Documentation
- **Next.js:** https://nextjs.org/docs
- **MongoDB:** https://www.mongodb.com/docs/
- **NextAuth.js:** https://next-auth.js.org/
- **Socket.IO:** https://socket.io/docs/
- **Vercel:** https://vercel.com/docs

### Tools
- **MongoDB Compass:** GUI for MongoDB
- **Postman:** API testing
- **k6:** Load testing
- **Sentry:** Error tracking

---

## 🎯 Next Steps

### Immediate Actions (This Week)

1. ✅ **Read this document fully**
2. ✅ **Discuss with team** (get alignment)
3. ✅ **Create MongoDB Atlas account** (free tier)
4. ✅ **Export Firebase data** (backup!)
5. ✅ **Create proof-of-concept** (Week 1 tasks only)

### Decision Point (After POC)

After completing Week 1, evaluate:
- ✅ Is MongoDB connection working?
- ✅ Is data imported correctly?
- ✅ Are you comfortable with Next.js?
- ✅ Do you have enough time?

**If YES to all → Proceed with full migration**  
**If NO to any → Reconsider or stay with Firebase**

---

**FINAL RECOMMENDATION:**

Start with a **low-risk proof-of-concept** (Week 1 only). This gives you hands-on experience without committing to the full migration. You can always stop after testing if it doesn't feel right.

**Risk Level:** 🟡 Medium (manageable with proper planning)  
**Effort Level:** ⚠️ High (170 hours)  
**Cost Savings:** 💰 Excellent (80-90%)  
**Technical Complexity:** 🟡 Medium (Socket.IO is the hardest part)

---

**Document Status:** ✅ Ready for Implementation  
**Last Updated:** April 6, 2026  
**Version:** 1.0  
**Author:** Migration Planning Team

---

**END OF DOCUMENT**
