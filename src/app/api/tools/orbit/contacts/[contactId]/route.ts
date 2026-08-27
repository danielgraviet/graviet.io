import { deleteOrbitContact, isOrbitDate, updateOrbitContact } from "@/lib/orbit";
import { isToolsAuthenticated } from "@/lib/tools-auth";

export const runtime = "nodejs";

function parseId(value: string): number | null {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function PATCH(request: Request, { params }: { params: Promise<{ contactId: string }> }) {
  if (!isToolsAuthenticated(request)) return Response.json({ error: "Invalid tools password." }, { status: 401 });
  const id = parseId((await params).contactId);
  if (!id) return Response.json({ error: "Invalid contact id." }, { status: 400 });
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return Response.json({ error: "Send a JSON request body." }, { status: 400 }); }
  if (!isOrbitDate(body.contactedOn)) return Response.json({ error: "A valid contact date is required." }, { status: 400 });
  if (body.note !== undefined && typeof body.note !== "string") return Response.json({ error: "Note must be text." }, { status: 400 });
  try {
    const contact = await updateOrbitContact(id, body.contactedOn, typeof body.note === "string" ? body.note : "");
    return contact ? Response.json({ contact }) : Response.json({ error: "Contact not found." }, { status: 404 });
  } catch (error) {
    console.error("orbit contact PATCH failed", error);
    return Response.json({ error: "Failed to update contact." }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ contactId: string }> }) {
  if (!isToolsAuthenticated(request)) return Response.json({ error: "Invalid tools password." }, { status: 401 });
  const id = parseId((await params).contactId);
  if (!id) return Response.json({ error: "Invalid contact id." }, { status: 400 });
  try {
    return (await deleteOrbitContact(id)) ? Response.json({ ok: true }) : Response.json({ error: "Contact not found." }, { status: 404 });
  } catch (error) {
    console.error("orbit contact DELETE failed", error);
    return Response.json({ error: "Failed to delete contact." }, { status: 500 });
  }
}
