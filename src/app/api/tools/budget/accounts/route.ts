import { listBudgetAccounts, setSelectedBudgetAccounts } from "@/lib/budget";
import { budgetJson, budgetUnauthorized, requireBudgetSession } from "@/lib/budget-http";

export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!requireBudgetSession(request)) return budgetUnauthorized();
  try {
    return Response.json({ accounts: await listBudgetAccounts() });
  } catch {
    return Response.json({ error: "Unable to load accounts." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!requireBudgetSession(request)) return budgetUnauthorized();
  const body = await budgetJson(request);
  if (!body) return Response.json({ error: "Send a JSON request body." }, { status: 400 });
  try {
    return Response.json({ accounts: await setSelectedBudgetAccounts(body.accountIds) });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to update accounts." }, { status: 400 });
  }
}
