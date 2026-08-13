import type { Metadata } from "next";
import SectionHeading from "@/components/SectionHeading";
import LearnHub from "./LearnHub";

export const metadata: Metadata = {
  title: "Learn",
};

export default function LearnPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 md:px-6 md:py-12">
      <SectionHeading
        title="Learn"
        subtitle="Curriculum, custom subjects, and a daily quiz queue so concepts stick."
      />
      <LearnHub />
    </div>
  );
}
