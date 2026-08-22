"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type * as React from "react";
import type { CSSProperties } from "react";
import Link from "next/link";
import ControlPanel from "./ControlPanel";
import { applyAllMaterials, darkenHex, type ModelViewerElement } from "./materialControls";
import useIsMobile from "./useIsMobile";

interface WatchConfig {
  src: string;
  alt: string;
  title: string;
  subtitle: string;
  orbit: string;
  fov: string;
}

type WatchKey = "ae1200" | "f91w";
type MaterialType = "plastic" | "metallic";
type DisplayValue = "positive" | "negative";

interface ColorFilter {
  touched: boolean;
  enabled: boolean;
  color: string;
  transparency: number;
  gradient: boolean;
  textureUrl: string | null;
  scaleX: number;
  scaleY: number;
  offsetX: number;
  offsetY: number;
  repeat: boolean;
}

interface Faceplate {
  touched: boolean;
  color: string;
  materialType: MaterialType;
  glossiness: number;
  textureUrl: string | null;
  scaleX: number;
  scaleY: number;
  offsetX: number;
  offsetY: number;
  repeat: boolean;
}

interface Display {
  touched: boolean;
  value: DisplayValue;
}

type ColorFilterPartKey = "dial" | "mute" | "map" | "main";

type ColorFilterParts = Record<ColorFilterPartKey, ColorFilter>;

interface Bumper {
  touched: boolean;
  enabled: boolean;
  color: string;
  materialType: MaterialType;
  glossiness: number;
}

interface CaseMaterial {
  touched: boolean;
  color: string;
  materialType: MaterialType;
  glossiness: number;
}

interface CleanModePart {
  touched: boolean;
  value: boolean;
}

interface CleanMode {
  faceplate: CleanModePart;
  case: CleanModePart;
}

type Patch<T> = Partial<T>;

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "model-viewer": React.DetailedHTMLProps<
        React.HTMLAttributes<ModelViewerElement>,
        ModelViewerElement
      > & Record<string, unknown>;
    }
  }
}

const COLORS = {
  bg: "#101210",
  ink: "#e7ebe2",
  inkDim: "#8b9284",
  panelLine: "#2b2f28",
  accent: "#b7d99a",
  accentGlow: "rgba(183,217,154,0.35)",
};

const MONO = "'Space Mono', monospace";
const SANS = "'Archivo', sans-serif";

const WATCHES: Record<WatchKey, WatchConfig> = {
  ae1200: {
    src: "/casiomodels/casio_ae12001.glb",
    alt: "Casio AE-1200WHD digital watch, 3D model",
    title: "Casio AE-1200WHD",
    subtitle: "World Time · compass dial. Drag to rotate, scroll or pinch to zoom.",
    orbit: "-32deg 74deg 2.4m",
    fov: "30deg",
  },
  f91w: {
    src: "/casiomodels/casio_f91w.glb",
    alt: "Casio F-91W digital watch, 3D model",
    title: "Casio F-91W",
    subtitle: "The classic digital watch. Drag to rotate, scroll or pinch to zoom.",
    orbit: "-32deg 74deg 2.4m",
    fov: "30deg",
  },
};

// Rounded to a fixed precision so the server and client render passes
// produce byte-identical markup — Math.cos/Math.sin can differ in their
// last float digits between Node and the browser's JS engine, which
// otherwise trips a hydration mismatch on every load.
const round = (n: number) => Math.round(n * 1000) / 1000;

const TICK_COUNT = 60;
const TICKS = Array.from({ length: TICK_COUNT }, (_, i) => {
  const a = (i / TICK_COUNT) * Math.PI * 2;
  const long = i % 5 === 0;
  const r1 = 96;
  const r2 = long ? 88 : 92;
  return {
    key: i,
    x1: round(100 + r1 * Math.cos(a)),
    y1: round(100 + r1 * Math.sin(a)),
    x2: round(100 + r2 * Math.cos(a)),
    y2: round(100 + r2 * Math.sin(a)),
    width: long ? 1.4 : 0.6,
  };
});

