import { schedule } from './runner.js';
import { env } from '../config/env.js';

export async function keepRenderAwake() {
  try {
    const pingUrl = env.renderUrl || 'https://hoas.onrender.com';
    const timeout = 10000;

    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), timeout);

    const response = await fetch(pingUrl, {
      method: 'GET',
      signal: abortController.signal,
    });

    clearTimeout(timeoutId);
    return { status: response.status };
  } catch (error) {
    return { error: error.message };
  }
}

export function startRenderKeeperScheduler() {
  schedule(5 * 60 * 1000, async () => {
    await keepRenderAwake();
  });
}

export function stopRenderKeeperScheduler() {}