import { plaidRequest, storePlaidItem } from "@/lib/budget";
import { budgetJson, budgetUnauthorized, requireBudgetSession } from "@/lib/budget-http";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!requireBudgetSession(request)) return budgetUnauthorized();
  const body = await budgetJson(request);
  if (!body || typeof body.publicToken !== "string") {
    return Response.json({ error: "A Plaid public token is required." }, { status: 400 });
  }
  try {
    const exchange = await plaidRequest<{ access_token: string; item_id: string }>("/item/public_token/exchange", {
      public_token: body.publicToken,
    });
    const accounts = Array.isArray(body.accounts) ? body.accounts : [];
    const storedAccounts = await storePlaidItem({
      itemId: exchange.item_id,
      accessToken: exchange.access_token,
      accounts: accounts.filter((account): account is { id: string; name?: string; mask?: string | null; type?: string; subtype?: string | null } =>
        Boolean(account && typeof account === "object" && typeof (account as { id?: unknown }).id === "string"),
      ),
    });
    return Response.json({ accounts: storedAccounts });
  } catch (error) {
    console.error("budget exchange failed", error);
    return Response.json({ error: error instanceof Error ? error.message : "Unable to connect the account." }, { status: 500 });
  }
}
