// Maps each watch model to the real glTF material names baked into its .glb,
// so the control panel can target the right material instead of guessing.
const STAND_MATERIALS = ["Mat_Stand", "Mat_Elem_stand_001", "Mat_Elem_stand_002"];

// AE-1200 only: confirmed by lighting up each material individually in a live
// render. 001=compass dial, 002=the MUTE indicator strip, 003=world map area,
// 004=main LCD background — matches the Dial/Mute/Map/Main control panel rows.
const AE1200_COLOR_FILTER_PARTS = {
  dial: ["Mat_Color_filter_001"],
  mute: ["Mat_Color_filter_002"],
  map: ["Mat_Color_filter_003"],
  main: ["Mat_Color_filter_004"],
};

// Printed text/graphics layered on top of the base faceplate and case —
// hiding these is what "Clean Mode" means (a blank case/dial with no labels).
const AE1200_FACEPLATE_DECOR = [
  "Mat_Elem_face_10yearbattery",
  "Mat_Elem_face_5alarms",
  "Mat_Elem_face_CASIO",
  "Mat_Elem_face_dial_marks",
  "Mat_Elem_face_dial_numbers",
  "Mat_Elem_face_settings",
  "Mat_Elem_face_wr100m",
  "Mat_Face_symbols_bottom",
  "Mat_Face_timezone",
  "Mat_Face_symbols_top_lines",
  "Mat_Face_symbols_map",
  "Mat_Face_symbols_arrows",
  "Face_symbols_bottom_lines",
];
const AE1200_CASE_DECOR = ["Mat_Elem_case_001", "Mat_Elem_case_002"];

interface MaterialMapEntry {
  faceplate: string[];
  faceplateDecor?: string[];
  colorFilterParts?: Record<ColorFilterPartKey, string[]>;
  colorFilter?: string[];
  bumper?: string[];
  case?: string[];
  caseDecor?: string[];
  lcdPositive: string[];
  lcdNegative: string[];
  stand: string[];
}

export const MATERIAL_MAP: Record<"ae1200" | "f91w", MaterialMapEntry> = {
  ae1200: {
    faceplate: ["Mat_Face_main"],
    faceplateDecor: AE1200_FACEPLATE_DECOR,
    colorFilterParts: AE1200_COLOR_FILTER_PARTS,
    bumper: ["Mat_Bumper_casio_ae1200_standard"],
    case: ["Mat_Case"],
    caseDecor: AE1200_CASE_DECOR,
    lcdPositive: ["Mat_LCD_Casio_AE-1200WHD-1AV"],
    lcdNegative: [
      "Mat_LCD_Casio_AE-1200WHD-1AV_for_inverted",
      "LCD_Casio_AE-1200WHD-1AV_inverted",
    ],
    stand: STAND_MATERIALS,
  },
  f91w: {
    faceplate: ["Mat_Face"],
    colorFilter: ["Mat_Color_filter"],
    lcdPositive: ["Mat_LCD_screen_positive"],
    lcdNegative: ["Mat_LCD_screen_negative"],
    stand: STAND_MATERIALS,
  },
};

export type WatchKey = keyof typeof MATERIAL_MAP;
export type ColorFilterPartKey = "dial" | "mute" | "map" | "main";

// ---------- <model-viewer> scene-graph API surface we actually use ----------

export interface ModelViewerTextureSampler {
  setWrapS: (mode: number) => void;
  setWrapT: (mode: number) => void;
  setOffset: (offset: { u: number; v: number }) => void;
  setScale: (scale: { u: number; v: number }) => void;
}

export interface ModelViewerTexture {
  sampler: ModelViewerTextureSampler;
}

export interface ModelViewerMaterial {
  name: string;
  setAlphaMode: (mode: "OPAQUE" | "BLEND" | "MASK") => void;
  pbrMetallicRoughness: {
    baseColorFactor: number[];
    setBaseColorFactor: (rgba: number[]) => void;
    setMetallicFactor: (value: number) => void;
    setRoughnessFactor: (value: number) => void;
    baseColorTexture: {
      setTexture: (texture: ModelViewerTexture | null) => void;
    };
  };
}

export interface ModelViewerElement extends HTMLElement {
  model?: { materials: ModelViewerMaterial[] } | null;
  cameraOrbit: string;
  fieldOfView: string;
  createTexture: (url: string) => Promise<ModelViewerTexture | null>;
}

// ---------- control state shapes read by the apply* functions below ----------

