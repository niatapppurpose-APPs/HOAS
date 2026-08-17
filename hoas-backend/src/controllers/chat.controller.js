import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import Complaint from '../models/Complaint.js';
import LeaveRequest from '../models/LeaveRequest.js';
import Outing from '../models/Outing.js';
import EmergencyLocation from '../models/EmergencyLocation.js';
import User from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { canManageCollege } from '../utils/scope.js';
import { recordAudit } from '../services/audit.service.js';
import { emitToUser } from '../services/socket.service.js';

async function resolveContext(contextType, contextId) {
  if (contextType === 'complaint') return Complaint.findById(contextId);
  if (contextType === 'leave') return LeaveRequest.findById(contextId);
  if (contextType === 'outing') return Outing.findById(contextId);
  if (contextType === 'emergency') return EmergencyLocation.findById(contextId);
  return null;
}

async function getOrCreateConversation(contextType, contextId, collegeId) {
  let conversation = await Conversation.findOne({ contextType, contextId });
  if (conversation) return conversation;

  const context = await resolveContext(contextType, contextId);
  if (!context) return null;

  const student = await User.findById(context.studentId || context.studentUid);
  const warden = await User.findById(context.wardenId || (student && student.wardenId));
  if (!student || !warden) return null;

  conversation = await Conversation.create({
    contextType,
    contextId,
    studentId: student._id,
    wardenId: warden._id,
    collegeId: collegeId || context.collegeId || student.collegeId,
  });
  return conversation;
}

export async function sendMessage(req, res, next) {
  try {
    const { contextType, contextId, text } = req.body;
    const conversation = await getOrCreateConversation(contextType, contextId, req.user.collegeId);
    if (!conversation) throw new AppError(404, 'CONTEXT_NOT_FOUND');
    if (conversation.isClosed) throw new AppError(409, 'CONVERSATION_CLOSED');

    const isParticipant =
      String(conversation.studentId) === String(req.user._id) ||
      String(conversation.wardenId) === String(req.user._id);
    if (!isParticipant) throw new AppError(403, 'FORBIDDEN');

    const messageCount = await Message.countDocuments({ conversationId: conversation._id });
    if (messageCount >= 10) throw new AppError(409, 'MESSAGE_LIMIT_REACHED');

    const lastMessage = await Message.findOne({ conversationId: conversation._id }).sort({ createdAt: -1 });
    if (lastMessage && String(lastMessage.senderId) === String(req.user._id)) {
      const cooldownMs = 5000;
      if (Date.now() - new Date(lastMessage.createdAt).getTime() < cooldownMs) {
        throw new AppError(429, 'MESSAGE_COOLDOWN');
      }
    }

    const message = await Message.create({
      conversationId: conversation._id,
      senderId: req.user._id,
      senderRole: req.user.role,
      text,
    });

    conversation.lastMessageAt = new Date();
    await conversation.save();

    const recipientId = String(conversation.studentId) === String(req.user._id)
      ? conversation.wardenId
      : conversation.studentId;
    emitToUser(recipientId, 'chat:message', { conversationId: conversation._id, message: message.toJSON() });

    res.status(201).json({ message, conversation });
  } catch (error) {
    next(error);
  }
}

export async function getConversation(req, res, next) {
  try {
    const { contextType, contextId } = req.params;
    const conversation = await getOrCreateConversation(contextType, contextId, req.user.collegeId);
    if (!conversation) throw new AppError(404, 'CONTEXT_NOT_FOUND');

    const context = await resolveContext(contextType, contextId);
    const isParticipant =
      String(conversation.studentId) === String(req.user._id) ||
      String(conversation.wardenId) === String(req.user._id);
    const isPrivileged =
      req.user.role === 'owner' ||
      req.user.role === 'admin' ||
      (req.user.role === 'management' && canManageCollege(req.user, conversation.collegeId));
    if (!isParticipant && !isPrivileged) throw new AppError(403, 'FORBIDDEN');

    const contextClosed =
      (contextType === 'complaint' && ['resolved', 'rejected', 'closed'].includes(context?.status)) ||
      (contextType === 'leave' && ['completed', 'denied', 'cancelled', 'rejected'].includes(context?.status)) ||
      (contextType === 'outing' && ['completed', 'rejected'].includes(context?.status)) ||
      (contextType === 'emergency' && context?.isActive === false);

    if (contextClosed && !conversation.isClosed) {
      conversation.isClosed = true;
      conversation.closedAt = new Date();
      await conversation.save();
    }

    const messages = await Message.find({ conversationId: conversation._id }).sort({ createdAt: 1 }).limit(200);
    res.json({ conversation, messages });
  } catch (error) {
    next(error);
  }
}

export async function closeConversation(req, res, next) {
  try {
    const { contextType, contextId } = req.params;
    const conversation = await getOrCreateConversation(contextType, contextId, req.user.collegeId);
    if (!conversation) throw new AppError(404, 'CONVERSATION_NOT_FOUND');

    const allowed =
      String(conversation.wardenId) === String(req.user._id) ||
      req.user.role === 'owner' ||
      req.user.role === 'admin' ||
      (req.user.role === 'management' && canManageCollege(req.user, conversation.collegeId));
    if (!allowed) throw new AppError(403, 'FORBIDDEN');

    conversation.isClosed = true;
    conversation.closedAt = new Date();
    await conversation.save();

    await recordAudit({
      actor: req.user,
      action: 'CONVERSATION_CLOSED',
      targetType: 'Conversation',
      targetId: conversation._id,
    });
    res.json({ conversation });
  } catch (error) {
    next(error);
  }
}