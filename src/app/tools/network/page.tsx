import type { Metadata } from "next";
import NetworkTool from "./NetworkTool";

export const metadata: Metadata = { title: "Network" };

export default function NetworkPage() {
  return <NetworkTool />;
}
