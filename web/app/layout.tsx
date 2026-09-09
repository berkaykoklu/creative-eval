import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "creative-eval",
  description:
    "Generating ad creatives is easy. Knowing which ones are any good is the problem. Measuring whether automatic scores agree with human judgement.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body><main>{children}</main></body>
    </html>
  );
}
