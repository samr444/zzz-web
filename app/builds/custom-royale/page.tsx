"use client";

import { useState } from "react";
import Link from "next/link";
import { formatINR, INSTAGRAM_URL, WHATSAPP_NUMBER } from "../../data";

/* ------------------------------------------------------------------ */
/* Option data                                                          */
/* ------------------------------------------------------------------ */

const CASE_OPTIONS = [
  { id: "silver",       label: "Silver",         model: "AE-1200WHD-1AV", price: 3995, image: "/lineups/models/ae1200_silver.png" },
  { id: "black",        label: "Black",          model: "AE-1200WH-1AV",  price: 2995, image: "/lineups/models/ae1200_black.png" },
  { id: "brown",        label: "Brown",          model: "AE-1200WHL-5AV", price: 4495, image: "/lineups/models/ae1200_brown.png" },
  { id: "green",        label: "Green",          model: "AE-1200WHB-3BV", price: 3495, image: "/lineups/models/ae1200_green.png" },
  { id: "black-yellow", label: "Black & Yellow", model: "AE-1200WH-1BV",  price: 2995, image: "/lineups/models/ae1200_black_yellow.png" },
];

const WINDOWS = [
  { key: "w1" as const, label: "Window 1", desc: "Circular compass face — top left",      placeholder: "e.g. Red compass, Luffy face, leave blank for default…" },
  { key: "w2" as const, label: "Window 2", desc: "Thin secondary display — top right",    placeholder: "e.g. Blue tint, custom text…" },
  { key: "w3" as const, label: "Window 3", desc: "Map / mode window — middle right",      placeholder: "e.g. Green overlay, anime character…" },
  { key: "w4" as const, label: "Window 4", desc: "Main time display — bottom",            placeholder: "e.g. Orange gel, custom decal, leave blank for default…" },
];

type WindowKey = "w1" | "w2" | "w3" | "w4";

const ROYALE_FEE = 2000;

const BASE_FEATURES = [
  "Digital display",
  "42.1 mm case width",
  "Resin case",
  "10-year battery life",
  "Japanese Quartz movement",
  "Water resistant to 100 m",
  "Backlight",
  "Day & date display, 12/24 h",
  "5 alarms",
  "Stopwatch",
  "World Time",
  "Countdown timer",
];

/* ------------------------------------------------------------------ */
/* Page                                                                 */
/* ------------------------------------------------------------------ */

