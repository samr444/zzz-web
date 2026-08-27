/**
 * ZzzCulture — catalogue + pricing.
 *
 * Source of truth for names and prices is the donor dataset (formerly
 * newprice.ts, now folded in below as BASE_WATCHES).
 *
 *   BASE_WATCHES — donor watches you stock. displayName === dataset `name`.
 *   Mod pricing  — what each mod adds.
 *   LINEUP       — builds you sell. Stores no price; it's always derived.
 */

/* ------------------------------------------------------------------ */
/* 1. Donor watches                                                    */
/* ------------------------------------------------------------------ */

export type Finish = "black" | "silver" | "white" | "blue" | "orange";

export interface BaseWatch {
  /** Stable slug. Never change once a build references it. */
  id: string;
  /** Exactly the `name` from the dataset. This is what customers see. */
  displayName: string;
  /** Exactly the `tag` from the dataset. */
  tag: string;
  /** Exactly the `baseName` from the dataset. */
  baseName: string;
  basePrice: number;
  /** Structured form of `tag`, for filtering. */
  colorway: { frame: Finish; case: Finish; strap: Finish };
  inStock: boolean;
}

export const BASE_WATCHES: readonly BaseWatch[] = [
  {
    id: "ae1200whd-1av",
    displayName: "Casio AE-1200WHD 1AV",
    tag: "black frame, silver case, silver strap",
    baseName: "AE-1200",
    basePrice: 3995,
    colorway: { frame: "black", case: "silver", strap: "silver" },
    inStock: true,
  },
  {
    id: "ae1200wh-1av",
    displayName: "Casio AE-1200WH 1AV",
    tag: "black frame, black case, black strap",
    baseName: "AE-1200",
    basePrice: 2995,
    colorway: { frame: "black", case: "black", strap: "black" },
    inStock: true,
  },
  {
    id: "ae1200wh-1cvcf",
    displayName: "Casio AE-1200WH 1CVCF",
    tag: "black frame, silver case, black strap",
    baseName: "AE-1200",
    basePrice: 4500,
    colorway: { frame: "black", case: "silver", strap: "black" },
    inStock: true,
  },
  {
    id: "ae1200wh-1cvcf-orange",
    // NOTE: same `name` as ae1200wh-1cvcf above. Both cards will read
    // "Casio AE-1200WH 1CVCF". Rename one (the orange is usually 4AV) —
    // validateCatalog() below flags this so it isn't silently forgotten.
    displayName: "Casio AE-1200WH 1CVCF",
    tag: "black frame, silver case, orange strap",
    baseName: "AE-1200",
    basePrice: 4500,
    colorway: { frame: "black", case: "silver", strap: "orange" },
    inStock: true,
  },
  {
    id: "dw291h",
    displayName: "Casio DW-291H",
    tag: "black frame, black case, black strap",
    baseName: "DW-291H",
    basePrice: 3595,
    colorway: { frame: "black", case: "black", strap: "black" },
    inStock: true,
  },
  {
    id: "f91-blue",
    displayName: "Casio F91 Blue",
    tag: "blue frame, blue case, blue strap",
    baseName: "Casio F91",
    basePrice: 1695,
    colorway: { frame: "blue", case: "blue", strap: "blue" },
    inStock: true,
  },
  {
    id: "f91-white",
    displayName: "Casio F91 White",
    tag: "white frame, white case, white strap",
    baseName: "Casio F91",
    basePrice: 1695,
    colorway: { frame: "white", case: "white", strap: "white" },
    inStock: true,
  },
  {
    id: "f91-black",
    displayName: "Casio F91 Black",
    tag: "black frame, black case, black strap",
    baseName: "Casio F91",
    basePrice: 1295,
    colorway: { frame: "black", case: "black", strap: "black" },
    inStock: true,
  },
  {
    id: "a158wa-1",
    displayName: "Casio A158WA-1",
    tag: "black frame, black case, black strap",
    // Kept verbatim from your dataset. Note: this groups the A158 under the
    // F91 family, so any "more from this model" UI will mix the two.
    baseName: "Casio F91",
    basePrice: 1895,
    colorway: { frame: "black", case: "black", strap: "black" },
    inStock: true,
  },
];

/* ------------------------------------------------------------------ */
/* 2. Mod pricing                                                      */
/* ------------------------------------------------------------------ */

export type Mod =
  | { kind: "color-filter"; colorCount: 1 | 2 | 3 | 4; label: string }
  | {
      kind: "custom-print";
      imageCount: number;
      transparent: boolean;
      label: string;
    };

