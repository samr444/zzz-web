import { darkenHex, type ModelViewerElement } from "./materialControls";

export type PhotoAspectRatio = "square" | "16:9";
export type PhotoQuality = "good" | "high";

export interface PhotoStudioOptions {
  aspectRatio: PhotoAspectRatio;
  quality: PhotoQuality;
}

// "16:9" here means the Instagram Story/Reel portrait shape (9 wide, 16
// tall) — not landscape — so the value is width/height = 9/16.
const ASPECT_VALUES: Record<PhotoAspectRatio, number> = {
  square: 1,
  "16:9": 9 / 16,
};

// The full wordmark used in the page footer (logo_text.png) — stamped as a
// watermark onto every saved photo so it stays branded once downloaded.
const WATERMARK_SRC = "/logo/logo_text.png";
const WATERMARK_WIDTH_RATIO = 0.13;
const WATERMARK_MARGIN_RATIO = 0.035;

// PNG is lossless regardless of qualityArgument, so "High" always uses PNG;
// "Good" trades that for a much smaller JPEG file.
function encodingFor(quality: PhotoQuality): { mimeType: string; qualityArgument?: number } {
  return quality === "high"
    ? { mimeType: "image/png" }
    : { mimeType: "image/jpeg", qualityArgument: 0.85 };
}

function loadImage(src: string, revokeUrlOnSettle?: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      if (revokeUrlOnSettle) URL.revokeObjectURL(revokeUrlOnSettle);
      resolve(img);
    };
    img.onerror = () => {
      if (revokeUrlOnSettle) URL.revokeObjectURL(revokeUrlOnSettle);
      reject(new Error(`Failed to load image: ${src}`));
    };
    img.src = src;
  });
}

// Same-origin static asset — safe to cache and reuse across every capture
// instead of re-fetching it each time the user takes a photo.
let watermarkPromise: Promise<HTMLImageElement> | null = null;
function loadWatermark(): Promise<HTMLImageElement> {
  if (!watermarkPromise) watermarkPromise = loadImage(WATERMARK_SRC);
  return watermarkPromise;
}

// Reproduces the same `radial-gradient(circle at 50% 38%, background 0%,
// darkenHex(background) 78%)` CSS painted behind the live <model-viewer> in
// CasioViewer.tsx. toBlob() only captures the WebGL canvas itself — which is
// transparent wherever there's no model geometry — so without this, the
// exported photo's background would come out black/transparent instead of
// matching what's actually shown on screen.
function paintBackground(ctx: CanvasRenderingContext2D, width: number, height: number, backgroundColor: string) {
  const cx = width * 0.5;
  const cy = height * 0.38;
  const corners: [number, number][] = [
    [0, 0],
    [width, 0],
    [0, height],
    [width, height],
  ];
  const radius = Math.max(...corners.map(([x, y]) => Math.hypot(x - cx, y - cy)));
  const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
  const darkened = darkenHex(backgroundColor);
  gradient.addColorStop(0, backgroundColor);
  gradient.addColorStop(0.78, darkened);
  gradient.addColorStop(1, darkened);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
}

// <model-viewer>'s toBlob captures the canvas at its native render size,
// which rarely matches the aspect ratio the user picked — so we center-crop
// it onto an offscreen canvas at exactly that ratio, paint in the same
// background the user sees on screen, then stamp the ZZZculture watermark
// directly into the saved pixels — applies to both Square and 16:9 since
// they share this same function.
async function cropToAspect(
  source: Blob,
  targetAspect: number,
  mimeType: string,
  backgroundColor: string,
  qualityArgument?: number
): Promise<Blob> {
  const objectUrl = URL.createObjectURL(source);
  const img = await loadImage(objectUrl, objectUrl);

  const srcW = img.naturalWidth;
  const srcH = img.naturalHeight;
  const srcAspect = srcW / srcH;

  let sx = 0;
  let sy = 0;
  let sw = srcW;
  let sh = srcH;
  if (srcAspect > targetAspect) {
    sw = srcH * targetAspect;
    sx = (srcW - sw) / 2;
  } else {
    sh = srcW / targetAspect;
    sy = (srcH - sh) / 2;
  }

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(sw);
  canvas.height = Math.round(sh);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2D context unavailable for photo crop");
  paintBackground(ctx, canvas.width, canvas.height, backgroundColor);
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);

  const watermark = await loadWatermark();
  const margin = canvas.width * WATERMARK_MARGIN_RATIO;
  const logoWidth = canvas.width * WATERMARK_WIDTH_RATIO;
  const logoHeight = logoWidth * (watermark.naturalHeight / watermark.naturalWidth);
  ctx.drawImage(watermark, margin, margin, logoWidth, logoHeight);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (out) => (out ? resolve(out) : reject(new Error("Canvas toBlob failed"))),
      mimeType,
      qualityArgument
    );
  });
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Deferred so the click's navigation has time to start before we free the URL.
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export async function capturePhoto(
  viewer: ModelViewerElement,
  options: PhotoStudioOptions,
  filenamePrefix: string,
  backgroundColor: string
): Promise<void> {
  const { mimeType, qualityArgument } = encodingFor(options.quality);
  // idealAspect is NOT "output at my requested aspect ratio" — it's
  // model-viewer's own pre-crop to the loaded model's natural framing aspect
  // (from its bounding geometry), which fights our own Square/16:9 crop
  // below. Leave it off so the raw capture is just the actual rendered
  // canvas, and let cropToAspect be the only thing deciding the final shape.
  //
  // Always request the raw frame as PNG regardless of the final output
  // format — <model-viewer>'s own toBlob() would otherwise bake a black
  // background into any transparent pixels immediately if asked for JPEG,
  // before paintBackground() below ever gets a chance to fill in the real one.
  const raw = await viewer.toBlob({ mimeType: "image/png" });
  const cropped = await cropToAspect(raw, ASPECT_VALUES[options.aspectRatio], mimeType, backgroundColor, qualityArgument);
  const extension = mimeType === "image/png" ? "png" : "jpg";
  downloadBlob(cropped, `${filenamePrefix}-${Date.now()}.${extension}`);
}
