"use client";

import { useState, type ChangeEvent, type ReactNode } from "react";
import "./ControlPanel.css";
import useIsMobile from "./useIsMobile";


type ColorFilterState = {
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
};

type MaterialState = {
  touched: boolean;
  color: string;
  materialType: "plastic" | "metallic";
  glossiness: number;
  textureUrl?: string | null;
  scaleX?: number;
  scaleY?: number;
  offsetX?: number;
  offsetY?: number;
  repeat?: boolean;
};

type DisplayValue = "positive" | "negative";

type CleanPart = {
  touched: boolean;
  value: boolean;
};

type CleanModeState = {
  faceplate: CleanPart;
  case: CleanPart;
};

type ColorFilterPartKey = "dial" | "mute" | "map" | "main";

type Patch<T> = Partial<T>;

type ToggleOption<T> = {
  label: string;
  value: T;
};

const BACKGROUND_PRESETS = ["#ffffff", "#000000", "#1a1330", "#141a33", "#241a66"];
const COLOR_FILTER_PRESETS = ["#e5342b", "#3ecf4a", "#1d4ed8", "#ffe11a", "#7c3aed", "#f2a13c"];

// Dense inspector-panel row: fixed-width label on the left, control(s) on
// the right — the base unit of the whole Framer/Figma-style layout.
const PropRow = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="prop-row">
    <span className="prop-label">{label}</span>
    <div className="prop-control">{children}</div>
  </div>
);

// A section-header reset icon — restores that whole section's state (color,
// enable, material type, glossiness, and any texture scale/offset/repeat)
// back to its defaults in one click.
const ResetButton = ({ onClick, label }: { onClick: () => void; label: string }) => (
  <button type="button" className="icon-btn" onClick={onClick} title={`Reset ${label}`}>
    ↺
  </button>
);

const Section = ({
  title,
  defaultOpen = true,
  right,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  right?: ReactNode;
  children: ReactNode;
}) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="prop-section">
      <div className="prop-section-header">
        <button type="button" className="prop-section-toggle" onClick={() => setOpen((o) => !o)}>
          <span className={`prop-chevron ${open ? "open" : ""}`}>⌄</span>
          <span className="prop-section-title">{title}</span>
        </button>
        {right}
      </div>
      {open && <div className="prop-section-body">{children}</div>}
    </div>
  );
};

const ColorField = ({ value, onChange }: { value: string; onChange: (value: string) => void }) => (
  <label className="color-field">
    <span className="color-swatch" style={{ background: value }} />
    <input type="color" value={value} onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value)} />
    <span className="color-hex">{value.toUpperCase()}</span>
  </label>
);

const SegmentedToggle = <T,>({
  options,
  value,
  onChange,
}: {
  options: ToggleOption<T>[];
  value: T;
  onChange: (value: T) => void;
}) => (
  <div className="segmented">
    {options.map((opt) => (
      <button
        key={String(opt.value)}
        type="button"
        className={`segmented-btn ${value === opt.value ? "active" : ""}`}
        onClick={() => onChange(opt.value)}
      >
        {opt.label}
      </button>
    ))}
  </div>
);

const UploadRemoveRow = ({
  hasTexture,
  onUpload,
  onRemove,
}: {
  hasTexture: boolean;
  onUpload: (file: File) => void;
  onRemove: () => void;
}) => (
  <div className="upload-row">
    <label className="ghost-btn">
      ⬆ Upload
      <input
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={(e: ChangeEvent<HTMLInputElement>) => {
          const file = e.target.files && e.target.files[0];
          if (file) onUpload(file);
          e.target.value = "";
        }}
      />
    </label>
    {hasTexture && (
      <button type="button" className="ghost-btn danger" onClick={onRemove}>
        Remove
      </button>
    )}
  </div>
);

const Slider = ({
  value,
  min = 0,
  max = 1,
  step = 0.01,
  format,
  onChange,
}: {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  format?: (value: number) => string;
  onChange: (value: number) => void;
}) => (
  <div className="slider-track-row">
    <span className="value-chip">{format ? format(value) : value}</span>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(parseFloat(e.target.value))}
    />
  </div>
);

