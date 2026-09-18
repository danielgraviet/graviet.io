import type { Metadata } from "next";
import TimeZoneConverter from "./TimeZoneConverter";

export const metadata: Metadata = {
  title: "Time Zones",
  description: "Compare Utah, Croatia, and San Francisco time at a glance.",
};

export default function TimeZonesPage() {
  return <TimeZoneConverter />;
}
