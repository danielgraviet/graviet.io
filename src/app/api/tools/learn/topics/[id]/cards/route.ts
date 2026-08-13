import { createCard, getTopic, listCards } from "@/lib/learn/learn";
import { readJson, requirePassword, unauthorized } from "@/lib/learn/http";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!requirePassword(request)) return unauthorized();
  const id = Number((await params).id);
  if (!Number.isInteger(id)) {
    return Response.json({ error: "Invalid topic id." }, { status: 400 });
  }

  try {
    const topic = await getTopic(id);
    if (!topic) return Response.json({ error: "Topic not found." }, { status: 404 });
    const cards = await listCards(id);
    return Response.json({ topic, cards });
  } catch (error) {
    console.error("learn cards GET failed", error);
    return Response.json({ error: "Failed to load cards." }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const body = await readJson(request);
  if (body instanceof Response) return body;
  if (!requirePassword(request, body)) return unauthorized();

  const id = Number((await params).id);
  if (!Number.isInteger(id)) {
    return Response.json({ error: "Invalid topic id." }, { status: 400 });
  }

  const front = typeof body.front === "string" ? body.front.trim() : "";
  const back = typeof body.back === "string" ? body.back.trim() : "";
  if (!front || !back) {
    return Response.json({ error: "Front and back are required." }, { status: 400 });
  }

  try {
    const topic = await getTopic(id);
    if (!topic) return Response.json({ error: "Topic not found." }, { status: 404 });
    const card = await createCard({
      topicId: id,
      subjectId: topic.subjectId,
      front,
      back,
      source: body.source === "parsed" || body.source === "tutor" ? body.source : "manual",
    });
    return Response.json({ card }, { status: 201 });
  } catch (error) {
    console.error("learn cards POST failed", error);
    return Response.json({ error: "Failed to create card." }, { status: 500 });
  }
}
