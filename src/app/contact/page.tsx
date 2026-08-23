import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact",
};

const links = [
  {
    label: "GitHub",
    href: "https://github.com/danielgraviet",
    description: "Open source work and projects",
  },
  {
    label: "X",
    href: "https://x.com/lilgrav",
    description: "Follow along",
  },
];

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-xl py-2">
      <h1 className="text-2xl tracking-tight">Elsewhere</h1>
      <p className="mt-2 text-text-secondary">GitHub and X. That&apos;s it.</p>
      <div className="mt-8 space-y-1">
        {links.map((link) => (
          <a
            key={link.label}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className="block py-3 transition-opacity hover:opacity-60"
          >
            <span className="font-medium">{link.label}</span>
            <p className="text-sm text-text-secondary">{link.description}</p>
          </a>
        ))}
      </div>
    </div>
  );
}
