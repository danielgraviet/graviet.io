import type { Metadata } from "next";
import { Inter, Source_Serif_4 } from "next/font/google";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
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
        <div className="mx-auto flex min-h-screen max-w-5xl flex-col md:flex-row">
          <Navbar />
          <div className="flex min-w-0 flex-1 flex-col">
            <main className="flex-1 px-4 pb-16 pt-4 md:px-8 md:pt-10 lg:px-12">
              {children}
            </main>
            <Footer />
          </div>
        </div>
        <Analytics />
      </body>
    </html>
  );
}
