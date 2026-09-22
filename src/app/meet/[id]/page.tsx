import type { Metadata } from "next";
import { getPoll } from "@/lib/meetings";
import MeetingPollPage from "./MeetingPollPage";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const poll = await getPoll(id);
  return {
    title: poll?.title ?? "Meeting poll",
    description: poll ? `Choose the times you can make it for ${poll.title}.` : "Find a time that works for everyone.",
    openGraph: { title: poll?.title ?? "Meeting poll", description: "Pick the times you can make it and find a time for everyone." },
  };
}

export default async function PollPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <MeetingPollPage id={id} />;
}
