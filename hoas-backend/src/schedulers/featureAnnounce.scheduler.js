import { schedule } from './runner.js';
import { env } from '../config/env.js';

const DAY_MS = 24 * 60 * 60 * 1000;

// Auto "What's new" mails: on every boot (catches freshly deployed features)
// plus once a day (retries anything whose mail failed). Idempotent — each
// feature is mailed exactly once, tracked in `featureannouncements`.
// Disable with FEATURE_ANNOUNCE_AUTO=false.
export function startFeatureAnnounceScheduler() {
  if (env.featureAnnounceAuto !== true) {
    console.log('[feature-announce] auto mails disabled (FEATURE_ANNOUNCE_AUTO=false)');
    return;
  }
  schedule(DAY_MS, async () => {
    const { announceNewFeatures } = await import('../services/featureAnnouncement.service.js');
    const summary = await announceNewFeatures({ triggeredBy: 'auto' });
    if (summary.checked > 0) {
      console.log(`[feature-announce] checked ${summary.checked}, mailed ${summary.announced?.length ?? 0} feature(s)`);
    }
    // AI path: reads new code, writes the note itself, mails once per commit.
    // Only runs when AI_ANNOUNCE_ENABLED=true with API credentials set.
    try {
      const { aiStatus, announceAi } = await import('../services/aiAnnouncement.service.js');
      if (aiStatus().enabled) {
        const ai = await announceAi({ triggeredBy: 'auto-ai' });
        if (!ai.upToDate) console.log(`[feature-announce] AI mailed release note for ${ai.headSha}`);
      }
    } catch (err) {
      console.error('[feature-announce] AI pass failed:', err.message);
    }
  }, { runImmediately: true });
}
