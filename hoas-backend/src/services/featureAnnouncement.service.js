import FeatureAnnouncement from '../models/FeatureAnnouncement.js';
import User from '../models/User.js';
import { FEATURES } from '../config/features.js';
import { sendMail } from './email.service.js';
import { recordAudit } from './audit.service.js';
import { env } from '../config/env.js';

/**
 * Automatic "What's new in HOAS" mails.
 *
 * Detection = registry diff: every entry in `src/config/features.js` with
 * no `FeatureAnnouncement` record is "new" and gets mailed exactly once.
 * - audience 'owners'   (normal features) -> roles owner + admin
 * - audience 'everyone' (major launches)  -> all approved, active users
 */

const SEND_CHUNK = 20;
const MAX_RECIPIENTS = 2000;

function appBaseUrl() {
  const u = env.appUrl;
  if (u && !u.includes('localhost')) return u.replace(/\/+$/, '');
  return 'https://hoas-client-4n13.vercel.app';
}

export async function detectNewFeatures() {
  const announced = await FeatureAnnouncement.distinct('featureId');
  const done = new Set(announced);
  return FEATURES.filter((f) => !done.has(f.id));
}

export async function listFeaturesWithStatus() {
  const announced = await FeatureAnnouncement.find().lean();
  const byId = new Map(announced.map((a) => [a.featureId, a]));
  return FEATURES.map((f) => ({
    ...f,
    announced: byId.has(f.id),
    announcedAt: byId.get(f.id)?.announcedAt || null,
    recipientCount: byId.get(f.id)?.recipientCount ?? null,
  }));
}

export async function resolveRecipients(audience) {
  const filter = { status: 'approved', isActive: { $ne: false }, email: { $exists: true, $ne: '' } };
  if (audience === 'owners') filter.role = { $in: ['owner', 'admin'] };
  else filter.role = { $in: ['owner', 'admin', 'management', 'warden', 'student'] };
  const users = await User.find(filter).select('email name role').limit(MAX_RECIPIENTS + 1).lean();
  const capped = users.length > MAX_RECIPIENTS;
  return { recipients: users.slice(0, MAX_RECIPIENTS), capped };
}

export async function sendFeatureMail(to, feature) {
  const audienceNote = feature.audience === 'everyone'
    ? 'A major update for everyone at HOAS.'
    : 'A new owner tools update (owners only).';
  return sendMail({
    to,
    type: 'feature_announcement',
    subject: `New in HOAS: ${feature.title}`,
    data: {
      userName: to.name || 'there',
      featureTitle: feature.title,
      featureSummary: feature.summary,
      featurePoints: feature.details || [],
      audienceNote,
      version: feature.version || '',
      featureUrl: appBaseUrl(),
    },
  });
}

export async function announceOne(feature, triggeredBy) {
  const { recipients, capped } = await resolveRecipients(feature.audience);
  if (capped) console.warn(`[feature-announce] recipient cap hit for ${feature.id}, truncated to ${MAX_RECIPIENTS}`);
  let sent = 0;
  const errors = [];
  for (let i = 0; i < recipients.length; i += SEND_CHUNK) {
    const chunk = recipients.slice(i, i + SEND_CHUNK);
    const results = await Promise.allSettled(chunk.map((u) => sendFeatureMail(u, feature)));
    results.forEach((r, idx) => {
      if (r.status === 'fulfilled') sent += 1;
      else errors.push(`${chunk[idx].email}: ${r.reason?.message || r.reason}`);
    });
  }
  await FeatureAnnouncement.create({
    featureId: feature.id,
    title: feature.title,
    audience: feature.audience,
    recipientCount: sent,
    triggeredBy,
  });
  await recordAudit({
    actor: null,
    action: 'FEATURE_ANNOUNCED',
    targetType: 'Feature',
    metadata: { featureId: feature.id, audience: feature.audience, sent, failed: errors.length, triggeredBy },
  }).catch(() => {});
  return { featureId: feature.id, title: feature.title, audience: feature.audience, sent, failed: errors.length, errors: errors.slice(0, 5) };
}

/** Detect + mail every unannounced feature. Idempotent — safe to re-run. */
export async function announceNewFeatures({ triggeredBy = 'auto' } = {}) {
  const fresh = await detectNewFeatures();
  const results = [];
  for (const feature of fresh) {
    try {
      results.push(await announceOne(feature, triggeredBy));
    } catch (err) {
      console.error(`[feature-announce] ${feature.id} failed:`, err.message);
      results.push({ featureId: feature.id, title: feature.title, sent: 0, failed: -1, error: err.message });
    }
  }
  return { announced: results.filter((r) => r.sent > 0 || r.failed === 0), checked: fresh.length, results };
}
