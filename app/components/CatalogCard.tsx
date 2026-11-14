import Link from "next/link";
import type { ResolvedBuild } from "../data";
import { CardImageSlider } from "./CardImageSlider";
import { BallDrawCard } from "./ball-draw/BallDrawCard";

interface CatalogCardProps {
  build: ResolvedBuild;
}

/** This build opens with the ball draw instead of going straight to its page. */
const BALL_DRAW_SLUG = "ae1200-cr7";
/** The card shows this instead of the watch, which the draw reveals. */
const BALL_DRAW_TEASER = "/lineups/cr7-portrait.webp";

export function CatalogCard({ build }: CatalogCardProps) {
  const soldOut = build.status === "sold-out";
  const madeToOrder = build.status === "made-to-order";
  const comingSoon = build.status === "coming-soon";
  const alt = `${build.title} — ${build.subtitle}`;

  const isCustomRoyale = build.slug === 'custom-royale';
  const isCustomF91 = build.slug === 'custom-f91';
  const isCustomBuilder = isCustomRoyale || isCustomF91;
  const isBallDraw = build.slug === BALL_DRAW_SLUG;

  const imageBox = (
    <div className={`catalog-card-image${soldOut ? " is-sold-out" : ""}${comingSoon ? " is-coming-soon" : ""}${isCustomRoyale ? " custom-royale-card" : ""}${isCustomF91 ? " custom-f91-card" : ""}${isBallDraw ? " is-ball-draw" : ""}`}>
      {isBallDraw && (
        <span className="catalog-card-badge">
          <span className="catalog-card-badge-dot" aria-hidden />
          New drop · Tap to draw
        </span>
      )}
      {isBallDraw ? (
        <img src={BALL_DRAW_TEASER} alt="CR7 edition: draw to reveal the watch" />
      ) : build.images.length > 1 ? (
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
      {isCustomF91 && (
        <div className="crf" aria-hidden>
          <span className="crf-corner crf-tl" />
          <span className="crf-corner crf-tr" />
          <span className="crf-corner crf-bl" />
          <span className="crf-corner crf-br" />
          <span className="crf-label">[ CUSTOMISE YOUR F-91W ]</span>
        </div>
      )}
    </div>
  );

  const card = (
    <div className="catalog-card">
      {soldOut || comingSoon ? (
        imageBox
      ) : isBallDraw ? (
        <BallDrawCard detailsHref={`/builds/${build.slug}`} label={alt}>
          {imageBox}
        </BallDrawCard>
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
        ) : isCustomF91 ? (
          <div>
            <p className="catalog-card-name">Customise Casio F-91W</p>
            <span className="catalog-card-tag">Casio F-91W</span>
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
            {comingSoon && (
              <span className="catalog-card-price-breakdown catalog-card-one-off">
                One-Offs &amp; Limited Editions
              </span>
            )}
          </div>
        )}
        {isBallDraw ? (
          <p className="catalog-card-reveal">Draw to reveal</p>
        ) : (
          !isCustomBuilder && !comingSoon && <p className="catalog-card-price">{build.formattedPrice}</p>
        )}
      </div>
    </div>
  );

  return card;
}
