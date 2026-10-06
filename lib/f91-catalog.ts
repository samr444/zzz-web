/**
 * Catalog for the ZZZ Culture Casio F-91W builder.
 *
 * All coordinates are registered against the 1280 × 1531 photograph at
 * /public/images/f91/f91_watch.jpg.
 */

export {
  FILTERS,
  DECALS,
  DECAL_FINISHES,
  TRANSPARENT_DECAL_OPACITY,
  byId,
  decalById,
  normalizeCircleDecal,
  circleDecalName,
  filterBackground,
  money,
  type DecalFinish,
  type Filter,
  type Decal,
} from './catalog';

import {
  FILTERS,
  DECALS,
  DECAL_FINISHES,
  byId,
  decalById,
  normalizeCircleDecal,
  circleDecalName,
  money,
  type DecalFinish,
} from './catalog';

/* ------------------------------------------------------------------ */
/* Photograph geometry                                                  */
/* ------------------------------------------------------------------ */

export const F91_PHOTO_WIDTH = 1280;
export const F91_PHOTO_HEIGHT = 1531;

/* Horizontal crop of the photograph — the watch content spans cols 153–1141. */
export const F91_VIEWPORT_X = 153;
export const F91_VIEWPORT_WIDTH = 988;

/**
 * The LCD display window.
 * Real-life size: 2 cm wide × 1 cm tall.
 * bounds: [x, y, width, height] in photograph pixels.
 */
export const F91_DISPLAY = {
  id: 'display',
  name: 'Display',
  description: 'Main LCD display',
  // Bounds measured from pixel transitions in f91_watch.jpg (1280×1531).
  // LCD glass: x 389–901, y 644–906. Top at 644 clears the ALARM CHRONOGRAPH strip.
  path:
    'M 401 644 L 889 644 Q 901 644 901 656 ' +
    'L 901 894 Q 901 906 889 906 ' +
    'L 401 906 Q 389 906 389 894 ' +
    'L 389 656 Q 389 644 401 644 Z',
  bounds: [389, 644, 512, 262] as [number, number, number, number],
} as const;

/* ------------------------------------------------------------------ */
/* Pricing                                                              */
/* ------------------------------------------------------------------ */

export const F91_BASE_PRICE = 1295;
export const F91_DISPLAY_FILTER_PRICE = 500;
export const F91_DECAL_PRICE = 500;

/* ------------------------------------------------------------------ */
/* Build                                                                */
/* ------------------------------------------------------------------ */

export interface F91Build {
  displayFilter: string;
  decal: { id: string; finish: DecalFinish } | null;
  customDecalUrl?: string | null;
}

export const F91_DEFAULT_BUILD: F91Build = {
  displayFilter: 'none',
  decal: null,
  customDecalUrl: null,
};

export function normalizeF91Build(input: Partial<F91Build> = {}): F91Build {
  const rawDecal = normalizeCircleDecal(input.decal as Parameters<typeof normalizeCircleDecal>[0]);
  const decal =
    rawDecal?.id === 'custom' && !input.customDecalUrl ? null : rawDecal;
  const filter = decal
    ? 'none'
    : (byId(FILTERS, input.displayFilter)?.id ?? 'none');
  return {
    displayFilter: filter,
    decal: decal ?? null,
    customDecalUrl: decal?.id === 'custom' ? (input.customDecalUrl ?? null) : null,
  };
}

/* ------------------------------------------------------------------ */
/* Pricing                                                              */
/* ------------------------------------------------------------------ */

export interface F91Pricing {
  currency: 'INR';
  base: number;
  baseName: string;
  upgrades: { id: string; name: string; price: number }[];
  total: number;
}

export function priceF91Build(input: Partial<F91Build>): F91Pricing {
  const build = normalizeF91Build(input);
  const upgrades: { id: string; name: string; price: number }[] = [];

  if (byId(FILTERS, build.displayFilter)?.colors) {
    upgrades.push({
      id: 'display-filter',
      name: 'Display colour',
      price: F91_DISPLAY_FILTER_PRICE,
    });
  }

  if (build.decal) {
    upgrades.push({
      id: 'decal',
      name: 'Display decal · ' + circleDecalName(build.decal as Parameters<typeof circleDecalName>[0]),
      price: F91_DECAL_PRICE,
    });
  }

  return {
    currency: 'INR',
    base: F91_BASE_PRICE,
    baseName: 'Casio F-91W-1',
    upgrades,
    total: F91_BASE_PRICE + upgrades.reduce((s, u) => s + u.price, 0),
  };
}

/* ------------------------------------------------------------------ */
/* Build summary for WhatsApp order                                    */
/* ------------------------------------------------------------------ */

export function f91BuildProperties(input: Partial<F91Build>): Record<string, string> {
  const b = normalizeF91Build(input);
  const filter = byId(FILTERS, b.displayFilter);
  return {
    Model: 'F-91W-1 · Black',
    Display: b.decal
      ? 'Decal · ' + circleDecalName(b.decal as Parameters<typeof circleDecalName>[0])
      : filter?.colors
        ? filter.name
        : 'None',
  };
}
