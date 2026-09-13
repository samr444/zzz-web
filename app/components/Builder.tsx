'use client';

import './royale-builder.css';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import WatchPreview from './WatchPreview';
import MiniWatch from './MiniWatch';
import ZzzMark from './ZzzMark';
import { LiquidMetalButton } from './LiquidMetalButton';
import { LiquidGradientButton } from './LiquidGradientButton';
import {
  ALL_WINDOWS_PRICE,
  CASES,
  DECALS,
  DECAL_PRICE,
  DECAL_FINISHES,
  DEFAULT_BUILD,
  FILTERS,
  TEXT_REMOVALS,
  TEXT_REMOVAL_PRICE,
  WINDOW_COLOUR_PRICE,
  WINDOWS,
  type Build,
  type DecalFinish,
  byId,
  buildProperties,
  circleDecalName,
  decalById,
  extendGradient,
  filterBackground,
  modelName,
  money,
  normalizeBuild,
  priceBuild,
} from '@/lib/catalog';
import { CASE_IMAGES, decalImage } from '@/lib/assets';
import { INSTAGRAM_URL, WHATSAPP_NUMBER } from '../data';

const STORAGE_KEY = 'zzz-culture:builder';

/** Keyboard support for every `role="radiogroup"` in the builder. */
function handleRadioKeys(event: React.KeyboardEvent<HTMLElement>) {
  const current = (event.target as HTMLElement).closest?.('[role=radio]') as HTMLElement | null;
  const group = current?.closest('[role=radiogroup]');
  if (!current || !group) return;
  const options = Array.from(group.querySelectorAll<HTMLElement>('[role=radio]'));
  const index = options.indexOf(current);
  let target: HTMLElement | undefined;
  if (event.key === 'ArrowRight' || event.key === 'ArrowDown') target = options[(index + 1) % options.length];
  if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') target = options[(index - 1 + options.length) % options.length];
  if (event.key === 'Home') target = options[0];
  if (event.key === 'End') target = options.at(-1);
  if (!target) return;
  event.preventDefault();
  target.click();
  target.focus();
}

/**
 * Decorative artwork. If the CDN is unreachable the image collapses instead of
 * leaving a broken-image glyph in the middle of a swatch or a heading.
 */
function Art({
  src,
  size,
  className,
}: {
  src: string;
  size: number;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return (
    <img
      className={className}
      src={src}
      width={size}
      height={size}
      alt=""
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}

/** Tracks whether the artwork for the current case has arrived. */
function useArtworkReady(build: Build) {
  const caseUrl = CASE_IMAGES[build.case] ?? CASE_IMAGES['resin-silver'];
  const decal = decalById(build.circleDecal?.id);
  const decalUrl = decal ? decalImage(decal.image, decal.ext) : null;
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    let active = true;
    setState('loading');
    const load = (src: string) =>
      new Promise<void>((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve();
        image.onerror = () => reject(new Error(src));
        image.src = src;
      });
    const sources = [caseUrl, decalUrl].filter(Boolean) as string[];
    Promise.all(sources.map(load))
      .then(() => active && setState('ready'))
      .catch(() => active && setState('error'));
    return () => {
      active = false;
    };
  }, [caseUrl, decalUrl]);

  return state;
}

