import { spawn } from 'node:child_process';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const processes = [];

const start = (name, cwd) => {
  const child = spawn(npmCommand, ['run', 'dev'], {
    cwd,
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: { ...process.env, FORCE_COLOR: '1' },
  });

  child.on('error', (error) => console.error(`[${name}] failed to start:`, error.message));
  child.on('exit', (code, signal) => {
    if (code !== 0 && signal !== 'SIGTERM') {
      console.error(`[${name}] stopped with code ${code ?? signal}`);
    }
  });
  processes.push(child);
  return child;
};

const waitForBackend = async (child) => {
  for (let attempt = 1; attempt <= 60; attempt += 1) {
    if (child.exitCode !== null) {
      throw new Error('Backend stopped before becoming ready.');
    }

    try {
      const response = await fetch('http://localhost:4000/api/health');
      if (response.ok) return;
    } catch {
      // The backend may still be connecting to MongoDB.
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error('Backend did not become ready within 60 seconds.');
};

const stop = () => {
  for (const child of processes) {
    if (!child.killed) child.kill('SIGTERM');
  }
};

process.on('SIGINT', stop);
process.on('SIGTERM', stop);
process.on('exit', stop);

try {
  console.log('[BACKEND] Starting backend...');
  const backend = start('BACKEND', resolve(root, 'hoas-backend'));
  await waitForBackend(backend);
  console.log('[BACKEND] Ready. Starting frontend...');
  start('CLIENT', resolve(root, 'client'));
} catch (error) {
  console.error('Development startup failed:', error.message);
  stop();
  process.exitCode = 1;
}
