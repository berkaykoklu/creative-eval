import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

const DESCRIPTION =
  "A model generates sixty mobile-game ad creatives in ten minutes for nothing. Choosing between them is the part that costs something. Four automatic filters, sixty images rated blind — and a control that proved the best filter was measuring the wrong thing.";

export const metadata: Metadata = {
  metadataBase: new URL("https://creative-eval.berkaykoklu.com"),
  title: "Which AI ad creatives are worth a budget?",
  description: DESCRIPTION,
  openGraph: { title: "Which AI ad creatives are worth a budget?", description: DESCRIPTION, type: "website", locale: "en" },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=Geist+Mono:wght@400;500&display=swap" />
      </head>
      <body>{children}</body>
    </html>
  );
}
