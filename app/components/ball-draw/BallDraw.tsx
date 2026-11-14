'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import Link from 'next/link';
import gsap from 'gsap';
import { createStorm, type Storm } from './storm';
import './ball-draw.css';

type Tier = 'silver' | 'gold' | 'black';

/* ── Tiers ──────────────────────────────────────────────────────────────
 * `fill` decides how often each ball scrolls past in the reel.           */

const TIERS: Record<Tier, { fill: number; color: string }> = {
  silver: { fill: 0.55, color: '#dfe7f2' },
  gold: { fill: 0.3, color: '#ffcf4a' },
  black: { fill: 0.15, color: '#a87bff' },
};

/** Every draw lands on this ball for now. */
const WINNING_TIER: Tier = 'black';

/* ── The player the black ball opens into ─────────────────────────────
 * Drop a cut-out photo at public/ball-draw/player.webp and it shows on the
 * card; until then a silhouette stands in.                               */
const PLAYER = {
  name: 'C. Ronaldo',
  club: 'Manchester United',
  position: 'RMF',
  rating: 94,
  photo: '/ball-draw/player.webp',
  /** Shown on the back of the flashcard. */
  back: { src: '/ball-draw/watch-cr7.webp', alt: 'CR7 edition watch' },
};

const TIER_KEYS = Object.keys(TIERS) as Tier[];

/* ── Reel layout ───────────────────────────────────────────────────── */
const REEL_LENGTH = 48;
const WIN_INDEX = 40;
const START_POS = 3;

const VISIBLE_RANGE = 7;

function pick(weight: (t: Tier) => number): Tier {
  let r = Math.random();
  for (const t of TIER_KEYS) {
    r -= weight(t);
    if (r <= 0) return t;
  }
  return 'silver';
}

function makeReel(winner: Tier): Tier[] {
  const reel = Array.from({ length: REEL_LENGTH }, () => pick((t) => TIERS[t].fill));
  reel[WIN_INDEX] = winner;
  return reel;
}

/** Deterministic first paint so server and client agree. */
const INITIAL_REEL: Tier[] = Array.from({ length: REEL_LENGTH }, (_, i) =>
  i % 7 === 3 ? 'gold' : i % 11 === 5 ? 'black' : 'silver',
);

type Phase = 'idle' | 'spinning' | 'reveal' | 'result';

interface BallDrawProps {
  /** The watch's normal details page, offered once the card is revealed. */
  detailsHref: string;
  onClose: () => void;
}