interface TintedMaterialState {
  touched: boolean;
  enabled: boolean;
  color: string;
  transparency: number;
  gradient: boolean;
  textureUrl?: string | null;
  scaleX: number;
  scaleY: number;
  offsetX: number;
  offsetY: number;
  repeat: boolean;
}

interface FaceplateState {
  touched: boolean;
  color: string;
  materialType: string;
  glossiness: number;
  textureUrl?: string | null;
  scaleX: number;
  scaleY: number;
  offsetX: number;
  offsetY: number;
  repeat: boolean;
}

interface DisplayState {
  touched: boolean;
  value: string;
}

interface BumperState {
  touched: boolean;
  enabled: boolean;
  color: string;
  materialType: string;
  glossiness: number;
}

interface CaseMaterialState {
  touched: boolean;
  color: string;
  materialType: string;
  glossiness: number;
}

interface CleanModePartState {
  touched: boolean;
  value: boolean;
}

interface CleanModeState {
  faceplate: CleanModePartState;
  case: CleanModePartState;
}

export function hexToRgb01(hex: string, alpha = 1): [number, number, number, number] {
  const clean = hex.replace("#", "");
  const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
  const int = parseInt(full, 16);
  return [((int >> 16) & 255) / 255, ((int >> 8) & 255) / 255, (int & 255) / 255, alpha];
}

export function darkenHex(hex: string, amount = 0.55): string {
  const [r, g, b] = hexToRgb01(hex);
  const toHex = (v: number) =>
    Math.round(Math.min(255, Math.max(0, v * 255 * amount)))
      .toString(16)
      .padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function buildGradientDataUrl(hex: string): string {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";
  const grad = ctx.createLinearGradient(0, 0, 256, 256);
  grad.addColorStop(0, hex);
  grad.addColorStop(1, "#000000");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);
  return canvas.toDataURL("image/png");
}

function findMaterials(viewer: ModelViewerElement | null | undefined, names: string[]): ModelViewerMaterial[] {
  if (!viewer || !viewer.model || !viewer.model.materials) return [];
  return viewer.model.materials.filter((m) => names.includes(m.name));
}

async function setMaterialAlpha(viewer: ModelViewerElement, names: string[], alpha: number) {
  for (const mat of findMaterials(viewer, names)) {
    try {
      mat.setAlphaMode(alpha < 1 ? "BLEND" : "OPAQUE");
      const factor = mat.pbrMetallicRoughness.baseColorFactor;
      mat.pbrMetallicRoughness.setBaseColorFactor([factor[0], factor[1], factor[2], alpha]);
    } catch (err) {
      console.warn("[materials] alpha update failed for", mat.name, err);
    }
  }
}

interface TextureOptions {
  scaleX?: number;
  scaleY?: number;
  offsetX?: number;
  offsetY?: number;
  repeat?: boolean;
}

async function applyTexture(
  viewer: ModelViewerElement,
  mat: ModelViewerMaterial,
  dataUrl: string | null | undefined,
  { scaleX = 1, scaleY = 1, offsetX = 0, offsetY = 0, repeat = true }: TextureOptions = {}
) {
  const textureInfo = mat.pbrMetallicRoughness.baseColorTexture;
  if (!dataUrl) {
    try {
      textureInfo.setTexture(null);
    } catch (err) {
      console.warn("[materials] clearing texture failed for", mat.name, err);
    }
    return;
  }
  try {
    // createTexture lives on the <model-viewer> element itself, not on
    // viewer.model — calling it on .model throws "not a function".
    const texture = await viewer.createTexture(dataUrl);
    if (!texture) return;
    textureInfo.setTexture(texture);
    try {
      // GL texture wrap enums: REPEAT = 10497, CLAMP_TO_EDGE = 33071.
      const wrapMode = repeat ? 10497 : 33071;
      texture.sampler.setWrapS(wrapMode);
      texture.sampler.setWrapT(wrapMode);
    } catch (err) {
      console.warn("[materials] wrap mode unsupported", err);
    }
    try {
      // The UV transform lives on the sampler as {u, v} objects, not on
      // the TextureInfo (which has no setTransform in this model-viewer version).
      texture.sampler.setOffset({ u: offsetX, v: offsetY });
      texture.sampler.setScale({ u: scaleX, v: scaleY });
    } catch (err) {
      console.warn("[materials] texture transform unsupported", err);
    }
  } catch (err) {
    console.warn("[materials] texture upload failed for", mat.name, err);
  }
}

