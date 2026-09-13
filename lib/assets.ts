/**
 * Artwork URLs — local copies under /public/images.
 *
 * Every layer is registered to the same 1033 x 1523 photograph, of which the
 * builder shows the top 1033 x 1470.
 */

export const ASSETS = {
  bandLeather: '/images/band-leather.png',
  bandSteel: '/images/band-steel.webp',
  textRemoval: '/images/text-removal-patches.webp',
} as const;

/** Case artwork is the complete watch photograph in that case colour. */
export const CASE_IMAGES: Record<string, string> = {
  'resin-black': '/images/case-resin-black.webp',
  'resin-silver': '/images/case-resin-silver.webp',
  'resin-gold': '/images/case-resin-gold.webp',
};

export function decalImage(name: string, ext = 'webp'): string {
  return `/images/decals/${name}.${ext}`;
}

/** No longer needed — all assets are local image files. */
export const isTextAsset = (_url: string) => false;
