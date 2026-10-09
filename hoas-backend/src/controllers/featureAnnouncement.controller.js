import { listFeaturesWithStatus, announceNewFeatures } from '../services/featureAnnouncement.service.js';
import { recordAudit } from '../services/audit.service.js';
// Owner-only: what features exist, which "What's new" mails went out.
export async function listFeatureAnnouncements(req, res, next) {
  try {
    const features = await listFeaturesWithStatus();
    res.json({ features });
  } catch (error) {
    next(error);
  }
}

// Owner-only manual trigger: detect unannounced features and mail them now.
// (The scheduler does this automatically; this is the "send now" button.)
export async function triggerFeatureAnnounce(req, res, next) {
  try {
    const by = req.user?.email || String(req.user?._id || 'owner');
    const summary = await announceNewFeatures({ triggeredBy: `manual:${by}` });
    await recordAudit({
      actor: req.user,
      action: 'FEATURE_ANNOUNCE_TRIGGERED',
      targetType: 'Feature',
      metadata: { checked: summary.checked, announced: summary.announced?.length ?? 0 },
    }).catch(() => {});
    res.json({ ok: true, ...summary });
  } catch (error) {
    next(error);
  }
}

// AI status: is the AI writer enabled + configured?
export async function aiAnnounceStatus(req, res, next) {
  try {
    const { aiStatus } = await import('../services/aiAnnouncement.service.js');
    res.json({ ok: true, ...aiStatus() });
  } catch (error) {
    next(error);
  }
}

// Owner-only AI trigger: AI reads the new code, writes the release note,
// classifies owners-vs-everyone, and mails it. Idempotent per commit.
export async function triggerAiAnnounce(req, res, next) {
  try {
    const { announceAi } = await import('../services/aiAnnouncement.service.js');
    const by = req.user?.email || String(req.user?._id || 'owner');
    const summary = await announceAi({ triggeredBy: `ai-manual:${by}` });
    await recordAudit({
      actor: req.user,
      action: 'AI_ANNOUNCE_TRIGGERED',
      targetType: 'Feature',
      metadata: { upToDate: summary.upToDate, headSha: summary.headSha },
    }).catch(() => {});
    res.json({ ok: true, ...summary });
  } catch (error) {
    next(error);
  }
}
