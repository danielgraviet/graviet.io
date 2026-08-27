import type { Metadata } from "next";
import OrbitTool from "./OrbitTool";

export const metadata: Metadata = {
  title: "Orbit",
  description: "A private, lightweight way to keep important relationships close.",
};

export default function OrbitPage() {
  return <OrbitTool />;
}
