import type { Metadata } from "next";
import SectionHeading from "@/components/SectionHeading";
import WorkLogTool from "./WorkLogTool";

export const metadata: Metadata = {
  title: "Work Log",
};

export default function WorkLogPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 md:px-6 md:py-12">
      <SectionHeading
        title="Work Log"
        subtitle="Daily work notes with tags and search — a storehouse for resumes and reflection."
      />
      <WorkLogTool />
    </div>
  );
}
