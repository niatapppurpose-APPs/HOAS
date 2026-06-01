import express from 'express';
import { onRequest } from 'firebase-functions/v2/https';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import rateLimit from 'express-rate-limit';
import { db, corsHandler } from './config.js';
import { authenticateRequest } from './reportHelpers.js';

const EMERGENCY_COLLECTION = 'emergencyLocations';
const DEFAULT_EXPIRY_MINUTES = 30;
const MAX_EXPIRY_MINUTES = 60;
const RETENTION_MINUTES = 120;
const SHARE_COOLDOWN_MS = 60 * 1000;

const app = express();

// Rate limiting to prevent abuse
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  message: { error: 'Too many requests from this IP, please try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);
app.use(express.json({ limit: '32kb' }));

function runCors(req, res) {
  return new Promise((resolve, reject) => {
    corsHandler(req, res, (err) => {
      if (err) {
        reject(err);
        return;
      }
      resolve();
    });
  });
}

app.use(async (req, res, next) => {
  try {
    await runCors(req, res);
    next();
  } catch {
    res.status(403).json({ error: 'CORS not allowed for this origin' });
  }
});

function toFiniteNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function toEpoch(value) {
  if (!value) return null;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const asNumber = Number(value);
    if (Number.isFinite(asNumber)) return asNumber;
    const dateValue = Date.parse(value);
    return Number.isFinite(dateValue) ? dateValue : null;
  }
  if (value?.toMillis) return value.toMillis();
  return null;
}

function getLastUpdatedAt(locationDoc) {
  return toEpoch(locationDoc?.lastUpdatedAt)
    || toEpoch(locationDoc?.updatedAt)
    || toEpoch(locationDoc?.sharedAt);
}

function buildLocationResponse(locationDoc) {
  return {
    studentId: locationDoc.studentId,
    studentName: locationDoc.studentName || 'Student',
    latitude: locationDoc.latitude,
    longitude: locationDoc.longitude,
    accuracy: locationDoc.accuracy ?? null,
    isActive: Boolean(locationDoc.isActive),
    sharedAt: toEpoch(locationDoc.sharedAt),
    lastUpdatedAt: getLastUpdatedAt(locationDoc),
    expiresAt: toEpoch(locationDoc.expiresAt),
    visibleTo: Array.isArray(locationDoc.visibleTo) ? locationDoc.visibleTo : [],
    createdAt: toEpoch(locationDoc.createdAt),
    managementId: locationDoc.managementId || null,
    wardenId: locationDoc.wardenId || null,
  };
}

function sanitizeLocation(latitude, longitude) {
  const lat = toFiniteNumber(latitude);
  const lng = toFiniteNumber(longitude);

  if (lat === null || lng === null) {
    return { valid: false, message: 'latitude and longitude must be valid numbers' };
  }

  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return { valid: false, message: 'latitude/longitude out of range' };
  }

  return { valid: true, lat, lng };
}

function isPrivilegedRole(role) {
  return role === 'admin' || role === 'owner';
}

function canViewLocation(userData, locationDoc, userId) {
  const role = userData?.role;

  if (isPrivilegedRole(role)) return true;

  if (role === 'management') {
    if (userId === locationDoc.managementId) return true;
    return Array.isArray(locationDoc.visibleTo) && locationDoc.visibleTo.includes(userId);
  }

  if (role === 'warden') {
    return Array.isArray(locationDoc.visibleTo) && locationDoc.visibleTo.includes(userId);
  }

  return false;
}

