import type { Metadata } from "next";
import BrowserBenchmark from "./BrowserBenchmark";

export const metadata: Metadata = {
  title: "Browser benchmark",
  description: "Small, repeatable page-level tests for comparing Safari, Arc, Chrome, and Brave on the same machine.",
};

export default function BrowserBenchmarkPage() {
  return <BrowserBenchmark />;
}
