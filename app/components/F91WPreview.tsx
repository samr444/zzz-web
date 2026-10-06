'use client';

import { useId } from 'react';
import {
  F91_DISPLAY,
  F91_PHOTO_WIDTH,
  F91_PHOTO_HEIGHT,
  F91_VIEWPORT_X,
  F91_VIEWPORT_WIDTH,
  FILTERS,
  TRANSPARENT_DECAL_OPACITY,
  byId,
  decalById,
  type F91Build,
} from '@/lib/f91-catalog';
import { F91_WATCH_IMAGE, decalImage } from '@/lib/assets';

interface Props {
  build: F91Build;
  className?: string;
  label?: string;
}

export default function F91WPreview({ build, className, label }: Props) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const filter = byId(FILTERS, build.displayFilter);
  const decal = decalById(build.decal?.id);
  const hasCustomDecal = build.decal?.id === 'custom' && !!build.customDecalUrl;

  const [dx, dy, dw, dh] = F91_DISPLAY.bounds;

  return (
    <svg
      className={className}
      viewBox={`${F91_VIEWPORT_X} 0 ${F91_VIEWPORT_WIDTH} ${F91_PHOTO_HEIGHT}`}
      role="img"
      aria-label={label}
      style={{ isolation: 'isolate' }}
    >
      <defs>
        <clipPath id={`${uid}-display`}>
          <path d={F91_DISPLAY.path} />
        </clipPath>
        {filter?.colors && filter.colors.length > 1 && (
          <linearGradient
            id={`${uid}-grad`}
            gradientUnits="userSpaceOnUse"
            x1="0"
            y1={dy}
            x2="0"
            y2={dy + dh}
          >
            {filter.colors.map((color, i) => (
              <stop
                key={i}
                offset={`${(i / (filter.colors!.length - 1)) * 100}%`}
                stopColor={color}
              />
            ))}
          </linearGradient>
        )}
      </defs>

      {/* Base watch photograph */}
      <image
        href={F91_WATCH_IMAGE}
        x="0"
        y="0"
        width={F91_PHOTO_WIDTH}
        height={F91_PHOTO_HEIGHT}
        preserveAspectRatio="xMidYMin slice"
      />

      {/* Colour filter tints the LCD (multiply leaves the dark segments readable) */}
      {filter?.colors && (
        <g style={{ mixBlendMode: 'multiply' }}>
          <path
            d={F91_DISPLAY.path}
            fill={
              filter.colors.length === 1
                ? filter.colors[0]
                : `url(#${uid}-grad)`
            }
          />
        </g>
      )}

      {/* Decal — opaque covers, transparent multiplies */}
      {(decal || hasCustomDecal) && (
        <image
          href={
            hasCustomDecal
              ? build.customDecalUrl!
              : decalImage(decal!.image, decal!.ext)
          }
          x={dx}
          y={dy}
          width={dw}
          height={dh}
          clipPath={`url(#${uid}-display)`}
          preserveAspectRatio="xMidYMid slice"
          opacity={
            build.decal?.finish === 'transparent'
              ? TRANSPARENT_DECAL_OPACITY
              : 1
          }
          style={
            build.decal?.finish === 'transparent'
              ? { mixBlendMode: 'multiply' }
              : undefined
          }
        />
      )}
    </svg>
  );
}