export default function CustomRoyalePage() {
  const [selectedCase, setSelectedCase] = useState<string>("silver");
  const [windowIdeas, setWindowIdeas] = useState<Record<WindowKey, string>>({
    w1: "", w2: "", w3: "", w4: "",
  });
  const caseOpt = CASE_OPTIONS.find((c) => c.id === selectedCase)!;
  const total = caseOpt.price + ROYALE_FEE;

  const windowSummary = WINDOWS
    .map((w) => `${w.label}: ${windowIdeas[w.key] || "No preference"}`)
    .join("\n");
  const waText =
    `Hi! I'd like to order a Custom Royale Build.\n\n` +
    `Model: ${caseOpt.model} (${caseOpt.label})\n\n` +
    `Window ideas:\n${windowSummary}\n\n` +
    `Total: ${formatINR(total)}\n\n` +
    `(I'll send reference images here on WhatsApp / Instagram)`;
  const waUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(waText)}`;

  return (
    <>
      <header className="nav">
        <div className="nav-inner">
          <Link href="/" className="nav-logo">
            <img src="/logo/logo_lg.png" alt="ZzzCulture" />
          </Link>
          <nav className="nav-links">
            <Link className="nav-link-scroll" href="/#lineup">Current Lineup</Link>
            <Link className="nav-link-scroll" href="/#about">About</Link>
            <Link href="/try-out">Customize</Link>
          </nav>
        </div>
      </header>

      <main className="build-page">
        <div className="build-page-inner">
          <Link href="/#lineup" className="build-back">← Current Lineup</Link>

          <div className="build-layout">
            {/* ── Gallery ── */}
            <div className="build-gallery">
              <div className="build-main-image-wrap">
                <img
                  className="build-main-image"
                  src="/lineups/custom_royale.png"
                  alt="Custom Royale Build"
                />
              </div>
              <div className="royale-case-options-wrap">
                <img
                  src="/lineups/custom_royale_case_options.png"
                  alt="Case Color Options"
                  className="royale-case-options-img"
                />
              </div>
            </div>

            {/* ── Info ── */}
            <div className="build-info">
              <p className="build-label">Hand-modded Casio · AE-1200</p>
              <h1 className="build-title">Custom Royale Build</h1>

              <p className="build-price-hero">{formatINR(total)}</p>
              <p className="build-shipping-note">Shipping calculated at checkout.</p>

              {/* Step 1 — Available Models */}
              <div className="royale-step">
                <p className="royale-step-heading">
                  <span className="royale-step-num">1</span> Available Models
                </p>
                <div className="royale-model-pills">
                  {CASE_OPTIONS.map((c) => (
                    <button
                      key={c.id}
                      className={`royale-model-pill${selectedCase === c.id ? " is-selected" : ""}`}
                      onClick={() => setSelectedCase(c.id)}
                    >
                      <img className="royale-model-pill-img" src={c.image} alt={c.label} />
                      <span className="royale-model-pill-model">{c.model}</span>
                      <span className="royale-model-pill-label">{c.label}</span>
                      <span className="royale-model-pill-price">{formatINR(c.price)}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 2 — Window Ideas */}
              <div className="royale-step">
                <p className="royale-step-heading">
                  <span className="royale-step-num">2</span> Window Ideas
                </p>
                <p className="royale-windows-hint">
                  Describe what you want on each window — color, character, design, or anything. Leave blank for default. Send reference images directly on WhatsApp or Instagram after ordering.
                </p>
                <div className="royale-windows">
                  {WINDOWS.map((w) => (
                    <div key={w.key} className="royale-window-row royale-window-row--text">
                      <label className="royale-window-label" htmlFor={`win-${w.key}`}>
                        <strong>{w.label}</strong>
                        <span>{w.desc}</span>
                      </label>
                      <input
                        id={`win-${w.key}`}
                        type="text"
                        className="royale-window-input"
                        placeholder={w.placeholder}
                        value={windowIdeas[w.key]}
                        onChange={(e) =>
                          setWindowIdeas((prev) => ({ ...prev, [w.key]: e.target.value }))
                        }
                      />
                    </div>
                  ))}
                </div>
                <p className="royale-image-note">
                  📎 Reference images → send via <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer">Instagram DM</a> or WhatsApp after ordering.
                </p>
              </div>

              {/* Price breakdown */}
              <div className="build-breakdown">
                <div className="build-breakdown-row">
                  <span>Base watch ({caseOpt.label})</span>
                  <span>{formatINR(caseOpt.price)}</span>
                </div>
                <div className="build-breakdown-row">
                  <span>Custom Royale Build fee</span>
                  <span>{formatINR(ROYALE_FEE)}</span>
                </div>
                <div className="build-breakdown-row build-breakdown-total">
                  <span>Total</span>
                  <span>{formatINR(total)}</span>
                </div>
              </div>

              {/* Order */}
              <a className="build-btn-primary" href={waUrl} target="_blank" rel="noopener noreferrer">
                Order on WhatsApp
              </a>
              <a className="build-btn-secondary" href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer">
                Instagram DM
              </a>

              <p className="royale-mto-note">
                Made to order · Processing time 7–10 business days after confirmation.
              </p>

              {/* Base watch features */}
              <div className="royale-features">
                <p className="royale-features-heading">Base Watch Features</p>
                <ul className="royale-features-list">
                  {BASE_FEATURES.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="site-footer">
        <div className="site-footer-inner">
          <div>
            <p className="footer-brand">ZzzCulture</p>
            <p className="footer-copy">© 2026 ZzzCulture. Where craft meets culture.</p>
          </div>
          <div className="footer-links">
            <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer">Instagram</a>
            <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noopener noreferrer">WhatsApp</a>
            <a href="#">Shipping</a>
            <a href="#">Terms</a>
          </div>
        </div>
      </footer>
    </>
  );
}
