import type { Metadata } from "next";
import SectionHeading from "@/components/SectionHeading";
import BudgetTool from "./BudgetTool";

export const metadata: Metadata = { title: "Household Budget" };

export default function BudgetPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-6 md:py-12">
      <SectionHeading
        title="Household Budget"
        subtitle="A clear view of where our money goes."
      />
      <BudgetTool />
    </div>
  );
}
