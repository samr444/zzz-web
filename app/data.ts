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
    id: "f91wb-1a",
    displayName: "Casio F91WB-1A",
    tag: "black frame, black case, black strap",
    baseName: "Casio F91",
    basePrice: 1695,
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
  | { kind: "color-filter"; colorCount: 1 | 2 | 3 | 4; label: string; priceOverride?: number }
  | { kind: "custom-print"; imageCount: number; transparent: boolean; label: string; priceOverride?: number }
  | { kind: "strap"; name: string; color: string; label: string }
  | { kind: "custom-faceplate"; name: string; label: string }
  | { kind: "custom-royale"; label: string };

/** Colour filter price by number of colours. */
const COLOR_FILTER_TIERS: Record<number, number> = {
  1: 1000,
  2: 1500,
  3: 2000,
  4: 2000,
};

/** Transparent custom print, priced by how many dials are printed. */
type PrintTiers = Readonly<Record<number, number>>;
const CUSTOM_PRINT_TIERS_DEFAULT: PrintTiers = { 1: 2000 };
const CUSTOM_PRINT_TIERS_BY_DONOR: Readonly<Record<string, PrintTiers>> = {};

export function customPrintPrice(donorId: string, imageCount = 1): number {
  const tiers = CUSTOM_PRINT_TIERS_BY_DONOR[donorId] ?? CUSTOM_PRINT_TIERS_DEFAULT;
  const counts = Object.keys(tiers).map(Number).sort((a, b) => a - b);
  if (counts.length === 0) return 0;
  let price = tiers[counts[0]];
  for (const c of counts) {
    if (imageCount >= c) price = tiers[c];
  }
  return price;
}

/** Rubber / aftermarket strap prices by name. */
const STRAP_PRICES: Record<string, number> = {
  "rubber strap": 200,
};

/** Custom faceplate prices by name slug. */
const FACEPLATE_PRICES: Record<string, number> = {
  customFacePlateF91_A158: 2000,
};

/** Custom Royale Build: full window customization fee on the AE-1200. */
const CUSTOM_ROYALE_BUILD_PRICE = 2000;

export function modPrice(mod: Mod, base: BaseWatch): number {
  switch (mod.kind) {
    case "color-filter":
      if (mod.priceOverride !== undefined) return mod.priceOverride;
      return COLOR_FILTER_TIERS[mod.colorCount] ?? 0;
    case "custom-print":
      if (mod.priceOverride !== undefined) return mod.priceOverride;
      // transparent prints use the tier system; plain prints are flat ₹1000
      return mod.transparent ? customPrintPrice(base.id, mod.imageCount) : 1000;
    case "strap":
      return STRAP_PRICES[mod.name] ?? 0;
    case "custom-faceplate":
      return FACEPLATE_PRICES[mod.name] ?? 0;
    case "custom-royale":
      return CUSTOM_ROYALE_BUILD_PRICE;
  }
}

/* ------------------------------------------------------------------ */
/* 3. Lineup                                                           */
/* ------------------------------------------------------------------ */

export type BuildStatus = "available" | "sold-out" | "made-to-order" | "coming-soon";

export interface Build {
  slug: string;
  baseWatchId: BaseWatch["id"];
  mods: Mod[];
  images: string[];
  status: BuildStatus;
  order: number;
  /** Hide the base + mod price breakdown; show only the total. */
  hideBreakdown?: boolean;
}

