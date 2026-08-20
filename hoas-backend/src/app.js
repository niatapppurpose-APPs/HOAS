import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { env } from './config/env.js';
import { globalRateLimit } from './middleware/rateLimit.middleware.js';
import { notFoundHandler, errorHandler } from './middleware/error.middleware.js';
import { authenticate } from './middleware/auth.middleware.js';
import { mintDevToken } from './middleware/auth.middleware.js';
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import studentRoutes from './routes/student.routes.js';
import collegeRoutes from './routes/college.routes.js';
import hostelRoutes from './routes/hostel.routes.js';
import complaintRoutes from './routes/complaint.routes.js';
import leaveRoutes from './routes/leave.routes.js';
import outingRoutes from './routes/outing.routes.js';
import feeRoutes from './routes/fee.routes.js';
import emergencyRoutes from './routes/emergency.routes.js';
import chatRoutes from './routes/chat.routes.js';
import announcementRoutes from './routes/announcement.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import supportRoutes from './routes/support.routes.js';
import settingRoutes from './routes/setting.routes.js';
import reportRoutes from './routes/report.routes.js';
import uploadRoutes from './routes/upload.routes.js';

const app = express();

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || env.allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error('CORS origin not allowed'));
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(globalRateLimit);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'hoas-backend',
    time: new Date().toISOString(),
    database: mongooseConnectionState(),
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'hoas-backend',
    time: new Date().toISOString(),
  });
});

app.post('/api/dev/token', (req, res) => {
  if (!env.firebaseDevMode) return res.status(404).json({ error: 'NOT_FOUND' });
  const { uid } = req.body || {};
  if (!uid) return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'uid required' });
  res.json({ token: mintDevToken(uid) });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/colleges', collegeRoutes);
app.use('/api/hostels', hostelRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/outings', outingRoutes);
app.use('/api/fees', feeRoutes);
app.use('/api/emergency', emergencyRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/settings', settingRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/uploads', uploadRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

function mongooseConnectionState() {
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  return states[mongoose.connection.readyState] || 'unknown';
}

export default app;