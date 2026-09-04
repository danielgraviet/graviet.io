import { getLearnStats, getReviewQueue, listSubjects } from "@/lib/learn/learn";
import { requirePassword, todayLocal, unauthorized } from "@/lib/learn/http";

export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!requirePassword(request)) return unauthorized();
  const searchParams = new URL(request.url).searchParams;
  const today = todayLocal(searchParams.get("today"));
  const subjectSlug = searchParams.get("subject")?.trim() || undefined;

  try {
    const subjects = await listSubjects();
    const subject = subjectSlug
      ? subjects.find((item) => item.slug === subjectSlug)
      : undefined;
    if (subjectSlug && !subject) {
      return Response.json({ error: "Subject not found." }, { status: 404 });
    }
    const [cards, globalStats] = await Promise.all([
      getReviewQueue(50, subjectSlug),
      getLearnStats(today),
    ]);
    const stats = {
      ...globalStats,
      due: subject?.dueCount ?? globalStats.due,
    };
    return Response.json({ cards, stats, subjects });
  } catch (error) {
    console.error("learn review queue failed", error);
    return Response.json({ error: "Failed to load review queue." }, { status: 500 });
  }
}
