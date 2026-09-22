import { createPoll } from "@/lib/meetings";
import { verifyToolsAuthCookie } from "@/lib/tools-auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!verifyToolsAuthCookie(request.headers.get("cookie"))) {
    return Response.json({ error: "Unlock Tooling before creating a poll." }, { status: 401 });
  }

  let body: unknown;
  try { body = await request.json(); } catch { return Response.json({ error: "Send a JSON request body." }, { status: 400 }); }
  const data = body && typeof body === "object" ? body as Record<string, unknown> : {};
  const title = typeof data.title === "string" ? data.title.trim() : "";
  const timeZone = typeof data.timeZone === "string" ? data.timeZone : "";
  const slots = data.slots;
  if (!title || title.length > 100) return Response.json({ error: "Add a title of 1–100 characters." }, { status: 400 });
  try { new Intl.DateTimeFormat("en", { timeZone }).format(); } catch { return Response.json({ error: "Choose a valid time zone." }, { status: 400 }); }
  if (!Array.isArray(slots) || slots.length < 2 || slots.length > 84 || slots.some((slot) => {
    if (!slot || typeof slot !== "object") return true;
    const candidate = slot as { startsAt?: unknown; date?: unknown; period?: unknown };
    if (typeof candidate.startsAt === "string") return !Number.isFinite(Date.parse(candidate.startsAt));
    return typeof candidate.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(candidate.date) || !["morning", "afternoon", "evening"].includes(String(candidate.period));
  })) {
    return Response.json({ error: "Add between 2 and 84 valid date and time options." }, { status: 400 });
  }
  const result = await createPoll({ title, timeZone, slots });
  return Response.json(result, { status: 201 });
}
