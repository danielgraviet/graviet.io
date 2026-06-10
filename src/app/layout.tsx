import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import "./globals.css";
import "katex/dist/katex.min.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "graviet.io",
    template: "%s | graviet.io",
  },
  description:
    "Personal website and blog — thoughts on web development, projects, and more.",
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
    <html lang="en" className={inter.variable}>
      <head>
        <link rel="preconnect" href="https://api.fontshare.com" />
        <link
          rel="stylesheet"
          href="https://api.fontshare.com/v2/css?f[]=array@400,700&display=swap"
        />
      </head>
      <body className="antialiased">
        <Navbar />
        <main className="min-h-[calc(100vh-8rem)] pb-24">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