/** Colour filter price by number of colours. Edit the ladder here only. */
const COLOR_FILTER_TIERS: Record<number, number> = {
  1: 1000,
  2: 2000,
  3: 2000,
  4: 2000,
};

/**
 * Custom transparent photo print, priced by how many dials are printed.
 * Keys are image counts, values are the total for that count (not per-image).
 */
type PrintTiers = Readonly<Record<number, number>>;

/** Used when the donor has no entry in CUSTOM_PRINT_TIERS_BY_DONOR. */
const CUSTOM_PRINT_TIERS_DEFAULT: PrintTiers = {
  1: 2000,
  4: 3000, // all four dials, e.g. the AE-1200
};

/** Per-donor overrides. Keys are BaseWatch ids. */
const CUSTOM_PRINT_TIERS_BY_DONOR: Readonly<Record<string, PrintTiers>> = {
  // Single-display cases — only a 1-image print applies.
  "f91-blue": { 1: 1500 },
  "a158wa-1": { 1: 1500 },
};

export function customPrintPrice(donorId: string, imageCount = 1): number {
  const tiers = CUSTOM_PRINT_TIERS_BY_DONOR[donorId] ?? CUSTOM_PRINT_TIERS_DEFAULT;
  const counts = Object.keys(tiers)
    .map(Number)
    .sort((a, b) => a - b);

  if (counts.length === 0) return 0;

  // Step function: charge the highest defined tier at or below imageCount.
  // So with tiers {1, 4}, two and three dials both price at the 1-tier.
  // Add explicit 2 and 3 entries above once you've set those rates.
  let price = tiers[counts[0]];
  for (const c of counts) {
    if (imageCount >= c) price = tiers[c];
  }
  return price;
}

export function modPrice(mod: Mod, base: BaseWatch): number {
  switch (mod.kind) {
    case "color-filter":
      return COLOR_FILTER_TIERS[mod.colorCount] ?? 0;
    case "custom-print":
      return customPrintPrice(base.id, mod.imageCount);
  }
}

/* ------------------------------------------------------------------ */
/* 3. Lineup                                                           */
/* ------------------------------------------------------------------ */

export type BuildStatus = "available" | "sold-out" | "made-to-order";

export interface Build {
  slug: string;
  baseWatchId: BaseWatch["id"];
  mod: Mod;
  images: string[];
  status: BuildStatus;
  order: number;
}

// Image paths point at what's actually in public/lineups/normalized/ (the
// site's real cropped photos) rather than the /lineup/*.jpg placeholders —
// those files don't exist in this repo.
export const LINEUP: readonly Build[] = [
  {
    slug: "ae1200-3-color-black",
    baseWatchId: "ae1200wh-1cvcf", // silver case + black resin strap
    mod: { kind: "color-filter", colorCount: 3, label: "3-Color Black" },
    images: ["/lineups/normalized/ae1200_3color_black_strap.png"],
    status: "available",
    order: 1,
  },
  {
    slug: "ae1200-3-color-orange",
    baseWatchId: "ae1200wh-1cvcf-orange",
    mod: { kind: "color-filter", colorCount: 3, label: "3-Color" },
    images: ["/lineups/normalized/ae1200_3color.png"],
    status: "available",
    order: 2,
  },
  {
    slug: "f91-luffy-blue",
    baseWatchId: "f91-blue",
    mod: {
      kind: "custom-print",
      imageCount: 1,
      transparent: true,
      label: "Luffy Blue",
    },
    images: ["/lineups/normalized/blue_f91_luffy.png"],
    status: "sold-out",
    order: 3,
  },
  {
    slug: "a158-naruto",
    baseWatchId: "a158wa-1",
    mod: {
      kind: "custom-print",
      imageCount: 1,
      transparent: true,
      label: "Naruto",
    },
    images: ["/lineups/normalized/casio_a158_naruto.png"],
    status: "available",
    order: 4,
  },
  {
    slug: "a158-green-filter",
    baseWatchId: "a158wa-1",
    mod: { kind: "color-filter", colorCount: 1, label: "Green Filter" },
    images: ["/lineups/normalized/a158_green_filter.png"],
    status: "available",
    order: 5,
  },
  {
    slug: "dw291h-red-filter",
    baseWatchId: "dw291h",
    mod: { kind: "color-filter", colorCount: 1, label: "Red Filter" },
    images: ["/lineups/normalized/casio-dw-291h-red.png"],
    status: "available",
    order: 6,
  },
  {
    slug: "ae1200-yellow-filter",
    baseWatchId: "ae1200whd-1av",
    mod: { kind: "color-filter", colorCount: 1, label: "Yellow Filter" },
    images: ["/lineups/normalized/casio-ae-1200whd.png"],
    status: "available",
    order: 7,
  },
  {
    slug: "ae1200-spiderman",
    baseWatchId: "ae1200whd-1av",
    mod: {
      kind: "custom-print",
      imageCount: 4, // all four dials
      transparent: true,
      label: "Spiderman",
    },
    images: ["/lineups/normalized/ae1200_spiderman_0.1.png"],
    status: "available",
    order: 8,
  },
];