export async function applyFaceplate(viewer: ModelViewerElement, watchKey: WatchKey, faceplate: FaceplateState) {
  if (!faceplate.touched) return;
  const names = MATERIAL_MAP[watchKey]?.faceplate || [];
  const hasTexture = Boolean(faceplate.textureUrl);
  for (const mat of findMaterials(viewer, names)) {
    try {
      // baseColorFactor multiplies with baseColorTexture in glTF's PBR
      // model — once a texture is uploaded it must reset to opaque white,
      // otherwise the faceplate color tints the uploaded image instead of
      // leaving it true to source.
      mat.pbrMetallicRoughness.setBaseColorFactor(hasTexture ? [1, 1, 1, 1] : hexToRgb01(faceplate.color, 1));
      mat.pbrMetallicRoughness.setMetallicFactor(faceplate.materialType === "metallic" ? 1 : 0);
      mat.pbrMetallicRoughness.setRoughnessFactor(1 - faceplate.glossiness);
    } catch (err) {
      console.warn("[materials] faceplate color/finish failed", err);
    }
    await applyTexture(viewer, mat, faceplate.textureUrl, {
      scaleX: faceplate.scaleX,
      scaleY: faceplate.scaleY,
      offsetX: faceplate.offsetX,
      offsetY: faceplate.offsetY,
      repeat: faceplate.repeat,
    });
  }
}

// Shared by the old single-material Color Filter (F-91W) and the new
// per-part Color Filter rows (AE-1200 Dial/Mute/Map/Main) — same shape:
// enabled/color/transparency/gradient/textureUrl/scale/offset/repeat.
async function applyTintedMaterials(viewer: ModelViewerElement, names: string[], state: TintedMaterialState) {
  const alpha = state.enabled ? state.transparency : 0;
  const dataUrl = state.enabled
    ? state.textureUrl
      ? state.textureUrl
      : state.gradient
      ? buildGradientDataUrl(state.color)
      : null
    : null;
  for (const mat of findMaterials(viewer, names)) {
    try {
      mat.setAlphaMode(alpha < 1 ? "BLEND" : "OPAQUE");
      // baseColorFactor multiplies with baseColorTexture in glTF's PBR
      // model — once an image is driving the texture (an upload, or the
      // gradient already baked with this color), the factor must stay
      // white or it tints/double-tints that image. The solid color only
      // applies when there's no image at all.
      mat.pbrMetallicRoughness.setBaseColorFactor(dataUrl ? [1, 1, 1, alpha] : hexToRgb01(state.color, alpha));
    } catch (err) {
      console.warn("[materials] tint color failed", err);
    }
    if (!state.enabled) {
      await applyTexture(viewer, mat, null);
      continue;
    }
    await applyTexture(viewer, mat, dataUrl, {
      scaleX: state.scaleX,
      scaleY: state.scaleY,
      offsetX: state.offsetX,
      offsetY: state.offsetY,
      repeat: state.repeat,
    });
  }
}

export async function applyColorFilter(viewer: ModelViewerElement, watchKey: WatchKey, colorFilter: TintedMaterialState) {
  if (!colorFilter.touched) return;
  const names = MATERIAL_MAP[watchKey]?.colorFilter || [];
  await applyTintedMaterials(viewer, names, colorFilter);
}

// AE-1200 only — Dial/Mute/Map/Main each get their own independent tint.
export async function applyColorFilterPart(
  viewer: ModelViewerElement,
  watchKey: WatchKey,
  partKey: ColorFilterPartKey,
  part: TintedMaterialState
) {
  if (!part.touched) return;
  const names = MATERIAL_MAP[watchKey]?.colorFilterParts?.[partKey] || [];
  await applyTintedMaterials(viewer, names, part);
}

export async function applyColorFilterParts(
  viewer: ModelViewerElement,
  watchKey: WatchKey,
  parts: Record<ColorFilterPartKey, TintedMaterialState> | null | undefined
) {
  if (!parts) return;
  await Promise.all(
    (Object.entries(parts) as [ColorFilterPartKey, TintedMaterialState][]).map(([partKey, part]) =>
      applyColorFilterPart(viewer, watchKey, partKey, part)
    )
  );
}

