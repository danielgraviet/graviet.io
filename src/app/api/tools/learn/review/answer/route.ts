import { answerCard, getLearnStats, getReviewQueue } from "@/lib/learn/learn";
import { isLearnRating } from "@/lib/learn/sm2";
import { readJson, requirePassword, todayLocal, unauthorized } from "@/lib/learn/http";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await readJson(request);
  if (body instanceof Response) return body;
  if (!requirePassword(request, body)) return unauthorized();

  const cardId = Number(body.cardId);
  if (!Number.isInteger(cardId) || !isLearnRating(body.rating)) {
    return Response.json({ error: "cardId and rating are required." }, { status: 400 });
  }

  const today = todayLocal(typeof body.today === "string" ? body.today : null);

  try {
    const card = await answerCard(cardId, body.rating, today);
    if (!card) return Response.json({ error: "Card not found." }, { status: 404 });
    const [queue, stats] = await Promise.all([
      getReviewQueue(20),
      getLearnStats(today),
    ]);
    return Response.json({ card, cards: queue, stats });
  } catch (error) {
    console.error("learn review answer failed", error);
    return Response.json({ error: "Failed to save review." }, { status: 500 });
  }
}
