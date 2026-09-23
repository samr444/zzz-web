'use client';

import { useId } from 'react';
import {
  BAND_PATH,
  DECAL_CENTER,
  DECAL_SIZE,
  FILTERS,
  PHOTO_HEIGHT,
  PHOTO_WIDTH,
  TEXT_REMOVALS,
  TRANSPARENT_DECAL_OPACITY,
  WINDOWS,
  byId,
  decalById,
  gradientWindowBounds,
  type Build,
} from '@/lib/catalog';
import { ASSETS, CASE_IMAGES, decalImage } from '@/lib/assets';

export function useCaseImage(caseId: string): string | null {
  return CASE_IMAGES[caseId] ?? CASE_IMAGES['resin-silver'];
}

const bandArtwork = (band: string) => {
  switch (band) {
    case 'leather-brown':
      return { src: ASSETS.bandLeather, darken: false };
    case 'leather-black':
      return { src: ASSETS.bandLeather, darken: true };
    case 'steel':
      return { src: ASSETS.bandSteel, darken: false };
    default:
      return null; // the case photograph already wears the stock rubber strap
  }
};

interface Props {
  build: Build;
  activeWindow?: number;
  onSelectWindow?: (index: number) => void;
  /** Decorative previews skip hotspots and the loading state. */
  interactive?: boolean;
  label?: string;
  className?: string;
}

export default function WatchPreview({
  build,
  activeWindow = 0,
  onSelectWindow,
  interactive = false,
  label,
  className,
}: Props) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const caseSrc = useCaseImage(build.case);
  const band = bandArtwork(build.band);
  const decal = decalById(build.circleDecal?.id);
  const removals = TEXT_REMOVALS.filter((option) => build.textRemovals.includes(option.id));

  return (
    <svg
      className={className}
      viewBox={`0 0 ${PHOTO_WIDTH} ${PHOTO_HEIGHT}`}
      role="img"
      aria-label={label}
      style={{ isolation: 'isolate' }}
    >
      <defs>
        <clipPath id={`${uid}-band`}>
          <path d={BAND_PATH} />
        </clipPath>
        <clipPath id={`${uid}-aperture`}>
          <path d={WINDOWS[0].path} />
        </clipPath>
        {/* Matches the renderer's gamma 2.15 luminance roll-off for black leather. */}
        <filter id={`${uid}-darken`} colorInterpolationFilters="sRGB">
          <feComponentTransfer>
            <feFuncR type="gamma" exponent="2.15" />
            <feFuncG type="gamma" exponent="2.15" amplitude="0.99" />
            <feFuncB type="gamma" exponent="2.15" amplitude="0.98" />
          </feComponentTransfer>
        </filter>
        {removals.length > 0 && (
          <mask id={`${uid}-removal`}>
            <rect x="0" y="0" width={PHOTO_WIDTH} height={PHOTO_HEIGHT} fill="#000" />
            {removals.map((option) => (
              <rect
                key={option.id}
                x={option.bounds[0]}
                y={option.bounds[1]}
                width={option.bounds[2]}
                height={option.bounds[3]}
                fill="#fff"
              />
            ))}
          </mask>
        )}
        {WINDOWS.map((_, index) => {
          const filter = byId(FILTERS, build.windows[index]);
          if (!filter?.colors || filter.colors.length < 2) return null;
          const [, top, , height] = gradientWindowBounds(build, index);
          return (
            <linearGradient
              key={index}
              id={`${uid}-grad-${index}`}
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
      </defs>

      {/* Case photograph — "slice" anchored to the top crops the baked-in caption. */}
      {caseSrc && (
        <image
          href={caseSrc}
          x="0"
          y="0"
          width={PHOTO_WIDTH}
          height={PHOTO_HEIGHT}
          preserveAspectRatio="xMidYMin slice"
        />
      )}

      {/* Strap artwork contributes strap pixels only. */}
      {band && (
        <g clipPath={`url(#${uid}-band)`}>
          <image
            href={band.src}
            x="0"
            y="0"
            width={PHOTO_WIDTH}
            height={PHOTO_HEIGHT}
            preserveAspectRatio="xMidYMin slice"
            filter={band.darken ? `url(#${uid}-darken)` : undefined}
          />
        </g>
      )}

      {/* Only the selected faceplate labels are revealed from the patch artwork. */}
      {removals.length > 0 && (
        <image
          href={ASSETS.textRemoval}
          x="0"
          y="0"
          width={PHOTO_WIDTH}
          height={PHOTO_HEIGHT}
          preserveAspectRatio="xMidYMin slice"
          mask={`url(#${uid}-removal)`}
        />
      )}

      {/* Filters tint the aperture and leave the dark LCD segments readable. */}
      <g style={{ mixBlendMode: 'multiply' }}>
        {WINDOWS.map((window, index) => {
          const filter = byId(FILTERS, build.windows[index]);
          if (!filter?.colors) return null;
          const fill =
            filter.colors.length === 1 ? filter.colors[0] : `url(#${uid}-grad-${index})`;
          return <path key={window.id} d={window.path} fill={fill} />;
        })}
      </g>

      {/* Circle decal: transparent film multiplies over the LCD, opaque covers it. */}
      {(decal || (build.circleDecal?.id === 'custom' && build.customDecalUrl)) && (
        <image
          href={build.circleDecal?.id === 'custom' ? build.customDecalUrl! : decalImage(decal!.image, decal!.ext)}
          x={DECAL_CENTER.x - DECAL_SIZE / 2}
          y={DECAL_CENTER.y - DECAL_SIZE / 2}
          width={DECAL_SIZE}
          height={DECAL_SIZE}
          clipPath={`url(#${uid}-aperture)`}
          opacity={build.circleDecal?.finish === 'transparent' ? TRANSPARENT_DECAL_OPACITY : 1}
          style={
            build.circleDecal?.finish === 'transparent'
              ? { mixBlendMode: 'multiply' }
              : undefined
          }
        />
      )}

      {interactive && onSelectWindow && (
        <g className="watch-hotspots">
          {WINDOWS.map((window, index) => (
            <path
              key={window.id}
              d={window.path}
              tabIndex={0}
              role="button"
              aria-label={`Select window ${index + 1}: ${window.name}`}
              aria-pressed={activeWindow === index}
              onClick={() => onSelectWindow(index)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  onSelectWindow(index);
                }
              }}
            />
          ))}
        </g>
      )}
    </svg>
  );
}
