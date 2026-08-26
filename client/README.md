# HOAS Front-End (Client)

The **HOAS (Hostel Operations Accountability System)** front-end is a React single-page application (SPA) that serves four role-based dashboards — **Student**, **Warden**, **Management**, and **Owner** — plus a public landing page and login system.

This README explains *how the app works internally*, so anyone can learn the codebase from scratch.

---

## 1. Technology Stack

| Category | Technology | Why it's used |
|---|---|---|
| UI Library | **React 19** | Component-based UI |
| Build Tool | **Vite 7** | Extremely fast dev server + optimized production builds |
| Routing | **React Router DOM v7** | Client-side routing with nested layouts |
| Styling | **Tailwind CSS v4** (`@tailwindcss/vite` plugin) | Utility-first CSS |
| Theming | CSS custom properties (variables) | Dark/Light mode without re-rendering libraries |
| Animation | **Framer Motion** | Page transitions, micro-interactions |
| Icons | **Lucide React**, React Icons | Icon system |
| Charts | **Recharts** | Analytics dashboards |
| Maps | **Leaflet / React-Leaflet**, Google Maps API | Emergency location tracking |
| Real-time | **Socket.IO Client** | Live notifications, emergency alerts |
| Auth | **Firebase Authentication** | Email/password login + ID tokens |
| Push Notifications | **Firebase Cloud Messaging (FCM)** | Browser notifications |
| i18n | **i18next** | Multi-language support |
| Guided Tours | **Driver.js**, Shepherd.js | Onboarding tours per dashboard |
| PDF/Excel Export | **jsPDF (+autotable)**, **xlsx** | Downloadable reports |
| PWA | Custom Service Workers (`sw.js`, `firebase-messaging-sw.js`) | Installable app + background push |
| Lottie | `@lottiefiles/react-lottie-player` | Loader/animation assets |

---

## 2. Project Structure

```
client/
├── index.html                  # Single HTML entry point
├── vite.config.js              # Vite config (proxy, chunking, minify)
├── vercel.json                 # Deployment config (SPA rewrites)
├── .env                        # VITE_* environment variables
├── public/
│   ├── sw.js                   # PWA service worker
│   ├── firebase-messaging-sw.js# FCM background notification worker
│   ├── manifest.json           # PWA manifest (installability)
│   └── ...                     # logos, sounds, demo video
└── src/
    ├── main.jsx                # App bootstrap: providers + error recovery
    ├── App.jsx                 # Top-level gates (offline, server status, maintenance)
    ├── index.css               # Tailwind import + theme variables (light/dark)
    ├── components/
    │   ├── Routes/index.jsx    # ALL route definitions + ProtectedRoute
    │   ├── ui/                 # Shared UI kit (Avatar, Sidebar, StatsCard,
    │   │                       #   StatusBadge, EmptyState, DeleteConfirmModal…)
    │   ├── Toast/              # Global toast notification system
    │   ├── ThemeToggle/        # Dark/light switch component
    │   └── ...
    ├── context/
    │   ├── AuthContext.jsx     # Firebase auth state + user profile from backend
    │   ├── ThemeContext.jsx    # isDark state, persisted in localStorage
    │   ├── NotificationContext.jsx
    │   ├── ModalContext.jsx
    │   └── ErrorContext.jsx
    ├── DashBoards/
    │   ├── Student-DashBoard/      # layout/ + pages/ (complaints, leave, fees…)
    │   ├── Warden-Dashboard/       # layout/ + pages/
    │   ├── Management-Dashboard/   # Pages/ + components/
    │   └── Principal-Dashbord/
    ├── Pages/
    │   ├── HOME/               # Public landing page
    │   ├── LoginPage/          # Login (all roles)
    │   ├── Dashboard/          # Role redirect hub after login
    │   ├── OwnersDashboard/    # Owner/Admin area (pages/)
    │   ├── WaitingApproval/    # Pending/denied account screen
    │   ├── ForcePasswordReset/ # Forced reset flow
    │   └── NotFound/           # 404 page
    ├── firebase/
    │   ├── firebaseConfig.js       # Firebase app/auth/messaging init
    │   ├── cloudFunctions.js       # Main REST API client (cached fetch)
    │   ├── hostelApi.js            # Hostel-specific API calls
    │   └── notificationService.js  # FCM token + foreground messages
    ├── hooks/
    │   ├── useSocket.js            # Socket.IO connection (token auth)
    │   ├── useServerStatus.js      # Detects backend cold-start (Render free tier)
    │   ├── useSystemSettings.jsx   # System settings + MaintenanceGate/FeatureGate
    │   ├── useAutoLogout.js        # Idle-time auto sign-out
    │   └── useNewBadge.js          # "NEW" feature badges
    ├── tours/                      # Dashboard onboarding tour configs (driver.js)
    ├── utils/
    │   ├── cloudinaryUpload.js     # Image upload to Cloudinary
    │   ├── notificationPrefsManager.js
    │   └── outingUtils.js
    └── data/                       # Static JSON data (colleges, feature flags)
```

