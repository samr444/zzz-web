import Link from "next/link";
import { formatINR } from "../data";
import type { ResolvedBuild } from "../data";

interface CatalogCardProps {
  build: ResolvedBuild;
}

export function CatalogCard({ build }: CatalogCardProps) {
  const soldOut = build.status === "sold-out";
  const madeToOrder = build.status === "made-to-order";

  const imageBox = (
    <div className={`catalog-card-image${soldOut ? " is-sold-out" : ""}`}>
      <img src={build.images[0]} alt={`${build.title} — ${build.subtitle}`} />
      {soldOut && <span className="catalog-card-sold-out-badge">Sold Out</span>}
    </div>
  );

  return (
    <div className="catalog-card">
      {soldOut ? (
        imageBox
      ) : (
        <Link href={`/builds/${build.slug}`} className="catalog-card-image-link">
          {imageBox}
        </Link>
      )}
      <div className="catalog-card-meta">
        <div>
          <p className="catalog-card-name">{build.title}</p>
          <span className="catalog-card-tag">
            {build.subtitle}
            {madeToOrder ? " · Made to Order" : ""}
          </span>
          <span className="catalog-card-price-breakdown">
            Model {formatINR(build.basePrice)}
            {build.modLines.map((line, i) => (
              <span key={i}> + {line.label} {formatINR(line.amount)}</span>
            ))}
          </span>
        </div>
        <p className="catalog-card-price">{build.formattedPrice}</p>
      </div>
    </div>
  );
}