export default function BallDraw({ detailsHref, onClose }: BallDrawProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const reelRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const selectorRef = useRef<HTMLDivElement>(null);
  const haloRef = useRef<HTMLDivElement>(null);
  const raysRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const flashRef = useRef<HTMLDivElement>(null);
  const cloudsRef = useRef<HTMLCanvasElement>(null);
  const boltsRef = useRef<HTMLCanvasElement>(null);
  const storm = useRef<Storm | null>(null);
  const dimRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<HTMLDivElement>(null);
  const flipRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const lockRef = useRef<HTMLDivElement>(null);

  const metrics = useRef({ size: 0, step: 0 });
  const pos = useRef({ value: START_POS });
  const pendingWinner = useRef<Tier | null>(null);
  /** True once the reveal owns the balls, so a resize can't restyle them. */
  const revealed = useRef(false);

  const [reel, setReel] = useState<Tier[]>(INITIAL_REEL);
  const [drawId, setDrawId] = useState(0);
  const [phase, setPhase] = useState<Phase>('idle');
  const [winner, setWinner] = useState<Tier | null>(null);
  const [photoOk, setPhotoOk] = useState(false);
  const [flipped, setFlipped] = useState(false);

  /* Use the player photo only if one has been added. */
  useEffect(() => {
    const img = new Image();
    img.onload = () => setPhotoOk(true);
    img.src = PLAYER.photo;
  }, []);

  const measure = useCallback(() => {
    const track = trackRef.current;
    if (!track || track.children.length < 2) return;
    // Computed styles keep the fractional pixels that offsetWidth/offsetLeft
    // round away; a 0.4px error per ball is 16px by the time the reel stops.
    const size = parseFloat(getComputedStyle(track.children[0]).width);
    const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
    metrics.current = { size, step: size + gap };
  }, []);

  /* One frame: slide the track and lift the balls nearest the selector. */
  const render = useCallback(() => {
    const track = trackRef.current;
    const { size, step } = metrics.current;
    if (!track || !step || revealed.current) return;
    const p = pos.current.value;

    track.style.transform = `translate3d(${-(p * step + size / 2)}px, -50%, 0)`;

    const balls = track.children;
    const lo = Math.max(0, Math.floor(p - VISIBLE_RANGE));
    const hi = Math.min(balls.length - 1, Math.ceil(p + VISIBLE_RANGE));
    for (let i = lo; i <= hi; i++) {
      const d = Math.abs(i - p);
      const k = Math.max(0, 1 - d / 1.3);
      const scale = 1 + 0.2 * k * k * (3 - 2 * k);
      const alpha = 0.45 + 0.55 * Math.max(0, 1 - d / 3.5);
      const el = balls[i] as HTMLElement;
      el.style.transform = `scale(${scale})`;
      el.style.opacity = String(alpha);
    }
  }, []);

  /* Sizing. */
  useLayoutEffect(() => {
    measure();
    render();

    // Dev-only handle for debugging the timeline from the console.
    if (process.env.NODE_ENV !== 'production') {
      (window as unknown as { __ballDraw?: unknown }).__ballDraw = {
        gsap,
        storm: () => storm.current,
      };
    }

    const ro = new ResizeObserver(() => {
      measure();
      render();
    });
    if (reelRef.current) ro.observe(reelRef.current);
    return () => ro.disconnect();
  }, [measure, render]);

  /* Thunderstorm canvases. */
  useEffect(() => {
    if (cloudsRef.current && boltsRef.current) {
      storm.current = createStorm(cloudsRef.current, boltsRef.current);
    }
    return () => {
      storm.current?.destroy();
      storm.current = null;
    };
  }, []);

  /* Runs once the fresh reel for a draw has been committed to the DOM. */
  useLayoutEffect(() => {
    const winTier = pendingWinner.current;
    if (!winTier || !trackRef.current) return;
    pendingWinner.current = null;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const balls = Array.from(trackRef.current.children) as HTMLElement[];
    const win = balls[WIN_INDEX];
    const color = TIERS[winTier].color;
    rootRef.current?.style.setProperty('--tier', color);

    revealed.current = false;
    pos.current.value = START_POS;
    measure();
    render();

    const ctx = gsap.context(() => {
      gsap.set([haloRef.current, raysRef.current], { opacity: 0, scale: 0.3 });
      gsap.set(selectorRef.current, { opacity: 1, scale: 1 });
      gsap.set(lockRef.current, { opacity: 0, scale: 0.9 });
      gsap.set(cardRef.current, { opacity: 0 });
      gsap.set(flipRef.current, { rotationY: 0 });

      const ring = selectorRef.current?.firstElementChild ?? null;
      let lastTick = Math.round(START_POS);

      const tl = gsap.timeline();

      tl.fromTo(reelRef.current, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.45, ease: 'power2.out' });

      tl.to(pos.current, {
        value: WIN_INDEX,
        duration: reduced ? 2 : 5.8,
        ease: 'power3.out',
        onUpdate: () => {
          render();
          const tick = Math.round(pos.current.value);
          if (tick !== lastTick) {
            lastTick = tick;
            gsap.fromTo(ring, { scale: 1.06 }, { scale: 1, duration: 0.18, ease: 'power2.out', overwrite: true });
          }
        },
      });

      // Land exactly on the winner whatever the last frame rounded to.
      tl.add(() => {
        pos.current.value = WIN_INDEX;
        render();
      });
      tl.to({}, { duration: 0.25 });

      /* ── Lock-in: the chosen ball flares white, as in the reference. ── */
      tl.add(() => {
        revealed.current = true;
        setPhase('reveal');
      });
      tl.to(lockRef.current, { opacity: 0.85, scale: 1.05, duration: 0.22, ease: 'power2.out' });
      tl.to(lockRef.current, { opacity: 0, scale: 1.25, duration: 0.6, ease: 'power2.out' });

      const others = balls.filter((_, i) => i !== WIN_INDEX && Math.abs(i - WIN_INDEX) <= VISIBLE_RANGE);
      tl.to(others, {
        opacity: 0,
        scale: 0.6,
        duration: 0.45,
        ease: 'power2.in',
        stagger: { each: 0.04, from: 'center' },
      }, '<');
      tl.to(selectorRef.current, { scale: 1.6, opacity: 0, duration: 0.5, ease: 'power2.out' }, '<');

      /* ── Storm: clouds roll in along the top, the stadium darkens, and
       *    lightning walks down from the clouds onto the chosen ball. The
       *    last strikes set off the reveal. ── */
      const sky = storm.current;
      if (!reduced && sky) {
        const strike = () => {
          const box = wrapRef.current?.getBoundingClientRect();
          if (box) sky.strike(box.left + box.width / 2, box.top + box.height / 2);
        };
        const flicker = (peak: number, at: string) =>
          tl.fromTo(
            flashRef.current,
            { opacity: peak },
            { opacity: 0, duration: 0.28, ease: 'power2.out', immediateRender: false },
            at,
          );

        tl.addLabel('storm', '+=0.05');
        tl.to(sky.state, { alpha: 1, duration: 0.5, ease: 'power2.out' }, 'storm');
        tl.to(dimRef.current, { opacity: 0.6, duration: 0.4, ease: 'power2.out' }, 'storm');
        tl.add(strike, 'storm+=0.5');
        flicker(0.3, 'storm+=0.5');
        tl.add(strike, 'storm+=0.95');
        flicker(0.4, 'storm+=0.95');
        tl.to(win, { scale: 1.3, duration: 0.12, ease: 'power2.out', yoyo: true, repeat: 1 }, 'storm+=0.95');
        tl.add(strike, 'storm+=1.5');
        tl.add(strike, 'storm+=1.56');
        tl.to(dimRef.current, { opacity: 0, duration: 0.5, ease: 'power2.out' }, 'storm+=1.56');
        tl.to(sky.state, { alpha: 0, duration: 1.2, ease: 'power2.in' }, 'storm+=1.56');
        tl.to({}, { duration: 0.1 }, 'storm+=1.5');
      }

      tl.addLabel('burst', !reduced && sky ? 'storm+=1.6' : '-=0.1');
      tl.fromTo(
        flashRef.current,
        { opacity: winTier === 'silver' ? 0.45 : 0.8 },
        { opacity: 0, duration: 0.9, ease: 'power2.out', immediateRender: false },
        'burst',
      );
      tl.to(win, { scale: 1.75, duration: 0.9, ease: 'back.out(1.8)' }, 'burst');
      tl.to([haloRef.current, raysRef.current], { opacity: 1, scale: 1, duration: 0.9, ease: 'expo.out' }, 'burst');
      tl.add(() => burstSparks(wrapRef.current, color, winTier === 'black' ? 34 : 22), 'burst');

      if (winTier === 'black' && !reduced) {
        // Second strike of lightning and a short shake.
        tl.fromTo(
          flashRef.current,
          { opacity: 0.7 },
          { opacity: 0, duration: 0.5, ease: 'power3.out', immediateRender: false },
          'burst+=0.28',
        );
        tl.fromTo(
          rootRef.current,
          { x: -8 },
          { x: 0, duration: 0.5, ease: 'elastic.out(1.2, 0.2)', clearProps: 'x', immediateRender: false },
          'burst',
        );
      }

      /* ── The ball opens: it swells into a white flash and the player
       *    card comes out of it. ── */
      tl.addLabel('open', 'burst+=1.35');
      tl.to(win, { scale: 1.95, duration: 0.35, ease: 'power2.in' }, 'open');
      tl.to(lockRef.current, { opacity: 1, scale: 1.6, duration: 0.35, ease: 'power2.in' }, 'open');
      tl.fromTo(
        flashRef.current,
        { opacity: 0.9 },
        { opacity: 0, duration: 0.8, ease: 'power2.out', immediateRender: false },
        'open+=0.33',
      );
      tl.set(win, { opacity: 0 }, 'open+=0.35');
      tl.add(() => {
        setPhase('result');
        burstSparks(wrapRef.current, '#ffffff', 26);
      }, 'open+=0.35');
      tl.to(lockRef.current, { opacity: 0, scale: 2, duration: 0.7, ease: 'power2.out' }, 'open+=0.35');
      // The flashcard swings out of the flash, then its tile and text land.
      tl.fromTo(
        cardRef.current,
        { opacity: 0, scale: 0.3, rotationY: -80, transformPerspective: 1200 },
        { opacity: 1, scale: 1, rotationY: 0, duration: 1, ease: 'back.out(1.3)', immediateRender: false },
        'open+=0.35',
      );
      tl.fromTo(
        playerRef.current,
        { opacity: 0, scale: 0.6 },
        { opacity: 1, scale: 1, duration: 0.6, ease: 'back.out(2)', immediateRender: false },
        'open+=0.7',
      );
      tl.fromTo(
        textRef.current,
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out', immediateRender: false },
        'open+=0.9',
      );

      // Gentle float once the card is presented.
      tl.add(() => {
        gsap.to(cardRef.current, { y: -6, duration: 1.8, ease: 'sine.inOut', yoyo: true, repeat: -1 });
        gsap.to(raysRef.current, { rotation: '+=360', duration: 24, ease: 'none', repeat: -1 });
      });

      // The card turns over by itself to show the watch.
      tl.add(() => {
        setFlipped(true);
        gsap.to(flipRef.current, { rotationY: 180, duration: 0.9, ease: 'power3.inOut' });
      }, '+=1.3');
    }, rootRef);

    return () => ctx.revert();
  }, [drawId, measure, render]);

  const draw = useCallback(() => {
    const w = WINNING_TIER;
    const next = makeReel(w);
    pendingWinner.current = w;
    gsap.set(cardRef.current, { opacity: 0 });
    setFlipped(false);
    setWinner(w);
    setPhase('spinning');
    setReel(next);
    setDrawId((n) => n + 1);
  }, []);

  /* The draw starts as soon as the overlay opens. */
  useEffect(() => {
    draw();
  }, [draw]);

  /* Escape closes; the page behind stays put while the overlay is up. */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  const flip = () => {
    if (phase !== 'result') return;
    const next = !flipped;
    setFlipped(next);
    gsap.to(flipRef.current, { rotationY: next ? 180 : 0, duration: 0.8, ease: 'power3.inOut' });
  };

  return (
    <div
      ref={rootRef}
      className="bd"
      role="dialog"
      aria-modal="true"
      aria-label="Ball draw"
      data-phase={phase}
      data-tier={winner ?? undefined}
    >
      <div className="bd-bg" aria-hidden="true">
        <div className="bd-stadium" />
        <div className="bd-shade" />
        <div className="bd-smoke bd-smoke--b" />
        <div className="bd-smoke bd-smoke--a" />
        <div className="bd-smoke bd-smoke--c" />
      </div>
      <div ref={dimRef} className="bd-dim" aria-hidden="true" />
      <canvas ref={cloudsRef} className="bd-clouds" aria-hidden="true" />
      <canvas ref={boltsRef} className="bd-bolts" aria-hidden="true" />
      <div ref={flashRef} className="bd-flash" aria-hidden="true" />

      <header className="bd-head">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="bd-logo" src="/logo/logo_text_white.svg" alt="ZzzCulture" />
        <h1 className="bd-title">Ball Draw</h1>
        <button type="button" className="bd-close" onClick={onClose} aria-label="Close">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </header>

      <section className="bd-stage">
        <p className="bd-kicker">Where it stops is what you get</p>

        <div ref={wrapRef} className="bd-reel-wrap">
          <div ref={haloRef} className="bd-halo" aria-hidden="true" />
          <div ref={raysRef} className="bd-rays" aria-hidden="true" />

          <div ref={reelRef} className="bd-reel">
            <div ref={trackRef} className="bd-track">
              {reel.map((tier, i) => (
                <div key={`${drawId}-${i}`} className="bd-ball" data-tier={tier}>
                  <div className="bd-float">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`/ball-draw/${tier}.webp`} alt="" draggable={false} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div ref={lockRef} className="bd-lock" aria-hidden="true" />

          <div ref={selectorRef} className="bd-selector" aria-hidden="true">
            <div className="bd-selector-ring" />
          </div>

          {/* Flashcard: player on the front, the watch on the back. */}
          <div ref={cardRef} className="bd-flashcard" aria-hidden={phase !== 'result'} style={{ opacity: 0 }}>
            <div
              ref={flipRef}
              className="bd-flashcard-inner"
              role="button"
              tabIndex={phase === 'result' ? 0 : -1}
              aria-label={flipped ? 'Flip to the player' : 'Flip to see the watch'}
              aria-pressed={flipped}
              onClick={flip}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  flip();
                }
              }}
            >
              <div className="bd-face bd-face--front">
                <div className="bd-face-lights" />
                <div ref={playerRef} className="bd-player">
                  <div className="bd-player-stats">
                    <span className="bd-player-pos">{PLAYER.position}</span>
                    <span className="bd-player-rating">{PLAYER.rating}</span>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img className="bd-player-ball" src={`/ball-draw/${WINNING_TIER}.webp`} alt="" />
                  </div>
                  {photoOk ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img className="bd-player-photo" src={PLAYER.photo} alt={PLAYER.name} />
                  ) : (
                    <svg className="bd-player-photo bd-player-silhouette" viewBox="0 0 100 120" aria-hidden="true">
                      <circle cx="52" cy="38" r="21" />
                      <path d="M8 120c2-30 20-46 44-46s42 16 44 46z" />
                    </svg>
                  )}
                </div>
                <div ref={textRef} className="bd-card-text" aria-live="polite">
                  <h2 className="bd-card-title">{PLAYER.name}</h2>
                  <p className="bd-card-club">{PLAYER.club}</p>
                </div>
                <span className="bd-flip-hint">Tap to flip</span>
              </div>

              <div className="bd-face bd-face--back">
                <div className="bd-face-lights" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={PLAYER.back.src} alt={PLAYER.back.alt} draggable={false} />
                <span className="bd-flip-hint">Tap to flip back</span>
              </div>
            </div>
          </div>
        </div>

        {phase === 'result' ? (
          <Link href={detailsHref} className="bd-btn">
            View details
          </Link>
        ) : (
          <button type="button" className="bd-btn" disabled>
            Drawing…
          </button>
        )}
      </section>
    </div>
  );
}

/** Radial spray of light specks from the centre of the reel. */
function burstSparks(host: HTMLElement | null, color: string, count: number) {
  if (!host) return;
  for (let i = 0; i < count; i++) {
    const s = document.createElement('span');
    s.className = 'bd-spark';
    s.style.background = color;
    s.style.color = color;
    host.appendChild(s);
    const angle = (i / count) * Math.PI * 2 + Math.random() * 0.4;
    const dist = 120 + Math.random() * 180;
    gsap.fromTo(
      s,
      { x: 0, y: 0, scale: 1, opacity: 1 },
      {
        x: Math.cos(angle) * dist,
        y: Math.sin(angle) * dist,
        scale: 0.2,
        opacity: 0,
        duration: 0.9 + Math.random() * 0.6,
        ease: 'power3.out',
        onComplete: () => s.remove(),
      },
    );
  }
}