### Naming conventions used in this codebase
- **Dashboards live in `DashBoards/`** with a `layout/` folder (sidebar + header shell) and a `pages/` or `Pages/` folder (one file per screen).
- **Owner dashboard lives in `Pages/OwnersDashboard/`** instead of `DashBoards/` (historical).
- Shared, reusable pieces go in `components/ui/`; role-specific screens never go there.

---

## 3. Application Bootstrap Flow

Understanding what happens when the app loads:

```
index.html
   └── src/main.jsx          ← ReactDOM.createRoot()
         │
         ├── registers PWA service worker (registerSW.js)
         ├── sets up global chunk-error recovery* 
         │
         └── wraps <App /> in providers (order matters):
              BrowserRouter
               └── ThemeProvider
                    └── Tooltip.Provider (Radix)
                         └── ErrorProvider → ErrorBoundary → ErrorModal
                              └── ToastProvider
                                   └── ModalProvider
                                        └── AuthProvider
                                             └── NotificationProvider
                                                  └── SystemSettingsProvider
                                                       └── <App />
```

> \* **Chunk-error recovery**: because Vite code-splits the app, deploying a new version invalidates old JS chunks. If a user has the old tab open, dynamic imports fail. `main.jsx` listens for `vite:preloadError` / unhandled errors and reloads the page once (`sessionStorage` flag prevents reload loops). This is an important production pattern to learn.

### `App.jsx` — top-level gates

Before any route renders, `App.jsx` decides what to show:

1. **Offline?** (`navigator.onLine`) → show `WakeUpScreen offline`.
2. **Server waking up?** (`useServerStatus`) → show premium loader while the Render free-tier backend cold-starts.
3. **Maintenance mode?** Non-admin users see `MaintenanceGate` (from `useSystemSettings`). Public routes (`/`, `/login`) and admins bypass it.
4. **Forced password reset?** If enabled in settings and the user hasn't reset since it was enabled → `ForcePasswordReset`.
5. Otherwise render `<Routes_path />` plus global overlays (`GlobalDeleteModal`, `CookieConsent`, `InstallPrompt`).

---

## 4. Routing & Route Protection

All routes are defined in one place: `src/components/Routes/index.jsx`.

### `ProtectedRoute`
A wrapper component enforcing authentication **and** role:

```jsx
<Route path="/dashboard/student" element={
  <ProtectedRoute roles={["student"]}><StudentLayout /></ProtectedRoute>
}>
  <Route index element={<StudentDashboard />} />
  <Route path="complaints" element={<StudentComplaints />} />
  ...
</Route>
```

Logic inside `ProtectedRoute`:
1. While auth state is loading → render nothing (prevents redirect flashes).
2. No user → redirect to `/login`.
3. Account status is `pending`/`denied` → force `/waiting-approval`.
4. Role check against `userData.role` (admins/owners pass any admin-inclusive route).
5. Otherwise render children.

### Code splitting (lazy loading)
Only core pages (Home, Login, Dashboard, 404) are imported eagerly. Every dashboard page uses:

```jsx
const StudentComplaints = lazy(() => import(".../StudentComplaints"));
```

wrapped in `<Suspense fallback={<PageLoader />}>`. This keeps the initial bundle small.

### `FeatureGate`
Some routes are gated by system settings (toggled by the Owner):