/* ------------------------------------------------------------------ */
/* Resolver — the only thing your components import                    */
/* ------------------------------------------------------------------ */

export const WHATSAPP_NUMBER = "918129004196";
export const INSTAGRAM_URL = "https://ig.me/m/zzzculture.builds";

export interface ResolvedBuild {
  slug: string;
  title: string;
  subtitle: string;
  base: BaseWatch;
  mod: Mod;
  images: string[];
  status: BuildStatus;
  basePrice: number;
  modPrice: number;
  price: number;
  formattedPrice: string;
  whatsappUrl: string;
  instagramUrl: string;
}

const byId = new Map(BASE_WATCHES.map((w) => [w.id, w]));

export function formatINR(amount: number): string {
  return `₹${amount.toLocaleString("en-IN")}`;
}

export function buildWhatsAppUrl(title: string, subtitle: string, price: number): string {
  const text = `Hi! I'd like to order the ${title} — ${subtitle} (${formatINR(price)}).`;
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
}

export function resolveBuild(build: Build): ResolvedBuild {
  const base = byId.get(build.baseWatchId);
  if (!base) {
    throw new Error(`Build "${build.slug}" references unknown donor "${build.baseWatchId}"`);
  }

  const mp = modPrice(build.mod, base);
  const price = base.basePrice + mp;
  const title = base.displayName;
  const subtitle = build.mod.label;

  return {
    slug: build.slug,
    title,
    subtitle,
    base,
    mod: build.mod,
    images: build.images,
    status: build.status,
    basePrice: base.basePrice,
    modPrice: mp,
    price,
    formattedPrice: formatINR(price),
    whatsappUrl: buildWhatsAppUrl(title, subtitle, price),
    instagramUrl: INSTAGRAM_URL,
  };
}

export function getLineup(): ResolvedBuild[] {
  return [...LINEUP].sort((a, b) => a.order - b.order).map(resolveBuild);
}

export function getBuild(slug: string): ResolvedBuild | undefined {
  const b = LINEUP.find((x) => x.slug === slug);
  return b ? resolveBuild(b) : undefined;
}

/* ------------------------------------------------------------------ */
/* Configurator (/try-out)                                             */
/* ------------------------------------------------------------------ */

export interface Quote {
  lines: { label: string; amount: number }[];
  total: number;
  formattedTotal: string;
}

export function quote(baseWatchId: string, mod: Mod): Quote {
  const base = byId.get(baseWatchId);
  if (!base) throw new Error(`Unknown donor "${baseWatchId}"`);

  const mp = modPrice(mod, base);
  const total = base.basePrice + mp;

  return {
    lines: [
      { label: base.displayName, amount: base.basePrice },
      { label: mod.label, amount: mp },
    ],
    total,
    formattedTotal: formatINR(total),
  };
}

/** Dev-time check. Run in a test or a prebuild script. */
export function validateCatalog(): string[] {
  const problems: string[] = [];
  const ids = new Set<string>();

  for (const w of BASE_WATCHES) {
    if (ids.has(w.id)) problems.push(`Duplicate donor id: ${w.id}`);
    ids.add(w.id);
    if (w.basePrice <= 0) problems.push(`${w.id} has no base price`);
  }

  const names = new Set<string>();
  for (const w of BASE_WATCHES) {
    if (names.has(w.displayName)) problems.push(`Two donors share displayName "${w.displayName}"`);
    names.add(w.displayName);
  }

  for (const donorId of Object.keys(CUSTOM_PRINT_TIERS_BY_DONOR)) {
    if (!ids.has(donorId)) problems.push(`Print tiers set for unknown donor "${donorId}"`);
  }

  const slugs = new Set<string>();
  for (const b of LINEUP) {
    if (slugs.has(b.slug)) problems.push(`Duplicate build slug: ${b.slug}`);
    slugs.add(b.slug);
    if (!ids.has(b.baseWatchId)) problems.push(`${b.slug} points at missing donor "${b.baseWatchId}"`);
  }

  return problems;
}