// The body of a single tinted-material control: enable, texture upload,
// (color + presets + gradient) OR (texture settings once a texture is set),
// and transparency. Shared by F-91W's single Color Filter (ON/OFF segmented)
// and each of AE-1200's Dial/Mute/Map/Main rows (a checkbox, per the design)
// — set `checkboxEnable` to switch which one renders.
const ColorFilterBody = ({
  state,
  onChange,
  onTextureUpload,
  onTextureRemove,
  checkboxEnable = false,
}: {
  state: ColorFilterState;
  onChange: (patch: Patch<ColorFilterState>) => void;
  onTextureUpload: (file: File) => void;
  onTextureRemove: () => void;
  checkboxEnable?: boolean;
}) => {
  const hasTexture = Boolean(state.textureUrl);
  return (
    <>
      <PropRow label="Enable">
        {checkboxEnable ? (
          <input
            type="checkbox"
            className="prop-checkbox"
            checked={state.enabled}
            onChange={(e: ChangeEvent<HTMLInputElement>) => onChange({ enabled: e.target.checked })}
          />
        ) : (
          <SegmentedToggle
            options={[
              { label: "ON", value: true },
              { label: "OFF", value: false },
            ]}
            value={state.enabled}
            onChange={(v) => onChange({ enabled: v })}
          />
        )}
      </PropRow>

      <PropRow label="Texture">
        <UploadRemoveRow hasTexture={hasTexture} onUpload={onTextureUpload} onRemove={onTextureRemove} />
      </PropRow>

      {!hasTexture && (
        <>
          <PropRow label="Color">
            <ColorField value={state.color} onChange={(hex) => onChange({ color: hex })} />
          </PropRow>

          <PropRow label="Presets">
            <div className="preset-row">
              {COLOR_FILTER_PRESETS.map((hex) => (
                <button
                  key={hex}
                  type="button"
                  className={`preset-swatch ${state.color === hex ? "active" : ""}`}
                  style={{ background: hex }}
                  onClick={() => onChange({ color: hex })}
                />
              ))}
            </div>
          </PropRow>

          <PropRow label="Gradient">
            <SegmentedToggle
              options={[
                { label: "ON", value: true },
                { label: "OFF", value: false },
              ]}
              value={state.gradient}
              onChange={(v) => onChange({ gradient: v })}
            />
          </PropRow>
        </>
      )}

      <PropRow label="Transparency">
        <Slider value={state.transparency} format={(v) => v.toFixed(2)} onChange={(v) => onChange({ transparency: v })} />
      </PropRow>

      {hasTexture && (
        <>
          <div className="prop-subhead">Texture Settings</div>
          <PropRow label="Scale X">
            <Slider min={0.1} max={4} value={state.scaleX} format={(v) => v.toFixed(2)} onChange={(v) => onChange({ scaleX: v })} />
          </PropRow>
          <PropRow label="Scale Y">
            <Slider min={0.1} max={4} value={state.scaleY} format={(v) => v.toFixed(2)} onChange={(v) => onChange({ scaleY: v })} />
          </PropRow>
          <PropRow label="Offset X">
            <Slider min={-1} max={1} value={state.offsetX} format={(v) => v.toFixed(2)} onChange={(v) => onChange({ offsetX: v })} />
          </PropRow>
          <PropRow label="Offset Y">
            <Slider min={-1} max={1} value={state.offsetY} format={(v) => v.toFixed(2)} onChange={(v) => onChange({ offsetY: v })} />
          </PropRow>
          <PropRow label="Repeat">
            <input
              type="checkbox"
              className="prop-checkbox"
              checked={state.repeat}
              onChange={(e: ChangeEvent<HTMLInputElement>) => onChange({ repeat: e.target.checked })}
            />
          </PropRow>
        </>
      )}
    </>
  );
};

