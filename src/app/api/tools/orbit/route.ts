import { createOrbitPerson, isOrbitStatus, listOrbitPeople } from "@/lib/orbit";
import { isToolsAuthenticated } from "@/lib/tools-auth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!isToolsAuthenticated(request)) {
    return Response.json({ error: "Invalid tools password." }, { status: 401 });
  }
  try {
    return Response.json({ people: await listOrbitPeople() });
  } catch (error) {
    console.error("orbit GET failed", error);
    return Response.json({ error: "Failed to load Orbit." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!isToolsAuthenticated(request)) {
    return Response.json({ error: "Invalid tools password." }, { status: 401 });
  }
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Send a JSON request body." }, { status: 400 });
  }
  if (typeof body.name !== "string" || !body.name.trim()) {
    return Response.json({ error: "Name is required." }, { status: 400 });
  }
  if (body.status !== undefined && !isOrbitStatus(body.status)) {
    return Response.json({ error: "Invalid status." }, { status: 400 });
  }
  try {
    const person = await createOrbitPerson(body.name, isOrbitStatus(body.status) ? body.status : "orange");
    return Response.json({ person }, { status: 201 });
  } catch (error) {
    if (String(error).includes("duplicate key")) {
      return Response.json({ error: "That person is already in Orbit." }, { status: 409 });
    }
    console.error("orbit POST failed", error);
    return Response.json({ error: "Failed to add person." }, { status: 500 });
  }
}
