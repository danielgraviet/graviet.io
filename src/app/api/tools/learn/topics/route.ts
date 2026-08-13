import { createTopic } from "@/lib/learn/learn";
import { readJson, requirePassword, unauthorized } from "@/lib/learn/http";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await readJson(request);
  if (body instanceof Response) return body;
  if (!requirePassword(request, body)) return unauthorized();

  const title = typeof body.title === "string" ? body.title.trim() : "";
  const subjectId = Number(body.subjectId);
  if (!title || !Number.isInteger(subjectId)) {
    return Response.json({ error: "Title and subjectId are required." }, { status: 400 });
  }

  try {
    const topic = await createTopic({
      subjectId,
      domainId: typeof body.domainId === "number" ? body.domainId : null,
      title,
    });
    return Response.json({ topic }, { status: 201 });
  } catch (error) {
    console.error("learn topics POST failed", error);
    return Response.json({ error: "Failed to create topic." }, { status: 500 });
  }
}
