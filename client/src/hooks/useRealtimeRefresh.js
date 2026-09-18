import { useEffect, useRef } from 'react';
import useSocket from './useSocket';

/**
 * useRealtimeRefresh — replaces fixed-interval polling with event-driven refresh.
 *
 * - Calls `refetch()` instantly when any of `events` fires (socket CustomEvents
 *   like 'hoas:complaint-updated', dispatched globally by useSocket).
 * - Re-fetches on socket reconnect (missed events while offline).
 * - Re-fetches when the tab becomes visible again (missed events while hidden).
 * - Keeps a long safety-net poll (`fallbackMs`, default 5 min) instead of 30s.
 *
 * At scale this removes ~90% of list-fetch traffic: pages update on push,
 * not on a timer.
 */
export default function useRealtimeRefresh({
  events = [],
  refetch,
  fallbackMs = 5 * 60 * 1000,
  enabled = true,
}) {
  const { connected } = useSocket();
  const refetchRef = useRef(refetch);
  refetchRef.current = refetch;
  const eventsKey = events.join('|');

  // 1. Socket events -> instant refresh
  useEffect(() => {
    if (!enabled || events.length === 0) return;
    const handler = () => refetchRef.current?.();
    const list = eventsKey.split('|').filter(Boolean);
    list.forEach((ev) => window.addEventListener(ev, handler));
    return () => list.forEach((ev) => window.removeEventListener(ev, handler));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, eventsKey]);

  // 2. Reconnect -> catch up on anything missed while offline
  const wasConnected = useRef(connected);
  useEffect(() => {
    if (!enabled) return;
    if (connected && !wasConnected.current) refetchRef.current?.();
    wasConnected.current = connected;
  }, [connected, enabled]);

  // 3. Tab visible again -> catch up (covers sleep / background throttling)
  useEffect(() => {
    if (!enabled) return;
    const onVisible = () => {
      if (document.visibilityState === 'visible') refetchRef.current?.();
    };
    const onFocus = () => refetchRef.current?.();
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onFocus);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onFocus);
    };
  }, [enabled]);

  // 4. Long safety-net poll (fallback only)
  useEffect(() => {
    if (!enabled || !fallbackMs) return;
    const id = setInterval(() => refetchRef.current?.(), fallbackMs);
    return () => clearInterval(id);
  }, [enabled, fallbackMs]);
}
