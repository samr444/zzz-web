'use client';

import { useEffect, useState } from 'react';
import styles from './SiteLoader.module.css';
import { ZShine } from './ZShine';

/** One full shine sweep, so the logo never cuts off mid-pass. */
const MIN_SHOW_MS = 2150;
const FADE_MS = 600;

/**
 * Full-screen Z logo loader. Rendered on the server so it covers the page
 * from the first paint; fades out once the page has loaded and at least one
 * animation cycle has played. Lives in the root layout, so it only runs on
 * the initial load, not on client-side navigation.
 */
export function SiteLoader() {
  const [phase, setPhase] = useState<'show' | 'fade' | 'gone'>('show');

  useEffect(() => {
    const start = performance.now();
    let fadeTimer: number | undefined;
    let goneTimer: number | undefined;

    const finish = () => {
      const wait = Math.max(0, MIN_SHOW_MS - (performance.now() - start));
      fadeTimer = window.setTimeout(() => {
        setPhase('fade');
        goneTimer = window.setTimeout(() => setPhase('gone'), FADE_MS);
      }, wait);
    };

    if (document.readyState === 'complete') finish();
    else window.addEventListener('load', finish, { once: true });

    return () => {
      window.removeEventListener('load', finish);
      window.clearTimeout(fadeTimer);
      window.clearTimeout(goneTimer);
    };
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.style.overflow = phase === 'show' ? 'hidden' : '';
    return () => {
      root.style.overflow = '';
    };
  }, [phase]);

  if (phase === 'gone') return null;

  return (
    <div
      className={`${styles.container} ${phase === 'fade' ? styles.hidden : ''}`}
      role="status"
      aria-label="Loading"
    >
      <ZShine />
    </div>
  );
}
