import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getBuild, getLineup, formatINR, INSTAGRAM_URL, WHATSAPP_NUMBER } from "../../data";
import BuildGallery from "../../components/BuildGallery";

export async function generateStaticParams() {
  return getLineup().map((b) => ({ slug: b.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const build = getBuild(slug);
  if (!build) return {};
  return { title: `${build.title} — ${build.subtitle} | ZzzCulture` };
}

export default async function BuildPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const build = getBuild(slug);
  if (!build) notFound();

  const soldOut = build.status === "sold-out";
  const madeToOrder = build.status === "made-to-order";

  return (
    <>
      <header className="nav">
        <div className="nav-inner">
          <Link href="/" className="nav-logo">
            <img src="/logo/logo_lg.png" alt="ZzzCulture" />
          </Link>
          <nav className="nav-links">
            <Link className="nav-link-scroll" href="/#lineup">
              Current Lineup
            </Link>
            <Link className="nav-link-scroll" href="/#about">
              About
            </Link>
            <Link href="/try-out">Customize</Link>
          </nav>
        </div>
      </header>

      <main className="build-page">
        <div className="build-page-inner">
          <Link href="/#lineup" className="build-back">
            ← Current Lineup
          </Link>

          <div className="build-layout">
            {/* ── Left: image gallery ── */}
            <BuildGallery
              images={build.images}
              title={build.title}
              soldOut={soldOut}
            />

            {/* ── Right: product info ── */}
            <div className="build-info">
              <p className="build-label">Hand-modded Casio</p>
              <h1 className="build-title">{build.title}</h1>

              <p className="build-price-hero">{build.formattedPrice}</p>
              <p className="build-shipping-note">Shipping calculated at checkout.</p>

              {/* Mods as pill selectors */}
              {build.modLines.map((line, i) => (
                <div className="build-option-group" key={i}>
                  <p className="build-option-label">{line.label}</p>
                  <div className="build-option-pills">
                    <span className="build-pill is-selected">{line.label}</span>
                    <span className="build-pill-price">{formatINR(line.amount)}</span>
                  </div>
                </div>
              ))}

              {/* Base watch */}
              <div className="build-option-group">
                <p className="build-option-label">Base Watch</p>
                <div className="build-option-pills">
                  <span className="build-pill is-selected">{build.base.displayName}</span>
                  <span className="build-pill-price">{formatINR(build.basePrice)}</span>
                </div>
              </div>

              {madeToOrder && (
                <p className="build-made-to-order-note">
                  This is a made-to-order build. Lead time is 5–10 days after confirmation.
                </p>
              )}

              {/* Price breakdown */}
              <div className="build-breakdown">
                <div className="build-breakdown-row">
                  <span>Base watch</span>
                  <span>{formatINR(build.basePrice)}</span>
                </div>
                {build.modLines.map((line, i) => (
                  <div className="build-breakdown-row" key={i}>
                    <span>{line.label}</span>
                    <span>{formatINR(line.amount)}</span>
                  </div>
                ))}
                <div className="build-breakdown-row build-breakdown-total">
                  <span>Total</span>
                  <span>{build.formattedPrice}</span>
                </div>
              </div>

              {/* Order buttons */}
              {soldOut ? (
                <>
                  <button className="build-btn-disabled" disabled>
                    Sold Out
                  </button>
                  <a
                    className="build-btn-secondary"
                    href={INSTAGRAM_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Join Waitlist on Instagram
                  </a>
                </>
              ) : (
                <>
                  <a
                    className="build-btn-primary"
                    href={build.whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Order on WhatsApp
                  </a>
                  <a
                    className="build-btn-secondary"
                    href={build.instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Instagram DM
                  </a>
                </>
              )}

              <p className="build-donor-note">
                Donor: {build.base.tag}
              </p>
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
