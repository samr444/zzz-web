import Link from "next/link";
import type { Metadata } from "next";
import { INSTAGRAM_URL, WHATSAPP_NUMBER } from "../../data";
import F91Builder from "../../components/F91Builder";

export const metadata: Metadata = {
  title: "Custom F-91W Builder | ZzzCulture",
  description:
    "Design your own hand-modded Casio F-91W — choose a display colour or decal and make it yours.",
};

export default function CustomF91Page() {
  return (
    <>
      <header className="nav">
        <div className="nav-inner">
          <Link href="/" className="nav-logo">
            <img src="/logo/logo_text.png" alt="ZzzCulture" />
          </Link>
          <nav className="nav-links">
            <Link className="nav-link-scroll" href="/#lineup">
              Current Lineup
            </Link>
            <Link className="nav-link-scroll" href="/#about">
              About
            </Link>
            {/* <Link href="/try-out">Customize</Link> */}
          </nav>
        </div>
      </header>

      <main>
        <F91Builder />
      </main>

      <footer className="site-footer">
        <div className="site-footer-inner">
          <div>
            <p className="footer-brand">ZzzCulture</p>
            <p className="footer-copy">
              © 2026 ZzzCulture. Where craft meets culture.
            </p>
          </div>
          <div className="footer-links">
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              Instagram
            </a>
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}`}
              target="_blank"
              rel="noopener noreferrer"
            >
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
