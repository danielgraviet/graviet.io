import type { Metadata } from "next";
import InterviewTool from "./InterviewTool";

export const metadata: Metadata = {
  title: "Interview Tool",
};

export default function InterviewToolPage() {
  return <InterviewTool />;
}
