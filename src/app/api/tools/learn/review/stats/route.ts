import { getLearnStats } from "@/lib/learn/learn";
import { requirePassword, todayLocal, unauthorized } from "@/lib/learn/http";

export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!requirePassword(request)) return unauthorized();
  const today = todayLocal(new URL(request.url).searchParams.get("today"));

  try {
    const stats = await getLearnStats(today);
    return Response.json({ stats });
  } catch (error) {
    console.error("learn stats failed", error);
    return Response.json({ error: "Failed to load stats." }, { status: 500 });
  }
}
