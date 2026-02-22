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
      "Consistent gym routine — strength training most mornings. Movement is the best thing I do for focus and mood.",
  },
  {
    Icon: BookOpen,
    label: "Reading",
    description:
      "Books on technology, philosophy, and business. I try to read something every day, even if only for 15 minutes.",
  },
  {
    Icon: Utensils,
    label: "Food",
    description:
      "I love trying new restaurants and cooking at home. Particularly into anything with bold flavors — Vietnamese, Korean, Mexican.",
  },
  {
    Icon: Plane,
    label: "Travel",
    description:
      "Spent two years living in Vietnam and it permanently changed how I see the world. Always looking for the next trip.",
  },
  {
    Icon: Music,
    label: "Music",
    description:
      "Mostly ambient and lo-fi for focus, hip-hop for everything else. Always open to recommendations.",
  },
  {
    Icon: Sun,
    label: "Morning Routine",
    description:
      "Early riser. Most of my best thinking and deep work happens before 9am. Coffee, no phone, get to it.",
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
