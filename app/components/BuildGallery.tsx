'use client';

import { useState, useRef, useCallback } from 'react';

export default function BuildGallery({
  images,
  title,
  soldOut,
}: {
  images: string[];
  title: string;
  soldOut: boolean;
}) {
  const [activeIdx, setActiveIdx] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);

  const scrollTo = useCallback((idx: number) => {
    if (!trackRef.current) return;
    trackRef.current.scrollTo({ left: idx * trackRef.current.offsetWidth, behavior: 'smooth' });
    setActiveIdx(idx);
  }, []);

  const handleScroll = useCallback(() => {
    if (!trackRef.current) return;
    const { scrollLeft, offsetWidth } = trackRef.current;
    setActiveIdx(Math.round(scrollLeft / offsetWidth));
  }, []);

  return (
    <div className="build-gallery">
      {/* Wrapper keeps the sold-out badge visually fixed over the track */}
      <div className="build-slider-wrap">
        <div
          className={`build-slider-track${soldOut ? ' is-sold-out' : ''}`}
          ref={trackRef}
          onScroll={handleScroll}
        >
          {images.map((src, i) => (
            <div key={i} className="build-slide">
              <img src={src} alt={`${title} — view ${i + 1}`} />
            </div>
          ))}
        </div>
        {soldOut && <span className="build-sold-out-badge">Sold Out</span>}
      </div>

      {/* Dots — mobile only */}
      {images.length > 1 && (
        <div className="build-dots" aria-hidden="true">
          {images.map((_, i) => (
            <button
              key={i}
              className={`build-dot${i === activeIdx ? ' is-active' : ''}`}
              onClick={() => scrollTo(i)}
            />
          ))}
        </div>
      )}

      {/* Thumbnails — desktop only */}
      {images.length > 1 && (
        <div className="build-thumbs">
          {images.map((src, i) => (
            <div
              key={i}
              role="button"
              tabIndex={0}
              className={`build-thumb${i === activeIdx ? ' is-active' : ''}`}
              onClick={() => scrollTo(i)}
              onKeyDown={(e) => e.key === 'Enter' && scrollTo(i)}
            >
              <img src={src} alt={`${title} view ${i + 1}`} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
