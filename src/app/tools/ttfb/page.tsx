import type { Metadata } from "next";
import SectionHeading from "@/components/SectionHeading";
import TtfbTool from "./TtfbTool";

export const metadata: Metadata = {
  title: "TTFB Tool",
};

export default function TtfbToolPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 md:px-6 md:py-12">
      <SectionHeading
        title="TTFB Tool"
        subtitle="Measure time to first byte from an ephemeral Daytona sandbox."
      />
      <TtfbTool />
    </div>
  );
}
