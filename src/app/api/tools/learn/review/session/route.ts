import {
  answerCards,
  BatchReviewConflictError,
  getLearnStats,
  listSubjects,
} from "@/lib/learn/learn";
import { parseReviewBatch } from "@/lib/learn/review-session";
import {
  readJson,
  requirePassword,
  todayLocal,
  unauthorized,
} from "@/lib/learn/http";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await readJson(request);
  if (body instanceof Response) return body;
  if (!requirePassword(request, body)) return unauthorized();

  const reviews = parseReviewBatch(body.reviews);
  if (!reviews || reviews.length === 0) {
    return Response.json(
      { error: "Send between 1 and 50 valid reviews." },
      { status: 400 },
    );
  }
  const today = todayLocal(typeof body.today === "string" ? body.today : null);

  try {
    const saved = await answerCards(reviews, today);
    const globalStats = await getLearnStats(today);
    const subjectSlug =
      typeof body.subjectSlug === "string" ? body.subjectSlug.trim() : "";
    const subject = subjectSlug
      ? (await listSubjects()).find((item) => item.slug === subjectSlug)
      : undefined;
    const stats = {
      ...globalStats,
      due: subject?.dueCount ?? globalStats.due,
    };
    return Response.json({ saved, stats });
  } catch (error) {
    if (error instanceof BatchReviewConflictError) {
      return Response.json(
        {
          error:
            "A card changed in another review session. Your local reviews are still safe.",
        },
        { status: 409 },
      );
    }
    console.error("learn review session save failed", error);
    return Response.json(
      { error: "Failed to save review session." },
      { status: 500 },
    );
  }
}
