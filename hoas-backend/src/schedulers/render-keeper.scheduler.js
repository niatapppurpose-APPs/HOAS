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
    console.log(`Render keeper: Ping ${pingUrl} - status: ${response.status}`);
    return { status: response.status };
  } catch (error) {
    console.log('Render keeper: Ping failed:', error.message);
    return { error: error.message };
  }
}

export function startRenderKeeperScheduler() {
  schedule(10 * 60 * 60 * 1000, async () => {
    const result = await keepRenderAwake();
    if (result.error) console.error('Render keeper failed:', result.error);
    else console.log('Render keeper: kept awake');
  });
}

export function stopRenderKeeperScheduler() {}