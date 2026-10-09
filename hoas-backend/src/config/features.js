/**
 * Feature registry for automatic "What's new" mails.
 *
 * HOW IT WORKS
 * 1. When you ship a feature, add ONE entry below (unique `id`).
 * 2. The detector (`featureAnnouncement.service.js`) diffs this list
 *    against the `featureannouncements` collection in MongoDB.
 * 3. Every entry with no announcement record is mailed ONCE, then recorded —
 *    redeploys and restarts never resend it.
 *
 * AUDIENCE (who gets the mail)
 * - 'owners'   : normal/internal features -> company owners only
 *                (roles `owner` + `admin`). Use this for admin tools,
 *                dashboards, logs, theme work, OTP flows, etc.
 * - 'everyone' : major user-facing launches -> every approved, active user
 *                (students, wardens, management + owners). Use sparingly.
 */
export const FEATURES = [
  // ADD NEW FEATURES HERE — one entry per launch. Example:
  // {
  //   id: 'owner-terminal-drawer',
  //   title: 'Owner terminal drawer (bottom console)',
  //   summary: 'A VS Code-style terminal slides up from the website bottom.',
  //   details: ['Open it from the sidebar, header, or Ctrl+`', 'Commands: logs, grep, audit, watch, export'],
  //   audience: 'owners', // 'owners' = normal features -> owners only | 'everyone' = major launch -> all users
  //   version: '2.1.0',
  // },
];

export const AUDIENCES = new Set(['owners', 'everyone']);

export function isValidAudience(a) {
  return AUDIENCES.has(String(a || ''));
}
