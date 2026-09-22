import { closePoll } from "@/lib/meetings";

export const runtime = "nodejs";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = await request.json().catch(() => ({})) as { organizerKey?: unknown };
  if (typeof body.organizerKey !== "string" || body.organizerKey.length < 30) return Response.json({ error: "Organizer access required." }, { status: 401 });
  const closed = await closePoll(id, body.organizerKey);
  return closed ? Response.json({ ok: true }) : Response.json({ error: "Organizer access required." }, { status: 401 });
}