async function resolveStudentContext(userId, userData) {
  if (userData?.role !== 'student') {
    return { error: 'Only students can share emergency location', code: 403 };
  }

  const managementId = userData.managementId || null;
  if (!managementId) {
    return { error: 'Student profile missing managementId', code: 400 };
  }

  const visibleTo = [];

  if (userData.wardenId) {
    visibleTo.push(userData.wardenId);
  } else if (userData.hostelBlock && userData.collegeName) {
    try {
      const wardenQuery = await db.collection('users')
        .where('role', '==', 'warden')
        .where('collegeName', '==', userData.collegeName)
        .where('hostelBlock', '==', userData.hostelBlock)
        .get();

      wardenQuery.forEach((docSnap) => {
        visibleTo.push(docSnap.id);
      });
    } catch (err) {
      console.warn(`Failed to auto-find wardens for ${userData.hostelBlock}:`, err.message);
    }
  }

  visibleTo.push(managementId);

  return {
    studentContext: {
      studentId: userId,
      managementId,
      wardenId: userData.wardenId || null,
      studentName: userData.fullName || userData.displayName || userData.name || userData.email || 'Student',
      visibleTo: [...new Set(visibleTo.filter(Boolean))],
    },
  };
}

async function markSessionInactive(docRef, now) {
  await docRef.set({
    isActive: false,
    updatedAt: now,
  }, { merge: true });
}

app.options(/.*/, (req, res) => {
  res.status(200).send('ok');
});

app.post('/share', async (req, res) => {
  const auth = await authenticateRequest(req, res, 'json');
  if (!auth) return;

  const { userId, userData } = auth;
  const studentCtxResult = await resolveStudentContext(userId, userData);
  if (studentCtxResult.error) {
    res.status(studentCtxResult.code).json({ error: studentCtxResult.error });
    return;
  }

  const { latitude, longitude, accuracy, expiryMinutes } = req.body || {};
  const locationValidation = sanitizeLocation(latitude, longitude);
  if (!locationValidation.valid) {
    res.status(400).json({ error: locationValidation.message });
    return;
  }

  const minutes = Math.min(Math.max(Number(expiryMinutes) || DEFAULT_EXPIRY_MINUTES, 5), MAX_EXPIRY_MINUTES);
  const now = Date.now();
  const expiresAt = now + minutes * 60 * 1000;
  const docRef = db.collection(EMERGENCY_COLLECTION).doc(userId);
  const existing = await docRef.get();
  const existingData = existing.exists ? existing.data() : null;
  const existingCreatedAt = existing.exists ? (toEpoch(existingData?.createdAt) || now) : now;

  if (existingData?.isActive && (toEpoch(existingData.expiresAt) || 0) > now) {
    const resumedSession = {
      ...existingData,
      latitude: locationValidation.lat,
      longitude: locationValidation.lng,
      accuracy: toFiniteNumber(accuracy),
      updatedAt: now,
      lastUpdatedAt: now,
    };

    await docRef.set(resumedSession, { merge: true });

    res.status(200).json({
      success: true,
      alreadyActive: true,
      data: buildLocationResponse(resumedSession),
    });
    return;
  }

  if (existingData) {
    const timeSinceLastShare = now - (toEpoch(existingData.sharedAt) || 0);
    if (timeSinceLastShare < SHARE_COOLDOWN_MS) {
      res.status(429).json({ error: 'Please wait a minute before sending another emergency request' });
      return;
    }
  }

  const payload = {
    studentId: studentCtxResult.studentContext.studentId,
    managementId: studentCtxResult.studentContext.managementId,
    wardenId: studentCtxResult.studentContext.wardenId,
    studentName: studentCtxResult.studentContext.studentName,
    latitude: locationValidation.lat,
    longitude: locationValidation.lng,
    accuracy: toFiniteNumber(accuracy),
    isActive: true,
    sharedAt: now,
    lastUpdatedAt: now,
    expiresAt,
    visibleTo: studentCtxResult.studentContext.visibleTo,
    createdAt: existingCreatedAt,
    updatedAt: now,
  };

  await docRef.set(payload, { merge: true });

  try {
    await docRef.collection('locationHistory').add({
      latitude: locationValidation.lat,
      longitude: locationValidation.lng,
      accuracy: toFiniteNumber(accuracy),
      timestamp: now,
      action: 'share',
    });
  } catch (historyErr) {
    console.warn('History write failed but share succeeded:', historyErr);
  }

  res.status(200).json({
    success: true,
    data: buildLocationResponse(payload),
  });
});

