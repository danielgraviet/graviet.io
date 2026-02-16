import type { Metadata } from "next";
import SectionHeading from "@/components/SectionHeading";

export const metadata: Metadata = {
  title: "About",
};

const timeline = [
  { year: "2024", event: "Started exploring Next.js and modern React patterns" },
  { year: "2025", event: "Built several full-stack projects with TypeScript" },
  { year: "2026", event: "Launched graviet.io and started writing" },
];

export default function AboutPage() {
  return (
    <>
      <SectionHeading title="About Me" />

      <section className="grid gap-10 md:grid-cols-[1fr_2fr]">
        {/* Photo placeholder */}
        <div className="flex aspect-square items-center justify-center rounded-xl bg-muted text-text-secondary">
          <span className="text-sm">Photo coming soon</span>
        </div>

        <div className="space-y-4 leading-relaxed text-text-secondary">
          <p>
            Hi there! I&apos;m a developer who loves crafting clean, thoughtful
            web experiences. I enjoy working across the stack, but I&apos;m
            especially drawn to the intersection of design and engineering.
          </p>
          <p>
            When I&apos;m not coding, you&apos;ll find me reading, experimenting
            with new tools, or exploring ideas that sit at the edge of what I
            know.
          </p>
          <p>
            This site is my little corner of the internet — a place to share
            projects, writing, and whatever else I&apos;m curious about.
          </p>
        </div>
      </section>

      {/* Timeline */}
      <section className="mt-16">
        <h3 className="mb-6 font-serif text-2xl font-bold">Timeline</h3>
        <ol className="space-y-4 border-l-2 border-border pl-6">
          {timeline.map((item) => (
            <li key={item.year} className="relative">
              <span className="absolute -left-[1.85rem] top-1 h-3 w-3 rounded-full bg-accent" />
              <span className="text-sm font-semibold text-accent">
                {item.year}
              </span>
              <p className="text-text-secondary">{item.event}</p>
            </li>
          ))}
        </ol>
      </section>
    </>
  );
}
