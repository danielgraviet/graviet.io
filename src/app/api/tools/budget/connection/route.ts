import { disconnectBudgetAccounts } from "@/lib/budget";
import { budgetUnauthorized, requireBudgetSession } from "@/lib/budget-http";

export const runtime = "nodejs";

export async function DELETE(request: Request) {
  if (!requireBudgetSession(request)) return budgetUnauthorized();
  try {
    return Response.json(await disconnectBudgetAccounts());
  } catch (error) {
    console.error("budget disconnect failed", error);
    return Response.json({ error: "Unable to remove the connected account." }, { status: 500 });
  }
}
