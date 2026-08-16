import { verifyBudgetAuthCookie } from "@/lib/tools-auth";

export function requireBudgetSession(request: Request) {
  return verifyBudgetAuthCookie(request.headers.get("cookie"));
}

export function budgetUnauthorized() {
  return Response.json({ error: "Unlock the budget to continue." }, { status: 401 });
}

export async function budgetJson(request: Request) {
  try {
    const body = await request.json();
    return body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  } catch {
    return null;
  }
}