app.post('/update', async (req, res) => {
  const auth = await authenticateRequest(req, res, 'json');
  if (!auth) return;

  const { userId, userData } = auth;
  if (userData?.role !== 'student') {
    res.status(403).json({ error: 'Only students can update emergency location' });
    return;
  }

  const { latitude, longitude, accuracy } = req.body || {};
  const locationValidation = sanitizeLocation(latitude, longitude);
  if (!locationValidation.valid) {
    res.status(400).json({ error: locationValidation.message });
    return;
  }

  const docRef = db.collection(EMERGENCY_COLLECTION).doc(userId);
  const snapshot = await docRef.get();
  if (!snapshot.exists) {
    res.status(404).json({ error: 'No active emergency sharing session found' });
    return;
  }

  const current = snapshot.data();
  const now = Date.now();

  if (!current.isActive) {
    res.status(409).json({ error: 'Emergency sharing is not active' });
    return;
  }

  if ((toEpoch(current.expiresAt) || 0) <= now) {
    await markSessionInactive(docRef, now);
    res.status(410).json({ error: 'Emergency sharing session expired' });
    return;
  }

  const updatedSession = {
    ...current,
    studentId: userId,
    latitude: locationValidation.lat,
    longitude: locationValidation.lng,
    accuracy: toFiniteNumber(accuracy),
    lastUpdatedAt: now,
    updatedAt: now,
  };

  await docRef.set({
    latitude: locationValidation.lat,
    longitude: locationValidation.lng,
    accuracy: toFiniteNumber(accuracy),
    lastUpdatedAt: now,
    updatedAt: now,
  }, { merge: true });

  await docRef.collection('locationHistory').add({
    latitude: locationValidation.lat,
    longitude: locationValidation.lng,
    accuracy: toFiniteNumber(accuracy),
    timestamp: now,
    action: 'update',
  });

  res.status(200).json({
    success: true,
    data: buildLocationResponse(updatedSession),
  });
});

app.post('/stop', async (req, res) => {
  const auth = await authenticateRequest(req, res, 'json');
  if (!auth) return;

  const { userId, userData } = auth;
  if (userData?.role !== 'student') {
    res.status(403).json({ error: 'Only students can stop emergency location sharing' });
    return;
  }

  const docRef = db.collection(EMERGENCY_COLLECTION).doc(userId);
  const snapshot = await docRef.get();
  if (!snapshot.exists) {
    res.status(200).json({ success: true, message: 'No active session found, already stopped' });
    return;
  }

  const now = Date.now();
  await docRef.set({
    isActive: false,
    stoppedAt: now,
    updatedAt: now,
  }, { merge: true });

  res.status(200).json({ success: true, message: 'Emergency location sharing stopped' });
});

app.get('/session', async (req, res) => {
  const auth = await authenticateRequest(req, res, 'json');
  if (!auth) return;

  const { userId, userData } = auth;
  if (userData?.role !== 'student') {
    res.status(403).json({ error: 'Only students can access their emergency location session' });
    return;
  }

  const docRef = db.collection(EMERGENCY_COLLECTION).doc(userId);
  const snapshot = await docRef.get();
  if (!snapshot.exists) {
    res.status(200).json({ success: true, data: null });
    return;
  }

  const location = snapshot.data();
  if (!location?.isActive) {
    res.status(200).json({ success: true, data: null });
    return;
  }

  const now = Date.now();
  if ((toEpoch(location.expiresAt) || 0) <= now) {
    await markSessionInactive(docRef, now);
    res.status(200).json({ success: true, data: null });
    return;
  }

  res.status(200).json({
    success: true,
    data: buildLocationResponse(location),
  });
});

