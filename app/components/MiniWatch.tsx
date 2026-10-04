'use client';

import { useId } from 'react';
import {
  DECAL_CENTER,
  DECAL_SIZE,
  FILTERS,
  WINDOWS,
  byId,
  decalById,
  gradientWindowBounds,
  type Build,
} from '@/lib/catalog';
import { decalImage } from '@/lib/assets';

/**
 * The selector diagram shares the exact aperture paths of the full-size
 * renderer, so a window's shape in the picker always matches the watch.
 */
export default function MiniWatch({
  build,
  window: windowIndex,
  activeWindow,
}: {
  build: Build;
  /** Which aperture this diagram highlights. */
  window: number;
  activeWindow: number;
}) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const decal = decalById(build.circleDecal?.id);

  return (
    <svg viewBox="235 385 550 550" aria-hidden="true">
      <defs>
        {WINDOWS.map((_, index) => {
          const filter = byId(FILTERS, build.windows[index]);
          if (!filter?.colors || filter.colors.length < 2) return null;
          const [, top, , height] = gradientWindowBounds(build, index);
          return (
            <linearGradient
              key={index}
              id={`${uid}-${index}`}
              gradientUnits="userSpaceOnUse"
              x1="0"
              y1={top}
              x2="0"
              y2={top + height}
            >
              {filter.colors.map((color, stop) => (
                <stop
                  key={stop}
                  offset={`${(stop / (filter.colors!.length - 1)) * 100}%`}
                  stopColor={color}
                />
              ))}
            </linearGradient>
          );
        })}
        <clipPath id={`${uid}-aperture`}>
          <path d={WINDOWS[0].path} />
        </clipPath>
        {WINDOWS.slice(1).map((window, idx) => (
          <clipPath key={idx} id={`${uid}-winclip-${idx + 1}`}>
            <path d={window.path} />
          </clipPath>
        ))}
      </defs>

      <path
        d="M310 401 H717 L771 456 V839 L720 911 H310 L252 839 V460Z"
        fill="#faf9fc"
        stroke={windowIndex === activeWindow ? 'var(--selection)' : '#cfccd6'}
        strokeWidth="13"
      />
      <path d="M312 437 H716 L739 464 V847 L712 880 H314 L288 846 V467Z" fill="#efecf3" />

      {WINDOWS.map((window, index) => {
        const filter = byId(FILTERS, build.windows[index]);
        const fill = filter?.colors
          ? filter.colors.length === 1
            ? filter.colors[0]
            : `url(#${uid}-${index})`
          : index === windowIndex
            ? '#25212c'
            : '#c9c5d0';
        return (
          <path
            key={window.id}
            d={window.path}
            fill={fill}
            opacity={index === windowIndex ? 1 : 0.45}
          />
        );
      })}

      {(decal || (build.circleDecal?.id === 'custom' && build.customDecalUrl)) && (
        <image
          href={build.circleDecal?.id === 'custom' ? build.customDecalUrl! : decalImage(decal!.image, decal!.ext)}
          x={DECAL_CENTER.x - DECAL_SIZE / 2}
          y={DECAL_CENTER.y - DECAL_SIZE / 2}
          width={DECAL_SIZE}
          height={DECAL_SIZE}
          clipPath={`url(#${uid}-aperture)`}
          opacity={windowIndex === 0 ? 1 : 0.55}
        />
      )}

      {WINDOWS.slice(1).map((window, idx) => {
        const index = idx + 1;
        const imageUrl = build.windowImages?.[index];
        if (!imageUrl) return null;
        const [x, y, w, h] = window.bounds;
        return (
          <image
            key={window.id}
            href={imageUrl}
            x={x}
            y={y}
            width={w}
            height={h}
            preserveAspectRatio="xMidYMid slice"
            clipPath={`url(#${uid}-winclip-${index})`}
            opacity={index === windowIndex ? 1 : 0.55}
          />
        );
      })}
    </svg>
  );
}
