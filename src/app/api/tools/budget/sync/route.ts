import { syncBudgetTransactions } from "@/lib/budget";
import { budgetUnauthorized, requireBudgetSession } from "@/lib/budget-http";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!requireBudgetSession(request)) return budgetUnauthorized();
  try {
    return Response.json(await syncBudgetTransactions());
  } catch (error) {
    console.error("budget sync failed", error);
    return Response.json({ error: error instanceof Error ? error.message : "Unable to sync transactions." }, { status: 500 });
  }
}
