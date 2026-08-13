import type { Metadata } from "next";
import LearnSubject from "./LearnSubject";

export const metadata: Metadata = {
  title: "Subject",
};

export default async function LearnSubjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 md:px-6 md:py-12">
      <LearnSubject slug={slug} />
    </div>
  );
}
