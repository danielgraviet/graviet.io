import type { Metadata } from "next";
import Link from "next/link";
import { Star } from "lucide-react";
import SectionHeading from "@/components/SectionHeading";

export const metadata: Metadata = {
  title: "Tools",
};

const items: { name: string; description: string; href: string; featured?: boolean }[] = [
  {
    name: "Learning",
    description:
      "AI Runtime Systems curriculum, custom subjects, and spaced-repetition quizzes.",
    href: "/tools/learn",
    featured: true,
  },
  {
    name: "Find a time",
    description: "Create a scheduling poll and see when everyone is available.",
    href: "/tools/meet",
  },
  {
    name: "Orbit",
    description: "Keep important friendships close with a simple relationship pulse.",
    href: "/tools/orbit",
  },
  {
    name: "Time Zones",
    description: "Compare Utah, Croatia, and San Francisco without doing timezone math.",
    href: "/tools/time-zones",
  },
  {
    name: "TTFB Tool",
    description:
      "Measure saved sites from a Daytona sandbox and track TTFB over time.",
    href: "/tools/ttfb",
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
    name: "Browser Benchmark",
    description: "Repeatable page load, interaction, tab, and video tests for comparing browsers.",
    href: "/browser-benchmark",
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
              className={`inline-flex shrink-0 items-center gap-2 text-base font-semibold underline decoration-border underline-offset-4 transition-colors hover:text-text-secondary ${item.featured ? "text-foreground" : ""}`}
            >
              {item.featured && <Star aria-label="Featured" size={16} className="fill-yellow-400 text-yellow-500" />}
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
