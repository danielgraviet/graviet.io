import type { Metadata } from "next";
import LearnTopic from "./LearnTopic";

export const metadata: Metadata = {
  title: "Topic",
};

export default async function LearnTopicPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 md:px-6 md:py-12">
      <LearnTopic id={Number(id)} />
    </div>
  );
}
