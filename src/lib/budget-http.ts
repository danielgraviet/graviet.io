import { verifyBudgetAuthCookie, verifyToolsAuthCookie } from "@/lib/tools-auth";

export function requireBudgetSession(request: Request) {
  const cookie = request.headers.get("cookie");
  return verifyBudgetAuthCookie(cookie) || verifyToolsAuthCookie(cookie);
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
