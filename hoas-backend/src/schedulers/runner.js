const timers = new Set();

export function schedule(intervalMs, fn, { runImmediately = true } = {}) {
  if (runImmediately) fn().catch((error) => console.error('Scheduled job failed:', error));
  const timer = setInterval(() => {
    fn().catch((error) => console.error('Scheduled job failed:', error));
  }, intervalMs);
  if (timer.unref) timer.unref();
  timers.add(timer);
  return timer;
}

export function stopAll() {
  for (const timer of timers) clearInterval(timer);
  timers.clear();
}