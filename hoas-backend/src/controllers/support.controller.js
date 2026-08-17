import SupportTicket from '../models/SupportTicket.js';
import { AppError } from '../utils/AppError.js';
import { recordAudit } from '../services/audit.service.js';
import { notifyAdmins } from '../services/notification.service.js';

export async function createTicket(req, res, next) {
  try {
    const ticket = await SupportTicket.create({
      subject: req.body.subject,
      description: req.body.description,
      category: req.body.category,
      priority: req.body.priority,
      reporterId: req.user._id,
      reporterRole: req.user.role,
      collegeId: req.user.collegeId,
    });

    await notifyAdmins({
      type: 'support_ticket',
      title: 'New support ticket',
      body: req.body.subject,
      data: { ticketId: String(ticket._id) },
    });

    await recordAudit({ actor: req.user, action: 'SUPPORT_TICKET_CREATED', targetType: 'SupportTicket', targetId: ticket._id });
    res.status(201).json({ ticket });
  } catch (error) {
    next(error);
  }
}

export async function listTickets(req, res, next) {
  try {
    const filter = {};
    if (req.user.role === 'owner' || req.user.role === 'admin') {
      if (req.query.status) filter.status = req.query.status;
    } else {
      filter.reporterId = req.user._id;
    }
    const tickets = await SupportTicket.find(filter)
      .populate('reporterId', 'name email role')
      .sort({ createdAt: -1 })
      .limit(200);
    res.json({ tickets });
  } catch (error) {
    next(error);
  }
}

export async function updateTicketStatus(req, res, next) {
  try {
    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) throw new AppError(404, 'TICKET_NOT_FOUND');

    if (req.user.role !== 'owner' && req.user.role !== 'admin') {
      if (String(ticket.reporterId) !== String(req.user._id) || !['resolved', 'closed'].includes(req.body.status)) {
        throw new AppError(403, 'FORBIDDEN');
      }
    }

    ticket.status = req.body.status;
    if (req.body.resolution) ticket.resolution = req.body.resolution;
    if (req.body.priority) ticket.priority = req.body.priority;
    if (req.body.status === 'resolved') {
      ticket.resolvedAt = new Date();
      if (req.user.role === 'owner' || req.user.role === 'admin') ticket.assignedTo = req.user._id;
    }
    await ticket.save();

    await recordAudit({
      actor: req.user,
      action: 'SUPPORT_TICKET_UPDATED',
      targetType: 'SupportTicket',
      targetId: ticket._id,
      metadata: { status: req.body.status },
    });
    res.json({ ticket });
  } catch (error) {
    next(error);
  }
}

export async function deleteTicket(req, res, next) {
  try {
    const ticket = await SupportTicket.findByIdAndDelete(req.params.id);
    if (!ticket) throw new AppError(404, 'TICKET_NOT_FOUND');

    await recordAudit({
      actor: req.user,
      action: 'SUPPORT_TICKET_DELETED',
      targetType: 'SupportTicket',
      targetId: ticket._id,
    });
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
}