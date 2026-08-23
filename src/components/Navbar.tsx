"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/blog", label: "Writing" },
  { href: "/", label: "Home" },
  { href: "/tools", label: "Tooling" },
] as const;

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  if (href === "/blog") return pathname.startsWith("/blog");
  if (href === "/tools") {
    return pathname.startsWith("/tools") || pathname.startsWith("/interview-tool");
  }
  return false;
}

export default function Navbar() {
  const pathname = usePathname();

  return (
    <header className="px-4 pt-6 pb-2 md:sticky md:top-0 md:flex md:h-screen md:w-56 md:shrink-0 md:flex-col md:px-6 md:py-10 lg:w-64">
      <Link
        href="/"
        className="text-[1.65rem] leading-tight tracking-tight text-foreground"
      >
        Daniel Graviet
      </Link>
      <nav className="mt-5 flex flex-col gap-1.5 pl-3 text-[15px] text-text-secondary md:mt-6">
        {links.map(({ href, label }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              className={`w-fit transition-colors hover:text-foreground ${
                active ? "text-foreground" : ""
              }`}
            >
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-6 flex items-center gap-3 text-foreground md:mt-8">
        <a
          href="https://github.com/danielgraviet"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="GitHub"
          className="opacity-80 transition-opacity hover:opacity-100"
        >
          <GitHubIcon />
        </a>
        <a
          href="https://x.com/lilgrav"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="X"
          className="opacity-80 transition-opacity hover:opacity-100"
        >
          <XIcon />
        </a>
      </div>
    </header>
  );
}

function GitHubIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4.5 w-4.5" aria-hidden>
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}
