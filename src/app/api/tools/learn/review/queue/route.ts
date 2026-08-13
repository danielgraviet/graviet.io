import { getLearnStats, getReviewQueue } from "@/lib/learn/learn";
import { requirePassword, todayLocal, unauthorized } from "@/lib/learn/http";

export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!requirePassword(request)) return unauthorized();
  const today = todayLocal(new URL(request.url).searchParams.get("today"));

  try {
    const [cards, stats] = await Promise.all([
      getReviewQueue(20),
      getLearnStats(today),
    ]);
    return Response.json({ cards, stats });
  } catch (error) {
    console.error("learn review queue failed", error);
    return Response.json({ error: "Failed to load review queue." }, { status: 500 });
  }
}
