import type { Metadata } from "next";
import CasioViewer from "./CasioViewer";

export const metadata: Metadata = {
  title: "Try It Out — ZzzCulture",
};

export default function TryOutPage() {
  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Archivo:wght@500;600;700;800&display=swap"
        rel="stylesheet"
      />
      <CasioViewer />
    </>
  );
}
