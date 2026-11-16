import type { Metadata } from "next";
import { GtaLanding } from "./GtaLanding";
import "./gta.css";

export const metadata: Metadata = { title: "GTA VI Drop | ZzzCulture" };

export default function GtaPage() {
  return <GtaLanding />;
}
