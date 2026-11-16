'use client';

import { useEffect, useState } from 'react';

/** Midnight IST on release day. */
export const DROP_AT = new Date('2026-11-19T00:00:00+05:30').getTime();

const LABELS = ['Days', 'Hrs', 'Min', 'Sec'] as const;

function split(now: number) {
  const ms = Math.max(0, DROP_AT - now);
  const s = Math.floor(ms / 1000);
  const values = [Math.floor(s / 86400), Math.floor((s % 86400) / 3600), Math.floor((s % 3600) / 60), s % 60];
  return { done: ms === 0, parts: LABELS.map((label, i) => ({ label, value: String(values[i]).padStart(2, '0') })) };
}

/**
 * Ticking countdown to the drop. Shows "--" until mounted so the server
 * render and the first client render match.
 */
export function useDropCountdown() {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  if (now === null) return { done: false, parts: LABELS.map((label) => ({ label, value: '--' })) };
  return split(now);
}
