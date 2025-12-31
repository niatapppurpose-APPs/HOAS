# HOAS - Hostel Operations Accountability System

A comprehensive full-stack hostel management system with role-based access control, Firebase Cloud Functions backend, and real-time data synchronization.

## 🎯 Features

- **Role-Based Access Control**: Owner, Management, Warden, and Student roles
- **Approval Workflows**: Multi-tier user approval system
- **Real-Time Updates**: Firestore real-time listeners
- **Secure Backend**: Firebase Cloud Functions for all critical operations
- **Modern UI**: React 19 + Tailwind CSS
- **Google OAuth**: Secure authentication

## 🏗️ Architecture

```
Frontend (React + Vite) → Cloud Functions (Backend) → Firebase Services
                                                     ├── Firestore
                                                     ├── Auth
                                                     └── Functions Runtime
```

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- Firebase CLI: `npm install -g firebase-tools`
- Firebase account

### Installation

1. **Clone and install dependencies:**
```bash
npm install
cd functions && npm install && cd ..
```

2. **Configure Firebase:**
```bash
# Login to Firebase
firebase login

# Update .firebaserc with your project ID
# Edit: .firebaserc → "default": "your-project-id"
```

3. **Set up environment variables:**
```bash
cp .env.example .env
# Edit .env with your Firebase credentials
```

4. **Copy service account key:**
```bash
cp serviceAccountKey.json functions/serviceAccountKey.json
```

### Development

```bash
# Terminal 1: Start Firebase Emulators
firebase emulators:start

# Terminal 2: Start frontend (set VITE_USE_FIREBASE_EMULATOR=true in .env)
npm run dev
```

Visit: `http://localhost:5173`

### Production Deployment

```bash
# Build frontend
npm run build

# Deploy to Firebase
firebase deploy
```

## 📖 Documentation

- **[QUICK_START.md](./QUICK_START.md)** - Get started in 5 minutes
- **[BACKEND_MIGRATION.md](./BACKEND_MIGRATION.md)** - Backend architecture overview
- **[FIREBASE_FUNCTIONS_DEPLOYMENT.md](./FIREBASE_FUNCTIONS_DEPLOYMENT.md)** - Deployment guide
- **[CLOUD_FUNCTIONS_API.md](./CLOUD_FUNCTIONS_API.md)** - Complete API reference
- **[PROJECT_DOCUMENTATION.md](./PROJECT_DOCUMENTATION.md)** - Full documentation

## 🔧 Tech Stack

### Frontend
- React 19.2.0
- Vite 7.2.4
- Tailwind CSS 4.1.18
- React Router 7.10.1
- Lucide React (icons)

### Backend
- Firebase Cloud Functions
- Firebase Firestore
- Firebase Authentication
- Firebase Admin SDK

## 🎭 User Roles

| Role | Access Level | Capabilities |
|------|--------------|--------------|
| **Owner** | Super Admin | Manage all colleges, approve management users |
| **Management** | College Admin | Manage wardens & students in their college |
| **Warden** | Hostel Manager | Approve students, manage hostel operations |
| **Student** | User | Access personal dashboard, submit requests |

## 🔥 Cloud Functions

### User Management
- `approveUser(userId, role)` - Approve pending users
- `denyUser(userId, reason)` - Deny user requests
- `getCollegeUsers(collegeId)` - Get users for a college

### College Management
- `deleteCollege(collegeId)` - Cascade delete college
- `getCollegeStats(collegeId)` - Get statistics

### Admin Operations
- `setAdminClaim(email, isAdmin)` - Manage admin access
- `getUserProfile(userId)` - Get user profile
- `updateUserProfile(data)` - Update profile

[See CLOUD_FUNCTIONS_API.md for complete reference](./CLOUD_FUNCTIONS_API.md)

## 📁 Project Structure

```
HOAS/
├── functions/              # Firebase Cloud Functions (backend)
│   ├── index.js           # 10+ cloud functions
│   └── package.json
├── src/
│   ├── components/        # React components
│   ├── DashBoards/        # Role-specific dashboards
│   ├── firebase/          # Firebase config & functions wrapper
│   ├── context/           # React Context (Auth)
│   └── Pages/             # Application pages
├── firebase.json          # Firebase configuration
├── .firebaserc            # Firebase project ID
└── package.json           # Dependencies
```

## 🔐 Security

- Server-side validation on all critical operations
- Firebase Authentication with Google OAuth
- Custom claims for admin roles
- Firestore security rules (configured)
- HTTPS-only Cloud Functions

## 📊 Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint

# Firebase
firebase emulators:start         # Start emulators
firebase deploy                  # Deploy everything
firebase deploy --only functions # Deploy functions only
firebase functions:log           # View logs
```

## 🐛 Troubleshooting

### Functions not deploying
```bash
cd functions && rm -rf node_modules && npm install && cd ..
firebase deploy --only functions
```

### Permission errors
```bash
node setAdmin.js  # Set admin custom claims
```

### CORS issues
Functions include CORS support. Check browser console for details.

## 🌟 Features Coming Soon

- Complaint management system
- Leave request workflow
- Announcement broadcasting
- Email/SMS notifications
- Analytics dashboard
- Export reports

## 👥 Authors

- Admin: faziyashaik81@gmail.com
- Admin: ramasaiahemanth@gmail.com

## 📄 License

Private and proprietary. All rights reserved.

## 🤝 Contributing

This is a private project. Contact administrators for access.

---
---

**Reports Page & Downloads**: Implementation guidance and sample code added in [REPORTS.md](REPORTS.md) — shows how to add an Owner-facing download button (PDF and JSON), using Node.js filesystem to create files and an example approach to produce password-protected PDFs (qpdf + pdfkit). See [REPORTS.md](REPORTS.md) for backend and frontend examples.
**Version:** 1.0.0  
**Last Updated:** December 22, 2025  
**Status:** ✅ Production Ready
