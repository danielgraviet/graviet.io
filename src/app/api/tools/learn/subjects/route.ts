import { createSubject, listSubjects } from "@/lib/learn/learn";
import { readJson, requirePassword, unauthorized } from "@/lib/learn/http";

export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!requirePassword(request)) return unauthorized();

  try {
    const subjects = await listSubjects();
    return Response.json({ subjects });
  } catch (error) {
    console.error("learn subjects GET failed", error);
    return Response.json({ error: "Failed to load subjects." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const body = await readJson(request);
  if (body instanceof Response) return body;
  if (!requirePassword(request, body)) return unauthorized();

  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (!title) {
    return Response.json({ error: "Title is required." }, { status: 400 });
  }

  try {
    const subject = await createSubject({
      title,
      description: typeof body.description === "string" ? body.description : "",
    });
    return Response.json({ subject }, { status: 201 });
  } catch (error) {
    console.error("learn subjects POST failed", error);
    return Response.json({ error: "Failed to create subject." }, { status: 500 });
  }
}
