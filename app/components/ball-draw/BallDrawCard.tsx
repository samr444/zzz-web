'use client';

import { useCallback, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import dynamic from 'next/dynamic';

const BallDraw = dynamic(() => import('./BallDraw'), { ssr: false });

const PRELOAD = ['gold', 'black', 'silver', 'stadium', 'player', 'watch-cr7'].map((n) => `/ball-draw/${n}.webp`);

interface BallDrawCardProps {
  detailsHref: string;
  label: string;
  children: ReactNode;
}

/** A catalog image that plays the ball draw before offering the details page. */
export function BallDrawCard({ detailsHref, label, children }: BallDrawCardProps) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);

  /* Warm the code and artwork on first intent so the draw opens without a hitch. */
  const preload = useCallback(() => {
    void import('./BallDraw');
    for (const src of PRELOAD) new Image().src = src;
  }, []);

  return (
    <>
      <button type="button" className="catalog-card-image-link catalog-card-image-button" aria-label={label} onPointerEnter={preload} onTouchStart={preload} onFocus={preload} onClick={() => setOpen(true)}>
        {children}
      </button>
      {open && createPortal(<BallDraw detailsHref={detailsHref} onClose={close} />, document.body)}
    </>
  );
}