// Image paths point at what's actually in public/lineups/normalized/ (the
// site's real cropped photos) rather than the /lineup/*.jpg placeholders —
// those files don't exist in this repo.
export const LINEUP: readonly Build[] = [
  {
    slug: "custom-royale",
    baseWatchId: "ae1200whd-1av",
    mods: [{ kind: "custom-royale", label: "Custom Royale Build" }],
    images: ["/custom_card/black.png", "/custom_card/silver.png", "/custom_card/gold.png"],
    status: "made-to-order",
    order: 0,
  },
  {
    slug: "ae1200-minnal-murali",
    baseWatchId: "ae1200whd-1av",
    mods: [{ kind: "custom-print", imageCount: 1, transparent: false, label: "Minnal Murali", priceOverride: 1505 }],
    images: ["/lineups/ae1200_silver_minnal_murali.png"],
    status: "available",
    order: 1,
  },
  {
    slug: "ae1200-spiderman",
    baseWatchId: "ae1200whd-1av",
    mods: [{ kind: "custom-print", imageCount: 4, transparent: true, label: "Spiderman" }],
    images: ["/lineups/normalized/ae1200_spiderman_0.1.png"],
    status: "available",
    order: 2,
  },
  {
    slug: "ae1200-3-color-black",
    baseWatchId: "ae1200wh-1cvcf",
    mods: [{ kind: "color-filter", colorCount: 3, label: "3-Color Black" }],
    images: ["/lineups/normalized/ae1200_3color_black_strap.png"],
    status: "sold-out",
    order: 3,
  },
  {
    slug: "ae1200-3-color-orange",
    baseWatchId: "ae1200wh-1cvcf-orange",
    mods: [
      { kind: "color-filter", colorCount: 3, label: "3-Color" },
      { kind: "strap", name: "rubber strap", color: "orange", label: "Orange Rubber Strap" },
    ],
    images: ["/lineups/normalized/ae1200_3color.png"],
    status: "sold-out",
    order: 4,
  },
  {
    slug: "f91-luffy-blue",
    baseWatchId: "f91-blue",
    mods: [{ kind: "custom-print", imageCount: 1, transparent: false, label: "Luffy Blue", priceOverride: 1304 }],
    images: ["/lineups/normalized/blue_f91_luffy.png"],
    status: "sold-out",
    order: 5,
    hideBreakdown: true,
  },
  {
    slug: "a158-naruto",
    baseWatchId: "a158wa-1",
    mods: [{ kind: "custom-print", imageCount: 1, transparent: false, label: "Naruto", priceOverride: 1604 }],
    images: ["/lineups/normalized/casio_a158_naruto.png"],
    status: "available",
    order: 6,
    hideBreakdown: true,
  },
  {
    slug: "a158-green-filter",
    baseWatchId: "a158wa-1",
    mods: [{ kind: "color-filter", colorCount: 1, label: "Green Filter", priceOverride: 1604 }],
    images: ["/lineups/normalized/a158_green_filter.png"],
    status: "available",
    order: 7,
    hideBreakdown: true,
  },
  {
    slug: "dw291h-red-filter",
    baseWatchId: "dw291h",
    mods: [{ kind: "color-filter", colorCount: 1, label: "Red Filter" }],
    images: ["/lineups/normalized/casio-dw-291h-red.png"],
    status: "available",
    order: 8,
  },
  {
    slug: "ae1200-yellow-filter",
    baseWatchId: "ae1200whd-1av",
    mods: [{ kind: "color-filter", colorCount: 1, label: "Yellow Filter" }],
    images: ["/lineups/normalized/casio-ae-1200whd.png"],
    status: "available",
    order: 9,
  },
  {
    slug: "a158-deadpool",
    baseWatchId: "a158wa-1",
    mods: [{ kind: "custom-print", imageCount: 1, transparent: false, label: "Deadpool", priceOverride: 1604 }],
    images: ["/lineups/a158_deadpool.png"],
    status: "available",
    order: 10,
    hideBreakdown: true,
  },
  {
    slug: "f91-black-spiderman",
    baseWatchId: "f91-black",
    mods: [{ kind: "custom-print", imageCount: 1, transparent: false, label: "Spiderman", priceOverride: 1704 }],
    images: ["/lineups/f91_black_spiderman.png"],
    status: "available",
    order: 11,
    hideBreakdown: true,
  },
  {
    slug: "f91-blue-van-gogh",
    baseWatchId: "f91-blue",
    mods: [{ kind: "custom-print", imageCount: 1, transparent: false, label: "Van Gogh", priceOverride: 1304 }],
    images: ["/lineups/f91_blue_vincent_van_gogh.png"],
    status: "sold-out",
    order: 12,
    hideBreakdown: true,
  },
  {
    slug: "f91-black-gradient",
    baseWatchId: "f91wb-1a",
    mods: [{ kind: "color-filter", colorCount: 1, label: "Gradient Theme", priceOverride: 1304 }],
    images: ["/lineups/f91_black_gradient_theme.png"],
    status: "sold-out",
    order: 13,
    hideBreakdown: true,
  },
  {
    slug: "ae1200-nasa-future",
    baseWatchId: "ae1200whd-1av",
    mods: [{ kind: "custom-print", imageCount: 1, transparent: true, label: "NASA Future Concept" }],
    images: ["/lineups/ae1200_future_concept_coming_soon.png"],
    status: "coming-soon",
    order: 14,
  },
];

/* ------------------------------------------------------------------ */
/* Resolver — the only thing your components import                    */
/* ------------------------------------------------------------------ */

export const WHATSAPP_NUMBER = "918281594196";
export const INSTAGRAM_URL = "https://ig.me/m/zzzculture.builds";

export interface ResolvedBuild {
  slug: string;
  title: string;
  subtitle: string;
  base: BaseWatch;
  mods: Mod[];
  /** Per-mod price breakdown for display. */
  modLines: { label: string; amount: number }[];
  images: string[];
  status: BuildStatus;
  basePrice: number;
  /** Total of all mod costs. */
  modPrice: number;
  price: number;
  formattedPrice: string;
  whatsappUrl: string;
  instagramUrl: string;
  hideBreakdown: boolean;
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

  const modLines = build.mods.map((m) => ({ label: m.label, amount: modPrice(m, base) }));
  const mp = modLines.reduce((sum, l) => sum + l.amount, 0);
  const price = base.basePrice + mp;
  const title = base.displayName;
  const subtitle = build.mods.map((m) => m.label).join(" + ");

  return {
    slug: build.slug,
    title,
    subtitle,
    base,
    mods: build.mods,
    modLines,
    images: build.images,
    status: build.status,
    basePrice: base.basePrice,
    modPrice: mp,
    price,
    formattedPrice: formatINR(price),
    whatsappUrl: buildWhatsAppUrl(title, subtitle, price),
    instagramUrl: INSTAGRAM_URL,
    hideBreakdown: build.hideBreakdown ?? false,
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

export function quote(baseWatchId: string, mods: Mod[]): Quote {
  const base = byId.get(baseWatchId);
  if (!base) throw new Error(`Unknown donor "${baseWatchId}"`);

  const modLines = mods.map((m) => ({ label: m.label, amount: modPrice(m, base) }));
  const total = base.basePrice + modLines.reduce((sum, l) => sum + l.amount, 0);

  return {
    lines: [{ label: base.displayName, amount: base.basePrice }, ...modLines],
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
    if (b.mods.length === 0) problems.push(`${b.slug} has no mods`);
  }

  return problems;
}
