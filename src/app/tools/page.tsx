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
      { name: "iPhone 15 Pro", description: "Daily driver." },
      { name: "AirPods Pro", description: "Noise cancellation for deep work sessions." },
    ],
  },
  {
    heading: "Development",
    items: [
      { name: "VS Code", description: "Editor of choice with Vim keybindings." },
      { name: "iTerm2 + Zsh", description: "Terminal setup with Oh My Zsh." },
      { name: "Claude Code", description: "AI coding assistant built into the terminal." },
      { name: "Cursor", description: "AI-native editor for heavier refactoring tasks." },
      { name: "Postman", description: "API testing and documentation." },
      { name: "TablePlus", description: "Database GUI for Postgres and MySQL." },
    ],
  },
  {
    heading: "Stack",
    items: [
      { name: "Next.js", description: "Go-to framework for web apps and this site." },
      { name: "TypeScript", description: "Strongly typed JavaScript everywhere." },
      { name: "Tailwind CSS", description: "Utility-first styling." },
      { name: "Sanity", description: "CMS powering this site's content." },
      { name: "Vercel", description: "Deployment and hosting." },
    ],
  },
  {
    heading: "Apps & Services",
    items: [
      { name: "Notion", description: "Notes, projects, and long-form thinking." },
      { name: "Raycast", description: "Replaced Spotlight — launcher, clipboard, snippets." },
      { name: "Arc", description: "Browser of choice." },
      { name: "Linear", description: "Issue tracking for personal projects." },
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
            <p className="mb-4 text-xs uppercase tracking-[0.2em] text-text-secondary">
              {section.heading}
            </p>
            <div className="border-t border-border">
              {section.items.map((item) => (
                <div
                  key={item.name}
                  className="flex flex-col gap-0.5 border-b border-border py-4 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4"
                >
                  <span className="shrink-0 text-sm font-semibold">{item.name}</span>
                  <span className="text-xs text-text-secondary">{item.description}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
