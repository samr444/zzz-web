import Link from "next/link";
import { CatalogCard } from "./components/CatalogCard";
import { UpcomingDropCard } from "./components/UpcomingDropCard";
import { WavyBackground } from "./components/WavyBackground";
import { getLineup, INSTAGRAM_URL, WHATSAPP_NUMBER } from "./data";

const CATEGORY_LABELS = { ae1200: "AE-1200", f91: "F-91W", a158: "A158" } as const;

export default function Home() {
  const lineup = getLineup();
  const builders = lineup.filter((b) => b.category === "custom");
  const categories = (["ae1200", "f91", "a158"] as const)
    .map((id) => ({ id, label: CATEGORY_LABELS[id], builds: lineup.filter((b) => b.category === id) }))
    .filter((c) => c.builds.length > 0);

  return (
    <>
      <header className="nav">
        <div className="nav-inner">
          <Link href="/" className="nav-logo">
            <img src="/logo/logo_text.png" alt="ZzzCulture" />
          </Link>
          <nav className="nav-links">
            <a className="nav-link-scroll" href="#lineup">
              Lineup
            </a>
            <Link href="/one-offs">One-Offs</Link>
            <a className="nav-link-scroll" href="#about">
              About
            </a>
            <Link href="/builds/custom-royale" className="nav-link-accent">Build yours</Link>
          </nav>
        </div>
      </header>

      <section className="hero" id="about">
        <WavyBackground className="hero-waves" />
        <div className="hero-inner">
          <div className="hero-text">
            <p className="hero-eyebrow">Hand-modded Casio watches</p>
            <h1 className="hero-title">Where Craft Meets Culture</h1>
            <p className="hero-copy">Custom Casio mods, hand built.</p>
            <p className="hero-note">Order on Instagram or WhatsApp. We reply directly.</p>
          </div>
          <div className="hero-builders">
            {builders.map((build) => (
              <CatalogCard key={build.slug} build={build} />
            ))}
          </div>
        </div>
      </section>

      <section className="steps" aria-label="How it works">
        <ol className="steps-inner">
          <li><span className="steps-num">01</span>Pick a base</li>
          <li><span className="steps-num">02</span>Design the dial</li>
          <li><span className="steps-num">03</span>We build and ship</li>
        </ol>
      </section>

      {/* SVG filter for electric border — referenced by CatalogCard */}
      <svg aria-hidden style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}>
        <defs>
          <filter id="turbulent-displace" colorInterpolationFilters="sRGB" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="turbulence" baseFrequency="0.02" numOctaves="10" result="noise1" seed="1" />
            <feOffset in="noise1" dx="0" dy="0" result="offsetNoise1">
              <animate attributeName="dy" values="700; 0" dur="6s" repeatCount="indefinite" calcMode="linear" />
            </feOffset>
            <feTurbulence type="turbulence" baseFrequency="0.02" numOctaves="10" result="noise2" seed="1" />
            <feOffset in="noise2" dx="0" dy="0" result="offsetNoise2">
              <animate attributeName="dy" values="0; -700" dur="6s" repeatCount="indefinite" calcMode="linear" />
            </feOffset>
            <feTurbulence type="turbulence" baseFrequency="0.02" numOctaves="10" result="noise1" seed="2" />
            <feOffset in="noise1" dx="0" dy="0" result="offsetNoise3">
              <animate attributeName="dx" values="490; 0" dur="6s" repeatCount="indefinite" calcMode="linear" />
            </feOffset>
            <feTurbulence type="turbulence" baseFrequency="0.02" numOctaves="10" result="noise2" seed="2" />
            <feOffset in="noise2" dx="0" dy="0" result="offsetNoise4">
              <animate attributeName="dx" values="0; -490" dur="6s" repeatCount="indefinite" calcMode="linear" />
            </feOffset>
            <feComposite in="offsetNoise1" in2="offsetNoise2" result="part1" />
            <feComposite in="offsetNoise3" in2="offsetNoise4" result="part2" />
            <feBlend in="part1" in2="part2" mode="color-dodge" result="combinedNoise" />
            <feDisplacementMap in="SourceGraphic" in2="combinedNoise" scale="30" xChannelSelector="R" yChannelSelector="B" />
          </filter>
        </defs>
      </svg>

      <section className="catalog" id="lineup">
        <div className="catalog-inner">
          <p className="catalog-label">Casio Mods</p>
          <nav className="catalog-chips" aria-label="Watch models">
            {categories.map((c) => (
              <a key={c.id} className="catalog-chip" href={`#${c.id}`}>
                {c.label}
              </a>
            ))}
          </nav>

          {categories.map((c, i) => (
            <div key={c.id} id={c.id} className={`catalog-section${i === 0 ? " is-first" : ""}`}>
              <h3 className="catalog-section-heading">{c.label}</h3>
              <div className="catalog-grid">
                {c.id === "ae1200" && <UpcomingDropCard />}
                {c.builds.map((build) => (
                  <CatalogCard key={build.slug} build={build} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="cta">
        <div className="cta-inner">
          <p className="cta-label">Order a mod</p>
          <h2 className="cta-title">Message us</h2>
          <p className="cta-copy">
            Send the model you want on Instagram or WhatsApp — we reply directly.
          </p>
          <div className="cta-actions">
            <a
              className="btn btn-primary"
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              Instagram DM
            </a>
            <a
              className="btn btn-secondary"
              href={`https://wa.me/${WHATSAPP_NUMBER}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              WhatsApp
            </a>
          </div>
        </div>
      </section>

      <footer className="site-footer">
        <div className="site-footer-inner">
          <div>
            <p className="footer-brand">ZzzCulture</p>
            <p className="footer-copy">© 2026 ZzzCulture. Where craft meets culture.</p>
          </div>
          <div className="footer-links">
            <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer">
              Instagram
            </a>
            <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noopener noreferrer">
              WhatsApp
            </a>
            <a href="#">Shipping</a>
            <a href="#">Terms</a>
          </div>
        </div>
      </footer>
    </>
  );
}
