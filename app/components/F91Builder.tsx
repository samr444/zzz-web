'use client';

import './royale-builder.css';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
} from 'react';
import F91WPreview from './F91WPreview';
import { LiquidMetalButton } from './LiquidMetalButton';
import { LiquidGradientButton } from './LiquidGradientButton';
import {
  FILTERS,
  byId,
  filterBackground,
  money,
  type DecalFinish,
  type F91Build,
  F91_DEFAULT_BUILD,
  normalizeF91Build,
  priceF91Build,
  f91BuildProperties,
} from '@/lib/f91-catalog';
import { WHATSAPP_NUMBER, INSTAGRAM_URL } from '../data';

const STORAGE_KEY = 'zzz-culture:f91-builder';

function handleRadioKeys(event: React.KeyboardEvent<HTMLElement>) {
  const current = (event.target as HTMLElement).closest?.(
    '[role=radio]'
  ) as HTMLElement | null;
  const group = current?.closest('[role=radiogroup]');
  if (!current || !group) return;
  const options = Array.from(
    group.querySelectorAll<HTMLElement>('[role=radio]')
  );
  const index = options.indexOf(current);
  let target: HTMLElement | undefined;
  if (event.key === 'ArrowRight' || event.key === 'ArrowDown')
    target = options[(index + 1) % options.length];
  if (event.key === 'ArrowLeft' || event.key === 'ArrowUp')
    target = options[(index - 1 + options.length) % options.length];
  if (event.key === 'Home') target = options[0];
  if (event.key === 'End') target = options.at(-1);
  if (!target) return;
  event.preventDefault();
  target.click();
  target.focus();
}

const readFileAsDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

