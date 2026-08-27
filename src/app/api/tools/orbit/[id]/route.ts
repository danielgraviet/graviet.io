import { deleteOrbitPerson, isOrbitStatus, updateOrbitPerson } from "@/lib/orbit";
import { isToolsAuthenticated } from "@/lib/tools-auth";

export const runtime = "nodejs";

function parseId(value: string): number | null {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isToolsAuthenticated(request)) return Response.json({ error: "Invalid tools password." }, { status: 401 });
  const id = parseId((await params).id);
  if (!id) return Response.json({ error: "Invalid person id." }, { status: 400 });
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return Response.json({ error: "Send a JSON request body." }, { status: 400 }); }
  if (typeof body.name !== "string" || !body.name.trim()) return Response.json({ error: "Name is required." }, { status: 400 });
  if (!isOrbitStatus(body.status)) return Response.json({ error: "Invalid status." }, { status: 400 });
  try {
    const person = await updateOrbitPerson(id, body.name, body.status);
    return person ? Response.json({ person }) : Response.json({ error: "Person not found." }, { status: 404 });
  } catch (error) {
    if (String(error).includes("duplicate key")) return Response.json({ error: "That person is already in Orbit." }, { status: 409 });
    console.error("orbit PATCH failed", error);
    return Response.json({ error: "Failed to update person." }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isToolsAuthenticated(request)) return Response.json({ error: "Invalid tools password." }, { status: 401 });
  const id = parseId((await params).id);
  if (!id) return Response.json({ error: "Invalid person id." }, { status: 400 });
  try {
    return (await deleteOrbitPerson(id)) ? Response.json({ ok: true }) : Response.json({ error: "Person not found." }, { status: 404 });
  } catch (error) {
    console.error("orbit DELETE failed", error);
    return Response.json({ error: "Failed to remove person." }, { status: 500 });
  }
}
