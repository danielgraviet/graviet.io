import { updateBudgetTransaction } from "@/lib/budget";
import { budgetJson, budgetUnauthorized, requireBudgetSession } from "@/lib/budget-http";

export const runtime = "nodejs";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!requireBudgetSession(request)) return budgetUnauthorized();
  const body = await budgetJson(request);
  if (!body) return Response.json({ error: "Send a JSON request body." }, { status: 400 });
  const { id } = await context.params;
  try {
    await updateBudgetTransaction({ id: Number(id), categoryId: body.categoryId, saveRule: body.saveRule });
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to update transaction." }, { status: 400 });
  }
}
