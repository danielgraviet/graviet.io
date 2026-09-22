import { getPoll, saveResponse } from "@/lib/meetings";

export const runtime = "nodejs";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!/^[a-f0-9]{20}$/.test(id)) return Response.json({ error: "Poll not found." }, { status: 404 });
  const poll = await getPoll(id);
  return poll ? Response.json(poll, { headers: { "Cache-Control": "no-store" } }) : Response.json({ error: "Poll not found." }, { status: 404 });
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!/^[a-f0-9]{20}$/.test(id)) return Response.json({ error: "Poll not found." }, { status: 404 });
  let body: unknown;
  try { body = await request.json(); } catch { return Response.json({ error: "Send a JSON request body." }, { status: 400 }); }
  const data = body && typeof body === "object" ? body as Record<string, unknown> : {};
  const name = typeof data.name === "string" ? data.name.trim() : "";
  const participantId = typeof data.participantId === "string" ? data.participantId : "";
  if (!name || name.length > 60 || !/^[a-zA-Z0-9-]{16,64}$/.test(participantId)) return Response.json({ error: "Enter your name to continue." }, { status: 400 });
  const result = await saveResponse(id, { name, participantId, availability: data.availability as boolean[] });
  if (result === "missing") return Response.json({ error: "Poll not found." }, { status: 404 });
  if (result === "closed") return Response.json({ error: "This poll is closed." }, { status: 409 });
  if (result === "invalid") return Response.json({ error: "Choose available or unavailable for every time." }, { status: 400 });
  return Response.json({ ok: true });
}
