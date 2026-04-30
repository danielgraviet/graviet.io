import type { Metadata } from "next";
import SectionHeading from "@/components/SectionHeading";
import { Dumbbell, BookOpen, Utensils, Plane, Music, Sun } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const metadata: Metadata = {
  title: "Lifestyle",
};

const interests: { Icon: LucideIcon; label: string; description: string }[] = [
  {
    Icon: Dumbbell,
    label: "Fitness",
    description:
      "Fan of the gym. I've seen it help a lot with focus and mood.",
  },
  {
    Icon: BookOpen,
    label: "Reading",
    description:
      "Books on technology, philosophy, and business. I try to read something every day.",
  },
  {
    Icon: Music,
    label: "Music",
    description:
      "Rain sounds for focus is underrated. You should definitely try it if you haven&apos;t.",
  },
  {
    Icon: Sun,
    label: "Morning Routine",
    description:
      "I do like the mornings. I feel the best when I start the day of strong.",
  },
];

export default function LifestylePage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8 md:px-6 md:py-12">
      <SectionHeading title="Lifestyle" subtitle="How I spend my time outside of work" />
      <div className="border-t border-border">
        {interests.map(({ Icon, label, description }) => (
          <div key={label} className="flex gap-4 border-b border-border py-6">
            <span className="mt-0.5 shrink-0 text-text-secondary">
              <Icon className="h-5 w-5" />
            </span>
            <div className="space-y-1">
              <p className="text-sm font-semibold">{label}</p>
              <p className="text-sm leading-relaxed text-text-secondary">{description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
