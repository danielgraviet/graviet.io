import { getBudgetDashboard } from "@/lib/budget";
import { budgetUnauthorized, requireBudgetSession } from "@/lib/budget-http";

export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!requireBudgetSession(request)) return budgetUnauthorized();
  try {
    const month = new URL(request.url).searchParams.get("month");
    return Response.json(await getBudgetDashboard(month));
  } catch (error) {
    console.error("budget dashboard failed", error);
    return Response.json({ error: "Unable to load the budget dashboard." }, { status: 500 });
  }
}