// A single collapsible row inside the AE-1200 Color Filter accordion
// (Dial / Mute / Map / Main). `open`/`onToggle` are lifted to the parent so
// only one row is open at a time — otherwise expanding one pushes the rest
// out of view. `onReset` restores just this one part to its default.
const PartRow = ({
  label,
  open,
  onToggle,
  onReset,
  children,
}: {
  label: string;
  open: boolean;
  onToggle: () => void;
  onReset: () => void;
  children: ReactNode;
}) => (
  <div className="part-row">
    <div className="part-row-header">
      <button type="button" className="part-row-toggle" onClick={onToggle}>
        <span className={`prop-chevron ${open ? "open" : ""}`}>⌄</span>
        <span>{label}</span>
      </button>
      <button type="button" className="icon-btn" onClick={onReset} title={`Reset ${label}`}>
        ↺
      </button>
    </div>
    {open && <div className="part-row-body">{children}</div>}
  </div>
);

const MaterialFinishBody = ({
  state,
  onChange,
}: {
  state: MaterialState;
  onChange: (patch: Patch<MaterialState>) => void;
}) => (
  <>
    <PropRow label="Color">
      <ColorField value={state.color} onChange={(hex) => onChange({ color: hex })} />
    </PropRow>

    <PropRow label="Type">
      <SegmentedToggle<"plastic" | "metallic">
        options={[
          { label: "Plastic", value: "plastic" },
          { label: "Metallic", value: "metallic" },
        ]}
        value={state.materialType}
        onChange={(v) => onChange({ materialType: v })}
      />
    </PropRow>

    <PropRow label="Finish">
      <div className="slider-track-row">
        <span className="finish-label">Matte</span>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={state.glossiness}
          onChange={(e: ChangeEvent<HTMLInputElement>) => onChange({ glossiness: parseFloat(e.target.value) })}
        />
        <span className="finish-label">Glossy</span>
      </div>
    </PropRow>
  </>
);


type ControlPanelProps = {
  modelKey: "ae1200" | "f91w";
  background: string;
  onBackgroundChange: (value: string) => void;
  onBackgroundReset: () => void;
  colorFilter: ColorFilterState;
  onColorFilterChange: (patch: Patch<ColorFilterState>) => void;
  onColorFilterTextureUpload: (file: File) => void;
  onColorFilterTextureRemove: () => void;
  onColorFilterReset: () => void;
  display: DisplayValue;
  onDisplayChange: (value: DisplayValue) => void;
  onDisplayReset: () => void;
  faceplate: MaterialState & {
    textureUrl: string | null;
    scaleX: number;
    scaleY: number;
    offsetX: number;
    offsetY: number;
    repeat: boolean;
  };
  onFaceplateChange: (patch: Patch<MaterialState>) => void;
  onFaceplateTextureUpload: (file: File) => void;
  onFaceplateTextureRemove: () => void;
  onFaceplateReset: () => void;
  colorFilterParts: Record<ColorFilterPartKey, ColorFilterState>;
  onColorFilterPartChange: (
    key: ColorFilterPartKey,
    patch: Patch<ColorFilterState>
  ) => void;
  onColorFilterPartTextureUpload: (
    key: ColorFilterPartKey,
    file: File
  ) => void;
  onColorFilterPartTextureRemove: (key: ColorFilterPartKey) => void;
  onColorFilterPartsReset: () => void;
  onColorFilterPartReset: (key: ColorFilterPartKey) => void;
  bumper: MaterialState & { enabled: boolean };
  onBumperChange: (patch: Patch<MaterialState & { enabled: boolean }>) => void;
  onBumperReset: () => void;
  caseMaterial: MaterialState;
  onCaseMaterialChange: (patch: Patch<MaterialState>) => void;
  onCaseMaterialReset: () => void;
  cleanMode: CleanModeState;
  onCleanModeChange: (part: keyof CleanModeState, value: boolean) => void;
  onCleanModeReset: () => void;
};