```jsx
<Route path="analytics" element={
  <FeatureGate feature="analytics" fallback={<FeatureDisabled />}>
    <ManagementAnalytics />
  </FeatureGate>
} />
```

### Main route map

| Path | Access | Purpose |
|---|---|---|
| `/` | public | Landing page |
| `/login` | public | Login for all roles |
| `/dashboard` | any logged-in | Redirects user to their role's dashboard |
| `/waiting-approval` | pending/denied | Account approval status |
| `/dashboard/student/*` | student | Complaints, Leave, Fees, Announcements, Emergency location, Settings, Profile |
| `/dashboard/warden/*` | warden | Students, Complaints, Leave approval, Fee verification, Analytics, Announcements |
| `/dashboard/management/*` | management/admin | Wardens, Students, Hostels, Complaints, Analytics, Reports, Settings |
| `/OwnersDashboard/*` | admin only | Colleges, Users, Global settings, Support tickets, Access requests |
| `*` | — | 404 |

---

## 5. Authentication Flow (Firebase + Backend profile)

HOAS uses **Firebase Authentication for identity**, but the **Node/MongoDB backend as the source of truth for roles and profiles**.

```
Login page
   │ signInWithEmailAndPassword (Firebase)
   ▼
onAuthStateChanged fires (AuthContext)
   │
   ├─ gets Firebase ID token
   ├─ calls GET /api/me via cloudFunctions.getMe()  ← Authorization: Bearer <idToken>
   │
   ▼
Backend verifies token → returns MongoDB profile {role, status, collegeId...}
   │
   ├─ userData stored in context
   ├─ isAdmin = (role === 'admin' || 'owner')
   └─ Router now allows access based on userData.role
```

Key points to learn:
- **`AuthContext.jsx`** exposes `{ user, userData, isAdmin, claims, loading }` via the `useAuth()` hook.
- The Firebase user (`user`) = identity; `userData` (from Mongo) = authorization/profile.
- Password reset, email verification etc. use Firebase APIs directly.
- `useAutoLogout` signs idle users out.

---

## 6. Talking to the Backend — the API layer

There is no axios. Two hand-written fetch wrappers live in `src/firebase/`:

### `cloudFunctions.js` (the main one) — cached request client
Every call:
1. Requires a signed-in user; gets a fresh **Firebase ID token** (`auth.currentUser.getIdToken()`).
2. Sends it as `Authorization: Bearer <token>` header.
3. Uses `AbortController` with a timeout (default 15 s).
4. **Caches GET responses in memory for 30 seconds** (stale-while-revalidate style):
   - Repeat visits render instantly from cache while a background refresh updates it.
   - A custom event `hoas:data-refreshed` lets components re-render with fresh data.
   - Realtime endpoints (`/emergency`, `/notifications`, `/chat`) are never cached.
   - Any mutation (POST/PATCH/DELETE) clears the whole cache.

### `hostelApi.js` — same pattern, smaller scope (hostel CRUD).

### Dev proxy (`vite.config.js`)
In development, `/api` and `/socket.io` are proxied to the local backend (default `http://localhost:4000`, override with `VITE_API_PROXY`). In production, `VITE_API_URL` points at the deployed backend (Render), so no proxy is needed.

```js
proxy: {
  '/api': { target: 'http://localhost:4000', changeOrigin: true },
  '/socket.io': { target: 'http://localhost:4000', ws: true },
}
```

---

## 7. Real-Time Layer — Socket.IO

`src/hooks/useSocket.js`:

1. When a user signs in, the hook grabs their Firebase ID token.
2. Opens a Socket.IO connection with `auth: { token }` over WebSocket.
3. The **backend** verifies the token (`verifyIdToken`) and joins the socket to rooms: `user:<uid>`, college room, hostel room, and `admins` for owner/staff.
4. Components subscribe to events (new notifications, emergency alerts, complaint updates).
5. On sign-out, the socket disconnects.

Browser notifications come through two channels:
- **Foreground**: FCM via `notificationService.js` (needs permission — requested in `App.jsx`).
- **Background**: `public/firebase-messaging-sw.js` service worker shows system notifications even when the tab is closed.

