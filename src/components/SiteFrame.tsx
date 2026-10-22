"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function SiteFrame({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  if (pathname.startsWith("/gt")) {
    return <main className="min-h-screen">{children}</main>;
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-5xl flex-col md:flex-row">
      <Navbar />
      <div className="flex min-w-0 flex-1 flex-col">
        <main className="flex-1 px-4 pb-16 pt-4 md:px-8 md:pt-10 lg:px-12">
          {children}
        </main>
        <Footer />
      </div>
    </div>
  );
}
