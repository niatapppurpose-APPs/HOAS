import {useState,  useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { io } from 'socket.io-client';

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

      const socket = io({ auth: { token }, transports: ['websocket'] });
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
    });
  }, [user, userData]);

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