const ControlPanel = ({
  modelKey,
  background,
  onBackgroundChange,
  onBackgroundReset,
  colorFilter,
  onColorFilterChange,
  onColorFilterTextureUpload,
  onColorFilterTextureRemove,
  onColorFilterReset,
  display,
  onDisplayChange,
  onDisplayReset,
  faceplate,
  onFaceplateChange,
  onFaceplateTextureUpload,
  onFaceplateTextureRemove,
  onFaceplateReset,
  colorFilterParts,
  onColorFilterPartChange,
  onColorFilterPartTextureUpload,
  onColorFilterPartTextureRemove,
  onColorFilterPartsReset,
  onColorFilterPartReset,
  bumper,
  onBumperChange,
  onBumperReset,
  caseMaterial,
  onCaseMaterialChange,
  onCaseMaterialReset,
  cleanMode,
  onCleanModeChange,
  onCleanModeReset,
}: ControlPanelProps) => {
  const isMobile = useIsMobile();
  const [expanded, setExpanded] = useState(false);
  const [openPart, setOpenPart] = useState<ColorFilterPartKey | null>(null);
  const isAe1200 = modelKey === "ae1200";
  const togglePart = (key: ColorFilterPartKey) => setOpenPart((prev) => (prev === key ? null : key));

  return (
    <div className={`control-panel ${isMobile ? "mobile" : ""}`}>
      {isMobile && (
        <button type="button" className="sheet-handle" onClick={() => setExpanded((e) => !e)}>
          <span className="sheet-handle-bar" />
          <span>Customize {expanded ? "▾" : "▴"}</span>
        </button>
      )}
      <div className={`control-panel-sections ${isMobile && !expanded ? "collapsed" : ""}`}>
        <Section title="Background" right={<ResetButton onClick={onBackgroundReset} label="Background" />}>
          <PropRow label="Color">
            <ColorField value={background} onChange={onBackgroundChange} />
          </PropRow>
          <PropRow label="Presets">
            <div className="preset-row">
              {BACKGROUND_PRESETS.map((hex) => (
                <button
                  key={hex}
                  type="button"
                  className={`preset-swatch ${background === hex ? "active" : ""}`}
                  style={{ background: hex }}
                  onClick={() => onBackgroundChange(hex)}
                />
              ))}
            </div>
          </PropRow>
        </Section>

        {isAe1200 ? (
          <Section
            title="Color Filter"
            right={<ResetButton onClick={onColorFilterPartsReset} label="all" />}
          >
            <PartRow
              label="Dial"
              open={openPart === "dial"}
              onToggle={() => togglePart("dial")}
              onReset={() => onColorFilterPartReset("dial")}
            >
              <ColorFilterBody
                state={colorFilterParts.dial}
                onChange={(patch) => onColorFilterPartChange("dial", patch)}
                onTextureUpload={(file) => onColorFilterPartTextureUpload("dial", file)}
                onTextureRemove={() => onColorFilterPartTextureRemove("dial")}
                checkboxEnable
              />
            </PartRow>
            <PartRow
              label="Mute"
              open={openPart === "mute"}
              onToggle={() => togglePart("mute")}
              onReset={() => onColorFilterPartReset("mute")}
            >
              <ColorFilterBody
                state={colorFilterParts.mute}
                onChange={(patch) => onColorFilterPartChange("mute", patch)}
                onTextureUpload={(file) => onColorFilterPartTextureUpload("mute", file)}
                onTextureRemove={() => onColorFilterPartTextureRemove("mute")}
                checkboxEnable
              />
            </PartRow>
            <PartRow
              label="Map"
              open={openPart === "map"}
              onToggle={() => togglePart("map")}
              onReset={() => onColorFilterPartReset("map")}
            >
              <ColorFilterBody
                state={colorFilterParts.map}
                onChange={(patch) => onColorFilterPartChange("map", patch)}
                onTextureUpload={(file) => onColorFilterPartTextureUpload("map", file)}
                onTextureRemove={() => onColorFilterPartTextureRemove("map")}
                checkboxEnable
              />
            </PartRow>
            <PartRow
              label="Main"
              open={openPart === "main"}
              onToggle={() => togglePart("main")}
              onReset={() => onColorFilterPartReset("main")}
            >
              <ColorFilterBody
                state={colorFilterParts.main}
                onChange={(patch) => onColorFilterPartChange("main", patch)}
                onTextureUpload={(file) => onColorFilterPartTextureUpload("main", file)}
                onTextureRemove={() => onColorFilterPartTextureRemove("main")}
                checkboxEnable
              />
            </PartRow>
          </Section>
        ) : (
          <Section title="Color Filter" right={<ResetButton onClick={onColorFilterReset} label="Color Filter" />}>
            <ColorFilterBody
              state={colorFilter}
              onChange={onColorFilterChange}
              onTextureUpload={onColorFilterTextureUpload}
              onTextureRemove={onColorFilterTextureRemove}
            />
          </Section>
        )}

        <Section title="Display" right={<ResetButton onClick={onDisplayReset} label="Display" />}>
          <PropRow label="Polarity">
            <SegmentedToggle
              options={[
                { label: "Positive", value: "positive" },
                { label: "Negative", value: "negative" },
              ]}
              value={display}
              onChange={onDisplayChange}
            />
          </PropRow>
        </Section>

        <Section title="Faceplate" right={<ResetButton onClick={onFaceplateReset} label="Faceplate" />}>
          <PropRow label="Color">
            <ColorField value={faceplate.color} onChange={(hex) => onFaceplateChange({ color: hex })} />
          </PropRow>
          <PropRow label="Type">
            <SegmentedToggle<"plastic" | "metallic">
              options={[
                { label: "Plastic", value: "plastic" },
                { label: "Metallic", value: "metallic" },
              ]}
              value={faceplate.materialType}
              onChange={(v) => onFaceplateChange({ materialType: v })}
            />
          </PropRow>
          <PropRow label="Finish">
            <div className="slider-track-row">
              <span className="finish-label">Matte</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={faceplate.glossiness}
                onChange={(e: ChangeEvent<HTMLInputElement>) => onFaceplateChange({ glossiness: parseFloat(e.target.value) })}
              />
              <span className="finish-label">Glossy</span>
            </div>
          </PropRow>
          <PropRow label="Texture">
            <UploadRemoveRow
              hasTexture={Boolean(faceplate.textureUrl)}
              onUpload={onFaceplateTextureUpload}
              onRemove={onFaceplateTextureRemove}
            />
          </PropRow>

          {faceplate.textureUrl && (
            <>
              <div className="prop-subhead">Texture Settings</div>
              <PropRow label="Scale X">
                <Slider min={0.1} max={4} value={faceplate.scaleX} format={(v) => v.toFixed(2)} onChange={(v) => onFaceplateChange({ scaleX: v })} />
              </PropRow>
              <PropRow label="Scale Y">
                <Slider min={0.1} max={4} value={faceplate.scaleY} format={(v) => v.toFixed(2)} onChange={(v) => onFaceplateChange({ scaleY: v })} />
              </PropRow>
              <PropRow label="Offset X">
                <Slider min={-1} max={1} value={faceplate.offsetX} format={(v) => v.toFixed(2)} onChange={(v) => onFaceplateChange({ offsetX: v })} />
              </PropRow>
              <PropRow label="Offset Y">
                <Slider min={-1} max={1} value={faceplate.offsetY} format={(v) => v.toFixed(2)} onChange={(v) => onFaceplateChange({ offsetY: v })} />
              </PropRow>
              <PropRow label="Repeat">
                <input
                  type="checkbox"
                  className="prop-checkbox"
                  checked={faceplate.repeat}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => onFaceplateChange({ repeat: e.target.checked })}
                />
              </PropRow>
            </>
          )}
        </Section>

        {isAe1200 && (
          <>
            {/* Bumper controls hidden for now — not needed yet. State/handlers
                stay wired in props; the bumper simply stays untouched, so
                materialControls' `!bumper.touched` guard keeps it a no-op. */}

            <Section title="Case" right={<ResetButton onClick={onCaseMaterialReset} label="Case" />}>
              <MaterialFinishBody state={caseMaterial} onChange={onCaseMaterialChange} />
            </Section>

            <Section title="Clean Mode" right={<ResetButton onClick={onCleanModeReset} label="Clean Mode" />}>
              <PropRow label="Faceplate">
                <SegmentedToggle
                  options={[
                    { label: "ON", value: true },
                    { label: "OFF", value: false },
                  ]}
                  value={cleanMode.faceplate.value}
                  onChange={(v) => onCleanModeChange("faceplate", v)}
                />
              </PropRow>
              <PropRow label="Case">
                <SegmentedToggle
                  options={[
                    { label: "ON", value: true },
                    { label: "OFF", value: false },
                  ]}
                  value={cleanMode.case.value}
                  onChange={(v) => onCleanModeChange("case", v)}
                />
              </PropRow>
            </Section>
          </>
        )}
      </div>
    </div>
  );
};

export default ControlPanel;