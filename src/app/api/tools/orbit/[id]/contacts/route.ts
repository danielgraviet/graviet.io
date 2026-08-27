import { createOrbitContact, isOrbitDate, listOrbitContacts } from "@/lib/orbit";
import { isToolsAuthenticated } from "@/lib/tools-auth";

export const runtime = "nodejs";

function parseId(value: string): number | null {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isToolsAuthenticated(request)) return Response.json({ error: "Invalid tools password." }, { status: 401 });
  const id = parseId((await params).id);
  if (!id) return Response.json({ error: "Invalid person id." }, { status: 400 });
  try {
    return Response.json({ contacts: await listOrbitContacts(id) });
  } catch (error) {
    console.error("orbit contacts GET failed", error);
    return Response.json({ error: "Failed to load contact history." }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isToolsAuthenticated(request)) return Response.json({ error: "Invalid tools password." }, { status: 401 });
  const id = parseId((await params).id);
  if (!id) return Response.json({ error: "Invalid person id." }, { status: 400 });
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return Response.json({ error: "Send a JSON request body." }, { status: 400 }); }
  if (!isOrbitDate(body.contactedOn)) return Response.json({ error: "A valid contact date is required." }, { status: 400 });
  if (body.note !== undefined && typeof body.note !== "string") return Response.json({ error: "Note must be text." }, { status: 400 });
  try {
    const contact = await createOrbitContact(id, body.contactedOn, typeof body.note === "string" ? body.note : "");
    return contact ? Response.json({ contact }, { status: 201 }) : Response.json({ error: "Person not found." }, { status: 404 });
  } catch (error) {
    console.error("orbit contacts POST failed", error);
    return Response.json({ error: "Failed to log contact." }, { status: 500 });
  }
}
