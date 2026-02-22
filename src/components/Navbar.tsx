import Link from "next/link";
import { Home, User, BookOpen, FolderOpen, Mail } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const links: { href: string; label: string; Icon: LucideIcon }[] = [
  { href: "/", label: "Home", Icon: Home },
  { href: "/about", label: "About", Icon: User },
  { href: "/blog", label: "Blog", Icon: BookOpen },
  { href: "/projects", label: "Projects", Icon: FolderOpen },
  { href: "/contact", label: "Contact", Icon: Mail },
];

export default function Navbar() {
  return (
    <>
      {/* Top bar — logo only */}
      <header className="sticky top-0 z-50 bg-background/90 backdrop-blur-sm">
        <div className="mx-auto max-w-6xl px-4 py-3 md:px-6">
          <Link href="/" className="text-lg font-black uppercase tracking-wide">
            GRAVIET
          </Link>
        </div>
      </header>

      {/* Bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/90 backdrop-blur-sm">
        <ul className="mx-auto flex max-w-md items-center justify-around px-2 py-1">
          {links.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="flex flex-col items-center gap-1 px-4 py-2.5 text-text-secondary transition-colors hover:text-foreground"
              >
                <link.Icon className="h-6 w-6" />
                <span className="text-[10px] font-medium uppercase tracking-wide">
                  {link.label}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
