'use client';

import Link from 'next/link';
import { useDropCountdown } from './useDropCountdown';

/** Teaser card for the next mod: artwork and a countdown to the drop. */
export function UpcomingDropCard() {
  const left = useDropCountdown();

  return (
    <div className="catalog-card">
      <Link href="/gta-vi" className="catalog-card-image-link" aria-label="Next drop: GTA VI release day">
      <div className="catalog-card-image upcoming-drop">
        <span className="catalog-card-badge">
          <span className="catalog-card-badge-dot" aria-hidden />
          {left.done ? 'Out now' : 'Coming · Thu 19 Nov'}
        </span>
        <img className="upcoming-drop-art" src="/lineups/gta6-teaser.webp" alt="" />
        <div className="upcoming-drop-countdown" role="timer" aria-live="off">
          {left.parts.map((p) => (
            <div key={p.label} className="upcoming-drop-unit">
              <span className="upcoming-drop-value">{p.value}</span>
              <span className="upcoming-drop-label">{p.label}</span>
            </div>
          ))}
        </div>
      </div>
      </Link>
      <div className="catalog-card-meta">
        <div>
          <p className="catalog-card-name">Next drop</p>
          <span className="catalog-card-tag">GTA VI release day</span>
        </div>
        <p className="catalog-card-reveal">19.11</p>
      </div>
    </div>
  );
}
