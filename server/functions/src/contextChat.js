import express from 'express';
import { onRequest } from 'firebase-functions/v2/https';
import { onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { FieldValue } from 'firebase-admin/firestore';
import { db, corsHandler } from './config.js';
import { authenticateRequest } from './reportHelpers.js';

const app = express();
app.use(express.json({ limit: '64kb' }));

const CONTEXT_TYPES = ['complaint', 'leave', 'emergency'];
const MAX_MESSAGE_LENGTH = 500;
const MIN_MESSAGE_LENGTH = 1;
const MAX_MESSAGES_PER_CONTEXT = 10;
const MESSAGE_COOLDOWN_MS = 5000;

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

app.options(/.*/, (req, res) => {
  res.status(200).send('ok');
});

function nowMs() {
  return Date.now();
}

function conversationId(contextType, contextId) {
  return `${contextType}_${contextId}`;
}

function normalizeMessage(message) {
  return String(message || '').trim().replace(/\s+/g, ' ');
}

function validateContextType(contextType) {
  return CONTEXT_TYPES.includes(contextType);
}

function isContextClosed(contextType, record) {
  if (!record) return true;

  if (contextType === 'complaint') {
    return ['resolved', 'rejected', 'closed'].includes(record.status);
  }

  if (contextType === 'leave') {
    return ['completed', 'denied', 'cancelled', 'rejected'].includes(record.status);
  }

  if (contextType === 'emergency') {
    return record.isActive === false;
  }

  return true;
}

async function resolveContextRecord(contextType, contextId) {
  if (contextType === 'complaint') {
    const complaintRef = db.collection('complaints').doc(contextId);
    const complaintSnap = await complaintRef.get();
    if (!complaintSnap.exists) return null;
    return {
      contextType,
      contextId,
      ref: complaintRef,
      data: complaintSnap.data(),
      canonicalType: 'complaint',
    };
  }

  if (contextType === 'leave') {
    const leaveRef = db.collection('leaveRequests').doc(contextId);
    const leaveSnap = await leaveRef.get();
    if (leaveSnap.exists) {
      return {
        contextType,
        contextId,
        ref: leaveRef,
        data: leaveSnap.data(),
        canonicalType: 'leave',
      };
    }

    const outingRef = db.collection('outings').doc(contextId);
    const outingSnap = await outingRef.get();
    if (outingSnap.exists) {
      return {
        contextType,
        contextId,
        ref: outingRef,
        data: outingSnap.data(),
        canonicalType: 'leave',
      };
    }

    return null;
  }

  if (contextType === 'emergency') {
    const emergencyRef = db.collection('emergencyLocations').doc(contextId);
    const emergencySnap = await emergencyRef.get();
    if (!emergencySnap.exists) return null;

    return {
      contextType,
      contextId,
      ref: emergencyRef,
      data: emergencySnap.data(),
      canonicalType: 'emergency',
    };
  }

  return null;
}

async function resolveParticipants(contextType, contextRecord) {
  const data = contextRecord?.data || {};
  let studentId = data.studentId || data.studentUid || null;
  let wardenId = data.wardenId || null;
  const managementId = data.managementId || null;

  if (!studentId && contextType === 'emergency') {
    studentId = contextRecord.contextId;
  }

  if (!wardenId && studentId) {
    const studentSnap = await db.collection('users').doc(studentId).get();
    if (studentSnap.exists) {
      const studentData = studentSnap.data();
      wardenId = studentData.wardenId || null;
    }
  }

  return { studentId, wardenId, managementId };
}

function canReadConversation(role, userId, participants) {
  if (role === 'admin' || role === 'owner') return true;
  if (role === 'management') return participants.managementId === userId;
  if (role === 'student') return participants.studentId === userId;
  if (role === 'warden') return participants.wardenId === userId;
  return false;
}

function canSendConversation(role, userId, participants) {
  if (role === 'student') return participants.studentId === userId;
  if (role === 'warden') return participants.wardenId === userId;
  return false;
}

async function markConversationClosed(contextType, contextId, reason = 'context_closed') {
  const convoRef = db.collection('contextConversations').doc(conversationId(contextType, contextId));
  const snap = await convoRef.get();
  if (!snap.exists) return;

  if (snap.data().isActive === false) return;

  await convoRef.update({
    isActive: false,
    closedAt: nowMs(),
    closedReason: reason,
    updatedAt: nowMs(),
  });
}

app.post('/api/chat/send', async (req, res) => {
  try {
    const auth = await authenticateRequest(req, res, 'json');
    if (!auth) return;

    const { userId, userData } = auth;
    const { contextType, contextId, message } = req.body || {};

    if (!validateContextType(contextType) || !contextId) {
      res.status(400).json({ error: 'Valid contextType and contextId are required' });
      return;
    }

    const normalized = normalizeMessage(message);
    if (normalized.length < MIN_MESSAGE_LENGTH || normalized.length > MAX_MESSAGE_LENGTH) {
      res.status(400).json({ error: `Message must be between ${MIN_MESSAGE_LENGTH} and ${MAX_MESSAGE_LENGTH} characters` });
      return;
    }

    const contextRecord = await resolveContextRecord(contextType, contextId);
    if (!contextRecord) {
      res.status(404).json({ error: 'Context not found' });
      return;
    }

    const participants = await resolveParticipants(contextType, contextRecord);
    if (!canSendConversation(userData.role, userId, participants)) {
      res.status(403).json({ error: 'Only assigned student or warden can send messages in this context' });
      return;
    }

    if (isContextClosed(contextType, contextRecord.data)) {
      await markConversationClosed(contextType, contextId, 'resolved_or_completed');
      res.status(409).json({ error: 'Conversation is closed because the context is already resolved/completed' });
      return;
    }

    const convoRef = db.collection('contextConversations').doc(conversationId(contextType, contextId));
    const convoMessagesRef = convoRef.collection('messages').doc();
    const now = nowMs();

    const result = await db.runTransaction(async (tx) => {
      const convoSnap = await tx.get(convoRef);
      const existing = convoSnap.exists ? convoSnap.data() : null;

      if (existing?.isActive === false) {
        throw new Error('Conversation is closed');
      }

      const messageCount = Number(existing?.messageCount || 0);
      if (messageCount >= MAX_MESSAGES_PER_CONTEXT) {
        throw new Error(`Message limit reached for this context (${MAX_MESSAGES_PER_CONTEXT})`);
      }

      const senderLastAt = Number(existing?.lastMessageAtBySender?.[userId] || 0);
      if (now - senderLastAt < MESSAGE_COOLDOWN_MS) {
        throw new Error(`Please wait ${Math.ceil((MESSAGE_COOLDOWN_MS - (now - senderLastAt)) / 1000)}s before sending another message`);
      }

      if ((existing?.lastMessageNormalized || '') === normalized && existing?.lastSenderId === userId) {
        throw new Error('Duplicate message blocked');
      }

      const receiverId = userId === participants.studentId ? participants.wardenId : participants.studentId;
      if (!receiverId) {
        throw new Error('No receiver is assigned for this context yet');
      }

      const payload = {
        senderId: userId,
        receiverId,
        senderRole: userData.role,
        message: normalized,
        contextType,
        contextId,
        createdAt: now,
      };

      tx.set(convoMessagesRef, payload);

      const lastMessageAtBySender = {
        ...(existing?.lastMessageAtBySender || {}),
        [userId]: now,
      };

      tx.set(convoRef, {
        contextType,
        contextId,
        isActive: true,
        createdAt: existing?.createdAt || now,
        closedAt: null,
        closedReason: null,
        updatedAt: now,
        participants,
        messageCount: messageCount + 1,
        lastMessage: normalized,
        lastMessageNormalized: normalized,
        lastMessageAt: now,
        lastSenderId: userId,
        lastMessageAtBySender,
      }, { merge: true });

      return payload;
    });

    res.status(200).json({ success: true, message: result });
  } catch (error) {
    console.error('chat send error', error);
    res.status(409).json({ error: error.message || 'Unable to send message' });
  }
});

app.get('/api/chat/:contextId', async (req, res) => {
  try {
    const auth = await authenticateRequest(req, res, 'json');
    if (!auth) return;

    const { userId, userData } = auth;
    const { contextId } = req.params;
    const contextType = String(req.query.contextType || '').trim();

    if (!validateContextType(contextType)) {
      res.status(400).json({ error: 'contextType query param is required (complaint|leave|emergency)' });
      return;
    }

    const contextRecord = await resolveContextRecord(contextType, contextId);
    if (!contextRecord) {
      res.status(404).json({ error: 'Context not found' });
      return;
    }

    const participants = await resolveParticipants(contextType, contextRecord);
    if (!canReadConversation(userData.role, userId, participants)) {
      res.status(403).json({ error: 'Not allowed to view this conversation' });
      return;
    }

    const convoRef = db.collection('contextConversations').doc(conversationId(contextType, contextId));
    const convoSnap = await convoRef.get();
    const contextClosed = isContextClosed(contextType, contextRecord.data);

    if (contextClosed) {
      await markConversationClosed(contextType, contextId, 'resolved_or_completed');
    }

    const messagesSnap = await convoRef.collection('messages').orderBy('createdAt', 'asc').limit(200).get();
    const messages = messagesSnap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));

    const conversation = convoSnap.exists
      ? convoSnap.data()
      : {
        contextType,
        contextId,
        isActive: !contextClosed,
        createdAt: null,
        closedAt: contextClosed ? nowMs() : null,
        participants,
        messageCount: messages.length,
      };

    res.status(200).json({
      success: true,
      contextType,
      contextId,
      conversation: {
        ...conversation,
        isActive: !contextClosed && conversation.isActive !== false,
        participants,
      },
      messages,
      readOnly: userData.role === 'management' || userData.role === 'admin' || userData.role === 'owner',
    });
  } catch (error) {
    console.error('chat fetch error', error);
    res.status(500).json({ error: error.message || 'Unable to fetch conversation' });
  }
});

