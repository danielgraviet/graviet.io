import { createBudgetCategory, listBudgetCategories } from "@/lib/budget";
import { budgetJson, budgetUnauthorized, requireBudgetSession } from "@/lib/budget-http";

export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!requireBudgetSession(request)) return budgetUnauthorized();
  try {
    return Response.json({ categories: await listBudgetCategories() });
  } catch {
    return Response.json({ error: "Unable to load categories." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!requireBudgetSession(request)) return budgetUnauthorized();
  const body = await budgetJson(request);
  if (!body) return Response.json({ error: "Send a JSON request body." }, { status: 400 });
  try {
    return Response.json({ category: await createBudgetCategory(body.name) }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to create category." }, { status: 400 });
  }
}
