import Link from "next/link";
import { BuildCustomWatchButton } from "./components/BuildCustomWatchButton";
import { CatalogCard } from "./components/CatalogCard";
import { getLineup, INSTAGRAM_URL, WHATSAPP_NUMBER } from "./data";

export default function Home() {
  const lineup = getLineup();

  return (
    <>
      <header className="nav">
        <div className="nav-inner">
          <Link href="/" className="nav-logo">
            <img src="/logo/logo_lg.png" alt="ZzzCulture" />
          </Link>
          <nav className="nav-links">
            <a className="nav-link-scroll" href="#lineup">
              Current Lineup
            </a>
            <a className="nav-link-scroll" href="#about">
              About
            </a>
            <Link href="/try-out">Customize</Link>
          </nav>
        </div>
      </header>

      <section className="hero" id="about">
        <div className="hero-inner">
          <h1 className="hero-title">Where Craft Meets Culture</h1>
          <p className="hero-copy">
            Precision engineering meets curated aesthetics. Elevating classic digital
            timepieces for the modern collector.
          </p>
          <div className="hero-cta-wrap">
            <BuildCustomWatchButton />
          </div>
          <div className="hero-image-frame">
            <img src="/hero-mobile.png" alt="ZzzCulture hand-modded Casio instrument panel" />
          </div>
        </div>
      </section>

      <section className="catalog" id="lineup">
        <div className="catalog-inner">
          <p className="catalog-label">Casio Mods</p>
          <h2 className="catalog-title">Current lineup</h2>
          <div className="catalog-grid">
            {lineup.map((build) => (
              <CatalogCard key={build.slug} build={build} />
            ))}
          </div>
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
