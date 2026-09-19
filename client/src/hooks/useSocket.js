import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { io } from 'socket.io-client';

const SOCKET_URL = (import.meta.env.VITE_API_URL || window.location.origin).replace(/\/+$/, '');

// Module-level shared connection: exactly ONE socket per browser tab no
// matter how many components call useSocket(). Every extra connection costs
// the server memory, a Firebase token verification and presence writes.
let sharedSocket = null;
let sharedConnectPromise = null;
let sharedUid = null;
let pendingUser = null;
let refCount = 0;
let sharedConnected = false;
const connectedListeners = new Set();

const setSharedConnected = (value) => {
  sharedConnected = value;
  connectedListeners.forEach((fn) => fn(value));
};

const SOCKET_EVENT_MAP = [
  ['user:updated', 'hoas:user-updated'],
  ['notification', 'hoas:notification'],
  ['fee:updated', 'hoas:fee-updated'],
  ['complaint:new', 'hoas:complaint-new'],
  ['complaint:updated', 'hoas:complaint-updated'],
  ['complaint:disputed', 'hoas:complaint-disputed'],
  ['complaint:escalated', 'hoas:complaint-escalated'],
  ['announcement:new', 'hoas:announcement-new'],
  ['leave:new', 'hoas:leave-new'],
  ['leave:updated', 'hoas:leave-updated'],
  ['outing:new', 'hoas:outing-new'],
  ['outing:updated', 'hoas:outing-updated'],
  ['emergency:started', 'hoas:emergency-started'],
  ['emergency:updated', 'hoas:emergency-updated'],
  ['emergency:stopped', 'hoas:emergency-stopped'],
  ['college:updated', 'hoas:college-updated'],
  ['settings:updated', 'hoas:settings-updated'],
  ['visitor:updated', 'hoas:visitor-updated'],
  ['messmenu:updated', 'hoas:messmenu-updated'],
];

const attachForwarders = (socket) => {
  socket.on('connect', () => setSharedConnected(true));
  socket.on('disconnect', () => setSharedConnected(false));
  SOCKET_EVENT_MAP.forEach(([serverEvent, domEvent]) => {
    socket.on(serverEvent, (payload) => {
      window.dispatchEvent(new CustomEvent(domEvent, { detail: payload }));
    });
  });
};

const connectShared = () => {
  if (sharedSocket || sharedConnectPromise || !pendingUser) return;
  const user = pendingUser;
  sharedConnectPromise = (async () => {
    try {
      const token = await user.getIdToken();
      // Superseded (logout/switch) while the token was being fetched.
      if (!token || pendingUser?.uid !== user.uid) return;
      if (!sharedSocket) {
        const socket = io(SOCKET_URL, {
          auth: { token },
          transports: ['websocket'],
          path: '/socket.io',
        });
        attachForwarders(socket);
        sharedSocket = socket;
        sharedUid = user.uid;
      }
    } catch (err) {
      console.warn('Socket: could not retrieve Firebase token:', err);
    } finally {
      sharedConnectPromise = null;
      // A newer login superseded this attempt — drive exactly one more.
      if (pendingUser && !sharedSocket && pendingUser.uid !== user.uid) connectShared();
    }
  })();
};

const releaseSharedSocket = () => {
  if (refCount > 0 || !sharedSocket) return;
  sharedSocket.disconnect();
  sharedSocket = null;
  sharedUid = null;
  setSharedConnected(false);
};

// Initialize Socket.IO connection using the Firebase ID token.
// The backend authenticates connections via firebaseAuth.verifyIdToken(token)
// (see hoas-backend/src/services/socket-auth.js). The io() call connects with
// an auth object containing the token; the backend's socket-auth middleware
// verifies it and joins rooms (user, college, hostel, admins) based on the user.
export default function useSocket() {
  const { user } = useAuth();
  const [connected, setConnected] = useState(sharedConnected);

  useEffect(() => {
    connectedListeners.add(setConnected);
    if (user) {
      refCount += 1;
      pendingUser = user;
      // Different account than the live socket (or none) — reconnect.
      if (!sharedSocket || sharedUid !== user.uid) {
        if (sharedSocket) {
          sharedSocket.disconnect();
          sharedSocket = null;
          sharedUid = null;
        }
        connectShared();
      }
    }
    return () => {
      connectedListeners.delete(setConnected);
      if (user) {
        refCount = Math.max(0, refCount - 1);
        // Defer teardown a tick so StrictMode remounts and route
        // transitions don't flap the single shared connection.
        setTimeout(() => {
          if (refCount <= 0) {
            if (pendingUser?.uid === user.uid) pendingUser = null;
            releaseSharedSocket();
          }
        }, 0);
      }
    };
    // Intentionally keyed on uid only: reconnect on account switch/logout,
    // not on Firebase token refreshes (avoids socket churn).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]);

  return { connected };
}