app.get('/active', async (req, res) => {
  const auth = await authenticateRequest(req, res, 'json');
  if (!auth) return;

  const { userId, userData } = auth;
  const role = userData?.role;

  if (!['warden', 'management', 'admin', 'owner'].includes(role)) {
    res.status(403).json({ error: 'Only wardens or management can access active emergency locations' });
    return;
  }

  const now = Date.now();
  const snapshot = await db.collection(EMERGENCY_COLLECTION)
    .where('isActive', '==', true)
    .get();

  const expiredIds = [];
  const activeLocations = [];

  snapshot.docs.forEach((docSnap) => {
    const location = docSnap.data();
    const expiresAt = toEpoch(location.expiresAt) || 0;

    if (expiresAt <= now) {
      expiredIds.push(docSnap.id);
      return;
    }

    if (!canViewLocation(userData, location, userId)) {
      return;
    }

    activeLocations.push(buildLocationResponse(location));
  });

  if (expiredIds.length > 0) {
    const batch = db.batch();
    expiredIds.forEach((id) => {
      batch.set(db.collection(EMERGENCY_COLLECTION).doc(id), {
        isActive: false,
        updatedAt: now,
      }, { merge: true });
    });
    await batch.commit();
  }

  activeLocations.sort((a, b) => (b.sharedAt || 0) - (a.sharedAt || 0));

  res.status(200).json({
    success: true,
    count: activeLocations.length,
    data: activeLocations,
  });
});

app.get('/history/:studentId', async (req, res) => {
  const auth = await authenticateRequest(req, res, 'json');
  if (!auth) return;

  const { userId, userData } = auth;
  const { studentId } = req.params;
  const role = userData?.role;

  const isPrivileged = isPrivilegedRole(role);
  const isStudent = role === 'student' && userId === studentId;
  const isAuthorized = userData?.managementId && (
    role === 'management' || role === 'warden' || isPrivileged || isStudent
  );

  if (!isPrivileged && !isAuthorized) {
    res.status(403).json({ error: 'Not authorized to view this student\'s location history' });
    return;
  }

  try {
    const docRef = db.collection(EMERGENCY_COLLECTION).doc(studentId);
    const snapshot = await docRef.get();

    if (!snapshot.exists) {
      res.status(404).json({ error: 'No emergency location data found for this student' });
      return;
    }

    const locationData = snapshot.data();

    if (!isPrivileged && !isStudent && !canViewLocation(userData, locationData, userId)) {
      res.status(403).json({ error: 'Not authorized to view this student\'s location' });
      return;
    }

    const historySnapshot = await docRef
      .collection('locationHistory')
      .orderBy('timestamp', 'desc')
      .limit(100)
      .get();

    const history = historySnapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
      timestamp: toEpoch(docSnap.data().timestamp),
    }));

    res.status(200).json({
      success: true,
      studentId,
      studentName: locationData.studentName || 'Student',
      isActive: locationData.isActive,
      count: history.length,
      history,
    });
  } catch (error) {
    console.error('Error retrieving location history:', error);
    res.status(500).json({ error: 'Failed to retrieve location history' });
  }
});

export const locationApi = onRequest({ invoker: 'public' }, app);

export const cleanupEmergencyLocations = onSchedule('every 30 minutes', async () => {
  const now = Date.now();
  const retentionCutoff = now - RETENTION_MINUTES * 60 * 1000;
  const historyRetentionCutoff = now - (RETENTION_MINUTES + 60) * 60 * 1000;

  const staleSnapshot = await db.collection(EMERGENCY_COLLECTION)
    .where('updatedAt', '<', retentionCutoff)
    .get();

  if (!staleSnapshot.empty) {
    const batch = db.batch();
    staleSnapshot.docs.forEach((docSnap) => {
      batch.delete(docSnap.ref);
    });
    await batch.commit();
  }

  const allSnapshot = await db.collection(EMERGENCY_COLLECTION).get();
  const historyCleanupBatch = db.batch();
  let cleanupCount = 0;

  await Promise.all(
    allSnapshot.docs.map(async (docSnap) => {
      const historySnapshot = await docSnap.ref
        .collection('locationHistory')
        .where('timestamp', '<', historyRetentionCutoff)
        .get();

      historySnapshot.docs.forEach((historyDoc) => {
        historyCleanupBatch.delete(historyDoc.ref);
        cleanupCount += 1;
      });
    })
  );

  if (cleanupCount > 0) {
    await historyCleanupBatch.commit();
  }
});
