import MessMenu from '../models/MessMenu.js';
import { AppError } from '../utils/AppError.js';
import { canManageCollege, idOf } from '../utils/scope.js';
import { recordAudit } from '../services/audit.service.js';
import { emitToCollege } from '../services/socket.service.js';
import { getSettingsOrDefaults } from '../services/capacity.service.js';

const WEEK_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

async function assertMessEnabled() {
  const settings = await getSettingsOrDefaults();
  if (settings?.features?.messMenu === false) {
    throw new AppError(403, 'MESSMENU_DISABLED');
  }
}

function emitMenu(menu) {
  try {
    emitToCollege(menu.collegeId, 'messmenu:updated', menu.toJSON());
  } catch {
    // sockets are best-effort
  }
}

function sanitizeDays(days) {
  const list = Array.isArray(days) ? days : [];
  return WEEK_DAYS.map((day) => {
    const found = list.find((d) => String(d?.day || '').toLowerCase() === day.toLowerCase()) || {};
    return {
      day,
      breakfast: String(found.breakfast || ''),
      lunch: String(found.lunch || ''),
      snacks: String(found.snacks || ''),
      dinner: String(found.dinner || ''),
    };
  });
}

function withAverages(menu) {
  const doc = typeof menu.toObject === 'function' ? menu.toObject() : { ...menu };
  const byDay = {};
  for (const r of doc.ratings || []) {
    (byDay[r.day] = byDay[r.day] || []).push(r.score);
  }
  doc.averages = Object.fromEntries(
    Object.entries(byDay).map(([day, scores]) => [
      day,
      Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10,
    ])
  );
  doc.ratingCount = (doc.ratings || []).length;
  return doc;
}

// Current menu: latest published week for students/wardens,
// latest draft-or-published for management (so they can keep editing).
export async function getCurrentMenu(req, res, next) {
  try {
    const collegeId = idOf(req.user.collegeId);
    if (!collegeId) throw new AppError(400, 'COLLEGE_REQUIRED');
    const filter = { collegeId };
    if (req.user.role !== 'management' && req.user.role !== 'owner' && req.user.role !== 'admin') {
      filter.published = true;
    }
    const menu = await MessMenu.findOne(filter).sort({ weekStart: -1 });
    res.json({ menu: menu ? withAverages(menu) : null });
  } catch (error) {
    next(error);
  }
}

export async function listMenus(req, res, next) {
  try {
    const collegeId = idOf(req.user.collegeId);
    const menus = await MessMenu.find({ collegeId })
      .sort({ weekStart: -1 })
      .limit(12)
      .select('weekStart published createdAt updatedAt');
    res.json({ menus });
  } catch (error) {
    next(error);
  }
}

export async function saveMenu(req, res, next) {
  try {
    await assertMessEnabled();
    const { collegeId, weekStart, days } = req.body;
    if (!canManageCollege(req.user, collegeId)) throw new AppError(403, 'FORBIDDEN');

    const start = new Date(weekStart);
    if (Number.isNaN(start.getTime())) throw new AppError(400, 'INVALID_WEEK');

    let menu = await MessMenu.findOne({ collegeId, weekStart: start });
    if (menu) {
      menu.days = sanitizeDays(days);
      await menu.save();
    } else {
      menu = await MessMenu.create({
        collegeId,
        weekStart: start,
        days: sanitizeDays(days),
        published: false,
        createdBy: req.user._id,
      });
    }

    await recordAudit({
      actor: req.user,
      action: 'MESSMENU_SAVED',
      targetType: 'MessMenu',
      targetId: menu._id,
    });
    res.status(201).json({ menu: withAverages(menu) });
  } catch (error) {
    next(error);
  }
}

export async function publishMenu(req, res, next) {
  try {
    await assertMessEnabled();
    const menu = await MessMenu.findById(req.params.id);
    if (!menu) throw new AppError(404, 'MENU_NOT_FOUND');
    if (!canManageCollege(req.user, menu.collegeId)) throw new AppError(403, 'FORBIDDEN');
    menu.published = true;
    await menu.save();

    await recordAudit({
      actor: req.user,
      action: 'MESSMENU_PUBLISHED',
      targetType: 'MessMenu',
      targetId: menu._id,
    });
    emitMenu(menu);
    res.json({ menu: withAverages(menu) });
  } catch (error) {
    next(error);
  }
}

export async function rateMeal(req, res, next) {
  try {
    await assertMessEnabled();
    const menu = await MessMenu.findById(req.params.id);
    if (!menu || !menu.published) throw new AppError(404, 'MENU_NOT_FOUND');
    if (String(menu.collegeId) !== String(idOf(req.user.collegeId))) {
      throw new AppError(403, 'FORBIDDEN');
    }
    const { day, score } = req.body;
    if (!WEEK_DAYS.includes(day)) throw new AppError(400, 'INVALID_DAY');
    const n = Number(score);
    if (!Number.isInteger(n) || n < 1 || n > 5) throw new AppError(400, 'INVALID_SCORE');

    const existing = menu.ratings.find(
      (r) => String(r.studentId) === String(req.user._id) && r.day === day
    );
    if (existing) existing.score = n;
    else menu.ratings.push({ studentId: req.user._id, day, score: n });
    await menu.save();
    res.json({ menu: withAverages(menu) });
  } catch (error) {
    next(error);
  }
}
