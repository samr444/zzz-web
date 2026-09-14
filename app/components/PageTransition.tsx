'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import gsap from 'gsap';

const ROWS = 6;

export function PageTransition() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const isFirst = useRef(true);

  useEffect(() => {
    const rows = wrapRef.current?.querySelectorAll<HTMLElement>('.pt-row');
    if (!rows?.length) return;

    const tl = gsap.timeline({ defaults: { ease: 'expo.inOut' } });

    if (isFirst.current) {
      isFirst.current = false;
      // First load — strips already cover, retract left/right alternating
      tl.set(rows, (i: number) => ({ xPercent: 0 }))
        .to(rows, {
          xPercent: (i: number) => (i % 2 === 0 ? -105 : 105),
          duration: 0.75,
          stagger: { each: 0.055, from: 'center' },
        });
    } else {
      // Route change — sweep in from alternating sides, hold, then exit same way
      tl.set(rows, (i: number) => ({ xPercent: i % 2 === 0 ? 105 : -105 }))
        .to(rows, {
          xPercent: 0,
          duration: 0.5,
          stagger: { each: 0.05, from: 'edges' },
        })
        .to(rows, {
          xPercent: (i: number) => (i % 2 === 0 ? -105 : 105),
          duration: 0.5,
          stagger: { each: 0.05, from: 'center' },
          delay: 0.08,
        });
    }
  }, [pathname]);

  return (
    <div
      ref={wrapRef}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        pointerEvents: 'none',
        display: 'flex',
        flexDirection: 'column',
      }}
      aria-hidden
    >
      {Array.from({ length: ROWS }).map((_, i) => (
        <div
          key={i}
          className="pt-row"
          style={{
            flex: 1,
            width: '100%',
            background: '#ffffff',
            willChange: 'transform',
            // thin ink border on the leading edge (bottom of each strip)
            boxShadow: '0 2px 0 0 #1a1a1a',
            transform: `translateX(${i % 2 === 0 ? '105%' : '-105%'})`,
          }}
        />
      ))}
    </div>
  );
}
