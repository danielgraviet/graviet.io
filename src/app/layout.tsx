import type { Metadata } from "next";
import { Inter, Source_Serif_4 } from "next/font/google";
import SiteFrame from "@/components/SiteFrame";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import "katex/dist/katex.min.css";

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-source-serif",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.graviet.io"),
  title: {
    default: "Daniel Graviet",
    template: "%s | Daniel Graviet",
  },
  description:
    "Daniel Graviet is a CS student at BYU studying the systems underneath machine learning.",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${sourceSerif.variable} ${inter.variable}`}>
      <body className="font-serif antialiased">
        <SiteFrame>{children}</SiteFrame>
        <Analytics />
      </body>
    </html>
  );
}
