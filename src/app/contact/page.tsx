import type { Metadata } from "next";
import SectionHeading from "@/components/SectionHeading";

export const metadata: Metadata = {
  title: "Contact",
};

const links = [
  {
    label: "GitHub",
    href: "https://github.com/graviet",
    description: "Check out my open source work",
  },
  {
    label: "LinkedIn",
    href: "https://linkedin.com/in/graviet",
    description: "Let's connect professionally",
  },
  {
    label: "Email",
    href: "mailto:hello@graviet.io",
    description: "Drop me a line",
  },
];

export default function ContactPage() {
  return (
    <>
      <SectionHeading
        title="Get in Touch"
        subtitle="I'd love to hear from you"
      />
      <div className="mx-auto max-w-md space-y-4">
        {links.map((link) => (
          <a
            key={link.label}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className="block rounded-lg border border-border bg-white p-5 transition-shadow hover:shadow-md"
          >
            <span className="font-serif text-lg font-semibold text-accent">
              {link.label}
            </span>
            <p className="mt-1 text-sm text-text-secondary">
              {link.description}
            </p>
          </a>
        ))}
      </div>
    </>
  );
}
