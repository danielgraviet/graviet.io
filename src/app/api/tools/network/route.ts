import { createPerson, createRelationship, getNetworkGraph } from "@/lib/network";
import { verifyToolsPassword } from "@/lib/tools-auth";

export const runtime = "nodejs";

function auth(request: Request, password?: unknown) {
  return verifyToolsPassword(password) || verifyToolsPassword(new URL(request.url).searchParams.get("password"));
}

export async function GET(request: Request) {
  if (!auth(request)) return Response.json({ error: "Invalid tools password." }, { status: 401 });
  return Response.json({ graph: await getNetworkGraph() });
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return Response.json({ error: "Send a JSON request body." }, { status: 400 }); }
  if (!auth(request, body.password)) return Response.json({ error: "Invalid tools password." }, { status: 401 });
  if (body.kind === "person") {
    if (typeof body.name !== "string" || !body.name.trim()) return Response.json({ error: "Name is required." }, { status: 400 });
    try {
      const person = await createPerson({ name: body.name, description: typeof body.description === "string" ? body.description : undefined, occupation: typeof body.occupation === "string" ? body.occupation : undefined, notable: body.notable === true, profileUrl: typeof body.profileUrl === "string" ? body.profileUrl : null });
      return Response.json({ person }, { status: 201 });
    } catch (error) {
      if (String(error).includes("duplicate key")) return Response.json({ error: "That person is already in the graph." }, { status: 409 });
      throw error;
    }
  }
  if (body.kind === "relationship") {
    if (!Number.isInteger(body.sourceId) || !Number.isInteger(body.targetId) || typeof body.type !== "string" || !body.type.trim()) return Response.json({ error: "Two people and a relationship type are required." }, { status: 400 });
    const edgeKind = body.edgeKind === "personal" || body.edgeKind === "public" || body.edgeKind === "potential" ? body.edgeKind : "potential";
    const confidence = typeof body.confidence === "number" && body.confidence >= 0 && body.confidence <= 100 ? body.confidence : 60;
    const id = await createRelationship({ sourceId: body.sourceId as number, targetId: body.targetId as number, type: body.type, notes: typeof body.notes === "string" ? body.notes : undefined, occurredOn: typeof body.occurredOn === "string" ? body.occurredOn : null, status: body.status === "draft" ? "draft" : "confirmed", edgeKind, confidence, evidenceNote: typeof body.evidenceNote === "string" ? body.evidenceNote : undefined, evidenceUrl: typeof body.evidenceUrl === "string" ? body.evidenceUrl : null });
    return Response.json({ id }, { status: 201 });
  }
  return Response.json({ error: "Unknown network resource." }, { status: 400 });
}
