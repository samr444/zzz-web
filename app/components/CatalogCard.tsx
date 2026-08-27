"use client";

import { useState } from "react";
import type { ResolvedBuild } from "../data";

interface CatalogCardProps {
  build: ResolvedBuild;
}

// The order-via-chat overlay shows on hover for pointer devices, but touch
// devices have no hover — there it only opens once the card is tapped, and
// tapping again (or tapping elsewhere) closes it.
export function CatalogCard({ build }: CatalogCardProps) {
  const [open, setOpen] = useState(false);
  const soldOut = build.status === "sold-out";
  const madeToOrder = build.status === "made-to-order";

  return (
    <div className="catalog-card">
      <div
        className={`catalog-card-image${soldOut ? " is-sold-out" : ""}`}
        role={soldOut ? undefined : "button"}
        tabIndex={soldOut ? undefined : 0}
        onClick={soldOut ? undefined : () => setOpen((prev) => !prev)}
        onKeyDown={
          soldOut
            ? undefined
            : (e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setOpen((prev) => !prev);
                }
              }
        }
      >
        <img src={build.images[0]} alt={`${build.title} — ${build.subtitle}`} />
        {soldOut ? (
          <span className="catalog-card-sold-out-badge">Sold Out</span>
        ) : (
          <div className={`catalog-card-overlay${open ? " is-open" : ""}`}>
            <a
              className="catalog-card-order-btn"
              href={build.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
            >
              WhatsApp
            </a>
            <a
              className="catalog-card-order-btn"
              href={build.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
            >
              Instagram
            </a>
          </div>
        )}
      </div>
      <div className="catalog-card-meta">
        <div>
          <p className="catalog-card-name">{build.title}</p>
          <span className="catalog-card-tag">
            {build.subtitle}
            {madeToOrder ? " · Made to Order" : ""}
          </span>
        </div>
        <p className="catalog-card-price">{build.formattedPrice}</p>
      </div>
    </div>
  );
}
