export interface CatalogItem {
  name: string;
  img: string;
  tag: string;
  price: number;
}

// Images are pre-cropped to each watch's content bounding box (see
// public/lineups/normalized/) so every card scales the watch to roughly
// the same visual size despite the source photos having wildly different
// amounts of background padding baked in.
export const catalogItems: CatalogItem[] = [
  { name: "Casio AE-1200WHD", img: "/lineups/normalized/ae1200_3color_black_strap.png", tag: "3-Color Black", price: 4999 },
  { name: "Casio AE-1200WHD", img: "/lineups/normalized/ae1200_3color.png", tag: "3-Color", price: 5499 },
  { name: "Casio F-91W", img: "/lineups/normalized/blue_f91_luffy.png", tag: "Luffy Blue", price: 2499 },
  { name: "Casio A158WA-1", img: "/lineups/normalized/casio_a158_naruto.png", tag: "Naruto", price: 2999 },
  { name: "Casio A158WA-1", img: "/lineups/normalized/a158_green_filter.png", tag: "Green Filter", price: 2499 },
  { name: "Casio DW-291H", img: "/lineups/normalized/casio-dw-291h-red.png", tag: "Red Filter", price: 4095 },
  { name: "Casio AE-1200WHD", img: "/lineups/normalized/casio-ae-1200whd.png", tag: "Yellow Filter", price: 4495 },
];

export function formatInr(amount: number): string {
  return `₹${amount.toLocaleString("en-IN")}`;
}
