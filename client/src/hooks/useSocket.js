import {useState,  useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { io } from 'socket.io-client';

const SOCKET_URL = (import.meta.env.VITE_API_URL || window.location.origin).replace(/\/+$/, '');

// Initialize Socket.IO connection using the Firebase ID token.
// The backend authenticates connections via firebaseAuth.verifyIdToken(token)
// (see hoas-backend/src/services/socket-auth.js). The io() call connects with
// an auth object containing the token; the backend's socket-auth middleware
// verifies it and joins rooms (user, college, hostel, admins) based on the user.
export default function useSocket() {
  const { user, userData } = useAuth();
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!user) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setConnected(false);
      }
      return;
    }

    const fetchToken = async () => {
      try {
        const token = await user.getIdToken();
        return token;
      } catch (err) {
        console.warn('Socket: could not retrieve Firebase token:', err);
        return null;
      }
    };

    fetchToken().then((token) => {
      if (!token) return;

      const socket = io(SOCKET_URL, {
        auth: { token },
        transports: ['websocket'],
        path: '/socket.io',
      });
      socketRef.current = socket;

      socket.on('connect', () => {
        setConnected(true);
        console.log('Socket.IO connected as user', user.uid, 'role', userData?.role);
        // Owner/admins automatically join the 'admins' room on the server side.
        if (userData?.role === 'owner' || userData?.role === 'admin') {
          // The server joins 'admins' on connect; no extra action needed here.
        }
      });

       socket.on('disconnect', () => {
        setConnected(false);
        console.log('Socket.IO disconnected');
       });

        socket.on('user:updated', (payload) => {
          window.dispatchEvent(new CustomEvent('hoas:user-updated', { detail: payload }));
        });
        socket.on('notification', (payload) => {
          window.dispatchEvent(new CustomEvent('hoas:notification', { detail: payload }));
        });
        socket.on('fee:updated', (payload) => {
          window.dispatchEvent(new CustomEvent('hoas:fee-updated', { detail: payload }));
        });
        socket.on('complaint:new', (payload) => {
          window.dispatchEvent(new CustomEvent('hoas:complaint-new', { detail: payload }));
        });
        socket.on('complaint:updated', (payload) => {
          window.dispatchEvent(new CustomEvent('hoas:complaint-updated', { detail: payload }));
        });
        socket.on('complaint:disputed', (payload) => {
          window.dispatchEvent(new CustomEvent('hoas:complaint-disputed', { detail: payload }));
        });
        socket.on('complaint:escalated', (payload) => {
          window.dispatchEvent(new CustomEvent('hoas:complaint-escalated', { detail: payload }));
        });
        socket.on('announcement:new', (payload) => {
          window.dispatchEvent(new CustomEvent('hoas:announcement-new', { detail: payload }));
        });
        socket.on('leave:new', (payload) => {
          window.dispatchEvent(new CustomEvent('hoas:leave-new', { detail: payload }));
        });
        socket.on('leave:updated', (payload) => {
          window.dispatchEvent(new CustomEvent('hoas:leave-updated', { detail: payload }));
        });
        socket.on('emergency:started', (payload) => {
          window.dispatchEvent(new CustomEvent('hoas:emergency-started', { detail: payload }));
        });
        socket.on('emergency:updated', (payload) => {
          window.dispatchEvent(new CustomEvent('hoas:emergency-updated', { detail: payload }));
        });
        socket.on('emergency:stopped', (payload) => {
          window.dispatchEvent(new CustomEvent('hoas:emergency-stopped', { detail: payload }));
        });
        socket.on('college:updated', (payload) => {
          window.dispatchEvent(new CustomEvent('hoas:college-updated', { detail: payload }));
        });
     });
  }, [user]);

  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  return { connected };
}
