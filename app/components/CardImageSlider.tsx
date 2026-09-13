'use client';

import { useEffect, useState } from 'react';

interface Props {
  images: string[];
  alt: string;
  soldOut?: boolean;
}

export function CardImageSlider({ images, alt, soldOut }: Props) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (images.length < 2) return;
    const id = setInterval(() => {
      setActive((i) => (i + 1) % images.length);
    }, 2500);
    return () => clearInterval(id);
  }, [images.length]);

  return (
    <div className="card-slider">
      {images.map((src, i) => (
        <img
          key={src}
          src={src}
          alt={alt}
          className={`card-slider-img${i === active ? ' card-slider-img--active' : ''}`}
          draggable={false}
        />
      ))}
      {soldOut && <span className="catalog-card-sold-out-badge">Sold Out</span>}
      {images.length > 1 && (
        <div className="card-slider-dots">
          {images.map((_, i) => (
            <button
              key={i}
              type="button"
              className={`card-slider-dot${i === active ? ' card-slider-dot--active' : ''}`}
              onClick={() => setActive(i)}
              aria-label={`Image ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