app.post('/api/chat/close', async (req, res) => {
  try {
    const auth = await authenticateRequest(req, res, 'json');
    if (!auth) return;

    const { userId, userData } = auth;
    const { contextType, contextId, reason = 'closed_by_user' } = req.body || {};

    if (!validateContextType(contextType) || !contextId) {
      res.status(400).json({ error: 'Valid contextType and contextId are required' });
      return;
    }

    if (!['warden', 'management', 'admin', 'owner'].includes(userData.role)) {
      res.status(403).json({ error: 'Only warden/management can close conversations' });
      return;
    }

    const contextRecord = await resolveContextRecord(contextType, contextId);
    if (!contextRecord) {
      res.status(404).json({ error: 'Context not found' });
      return;
    }

    const participants = await resolveParticipants(contextType, contextRecord);
    const hasManagementAccess = ['management', 'admin', 'owner'].includes(userData.role)
      && (userData.role !== 'management' || participants.managementId === userId);

    const hasWardenAccess = userData.role === 'warden' && participants.wardenId === userId;

    if (!hasManagementAccess && !hasWardenAccess) {
      res.status(403).json({ error: 'Not authorized to close this conversation' });
      return;
    }

    const convoRef = db.collection('contextConversations').doc(conversationId(contextType, contextId));
    const now = nowMs();

    await convoRef.set({
      contextType,
      contextId,
      isActive: false,
      closedAt: now,
      closedReason: reason,
      updatedAt: now,
      closedBy: userId,
      participants,
    }, { merge: true });

    res.status(200).json({ success: true, message: 'Conversation closed' });
  } catch (error) {
    console.error('chat close error', error);
    res.status(500).json({ error: error.message || 'Unable to close conversation' });
  }
});

async function autoCloseConversationForContext(contextType, contextId, newData) {
  if (!contextId) return;
  if (!isContextClosed(contextType, newData)) return;
  await markConversationClosed(contextType, contextId, 'resolved_or_completed');
}

export const chatApi = onRequest({ cors: true, invoker: 'public' }, app);

export const autoCloseComplaintConversation = onDocumentUpdated('complaints/{complaintId}', async (event) => {
  const after = event.data.after.data();
  await autoCloseConversationForContext('complaint', event.params.complaintId, after);
});

export const autoCloseLeaveConversation = onDocumentUpdated('leaveRequests/{leaveId}', async (event) => {
  const after = event.data.after.data();
  await autoCloseConversationForContext('leave', event.params.leaveId, after);
});

export const autoCloseOutingConversation = onDocumentUpdated('outings/{outingId}', async (event) => {
  const after = event.data.after.data();
  await autoCloseConversationForContext('leave', event.params.outingId, after);
});

export const autoCloseEmergencyConversation = onDocumentUpdated('emergencyLocations/{emergencyId}', async (event) => {
  const after = event.data.after.data();
  await autoCloseConversationForContext('emergency', event.params.emergencyId, after);
});
