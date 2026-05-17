import Link from "next/link";
import { Home } from "lucide-react";

export default function Navbar() {
  return (
    <>
      {/* Top bar — logo only */}
      <header className="sticky top-0 z-50 bg-transparent">
        <div className="mx-auto max-w-6xl px-4 py-3 md:px-6">
          <Link
            href="/"
            className="font-display text-3xl font-bold uppercase tracking-wide transition-opacity hover:opacity-60"
          >
            GRAVIET
          </Link>
        </div>
      </header>

      {/* Bottom home button */}
      <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pb-6">
        <Link
          href="/"
          aria-label="Home"
          className="flex items-center justify-center rounded-full border border-border bg-background/90 p-3 text-text-secondary shadow-sm backdrop-blur-sm transition-colors hover:text-foreground"
        >
          <Home className="h-5 w-5" />
        </Link>
      </div>
    </>
  );
}
