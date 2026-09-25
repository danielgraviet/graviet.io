import type { Metadata } from "next";
import WorkloadTab from "./WorkloadTab";

export const metadata: Metadata = {
  title: "Benchmark workload tab",
  robots: { index: false },
};

export default async function WorkloadPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const tab = Number((await searchParams).tab) || 0;
  return <WorkloadTab tab={tab} />;
}