export default function Builder() {
  const [build, setBuild] = useState<Build>(DEFAULT_BUILD);
  const [activeWindow, setActiveWindow] = useState(0);
  const [expanded, setExpanded] = useState({ removal: false });
  const [toast, setToast] = useState('');
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const windowsSection = useRef<HTMLElement>(null);
  const previewCard = useRef<HTMLDivElement>(null);
  const hydrated = useRef(false);

  /* -------------------------------------------------- restore a saved build */
  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;
    try {
      const encoded =
        new URLSearchParams(window.location.hash.slice(1)).get('build') ||
        sessionStorage.getItem(STORAGE_KEY);
      if (encoded && encoded.length < 4000) setBuild(normalizeBuild(JSON.parse(encoded)));
    } catch {
      /* a malformed link just starts from the default build */
    }
  }, []);

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(build));
    } catch {
      /* private mode */
    }
  }, [build]);

  /* -------------------------------------------------- derived values */
  const pricing = useMemo(() => priceBuild(build), [build]);
  const properties = useMemo(() => buildProperties(build), [build]);
  const orderUrl = useMemo(() => {
    const lines = [
      "Hi! I’d like to order a Custom Royale Build.",
      '',
      ...Object.entries(properties).map(([k, v]) => `${k}: ${v}`),
      '',
      `Total: ${money(pricing.total)} ${pricing.currency}`,
    ];
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(lines.join('\n'))}`;
  }, [properties, pricing]);
  const artwork = useArtworkReady(build);
  const window0Decal = decalById(build.circleDecal?.id);
  const activeFilter = byId(FILTERS, build.windows[activeWindow])!;
  const activeIsDecal = activeWindow === 0 && !!build.circleDecal;
  const watchLabel = 'Your Casio Royale: ' + Object.values(properties).join(', ');

  const update = useCallback((patch: Partial<Build>) => {
    setBuild((current) => normalizeBuild({ ...current, ...patch }));
  }, []);

  const showToast = useCallback((message: string) => {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 4000);
  }, []);

  /*
   * Publish the sticky preview's height so the stylesheet can keep scroll
   * targets clear of it. Without this the browser's own scroll-into-view
   * (focus, anchors, `scrollIntoView`) parks a control underneath the preview
   * or the fixed purchase bar, where it can't be tapped.
   */
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const card = previewCard.current;
    const host = root.current;
    if (!card || !host || typeof ResizeObserver === 'undefined') return;
    const publish = () => {
      host.style.setProperty('--sticky-preview', `${Math.round(card.offsetHeight)}px`);
    };
    publish();
    const observer = new ResizeObserver(publish);
    observer.observe(card);
    return () => observer.disconnect();
  }, []);

  /* -------------------------------------------------- interactions */
  const selectWindow = (index: number, { fromPreview = false } = {}) => {
    setActiveWindow(index);
    if (!fromPreview) return;
    // On one-column layouts the controls sit below the sticky preview.
    if (!window.matchMedia('(max-width: 820px)').matches) return;
    const section = windowsSection.current;
    if (!section) return;
    const offset = (previewCard.current?.getBoundingClientRect().height ?? 0) + 12;
    window.scrollTo({
      top: section.getBoundingClientRect().top + window.scrollY - offset,
      behavior: 'smooth',
    });
  };

  const selectFilter = (id: string) => {
    const windows = [...build.windows];
    windows[activeWindow] = id;
    update({
      windows,
      gradientLayout: 'separate',
      ...(activeWindow === 0 ? { circleDecal: null } : {}),
    });
  };

  const selectDecal = (id: string | 'none') => {
    const decal = id === 'none' ? null : decalById(id);
    if (id !== 'none' && !decal) return;
    const windows = [...build.windows];
    windows[0] = 'none';
    update({ windows, circleDecal: decal ? { id: decal.id, finish: decal.finishes[0] } : null });
  };

  const setDecalFinish = (finish: DecalFinish) => {
    if (!build.circleDecal) return;
    update({ circleDecal: { ...build.circleDecal, finish } });
  };

  const applyToAll = () => {
    if (activeIsDecal) return;
    if ((activeFilter.colors?.length ?? 0) > 1) {
      setBuild(extendGradient(build, activeFilter.id));
      showToast(
        build.circleDecal
          ? 'Gradient extended across the thin, map and time windows. Your decal stays in place.'
          : `Gradient extended across all four windows · ${money(ALL_WINDOWS_PRICE)}.`
      );
      return;
    }
    update({
      windows: WINDOWS.map(() => activeFilter.id),
      circleDecal: null,
      gradientLayout: 'separate',
    });
    showToast(`Applied to all four windows · ${money(ALL_WINDOWS_PRICE)}.`);
  };

  const clearWindow = () => {
    const windows = [...build.windows];
    windows[activeWindow] = 'none';
    update({
      windows,
      gradientLayout: 'separate',
      ...(activeWindow === 0 ? { circleDecal: null } : {}),
    });
  };

  const toggleRemoval = (id: string, checked: boolean) => {
    const selected = new Set(build.textRemovals);
    if (checked) selected.add(id);
    else selected.delete(id);
    update({ textRemovals: [...selected] });
  };

  const toggleAllRemovals = (checked: boolean) => {
    update({ textRemovals: checked ? TEXT_REMOVALS.map((option) => option.id) : [] });
  };

  const copyBuild = async () => {
    const url = new URL(window.location.href);
    url.hash = new URLSearchParams({ build: JSON.stringify(build) }).toString();
    try {
      await navigator.clipboard.writeText(url.href);
      showToast('Build link copied.');
    } catch {
      window.history.replaceState(null, '', url);
      showToast('Your build is in the address bar. Copy the URL to share it.');
    }
  };

  const startOver = () => {
    setBuild(DEFAULT_BUILD);
    setActiveWindow(0);
    setExpanded({ removal: false });
    window.history.replaceState(null, '', window.location.pathname + window.location.search);
    showToast('Started a fresh build.');
  };

  const surpriseMe = () => {
    const pick = <T,>(items: T[]) => items[Math.floor(Math.random() * items.length)];
    const colours = FILTERS.filter((filter) => filter.colors);
    const useDecal = Math.random() < 0.35;
    const decal = pick(DECALS);
    setBuild(
      normalizeBuild({
        ...DEFAULT_BUILD,
        case: pick(CASES).id,
        windows: WINDOWS.map(() => pick(colours).id),
        circleDecal: useDecal ? { id: decal.id, finish: decal.finishes[0] } : null,
      })
    );
    showToast('Here is a random Royale. Keep tweaking it.');
  };

  /* -------------------------------------------------- render */

  return (
    <div className="zzz-royale-builder" ref={root} onKeyDown={handleRadioKeys}>

      <div className="builder">
        {/* ------------------------------------------------ preview */}
        <div className="preview-column">
          <div className="preview-sticky">
            <div className="preview-card" ref={previewCard}>
              <div className="preview-caption">
                <span className="preview-instruction">Tap a window to color it.</span>
                <span className="active-caption">
                  0{activeWindow + 1} · {WINDOWS[activeWindow].name} selected
                </span>
              </div>

              <div className="watch-stage" aria-busy={artwork === 'loading'}>
                <WatchPreview
                  className="watch-canvas"
                  build={build}
                  activeWindow={activeWindow}
                  onSelectWindow={(index) => selectWindow(index, { fromPreview: true })}
                  interactive
                  label={watchLabel}
                />
                <span className="preview-logo" aria-hidden>
                  <ZzzMark className="preview-logo-mark" />
                </span>
                {artwork !== 'ready' && (
                  <div className="image-loading">
                    {artwork === 'loading'
                      ? 'Loading your watch preview…'
                      : 'This watch preview could not load. Select your option again to retry.'}
                  </div>
                )}
              </div>
            </div>

            <section className="build-summary" aria-labelledby="summary-title">
              <div className="summary-heading">
                <h2 className="eyebrow" id="summary-title">
                  YOUR BUILD
                </h2>
                <button type="button" className="text-button" onClick={copyBuild}>
                  Copy link to build ↗
                </button>
              </div>
              <dl>
                {Object.entries(properties).map(([label, value]) => (
                  <div key={label} style={{ display: 'contents' }}>
                    <dt>{label}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          </div>
        </div>

        {/* ------------------------------------------------ controls */}
        <div className="controls-column">
          <div className="intro">
            <p>
              Choose the watch, its window colours and the finishing services. Every Royale is a
              genuine Casio AE1200 rebuilt by hand.
            </p>
            <div className="build-actions">
              <LiquidGradientButton label="Surprise me" onClick={surpriseMe} />
              <LiquidMetalButton label="Start over" onClick={startOver} />
            </div>
          </div>

          {/* 1 · Case */}
          <section className="option-section case-section" aria-labelledby="case-heading">
            <div className="section-heading">
              <h2 id="case-heading">
                <span className="step">1</span> Model
              </h2>
              <span className="selection-label">{modelName(build.case)}</span>
            </div>
            <div className="choice-grid case-grid" role="radiogroup" aria-label="Watch model">
              {CASES.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  className="choice"
                  role="radio"
                  aria-checked={build.case === option.id}
                  tabIndex={build.case === option.id ? 0 : -1}
                  onClick={() => update({ case: option.id })}
                >
                  <span className="model-img-wrap">
                    <img
                      className="model-watch-thumb"
                      src={CASE_IMAGES[option.id]}
                      alt={option.name}
                      draggable={false}
                    />
                  </span>
                  <span className="choice-text">
                    <span className="choice-name">{option.model}</span>
                    <span className="choice-description">
                      {option.name} · {money(option.price!)}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </section>

          {/* 2 · Windows */}
          <section className="option-section" aria-labelledby="window-heading" ref={windowsSection}>
            <div className="section-heading">
              <h2 id="window-heading">
                <span className="step">2</span> Windows
              </h2>
              <span className="included-label">
                {money(WINDOW_COLOUR_PRICE)} a window · {money(ALL_WINDOWS_PRICE)} for all four in
                one colour
              </span>
            </div>

            <div className="window-options">
              {WINDOWS.map((window, index) => {
                const decal = index === 0 ? window0Decal : null;
                const filter = byId(FILTERS, build.windows[index])!;
                return (
                  <button
                    key={window.id}
                    type="button"
                    className="window-option"
                    aria-pressed={index === activeWindow}
                    aria-label={`Window ${index + 1}, ${window.name}: ${
                      decal ? circleDecalName(build.circleDecal) : filter.name
                    }`}
                    onClick={() => selectWindow(index)}
                  >
                    <MiniWatch build={build} window={index} activeWindow={activeWindow} />
                    <span>
                      {index + 1} · {window.name}
                    </span>
                    {decal ? (
                      <Art
                        className="window-filter-dot window-decal-dot"
                        src={decalImage(decal.image, decal.ext)}
                        size={14}
                      />
                    ) : (
                      <i className="window-filter-dot" style={{ background: filterBackground(filter) }} />
                    )}
                  </button>
                );
              })}
            </div>

            <p className="window-description">
              <span>{WINDOWS[activeWindow].description}</span>
              <span className="current-filter">
                {activeIsDecal
                  ? circleDecalName(build.circleDecal)
                  : activeFilter.id === 'none'
                    ? 'No filter'
                    : activeFilter.name}
              </span>
            </p>

            {activeWindow === 0 && (
              <fieldset className="decal-fieldset">
                <legend>
                  DECALS <span>{money(DECAL_PRICE)} · Circle only</span>
                </legend>
                <div className="decal-options" role="radiogroup" aria-label="Circle decal">
                  <button
                    type="button"
                    className="decal-option"
                    role="radio"
                    aria-checked={!build.circleDecal}
                    tabIndex={!build.circleDecal ? 0 : -1}
                    onClick={() => selectDecal('none')}
                  >
                    <span className="decal-disc decal-none" aria-hidden />
                    <span>None</span>
                  </button>
                  {DECALS.map((decal) => (
                    <button
                      key={decal.id}
                      type="button"
                      className="decal-option"
                      role="radio"
                      aria-checked={build.circleDecal?.id === decal.id}
                      tabIndex={build.circleDecal?.id === decal.id ? 0 : -1}
                      aria-label={`${decal.name} decal`}
                      onClick={() => selectDecal(decal.id)}
                    >
                      <span className="decal-disc">
                        <Art src={decalImage(decal.image, decal.ext)} size={52} />
                      </span>
                      <span>{decal.name}</span>
                    </button>
                  ))}
                </div>
                {window0Decal && window0Decal.finishes.length > 1 && (
                  <div className="decal-finish">
                    <span>Decal finish</span>
                    <div role="radiogroup" aria-label="Decal finish" className="decal-finish-options">
                      {DECAL_FINISHES.map((finish) => (
                        <button
                          key={finish.id}
                          type="button"
                          className="decal-finish-option"
                          role="radio"
                          aria-checked={build.circleDecal?.finish === finish.id}
                          tabIndex={build.circleDecal?.finish === finish.id ? 0 : -1}
                          onClick={() => setDecalFinish(finish.id)}
                        >
                          {finish.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </fieldset>
            )}

            <fieldset className="filter-fieldset">
              <legend>FILTER COLORS</legend>
              <div className="color-options" role="radiogroup" aria-label="Solid filter colors">
                {FILTERS.filter((filter) => !filter.short).map((filter) => {
                  const checked = !activeIsDecal && build.windows[activeWindow] === filter.id;
                  return (
                    <button
                      key={filter.id}
                      type="button"
                      className="color-option"
                      role="radio"
                      aria-checked={checked}
                      tabIndex={checked ? 0 : -1}
                      data-value={filter.id}
                      aria-label={filter.name}
                      onClick={() => selectFilter(filter.id)}
                    >
                      <span className="color-disc" style={{ background: filterBackground(filter) }} />
                      <span className="color-name">{filter.name}</span>
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <fieldset className="filter-fieldset gradient-fieldset">
              <legend>GRADIENT FILTERS</legend>
              <div className="gradient-options" role="radiogroup" aria-label="Gradient filters">
                {FILTERS.filter((filter) => filter.short).map((filter) => {
                  const checked = !activeIsDecal && build.windows[activeWindow] === filter.id;
                  return (
                    <button
                      key={filter.id}
                      type="button"
                      className="color-option"
                      role="radio"
                      aria-checked={checked}
                      tabIndex={checked ? 0 : -1}
                      aria-label={filter.name}
                      onClick={() => selectFilter(filter.id)}
                    >
                      <span className="color-disc" style={{ background: filterBackground(filter) }} />
                      <span className="color-name">
                        <b>{filter.short}</b>
                        {filter.direction}
                      </span>
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <div className="window-actions">
              {!activeIsDecal && (
                <button
                  type="button"
                  className="outline-button"
                  aria-pressed={
                    (activeFilter.colors?.length ?? 0) > 1 && build.gradientLayout === 'continuous'
                  }
                  onClick={applyToAll}
                >
                  {(activeFilter.colors?.length ?? 0) > 1
                    ? `Extend gradient across all windows · ${money(ALL_WINDOWS_PRICE)}`
                    : `Apply to all 4 windows · ${money(ALL_WINDOWS_PRICE)}`}
                </button>
              )}
              <button type="button" className="text-button clear-button" onClick={clearWindow}>
                Clear this window
              </button>
            </div>
          </section>

          {/* 3 · Text removal */}
          <section
            className="option-section optional-service coming-soon-section"
            data-expanded={false}
            aria-labelledby="removal-heading"
            aria-disabled="true"
          >
            <div className="section-heading">
              <h2 id="removal-heading">
                <span className="step">3</span> Text removal
              </h2>
              <div className="service-heading-actions">
                <span className="coming-soon-badge">Coming soon</span>
              </div>
            </div>
            {expanded.removal && (
              <div>
                <p className="removal-help">
                  Choose the words or analog clock numbers to remove. {money(TEXT_REMOVAL_PRICE)} per
                  watch, regardless of how many you select.
                </p>
                <div className="removal-options">
                  <label
                    className="removal-choice removal-all"
                    data-selected={build.textRemovals.length > 0}
                  >
                    <input
                      type="checkbox"
                      checked={build.textRemovals.length === TEXT_REMOVALS.length}
                      ref={(element) => {
                        if (element)
                          element.indeterminate =
                            build.textRemovals.length > 0 &&
                            build.textRemovals.length < TEXT_REMOVALS.length;
                      }}
                      onChange={(event) => toggleAllRemovals(event.target.checked)}
                    />
                    <span>Remove all</span>
                  </label>
                  {TEXT_REMOVALS.map((option) => {
                    const checked = build.textRemovals.includes(option.id);
                    return (
                      <label key={option.id} className="removal-choice" data-selected={checked}>
                        <input
                          type="checkbox"
                          checked={checked}
                          aria-label={`Remove ${option.name}`}
                          onChange={(event) => toggleRemoval(option.id, event.target.checked)}
                        />
                        <span>{option.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
          </section>

          {/* Price */}
          <section className="price-breakdown" aria-label="Price breakdown">
            <div>
              <span>{pricing.baseName}</span>
              <span>{money(pricing.base)}</span>
            </div>
            <div className="upgrade-prices">
              {pricing.upgrades.map((upgrade) => (
                <div className="upgrade-price" key={upgrade.id}>
                  <span>{upgrade.name}</span>
                  <span>+{money(upgrade.price)}</span>
                </div>
              ))}
            </div>
            <div className="total-line">
              <strong>Your total</strong>
              <strong>
                {money(pricing.total)}
                <span> {pricing.currency}</span>
              </strong>
            </div>
            <p>All builds include a brand new genuine Casio AE1200 base watch.</p>
            <div className="order-cta">
              <a
                className="order-btn-primary"
                href={orderUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Order on WhatsApp
              </a>
              <a
                className="order-btn-secondary"
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                Instagram DM
              </a>
              <p className="order-mto-note">
                Made to order · 7–10 business days after confirmation
              </p>
            </div>
          </section>
        </div>
      </div>

      <div className={`toast${toast ? ' visible' : ''}`} role="status" aria-live="polite">
        {toast}
      </div>

    </div>
  );
}
