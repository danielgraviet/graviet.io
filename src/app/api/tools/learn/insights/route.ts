import { getLearnInsights } from "@/lib/learn/learn";
import { requirePassword, todayLocal, unauthorized } from "@/lib/learn/http";

export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!requirePassword(request)) return unauthorized();
  const today = todayLocal(new URL(request.url).searchParams.get("today"));

  try {
    const insights = await getLearnInsights(today);
    return Response.json({ insights });
  } catch (error) {
    console.error("learn insights failed", error);
    return Response.json({ error: "Failed to load insights." }, { status: 500 });
  }
}
