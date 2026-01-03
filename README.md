# HOAS - Hostel Operations Accountability System

A full-stack application for managing hostel operations with role-based access control.

## 📁 Project Structure

```
HOAS/
├── client/              # Frontend (React + Vite)
│   ├── src/            # React source code
│   ├── public/         # Static assets
│   ├── index.html      # Entry HTML
│   ├── package.json    # Frontend dependencies
│   └── vite.config.js  # Vite configuration
│
├── server/             # Backend (Firebase Functions)
│   ├── functions/      # Cloud Functions code
│   ├── firebase.json   # Firebase configuration
│   ├── setAdmin.js     # Admin setup utility
│   └── serviceAccountKey.json  # Firebase credentials (gitignored)
│
├── docs/               # Documentation
│   ├── ARCHITECTURE_DIAGRAMS.md
│   ├── BACKEND_MIGRATION.md
│   ├── DEPLOYMENT_CHECKLIST.md
│   └── ... (other documentation)
│
├── package.json        # Root workspace configuration
└── README.md          # This file
```

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- Firebase CLI
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd HOAS
   ```

2. **Install client dependencies**
   ```bash
   cd client
   npm install
   ```

3. **Install server dependencies**
   ```bash
   cd server/functions
   npm install
   ```

### Development

#### Run Frontend (Client)
```bash
cd client
npm run dev
```
Frontend will run on `http://localhost:5173`

#### Run Backend (Firebase Emulators)
```bash
cd server
firebase emulators:start
```
- Functions: `http://localhost:5001`
- Firestore: `http://localhost:8080`
- Auth: `http://localhost:9099`
- Emulator UI: `http://localhost:4000`

### Building for Production

#### Build Frontend
```bash
cd client
npm run build
```

#### Deploy Backend
```bash
cd server
firebase deploy --only functions
```

#### Deploy Everything
```bash
cd server
firebase deploy
```

## 🔑 Key Features

- **Role-Based Access Control**: Admin, Management, Warden, Student roles
- **Firebase Authentication**: Secure login with Google OAuth
- **Cloud Functions**: Serverless backend API
- **Real-time Database**: Firestore for data storage
- **Report Generation**: JSON and PDF reports
- **Approval Workflow**: Multi-level user approval system

## 📖 Documentation

See the `docs/` folder for detailed documentation:
- [Quick Start Guide](docs/QUICK_START.md)
- [Architecture Diagrams](docs/ARCHITECTURE_DIAGRAMS.md)
- [Deployment Checklist](docs/DEPLOYMENT_CHECKLIST.md)
- [Firebase Setup](docs/FIREBASE_EMULATOR_SETUP.md)

## 🛠️ Tech Stack

### Frontend
- React 18
- Vite
- TailwindCSS
- Firebase SDK

### Backend
- Node.js 20
- Firebase Functions (v2)
- Firebase Admin SDK
- Express.js
- PDFKit

## 📝 Scripts

### Root
```bash
npm run client          # Start client dev server
npm run server          # Start Firebase emulators
npm run build           # Build client for production
```

### Client
```bash
npm run dev            # Development server
npm run build          # Production build
npm run preview        # Preview production build
npm run lint           # Run ESLint
```

### Server
```bash
cd server
firebase emulators:start     # Start emulators
firebase deploy              # Deploy to production
firebase deploy --only functions  # Deploy only functions
```

## 🔐 Environment Setup

1. Create `server/serviceAccountKey.json` with your Firebase credentials
2. Update `server/firebase.json` with your project settings
3. Configure Firebase in `client/src/firebase/firebaseConfig.js`

## 👥 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is private and confidential.

## 📧 Contact

For questions or support, please contact the development team.
