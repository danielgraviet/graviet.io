import type { Metadata } from "next";
import MeetCreator from "./MeetCreator";

export const metadata: Metadata = {
  title: "Find a time",
  description: "Create a poll to find a time that works for everyone.",
};

export default function MeetPage() {
  return <MeetCreator />;
}
