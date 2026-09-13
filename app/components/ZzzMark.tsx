/**
 * The ZZZ Culture mark, drawn rather than loaded: three Zs stepping up to the
 * right, each blue with a cream keyline inside a black outline, the way the
 * embroidered patch is built up. Paths, so it never waits on a font or a CDN.
 */

/** A single blocky Z on a 0–100 grid; the group's skew supplies the italic. */
const Z = 'M0,0 H100 V26 L36,74 H100 V100 H0 V74 L64,26 H0 Z';

/** Smallest at the bottom left, largest at the top right, as on the patch. */
const LETTERS = [
  { x: 0, y: 88, scale: 0.68 },
  { x: 56, y: 44, scale: 0.84 },
  { x: 126, y: 0, scale: 1 },
];

/** Outline, keyline, fill — each layer strokes inside the one before it. */
const LAYERS = [
  { color: '#121212', width: 21 },
  { color: '#f1ebdc', width: 11 },
  { color: '#1b3ec4', width: 2 },
];

export default function ZzzMark({
  className,
  title,
}: {
  className?: string;
  title?: string;
}) {
  return (
    <svg
      className={className}
      viewBox="-46 -14 292 216"
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <g transform="skewX(-12)">
        {LETTERS.map((letter) => (
          <g key={letter.x} transform={`translate(${letter.x} ${letter.y}) scale(${letter.scale})`}>
            {LAYERS.map((layer) => (
              <path
                key={layer.color}
                d={Z}
                fill={layer.color}
                stroke={layer.color}
                strokeWidth={layer.width}
                strokeLinejoin="round"
              />
            ))}
          </g>
        ))}
      </g>
    </svg>
  );
}
