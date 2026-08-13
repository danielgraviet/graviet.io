import type { Metadata } from "next";
import SectionHeading from "@/components/SectionHeading";
import LearnReview from "./LearnReview";

export const metadata: Metadata = {
  title: "Review",
};

export default function LearnReviewPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 md:px-6 md:py-12">
      <SectionHeading
        title="Review"
        subtitle="Due cards first. Rate honestly — Again means you’ll see it tomorrow."
      />
      <LearnReview />
    </div>
  );
}
