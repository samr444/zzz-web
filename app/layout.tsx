import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ZzzCulture",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Manrope:wght@500;600;700&family=Inter:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      {/* Browser extensions (e.g. Tsenta, ColorZilla) inject attributes
          like data-tsenta-overlay-* / cz-shortcut-listen onto <html>/<body>
          before React hydrates. suppressHydrationWarning on these two tags
          is the standard fix — see https://react.dev/link/hydration-mismatch */}
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