export default function F91Builder() {
  const [build, setBuild] = useState<F91Build>(F91_DEFAULT_BUILD);
  const [toast, setToast] = useState('');
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previewCard = useRef<HTMLDivElement>(null);
  const root = useRef<HTMLDivElement>(null);
  const hydrated = useRef(false);
  const customDecalInputRef = useRef<HTMLInputElement>(null);

  /* ------------------------------------------------ restore saved build */
  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;
    try {
      const encoded =
        new URLSearchParams(window.location.hash.slice(1)).get('build') ||
        sessionStorage.getItem(STORAGE_KEY);
      if (encoded && encoded.length < 4000)
        setBuild(normalizeF91Build(JSON.parse(encoded)));
    } catch {
      /* malformed link — start from default */
    }
  }, []);

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(build));
    } catch {
      /* private mode */
    }
  }, [build]);

  /* ------------------------------------------------ publish preview height */
  useEffect(() => {
    const card = previewCard.current;
    const host = root.current;
    if (!card || !host || typeof ResizeObserver === 'undefined') return;
    const publish = () => {
      host.style.setProperty(
        '--sticky-preview',
        `${Math.round(card.offsetHeight)}px`
      );
    };
    publish();
    const observer = new ResizeObserver(publish);
    observer.observe(card);
    return () => observer.disconnect();
  }, []);

  /* ------------------------------------------------ derived values */
  const pricing = useMemo(() => priceF91Build(build), [build]);
  const properties = useMemo(() => f91BuildProperties(build), [build]);

  const orderUrl = useMemo(() => {
    const lines = [
      "Hi! I'd like to order a Custom F-91W Build.",
      '',
      ...Object.entries(properties).map(([k, v]) => `${k}: ${v}`),
      '',
      `Total: ${money(pricing.total)} ${pricing.currency}`,
    ];
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
      lines.join('\n')
    )}`;
  }, [properties, pricing]);

  const activeFilter = byId(FILTERS, build.displayFilter)!;
  const hasCustomDecal =
    build.decal?.id === 'custom' && !!build.customDecalUrl;
  const watchLabel =
    'Your Casio F-91W: ' + Object.values(properties).join(', ');

  const update = useCallback((patch: Partial<F91Build>) => {
    setBuild((current) => normalizeF91Build({ ...current, ...patch }));
  }, []);

  const showToast = useCallback((message: string) => {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 4000);
  }, []);

  /* ------------------------------------------------ interactions */
  const selectFilter = (id: string) => {
    update({ displayFilter: id, decal: null, customDecalUrl: null });
  };

  const clearFilter = () => {
    update({ displayFilter: 'none' });
  };

  const handleCustomImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    const dataUrl = await readFileAsDataUrl(file);
    update({
      decal: { id: 'custom', finish: 'transparent' },
      customDecalUrl: dataUrl,
      displayFilter: 'none',
    });
  };

  const clearCustomImage = () => {
    update({ decal: null, customDecalUrl: null });
  };

  const setDecalFinish = (finish: DecalFinish) => {
    if (!build.decal) return;
    update({ decal: { ...build.decal, finish } });
  };

  const shareBuild = async () => {
    const url = new URL(window.location.href);
    const { customDecalUrl: _omit, ...shareable } = build;
    url.hash = new URLSearchParams({
      build: JSON.stringify(shareable),
    }).toString();
    if (navigator.share) {
      try {
        await navigator.share({ title: 'My Casio F-91W Build', url: url.href });
        return;
      } catch {
        /* user cancelled */
      }
    }
    try {
      await navigator.clipboard.writeText(url.href);
      showToast('Build link copied.');
    } catch {
      window.history.replaceState(null, '', url);
      showToast('Your build is in the address bar. Copy the URL to share it.');
    }
  };

  const startOver = () => {
    setBuild(F91_DEFAULT_BUILD);
    window.history.replaceState(
      null,
      '',
      window.location.pathname + window.location.search
    );
    showToast('Started a fresh build.');
  };

  const surpriseMe = () => {
    const colours = FILTERS.filter((f) => f.colors);
    const pick = colours[Math.floor(Math.random() * colours.length)];
    setBuild(normalizeF91Build({ displayFilter: pick.id, decal: null }));
    showToast('Here is a random F-91W. Keep tweaking it.');
  };

  /* ------------------------------------------------ render */

  return (
    <div
      className="zzz-royale-builder zzz-f91-builder"
      ref={root}
      onKeyDown={handleRadioKeys}
    >
      <div className="builder">
        {/* ------------------------------------ preview column */}
        <div className="preview-column">
          <div className="preview-sticky">
            <div className="preview-card" ref={previewCard}>
              <div className="preview-caption">
                <span className="preview-instruction">Tap a colour to tint the display.</span>
                <span className="active-caption">
                  {hasCustomDecal
                    ? 'Custom image'
                    : activeFilter?.colors
                      ? activeFilter.name
                      : 'No filter'}
                </span>
              </div>

              <div className="watch-stage">
                <F91WPreview
                  className="watch-canvas"
                  build={build}
                  label={watchLabel}
                />
                <span className="preview-logo" aria-hidden>
                  <img src="/logo/logo_white.png" className="preview-logo-mark" alt="" />
                </span>
              </div>
            </div>

            <section className="build-summary" aria-labelledby="f91-summary-title">
              <div className="summary-heading">
                <h2 className="eyebrow" id="f91-summary-title">
                  YOUR BUILD
                </h2>
                <button type="button" className="text-button" onClick={shareBuild}>
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    width="13"
                    height="13"
                    style={{ verticalAlign: 'middle', marginRight: '5px' }}
                  >
                    <path
                      d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  Share this
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

        {/* ------------------------------------ controls column */}
        <div className="controls-column">
          <div className="intro">
            <p>
              Choose a display colour or upload a custom image for your F-91W.
              Every build is a genuine Casio F-91W rebuilt by hand.
            </p>
            <div className="build-actions">
              <LiquidGradientButton label="Surprise me" onClick={surpriseMe} />
              <LiquidMetalButton label="Start over" onClick={startOver} />
            </div>
          </div>

          {/* 1 · Display colour */}
          <section
            className="option-section"
            aria-labelledby="f91-filter-heading"
          >
            <div className="section-heading">
              <h2 id="f91-filter-heading">
                <span className="step">1</span> Display colour
              </h2>
              <span className="included-label">
                Included
              </span>
            </div>

            <p className="window-description">
              <span>Tints the LCD with a transparent coloured film.</span>
              <span className="current-filter">
                {hasCustomDecal
                  ? 'Custom image active — colour disabled'
                  : activeFilter?.colors
                    ? activeFilter.name
                    : 'No filter'}
              </span>
            </p>

            <fieldset className="filter-fieldset">
              <legend>SOLID COLOURS</legend>
              <div className="color-options" role="radiogroup" aria-label="Solid filter colours">
                {FILTERS.filter((f) => !f.short).map((filter) => {
                  const checked =
                    !hasCustomDecal && build.displayFilter === filter.id;
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
                      disabled={hasCustomDecal}
                    >
                      <span
                        className="color-disc"
                        style={{ background: filterBackground(filter) }}
                      />
                      <span className="color-name">{filter.name}</span>
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <fieldset className="filter-fieldset gradient-fieldset">
              <legend>GRADIENT COLOURS</legend>
              <div
                className="gradient-options"
                role="radiogroup"
                aria-label="Gradient filter colours"
              >
                {FILTERS.filter((f) => f.short).map((filter) => {
                  const checked =
                    !hasCustomDecal && build.displayFilter === filter.id;
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
                      disabled={hasCustomDecal}
                    >
                      <span
                        className="color-disc"
                        style={{ background: filterBackground(filter) }}
                      />
                      <span className="color-name">
                        <b>{filter.short}</b>
                        {filter.direction}
                      </span>
                    </button>
                  );
                })}
              </div>
            </fieldset>

            {!hasCustomDecal && build.displayFilter !== 'none' && (
              <div className="window-actions">
                <button
                  type="button"
                  className="text-button clear-button"
                  onClick={clearFilter}
                >
                  Clear colour
                </button>
              </div>
            )}
          </section>

          {/* 2 · Custom image */}
          <section
            className="option-section"
            aria-labelledby="f91-image-heading"
          >
            <div className="section-heading">
              <h2 id="f91-image-heading">
                <span className="step">2</span> Custom image
              </h2>
              <span className="included-label">
                Included · replaces display colour
              </span>
            </div>

            <fieldset className="decal-fieldset">
              <legend>
                DISPLAY IMAGE
                <span>Your image fills the LCD window</span>
              </legend>

              <div className="decal-options" role="radiogroup" aria-label="Custom image">
                <button
                  type="button"
                  className="decal-option"
                  role="radio"
                  aria-checked={!hasCustomDecal}
                  tabIndex={!hasCustomDecal ? 0 : -1}
                  aria-label={hasCustomDecal ? 'Remove image' : 'No image'}
                  onClick={clearCustomImage}
                >
                  <span className="decal-disc decal-none" aria-hidden />
                  <span>{hasCustomDecal ? 'Remove' : 'None'}</span>
                </button>

                <button
                  type="button"
                  className="decal-option"
                  role="radio"
                  aria-checked={hasCustomDecal}
                  tabIndex={hasCustomDecal ? 0 : -1}
                  aria-label={hasCustomDecal ? 'Change image' : 'Upload your own image'}
                  onClick={() => customDecalInputRef.current?.click()}
                >
                  <span className="decal-disc decal-upload">
                    {build.customDecalUrl ? (
                      <>
                        <img
                          src={build.customDecalUrl}
                          width={52}
                          height={52}
                          alt=""
                          style={{ borderRadius: '50%', objectFit: 'cover', display: 'block' }}
                        />
                        <span className="decal-upload-overlay" aria-hidden>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
                            <circle cx="12" cy="13" r="4"/>
                          </svg>
                        </span>
                      </>
                    ) : (
                      <span className="decal-upload-icon" aria-hidden>+</span>
                    )}
                  </span>
                  <span>{hasCustomDecal ? 'Change' : 'Custom'}</span>
                </button>

                <input
                  ref={customDecalInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleCustomImageUpload}
                />
              </div>

              {hasCustomDecal && (
                <div className="decal-finish">
                  <span>Decal finish</span>
                  <div
                    role="radiogroup"
                    aria-label="Decal finish"
                    className="decal-finish-options"
                  >
                    <button
                      type="button"
                      className="decal-finish-option"
                      role="radio"
                      aria-checked={build.decal?.finish === 'transparent'}
                      tabIndex={build.decal?.finish === 'transparent' ? 0 : -1}
                      onClick={() => setDecalFinish('transparent')}
                    >
                      On
                    </button>
                    <button
                      type="button"
                      className="decal-finish-option"
                      role="radio"
                      aria-checked={build.decal?.finish === 'opaque'}
                      tabIndex={build.decal?.finish === 'opaque' ? 0 : -1}
                      onClick={() => setDecalFinish('opaque')}
                    >
                      Off
                    </button>
                  </div>
                </div>
              )}
            </fieldset>
          </section>

          {/* Price + order CTA */}
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
            <p className="free-shipping-note">Free Shipping</p>
            <p>All builds include a brand new genuine Casio F-91W base watch.</p>
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

      <div
        className={`toast${toast ? ' visible' : ''}`}
        role="status"
        aria-live="polite"
      >
        {toast}
      </div>
    </div>
  );
}