// AE-1200 only — an optional accessory piece, hidden until explicitly enabled.
export async function applyBumper(viewer: ModelViewerElement, watchKey: WatchKey, bumper: BumperState) {
  if (!bumper.touched) return;
  const names = MATERIAL_MAP[watchKey]?.bumper || [];
  for (const mat of findMaterials(viewer, names)) {
    try {
      const alpha = bumper.enabled ? 1 : 0;
      mat.setAlphaMode(alpha < 1 ? "BLEND" : "OPAQUE");
      mat.pbrMetallicRoughness.setBaseColorFactor(hexToRgb01(bumper.color, alpha));
      mat.pbrMetallicRoughness.setMetallicFactor(bumper.materialType === "metallic" ? 1 : 0);
      mat.pbrMetallicRoughness.setRoughnessFactor(1 - bumper.glossiness);
    } catch (err) {
      console.warn("[materials] bumper update failed", err);
    }
  }
}

// AE-1200 only — the main case body color/finish (no texture, per the design).
export async function applyCaseMaterial(viewer: ModelViewerElement, watchKey: WatchKey, caseMaterial: CaseMaterialState) {
  if (!caseMaterial.touched) return;
  const names = MATERIAL_MAP[watchKey]?.case || [];
  for (const mat of findMaterials(viewer, names)) {
    try {
      mat.pbrMetallicRoughness.setBaseColorFactor(hexToRgb01(caseMaterial.color, 1));
      mat.pbrMetallicRoughness.setMetallicFactor(caseMaterial.materialType === "metallic" ? 1 : 0);
      mat.pbrMetallicRoughness.setRoughnessFactor(1 - caseMaterial.glossiness);
    } catch (err) {
      console.warn("[materials] case update failed", err);
    }
  }
}

// AE-1200 only — hides the printed text/graphics on the faceplate and/or
// case for a blank, unbranded look.
export async function applyCleanMode(viewer: ModelViewerElement, watchKey: WatchKey, cleanMode: CleanModeState | null | undefined) {
  if (!cleanMode) return;
  const map = MATERIAL_MAP[watchKey];
  const tasks: Promise<void>[] = [];
  if (cleanMode.faceplate.touched) {
    tasks.push(setMaterialAlpha(viewer, map.faceplateDecor || [], cleanMode.faceplate.value ? 0 : 1));
  }
  if (cleanMode.case.touched) {
    tasks.push(setMaterialAlpha(viewer, map.caseDecor || [], cleanMode.case.value ? 0 : 1));
  }
  await Promise.all(tasks);
}

export async function applyDisplayPolarity(viewer: ModelViewerElement, watchKey: WatchKey, display: DisplayState) {
  if (!display.touched) return;
  const map = MATERIAL_MAP[watchKey];
  await Promise.all([
    setMaterialAlpha(viewer, map.lcdPositive || [], display.value === "positive" ? 1 : 0),
    setMaterialAlpha(viewer, map.lcdNegative || [], display.value === "negative" ? 1 : 0),
  ]);
}

// Not user-configurable yet — controlled by SHOW_STAND in CasioViewer.tsx.
// Kept as a real toggle (not deleted logic) so the stand can be brought back
// later with a one-line flip, or wired to its own control panel section.
export async function applyStandVisibility(viewer: ModelViewerElement, watchKey: WatchKey, visible: boolean) {
  const names = MATERIAL_MAP[watchKey]?.stand || [];
  await setMaterialAlpha(viewer, names, visible ? 1 : 0);
}

export interface ApplyAllMaterialsOptions {
  faceplate: FaceplateState;
  colorFilter: TintedMaterialState;
  display: DisplayState;
  standVisible: boolean;
  colorFilterParts: Record<ColorFilterPartKey, TintedMaterialState>;
  bumper: BumperState;
  caseMaterial: CaseMaterialState;
  cleanMode: CleanModeState;
}

export async function applyAllMaterials(
  viewer: ModelViewerElement | null | undefined,
  watchKey: WatchKey,
  { faceplate, colorFilter, display, standVisible, colorFilterParts, bumper, caseMaterial, cleanMode }: ApplyAllMaterialsOptions
) {
  if (!viewer || !viewer.model) return;
  const tasks: Promise<void>[] = [
    applyFaceplate(viewer, watchKey, faceplate),
    applyDisplayPolarity(viewer, watchKey, display),
    applyStandVisibility(viewer, watchKey, standVisible),
  ];
  if (watchKey === "ae1200") {
    tasks.push(
      applyColorFilterParts(viewer, watchKey, colorFilterParts),
      applyBumper(viewer, watchKey, bumper),
      applyCaseMaterial(viewer, watchKey, caseMaterial),
      applyCleanMode(viewer, watchKey, cleanMode)
    );
  } else {
    tasks.push(applyColorFilter(viewer, watchKey, colorFilter));
  }
  await Promise.all(tasks);
}
