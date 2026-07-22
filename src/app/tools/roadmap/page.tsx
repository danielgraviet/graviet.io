import type { Metadata } from "next";
import SectionHeading from "@/components/SectionHeading";
import RoadmapTool from "./RoadmapTool";

export const metadata: Metadata = {
  title: "Learning Roadmap",
};

export default function RoadmapPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 md:px-6 md:py-12">
      <SectionHeading
        title="Learning Roadmap"
        subtitle="Concepts encountered while working, tracked as a checklist."
      />
      <RoadmapTool />
    </div>
  );
}
