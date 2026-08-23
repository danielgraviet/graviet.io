import type { Metadata } from "next";
import SectionHeading from "@/components/SectionHeading";
import LearnStats from "./LearnStats";

export const metadata: Metadata = {
  title: "Learn stats",
};

export default function LearnStatsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 md:px-6 md:py-12">
      <SectionHeading
        title="Stats"
        subtitle="A weekly look at retention, weak spots, and what's coming due."
      />
      <LearnStats />
    </div>
  );
}