interface HoverButtonProps {
  onClick: () => void;
  active: boolean;
  base: React.CSSProperties;
  activeStyle: React.CSSProperties;
  hoverStyle: React.CSSProperties;
  children: React.ReactNode;
  title?: string;
  "aria-label"?: string;
}

function HoverButton({
  onClick,
  active,
  base,
  activeStyle,
  hoverStyle,
  children,
  title,
  "aria-label": ariaLabel,
}: HoverButtonProps) {
  const [hover, setHover] = useState(false);
  const style = {
    ...base,
    ...(active ? activeStyle : {}),
    ...(hover && !active ? hoverStyle : {}),
  };
  return (
    <button
      style={style}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      title={title}
      aria-label={ariaLabel}
      aria-pressed={active}
    >
      {children}
    </button>
  );
}

function BackHomeLink() {
  const [hover, setHover] = useState(false);
  return (
    <Link
      href="/"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        pointerEvents: "auto",
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        alignSelf: "flex-start",
        fontFamily: MONO,
        fontSize: "11px",
        letterSpacing: ".08em",
        textTransform: "uppercase",
        padding: "6px 10px",
        marginLeft: "-10px",
        borderRadius: "3px",
        textDecoration: "none",
        color: hover ? COLORS.ink : COLORS.inkDim,
        background: hover ? "rgba(183,217,154,0.08)" : "transparent",
        transition: "background .15s ease, color .15s ease",
        boxSizing: "border-box",
      }}
    >
      ← Home
    </Link>
  );
}

const readFileAsDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

// `touched` tracks whether the user has actually interacted with this
// control. Until then, no override is sent to the model at all — the watch
// renders exactly as authored in the .glb, with no default tint/effect applied.
const DEFAULT_COLOR_FILTER: ColorFilter = {
  touched: false,
  enabled: false,
  color: "#ffdd00",
  transparency: 0.3,
  gradient: false,
  textureUrl: null,
  scaleX: 1,
  scaleY: 1,
  offsetX: 0,
  offsetY: 0,
  repeat: true,
};
const DEFAULT_FACEPLATE: Faceplate = {
  touched: false,
  color: "#c9c9c9",
  materialType: "plastic",
  glossiness: 0.15,
  textureUrl: null,
  scaleX: 1,
  scaleY: 1,
  offsetX: 0,
  offsetY: 0,
  repeat: true,
};
const DEFAULT_DISPLAY: Display = { touched: false, value: "positive" };
const DEFAULT_BACKGROUND = "#a7a5a5";

// AE-1200 only — Dial/Mute/Map/Main each get their own independent tint,
// rather than one shared Color Filter across all four.
const colorFilterPart = (color: string): ColorFilter => ({
  touched: false,
  enabled: false,
  color,
  transparency: 0.25,
  gradient: false,
  textureUrl: null,
  scaleX: 1,
  scaleY: 1,
  offsetX: 0,
  offsetY: 0,
  repeat: true,
});
const DEFAULT_COLOR_FILTER_PARTS = {
  dial: colorFilterPart("#e5342b"),
  mute: colorFilterPart("#3ecf4a"),
  map: colorFilterPart("#1d4ed8"),
  main: colorFilterPart("#ffe11a"),
};

// `touched: true` here (unlike the other DEFAULT_* state) so applyBumper
// always runs and forces the bumper material's alpha to 0 — since its
// control panel section is hidden, there's no other way for the user to
// hide it, and we don't want the .glb's own baked-in default to show through.
const DEFAULT_BUMPER: Bumper = {
  touched: true,
  enabled: false,
  color: "#1a1a1a",
  materialType: "plastic",
  glossiness: 0.15,
};

const DEFAULT_CASE_MATERIAL: CaseMaterial = {
  touched: false,
  color: "#c9c9c9",
  materialType: "plastic",
  glossiness: 0.15,
};

const DEFAULT_CLEAN_MODE: CleanMode = {
  faceplate: { touched: false, value: false },
  case: { touched: false, value: false },
};

// The display stand isn't wanted in the builder for now — flip this to true
// to bring it back (or wire it to its own control panel toggle later).
const SHOW_STAND = false;

