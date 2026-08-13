import { getTopic, updateTopic, type MasteryLevel, type TopicStatus } from "@/lib/learn/learn";
import { readJson, requirePassword, unauthorized } from "@/lib/learn/http";

export const runtime = "nodejs";

const STATUSES: TopicStatus[] = ["todo", "learning", "known"];
const MASTERY: MasteryLevel[] = ["learning", "practiced", "proficient", "mastered"];

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
    return Response.json({ topic });
  } catch (error) {
    console.error("learn topic GET failed", error);
    return Response.json({ error: "Failed to load topic." }, { status: 500 });
  }
}

export async function PATCH(
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

  const status =
    typeof body.status === "string" && STATUSES.includes(body.status as TopicStatus)
      ? (body.status as TopicStatus)
      : undefined;
  const mastery =
    typeof body.mastery === "string" && MASTERY.includes(body.mastery as MasteryLevel)
      ? (body.mastery as MasteryLevel)
      : undefined;

  try {
    const topic = await updateTopic(id, {
      title: typeof body.title === "string" ? body.title : undefined,
      status,
      mastery,
      notes: typeof body.notes === "string" ? body.notes : undefined,
      resources: typeof body.resources === "string" ? body.resources : undefined,
      noteLink: typeof body.noteLink === "string" ? body.noteLink : undefined,
    });
    if (!topic) return Response.json({ error: "Topic not found." }, { status: 404 });
    return Response.json({ topic });
  } catch (error) {
    console.error("learn topic PATCH failed", error);
    return Response.json({ error: "Failed to update topic." }, { status: 500 });
  }
}
