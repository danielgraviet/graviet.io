import { plaidRequest } from "@/lib/budget";
import { budgetUnauthorized, requireBudgetSession } from "@/lib/budget-http";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!requireBudgetSession(request)) return budgetUnauthorized();
  try {
    const redirectUri = process.env.PLAID_REDIRECT_URI;
    if (process.env.PLAID_ENV === "production" && !redirectUri) {
      throw new Error("PLAID_REDIRECT_URI is required for the Wells Fargo production OAuth flow.");
    }
    const data = await plaidRequest<{ link_token: string }>("/link/token/create", {
      client_name: "Graviet Household Budget",
      country_codes: ["US"],
      language: "en",
      products: ["transactions"],
      user: { client_user_id: "graviet-household" },
      ...(redirectUri ? { redirect_uri: redirectUri } : {}),
    });
    return Response.json({ linkToken: data.link_token });
  } catch (error) {
    console.error("budget link token failed", error);
    return Response.json({ error: error instanceof Error ? error.message : "Unable to start Wells Fargo connection." }, { status: 500 });
  }
}
