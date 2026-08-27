import type { Metadata } from "next";
import Link from "next/link";
import SectionHeading from "@/components/SectionHeading";

export const metadata: Metadata = {
  title: "Tools",
};

const items: { name: string; description: string; href: string }[] = [
  {
    name: "Orbit",
    description: "Keep important friendships close with a simple relationship pulse.",
    href: "/tools/orbit",
  },
  {
    name: "TTFB Tool",
    description:
      "Measure saved sites from a Daytona sandbox and track TTFB over time.",
    href: "/tools/ttfb",
  },
  {
    name: "Learn",
    description:
      "AI Runtime Systems curriculum, custom subjects, and spaced-repetition quizzes.",
    href: "/tools/learn",
  },
  {
    name: "Work Log",
    description: "Daily work notes with tags, search, and a logging streak.",
    href: "/tools/work-log",
  },
  {
    name: "Household Budget",
    description: "Private shared spending dashboard with Wells Fargo syncing.",
    href: "/tools/budget",
  },
  {
    name: "Interview Timer",
    description: "Timed interview practice with prompts, phases, and notes.",
    href: "/interview-tool",
  },
  {
    name: "Go-Explore Demo",
    description: "How sandbox snapshots let agents branch from saved progress.",
    href: "/daytona-search-demo",
  },
];

export default function ToolsPage() {
  return (
    <div className="mx-auto max-w-2xl py-2">
      <SectionHeading title="Tools" subtitle="Things I built to use" />
      <div className="border-t border-border">
        {items.map((item) => (
          <div
            key={item.name}
            className="flex flex-col gap-0.5 border-b border-border py-4 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4"
          >
            <Link
              href={item.href}
              className="shrink-0 text-base font-semibold underline decoration-border underline-offset-4 transition-colors hover:text-text-secondary"
            >
              {item.name}
            </Link>
            <span className="text-sm leading-relaxed text-text-secondary">
              {item.description}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