---

## 8. Theming & Styling

- **Tailwind v4** is loaded via the `@tailwindcss/vite` plugin (no `tailwind.config.js` needed).
- **Theme variables** live in `src/index.css`: `:root` defines light-mode colors (`--bg-primary`, `--text-primary`, `--accent-primary`…); a dark class overrides them.
- Components style themselves with these variables (e.g., `background: var(--bg-primary)`), so switching themes is instant with zero re-mounting — handled by `ThemeContext` (persisted to localStorage) + `ThemeToggle` component.
- Design language: glassmorphism (translucent sidebar/header/cards), rounded corners, Framer Motion animations.

---

## 9. PWA (Installable App)

- `manifest.json` → app name, icons, theme color (makes it installable).
- `sw.js` → registered in `main.jsx`; enables offline shell/caching.
- `InstallPrompt` component shows a custom "Add to Home Screen" banner.
- `vercel.json` rewrites all paths to `index.html` (required for SPA routing on refresh).

---

## 10. Performance Optimizations (worth learning)

| Technique | Where |
|---|---|
| Route-level code splitting | `Routes/index.jsx` (`lazy()` everywhere) |
| Vendor chunk splitting | `vite.config.js` — `react-vendor`, `firebase-vendor` chunks |
| Console stripping | esbuild `drop: ['console', 'debugger', …]` in build |
| In-memory GET cache + stale-while-revalidate | `cloudFunctions.js` |
| Chunk-failure auto-recovery | `main.jsx` event listeners |
| Lazy dashboards + Suspense loaders | `react-spinners` HashLoader fallback |

---

## 11. Environment Variables (`.env`)

All client env vars must be prefixed with `VITE_` (Vite requirement):

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FIREBASE_VAPID_KEY=...        # for web push (FCM)
VITE_USE_FIREBASE_EMULATOR=false
VITE_API_URL=...                   # backend base URL (production)
VITE_API_PROXY=http://localhost:4000  # dev proxy target
```

Note: `VITE_` variables are embedded into the shipped JS bundle — they are **not secret**. Firebase web API keys are safe to expose because security is enforced by Firebase rules + backend token verification.

---

## 12. Running the Front-End

From the workspace root:

```bash
npm run install:client   # install client deps
npm run dev              # starts BOTH client & backend via scripts/dev.mjs
npm run client           # client only  → http://localhost:5173
npm run build            # production build (client/dist)
```

From inside `client/` directly:

```bash
npm run dev      # Vite dev server with HMR
npm run build    # production bundle
npm run preview  # preview the production build locally
npm run lint     # ESLint
```

---

## 13. Suggested Learning Path (read the code in this order)

1. `index.html` → `src/main.jsx` → understand provider nesting.
2. `src/App.jsx` → the gates (offline, wake-up, maintenance, forced reset).
3. `src/components/Routes/index.jsx` → every screen + `ProtectedRoute`.
4. `src/context/AuthContext.jsx` → the heart of auth (Firebase ↔ backend).
5. `src/firebase/cloudFunctions.js` → how every API call is made & cached.
6. `src/hooks/useSocket.js` → real-time layer.
7. One dashboard end-to-end, e.g. Student:
   - `DashBoards/Student-DashBoard/components/layout/StudentLayout.jsx` (sidebar shell)
   - then one page like `StudentComplaints.jsx` (fetch → render → mutate pattern).
8. `src/index.css` → theme variables, then `ThemeContext.jsx`.
9. `vite.config.js` + `PWA-SETUP.md` → build & deployment concerns.

---

## 14. Key Takeaways (architecture summary)

- **Identity ≠ Authorization**: Firebase proves *who you are*; the backend profile decides *what you can do* (`userData.role`).
- **One protected route tree per role**, all in a single routes file — easy to audit.
- **Everything authenticated goes through one fetch wrapper** carrying a Bearer ID token — a clean single point for caching, timeouts, and error handling.
- **Real-time via Socket.IO rooms** keyed off the verified Firebase token — no separate auth system.
- **Resilience patterns everywhere**: cold-start screen, offline detection, maintenance gate, chunk-reload recovery — lessons learned from running a free-tier deployment.
