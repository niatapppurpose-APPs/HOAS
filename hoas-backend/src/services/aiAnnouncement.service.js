import { execFile } from 'child_process';
import { promisify } from 'util';
import FeatureAnnouncement from '../models/FeatureAnnouncement.js';
import { announceOne } from './featureAnnouncement.service.js';
import { env } from '../config/env.js';

/**
 * AI "What's new" announcements.
 *
 * Flow: newly deployed code -> git diff collected -> AI writes the release
 * note (title, user-facing summary, bullets) + classifies the audience
 * ('owners' for normal features, 'everyone' for major launches) -> the
 * existing mailer sends it -> recorded in `featureannouncements` with id
 * `ai-<commit>` so it is never sent twice.
 *
 * Works with ANY OpenAI-compatible chat API (OpenAI, Gemini, Groq,
 * OpenRouter, local Ollama...) via three env vars:
 *   AI_API_BASE_URL=https://api.openai.com/v1
 *   AI_API_KEY=sk-...
 *   AI_MODEL=gpt-4o-mini
 * Master switch: AI_ANNOUNCE_ENABLED=true
 */

const execGit = promisify(execFile);
const AI_TIMEOUT_MS = 60000;

function aiConfig() {
  let baseUrl = (env.ai?.baseUrl || '').replace(/\/+$/, '');
  // Safety net: a bare "googleapis.com" host is not an API endpoint —
  // point it at Gemini's OpenAI-compatible root automatically.
  if (/^https?:\/\/googleapis\.com\/?$/.test(baseUrl)) {
    baseUrl = 'https://generativelanguage.googleapis.com/v1beta/openai';
  }
  return {
    enabled: env.ai?.announceEnabled === true,
    baseUrl,
    key: env.ai?.key || '',
    model: env.ai?.model || 'gpt-4o-mini',
  };
}

export function aiStatus() {
  const c = aiConfig();
  return { enabled: c.enabled, configured: Boolean(c.baseUrl && c.key && c.model), model: c.model };
}

async function git(...args) {
  try {
    const { stdout } = await execGit('git', args, { cwd: process.cwd(), timeout: 15000, maxBuffer: 1024 * 1024 });
    return stdout.trim();
  } catch (err) {
    err.isGitFailure = true;
    throw err;
  }
}

/** Last commit SHA already announced by the AI path (null = never). */
export async function lastAiSha() {
  const rec = await FeatureAnnouncement.findOne({ featureId: /^ai-/ }).sort({ announcedAt: -1 }).lean();
  const m = rec?.featureId?.match(/^ai-([0-9a-f]+)/);
  return m ? m[1] : null;
}

/**
 * Collect what changed: commits + file stats since the last AI-announced
 * commit (or the last 5 commits on first run). Throws a friendly error when
 * git is unavailable (e.g. slim production images).
 */
export async function collectCodeChanges() {
  let base = null;
  try {
    base = await lastAiSha();
  } catch { base = null; }
  let range, commitsRaw, statRaw, headSha;
  try {
    headSha = await git('rev-parse', 'HEAD');
    if (base) {
      if (base === headSha) return { headSha, commits: [], diffStat: '', upToDate: true };
      range = `${base}..HEAD`;
    } else {
      range = 'HEAD~5..HEAD';
    }
    commitsRaw = await git('log', range, '--format=%H|%s|%an|%ad');
    statRaw = await git('diff', '--stat=200,120', range);
  } catch (err) {
    if (err?.isGitFailure) {
      const e = new Error('Git history is not available here — deploy from a full git checkout, or use the manual feature registry.');
      e.statusCode = 503;
      e.code = 'GIT_UNAVAILABLE';
      throw e;
    }
    throw err;
  }
  const commits = commitsRaw.split('\n').filter(Boolean).map((line) => {
    const [sha, subject, author, date] = line.split('|');
    return { sha: (sha || '').slice(0, 12), subject: subject || '', author: author || '', date: date || '' };
  });
  return { headSha, base, commits, diffStat: statRaw.slice(0, 6000), upToDate: commits.length === 0 };
}

const SYSTEM_PROMPT = `You write "What's new" emails for HOAS, a hostel management platform (roles: owner, admin, management, warden, student).
Given git commits + file stats for newly deployed code, produce ONE release note as strict JSON:
{"title":"short catchy feature name","summary":"1-2 plain sentences, user-facing, no jargon","details":["3-5 short bullets of what users can now do"],"audience":"owners|everyone"}
Rules: audience "everyone" ONLY for major user-facing launches (students/wardens gain something big); everything admin/internal/owner-dashboard/theme/email/OTP/logs is "owners". Ignore chore/refactor/test-only noise; if there is no user-visible change, set title to "Maintenance update" and details to what was stabilized. Output JSON only, no markdown fences.`;

function extractJson(text = '') {
  const clean = String(text).replace(/```json|```/g, '').trim();
  const start = clean.indexOf('{');
  const end = clean.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('AI did not return JSON');
  return JSON.parse(clean.slice(start, end + 1));
}

/** Ask the AI to turn code changes into a release note. */
export async function generateAnnouncement({ commits, diffStat }) {
  const { baseUrl, key, model } = aiConfig();
  if (!baseUrl || !key) {
    const err = new Error('AI announce is not configured — set AI_API_BASE_URL, AI_API_KEY (and AI_ANNOUNCE_ENABLED=true).');
    err.statusCode = 400;
    err.code = 'AI_NOT_CONFIGURED';
    throw err;
  }
  const userPrompt = `Commits:\n${commits.map((c) => `- ${c.sha} ${c.subject} (${c.author})`).join('\n') || '(none)'}\n\nChanged files:\n${diffStat || '(unavailable)'}`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), AI_TIMEOUT_MS);
  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      signal: ctrl.signal,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model,
        temperature: 0.3,
        max_tokens: 600,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
      }),
    });
    if (!res.ok) {
      const err = new Error(`AI provider error (${res.status})`);
      err.statusCode = 502;
      err.code = 'AI_PROVIDER_ERROR';
      throw err;
    }
    const json = await res.json().catch(() => null);
    const text = json?.choices?.[0]?.message?.content || '';
    const parsed = extractJson(text);
    if (!parsed.title || !parsed.summary) throw new Error('AI returned an incomplete release note');
    return {
      title: String(parsed.title).slice(0, 120),
      summary: String(parsed.summary).slice(0, 500),
      details: Array.isArray(parsed.details) ? parsed.details.map(String).slice(0, 6) : [],
      audience: parsed.audience === 'everyone' ? 'everyone' : 'owners',
    };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Full AI pipeline: collect changes -> AI writes note -> mail it -> record.
 * Safe to re-run: an already-announced HEAD short-circuits with upToDate.
 */
export async function announceAi({ triggeredBy = 'auto-ai' } = {}) {
  const changes = await collectCodeChanges();
  if (changes.upToDate || !changes.commits.length) {
    return { ok: true, upToDate: true, headSha: changes.headSha, announced: [] };
  }
  const note = await generateAnnouncement(changes);
  const feature = {
    id: `ai-${changes.headSha.slice(0, 12)}`,
    title: note.title,
    summary: note.summary,
    details: note.details,
    audience: note.audience,
    version: '',
  };
  const result = await announceOne(feature, triggeredBy);
  return { ok: true, upToDate: false, headSha: changes.headSha, commits: changes.commits.length, announced: [result] };
}
