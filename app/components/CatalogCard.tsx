import Link from "next/link";
import { formatINR } from "../data";
import type { ResolvedBuild } from "../data";
import { CardImageSlider } from "./CardImageSlider";

interface CatalogCardProps {
  build: ResolvedBuild;
}

export function CatalogCard({ build }: CatalogCardProps) {
  const soldOut = build.status === "sold-out";
  const madeToOrder = build.status === "made-to-order";
  const comingSoon = build.status === "coming-soon";
  const alt = `${build.title} — ${build.subtitle}`;

  const isCustomRoyale = build.slug === 'custom-royale';

  const imageBox = (
    <div className={`catalog-card-image${soldOut ? " is-sold-out" : ""}${comingSoon ? " is-coming-soon" : ""}${isCustomRoyale ? " custom-royale-card" : ""}`}>
      {build.images.length > 1 ? (
        <CardImageSlider images={build.images} alt={alt} soldOut={soldOut} />
      ) : (
        <>
          <img src={build.images[0]} alt={alt} />
          {soldOut && <span className="catalog-card-sold-out-badge">Sold Out</span>}
          {comingSoon && <span className="catalog-card-coming-soon-badge">Coming Soon</span>}
        </>
      )}
      {isCustomRoyale && (
        <div className="crf" aria-hidden>
          <span className="crf-corner crf-tl" />
          <span className="crf-corner crf-tr" />
          <span className="crf-corner crf-bl" />
          <span className="crf-corner crf-br" />
          <span className="crf-label">[ CUSTOMISE YOUR ROYALE ]</span>
        </div>
      )}
    </div>
  );

  const card = (
    <div className="catalog-card">
      {soldOut || comingSoon ? (
        imageBox
      ) : (
        <Link href={`/builds/${build.slug}`} className="catalog-card-image-link">
          {imageBox}
        </Link>
      )}
      <div className="catalog-card-meta">
        {isCustomRoyale ? (
          <div>
            <p className="catalog-card-name">Customise Casio AE1200</p>
            <span className="catalog-card-tag">Casio Royale</span>
          </div>
        ) : (
          <div>
            <p className="catalog-card-name">{build.title}</p>
            {!comingSoon && (
              <span className="catalog-card-tag">
                {build.subtitle}
                {madeToOrder ? " · Made to Order" : ""}
              </span>
            )}
            {comingSoon ? (
              <span className="catalog-card-price-breakdown catalog-card-one-off">
                One-Offs &amp; Limited Editions
              </span>
            ) : (
              <span className="catalog-card-price-breakdown">
                Model {formatINR(build.basePrice)}
                {build.modLines.map((line, i) => (
                  <span key={i}> + {line.label} {formatINR(line.amount)}</span>
                ))}
              </span>
            )}
          </div>
        )}
        {!isCustomRoyale && !comingSoon && (
          <p className="catalog-card-price">{build.formattedPrice}</p>
        )}
      </div>
    </div>
  );

  if (isCustomRoyale) {
    return (
      <div className="ec-wrap">
        <div className="ec-inner" aria-hidden>
          <div className="ec-border-outer">
            <div className="ec-card-face" />
          </div>
          <div className="ec-glow-1" />
          <div className="ec-glow-2" />
        </div>
        <div className="ec-overlay-1" aria-hidden />
        <div className="ec-overlay-2" aria-hidden />
        <div className="ec-bg-glow" aria-hidden />
        {card}
      </div>
    );
  }

  return card;
}