const watchKeys = Object.keys(WATCHES) as WatchKey[];
const isFactory = <T,>(value: T | (() => T)): value is () => T => typeof value === "function";
const perModelDefaults = <T,>(value: T | (() => T)): Record<WatchKey, T> => {
  const result = {} as Record<WatchKey, T>;
  for (const key of watchKeys) {
    result[key] = isFactory(value) ? value() : ({ ...value } as T);
  }
  return result;
};

function CasioViewer() {
  const viewerRef = useRef<ModelViewerElement | null>(null);
  const isMobile = useIsMobile();

  const [currentKey, setCurrentKey] = useState<WatchKey>("ae1200");
  const [autoRotate, setAutoRotate] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [modelReady, setModelReady] = useState(false);

  const [background, setBackground] = useState<string>(DEFAULT_BACKGROUND);

  // Each watch model keeps its own independent customization — switching
  // models never carries one model's edits onto another, and every model
  // starts from its own base look until the user changes it.
  const [colorFilterByModel, setColorFilterByModel] = useState<Record<WatchKey, ColorFilter>>(() => perModelDefaults(DEFAULT_COLOR_FILTER));
  const [faceplateByModel, setFaceplateByModel] = useState<Record<WatchKey, Faceplate>>(() => perModelDefaults(DEFAULT_FACEPLATE));
  const [displayByModel, setDisplayByModel] = useState<Record<WatchKey, Display>>(() => perModelDefaults(DEFAULT_DISPLAY));

  // AE-1200 only — not per-model since only this watch has these parts.
  const [colorFilterParts, setColorFilterParts] = useState<ColorFilterParts>(DEFAULT_COLOR_FILTER_PARTS);
  const [bumper, setBumper] = useState<Bumper>(DEFAULT_BUMPER);
  const [caseMaterial, setCaseMaterial] = useState<CaseMaterial>(DEFAULT_CASE_MATERIAL);
  const [cleanMode, setCleanMode] = useState<CleanMode>(DEFAULT_CLEAN_MODE);

  const watch = WATCHES[currentKey];
  const colorFilter = colorFilterByModel[currentKey];
  const faceplate = faceplateByModel[currentKey];
  const display = displayByModel[currentKey];

  const updateColorFilter = (patch: Patch<ColorFilter>) =>
    setColorFilterByModel((prev) => ({
      ...prev,
      [currentKey]: { ...prev[currentKey], ...patch, touched: true },
    }));
  const resetColorFilter = () =>
    setColorFilterByModel((prev) => ({ ...prev, [currentKey]: DEFAULT_COLOR_FILTER }));

  const updateFaceplate = (patch: Patch<Faceplate>) =>
    setFaceplateByModel((prev) => ({
      ...prev,
      [currentKey]: { ...prev[currentKey], ...patch, touched: true },
    }));
  const resetFaceplate = () =>
    setFaceplateByModel((prev) => ({ ...prev, [currentKey]: DEFAULT_FACEPLATE }));

  const setDisplay = (value: string) =>
    setDisplayByModel((prev) => ({ ...prev, [currentKey]: { value, touched: true } }));
  const resetDisplay = () =>
    setDisplayByModel((prev) => ({ ...prev, [currentKey]: DEFAULT_DISPLAY }));

  const resetBackground = () => setBackground(DEFAULT_BACKGROUND);

  const updateColorFilterPart = (partKey: ColorFilterPartKey, patch: Patch<ColorFilter>) =>
    setColorFilterParts((prev) => ({
      ...prev,
      [partKey]: { ...prev[partKey], ...patch, touched: true },
    }));
  const resetColorFilterParts = () => setColorFilterParts(DEFAULT_COLOR_FILTER_PARTS);
  const resetColorFilterPart = (partKey: ColorFilterPartKey) =>
    setColorFilterParts((prev) => ({ ...prev, [partKey]: DEFAULT_COLOR_FILTER_PARTS[partKey] }));

  const updateBumper = (patch: Patch<Bumper>) => setBumper((prev) => ({ ...prev, ...patch, touched: true }));
  const resetBumper = () => setBumper(DEFAULT_BUMPER);

  const updateCaseMaterial = (patch: Patch<CaseMaterial>) => setCaseMaterial((prev) => ({ ...prev, ...patch, touched: true }));
  const resetCaseMaterial = () => setCaseMaterial(DEFAULT_CASE_MATERIAL);

  const updateCleanMode = (part: keyof CleanMode, value: boolean) =>
    setCleanMode((prev) => ({ ...prev, [part]: { value, touched: true } }));
  const resetCleanMode = () => setCleanMode(DEFAULT_CLEAN_MODE);

  const handleColorFilterTextureUpload = async (file: File) => {
    const dataUrl = await readFileAsDataUrl(file);
    updateColorFilter({ textureUrl: dataUrl });
  };
  const handleColorFilterTextureRemove = () => updateColorFilter({ textureUrl: null });

  const handleColorFilterPartTextureUpload = async (partKey: ColorFilterPartKey, file: File) => {
    const dataUrl = await readFileAsDataUrl(file);
    updateColorFilterPart(partKey, { textureUrl: dataUrl });
  };
  const handleColorFilterPartTextureRemove = (partKey: ColorFilterPartKey) => updateColorFilterPart(partKey, { textureUrl: null });

  const handleFaceplateTextureUpload = async (file: File) => {
    const dataUrl = await readFileAsDataUrl(file);
    updateFaceplate({ textureUrl: dataUrl });
  };
  const handleFaceplateTextureRemove = () => updateFaceplate({ textureUrl: null });

  // The <model-viewer> custom element ships as a browser-only module (it
  // touches `customElements`/WebGL at import time), so it must load client
  // side only — importing it at the top of the file would crash Next.js's
  // server render pass. Elements already in the DOM upgrade automatically
  // once the definition registers, so a plain mount-time import is enough.
  useEffect(() => {
    import("@google/model-viewer");
  }, []);

  const applyMaterials = useCallback(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;
    applyAllMaterials(viewer, currentKey, {
      faceplate,
      colorFilter,
      display,
      standVisible: SHOW_STAND,
      colorFilterParts,
      bumper,
      caseMaterial,
      cleanMode,
    }).catch((err) =>
      console.warn("[CasioViewer] material apply failed", err)
    );
  }, [currentKey, faceplate, colorFilter, display, colorFilterParts, bumper, caseMaterial, cleanMode]);

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;
    const onLoad = () => {
      setModelReady(true);
      applyMaterials();
      setShowHint(true);
      const t = setTimeout(() => setShowHint(false), 3200);
      return () => clearTimeout(t);
    };
    viewer.addEventListener("load", onLoad);
    return () => viewer.removeEventListener("load", onLoad);
  }, [applyMaterials]);

  useEffect(() => {
    if (modelReady) applyMaterials();
  }, [modelReady, applyMaterials]);

  const loadWatch = (key: WatchKey) => {
    setModelReady(false);
    setCurrentKey(key);
  };

  const toggleAutoRotate = () => setAutoRotate((prev) => !prev);

  const ctrlActive: CSSProperties = { color: COLORS.accent, background: "rgba(183,217,154,0.12)" };
  const ctrlHover: CSSProperties = { background: "rgba(183,217,154,0.08)", color: COLORS.ink };

  const iconBtnBase: CSSProperties = {
    all: "unset",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: isMobile ? "26px" : "34px",
    height: isMobile ? "26px" : "34px",
    fontSize: "16px",
    lineHeight: 1,
    color: COLORS.inkDim,
    borderRadius: "3px",
    transition: "background .15s ease, color .15s ease",
    boxSizing: "border-box",
  };

  const sideModelBtnBase: CSSProperties = {
    all: "unset",
    cursor: "pointer",
    fontFamily: MONO,
    fontSize: isMobile ? "9.5px" : "11px",
    letterSpacing: ".05em",
    color: COLORS.inkDim,
    padding: isMobile ? "6px 8px" : "9px 14px",
    borderRadius: "3px",
    textAlign: "center",
    width: isMobile ? "auto" : "128px",
    whiteSpace: "nowrap",
    transition: "background .15s ease, color .15s ease",
    boxSizing: "border-box",
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: COLORS.bg,
        color: COLORS.ink,
        fontFamily: SANS,
        overflow: "hidden",
        boxSizing: "border-box",
      }}
    >
      <div style={{ position: "fixed", inset: 0 }}>
        <model-viewer
          ref={viewerRef}
          id="viewer"
          src={watch.src}
          alt={watch.alt}
          camera-controls="true"
          touch-action="pan-y"
          interaction-prompt="none"
          shadow-intensity="1.1"
          shadow-softness="0.9"
          exposure="1.05"
          environment-image="neutral"
          camera-orbit={watch.orbit}
          field-of-view={watch.fov}
          min-camera-orbit="auto auto 1.1m"
          max-camera-orbit="auto auto 4.5m"
          min-field-of-view="18deg"
          max-field-of-view="45deg"
          auto-rotate={autoRotate ? "true" : undefined}
          rotation-per-second={autoRotate ? "18deg" : undefined}
          style={{
            width: "100%",
            height: "100%",
            "--poster-color": "transparent",
            background: `radial-gradient(circle at 50% 38%, ${background} 0%, ${darkenHex(background)} 78%)`,
          } as CSSProperties & Record<string, string>}
        />
      </div>

      <ControlPanel
        modelKey={currentKey}
        background={background}
        onBackgroundChange={setBackground}
        onBackgroundReset={resetBackground}
        colorFilter={colorFilter}
        onColorFilterChange={updateColorFilter}
        onColorFilterTextureUpload={handleColorFilterTextureUpload}
        onColorFilterTextureRemove={handleColorFilterTextureRemove}
        onColorFilterReset={resetColorFilter}
        display={display.value}
        onDisplayChange={setDisplay}
        onDisplayReset={resetDisplay}
        faceplate={faceplate}
        onFaceplateChange={updateFaceplate}
        onFaceplateTextureUpload={handleFaceplateTextureUpload}
        onFaceplateTextureRemove={handleFaceplateTextureRemove}
        onFaceplateReset={resetFaceplate}
        colorFilterParts={colorFilterParts}
        onColorFilterPartChange={updateColorFilterPart}
        onColorFilterPartTextureUpload={handleColorFilterPartTextureUpload}
        onColorFilterPartTextureRemove={handleColorFilterPartTextureRemove}
        onColorFilterPartsReset={resetColorFilterParts}
        onColorFilterPartReset={resetColorFilterPart}
        bumper={bumper}
        onBumperChange={updateBumper}
        onBumperReset={resetBumper}
        caseMaterial={caseMaterial}
        onCaseMaterialChange={updateCaseMaterial}
        onCaseMaterialReset={resetCaseMaterial}
        cleanMode={cleanMode}
        onCleanModeChange={updateCleanMode}
        onCleanModeReset={resetCleanMode}
      />

      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg
          viewBox="0 0 200 200"
          style={{ width: "min(92vh,92vw)", height: "min(92vh,92vw)", opacity: 0.16 }}
        >
          <g stroke="#b7d99a" strokeWidth="1">
            {TICKS.map((t) => (
              <line key={t.key} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} strokeWidth={t.width} />
            ))}
          </g>
        </svg>
      </div>

      <div
        style={{
          position: "fixed",
          left: "50%",
          top: "24px",
          transform: "translateX(-50%)",
          fontFamily: MONO,
          fontSize: "10.5px",
          letterSpacing: ".08em",
          color: COLORS.inkDim,
          zIndex: 5,
          opacity: showHint ? 1 : 0,
          transition: "opacity .6s ease",
          pointerEvents: "none",
          textTransform: "uppercase",
        }}
      >
        drag to orbit · scroll to zoom
      </div>

      <header
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          display: "flex",
          alignItems: isMobile ? "stretch" : "flex-start",
          flexDirection: isMobile ? "column" : "row",
          justifyContent: "space-between",
          gap: isMobile ? "12px" : 0,
          padding: isMobile ? "18px 16px 0 16px" : "26px 30px 0 30px",
          pointerEvents: "none",
          zIndex: 5,
          boxSizing: "border-box",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <BackHomeLink />
          <img
            src="/logo/logo_sm.png"
            alt="zZZ Culture"
            style={{
              height: "40px",
              width: "auto",
              alignSelf: "flex-start",
              display: "block",
              mixBlendMode: "screen",
              pointerEvents: "auto",
            }}
          />
          <h1
            style={{
              margin: 0,
              fontSize: "clamp(20px,3vw,30px)",
              fontWeight: 800,
              letterSpacing: "-0.01em",
              color: COLORS.ink,
            }}
          >
            {watch.title}
          </h1>
          <div
            style={{
              marginTop: "2px",
              fontSize: "12.5px",
              color: COLORS.inkDim,
              maxWidth: "38ch",
              lineHeight: 1.5,
            }}
          >
            {watch.subtitle}
          </div>
        </div>
      </header>

      {/* Model switcher + auto-rotate: a standalone toolbar. On desktop it's
          vertically centered along the left edge; on mobile that spot
          overlaps the header/watch, so it moves to the top right instead. */}
      <div
        style={{
          position: "fixed",
          zIndex: 5,
          pointerEvents: "auto",
          background: "rgba(23,25,22,0.72)",
          border: `1px solid ${COLORS.panelLine}`,
          backdropFilter: "blur(10px)",
          borderRadius: isMobile ? "8px" : "10px",
          padding: isMobile ? "6px" : "10px",
          display: "flex",
          flexDirection: isMobile ? "row" : "column",
          alignItems: "center",
          gap: isMobile ? "4px" : "8px",
          boxSizing: "border-box",
          ...(isMobile
            ? { top: "18px", right: "16px" }
            : { left: "24px", top: "50%", transform: "translateY(-50%)" }),
        }}
      >
        <HoverButton
          active={currentKey === "ae1200"}
          onClick={() => loadWatch("ae1200")}
          base={sideModelBtnBase}
          activeStyle={ctrlActive}
          hoverStyle={ctrlHover}
        >
          AE-1200WHD
        </HoverButton>
        <HoverButton
          active={currentKey === "f91w"}
          onClick={() => loadWatch("f91w")}
          base={sideModelBtnBase}
          activeStyle={ctrlActive}
          hoverStyle={ctrlHover}
        >
          F-91W
        </HoverButton>
        <div
          style={
            isMobile
              ? { width: "1px", height: "18px", background: COLORS.panelLine, margin: "0 2px" }
              : { width: "70%", height: "1px", background: COLORS.panelLine, margin: "2px 0" }
          }
        />
        <HoverButton
          active={autoRotate}
          onClick={toggleAutoRotate}
          base={iconBtnBase}
          activeStyle={ctrlActive}
          hoverStyle={ctrlHover}
          title="Auto-rotate"
          aria-label="Toggle auto-rotate"
        >
          {/* Masked onto a solid box so the icon inherits the button's
              current text color (inkDim/accent) instead of rendering as a
              flat black PNG that would vanish against the dark UI. */}
          <span
            aria-hidden="true"
            style={
              {
                display: "inline-block",
                width: isMobile ? "14px" : "18px",
                height: isMobile ? "14px" : "18px",
                backgroundColor: "currentColor",
                WebkitMaskImage: "url(/360.png)",
                maskImage: "url(/360.png)",
                WebkitMaskSize: "contain",
                maskSize: "contain",
                WebkitMaskRepeat: "no-repeat",
                maskRepeat: "no-repeat",
                WebkitMaskPosition: "center",
                maskPosition: "center",
              } as CSSProperties
            }
          />
        </HoverButton>
      </div>

      <div
        style={{
          position: "fixed",
          left: 0,
          bottom: isMobile ? "64px" : 0,
          zIndex: 5,
          padding: isMobile ? "0 14px 14px 14px" : "0 22px 22px 22px",
          pointerEvents: "none",
        }}
      >
        <img
          src="/logo/logo_lg.png"
          alt="zZZ Culture"
          style={{
            height: isMobile ? "30px" : "35px",
            width: "auto",
            display: "block",
            mixBlendMode: "screen",
          }}
        />
      </div>
    </div>
  );
}

export default CasioViewer;