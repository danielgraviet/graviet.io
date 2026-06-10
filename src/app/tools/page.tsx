import type { Metadata } from "next";
import SectionHeading from "@/components/SectionHeading";

export const metadata: Metadata = {
  title: "Tools",
};

const sections: {
  heading: string;
  items: { name: string; description: string }[];
}[] = [
  {
    heading: "Hardware",
    items: [
      { name: "MacBook Pro M3", description: "Primary machine for everything." },
      { name: "HomePC", description: "My homebuilt PC. RTX 3090, 64GB RAM. Linux Mint." },
      { name: "iPhone 15 Pro", description: "Daily driver." },
      { name: "AirPods Pro", description: "Noise cancellation for deep work sessions." },
    ],
  },
  {
    heading: "Development",
    items: [
      { name: "VS Code", description: "Editor of choice with Claude Code CLI" },
      { name: "Alacritty", description: "Used to be Warp, but went for CPU friendly terminal." },
      { name: "Claude Code", description: "AI coding assistant built into the terminal." },
    ],
  },
  {
    heading: "Stack",
    items: [
      { name: "Next.js", description: "Go-to framework for web apps and this site." },
      { name: "TypeScript", description: "Strongly typed JavaScript everywhere." },
      { name: "Tailwind CSS", description: "Utility-first styling." },
      { name: "Vercel", description: "Deployment and hosting." },
    ],
  },
  {
    heading: "Apps & Services",
    items: [
      { name: "Notion", description: "Notes, projects, and long-form thinking." },
      { name: "Safari", description: "Browser of choice. CPU efficient and optimized for Mac hardware." },
    ],
  },
];

export default function ToolsPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8 md:px-6 md:py-12">
      <SectionHeading title="Tools" subtitle="What I use to get things done" />
      <div className="space-y-12">
        {sections.map((section) => (
          <div key={section.heading}>
            <p className="mb-4 text-sm font-semibold text-text-secondary">
              {section.heading}
            </p>
            <div className="border-t border-border">
              {section.items.map((item) => (
                <div
                  key={item.name}
                  className="flex flex-col gap-0.5 border-b border-border py-4 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4"
                >
                  <span className="shrink-0 text-base font-semibold">{item.name}</span>
                  <span className="text-sm leading-relaxed text-text-secondary">{item.description}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
