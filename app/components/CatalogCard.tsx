"use client";

import { useState } from "react";
import type { CatalogItem } from "../data";

interface CatalogCardProps {
  item: CatalogItem;
  price: string;
  whatsAppHref: string;
  instagramHref: string;
}

// The order-via-chat overlay shows on hover for pointer devices, but touch
// devices have no hover — there it only opens once the card is tapped, and
// tapping again (or tapping elsewhere) closes it.
export function CatalogCard({ item, price, whatsAppHref, instagramHref }: CatalogCardProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="catalog-card">
      <div
        className="catalog-card-image"
        role="button"
        tabIndex={0}
        onClick={() => setOpen((prev) => !prev)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen((prev) => !prev);
          }
        }}
      >
        <img src={item.img} alt={`${item.name} — ${item.tag}`} />
        <div className={`catalog-card-overlay${open ? " is-open" : ""}`}>
          <a
            className="catalog-card-order-btn"
            href={whatsAppHref}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
          >
            WhatsApp
          </a>
          <a
            className="catalog-card-order-btn"
            href={instagramHref}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
          >
            Instagram
          </a>
        </div>
      </div>
      <div className="catalog-card-meta">
        <div>
          <p className="catalog-card-name">{item.name}</p>
          <span className="catalog-card-tag">{item.tag}</span>
        </div>
        <p className="catalog-card-price">{price}</p>
      </div>
    </div>
  );
}
