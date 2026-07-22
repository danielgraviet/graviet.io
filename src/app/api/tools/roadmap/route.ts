import { createConcept, listConcepts } from "@/lib/roadmap";
import { verifyToolsPassword } from "@/lib/tools-auth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const password = new URL(request.url).searchParams.get("password");

  if (!verifyToolsPassword(password)) {
    return Response.json({ error: "Invalid tools password." }, { status: 401 });
  }

  const concepts = await listConcepts();

  return Response.json({ concepts });
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Send a JSON request body." }, { status: 400 });
  }

  const payload = body && typeof body === "object" ? body : {};
  const { password, title, parentId, notes, resources } = payload as {
    password?: unknown;
    title?: unknown;
    parentId?: unknown;
    notes?: unknown;
    resources?: unknown;
  };

  if (!verifyToolsPassword(password)) {
    return Response.json({ error: "Invalid tools password." }, { status: 401 });
  }

  if (typeof title !== "string" || title.trim().length === 0) {
    return Response.json({ error: "Title is required." }, { status: 400 });
  }

  const concept = await createConcept({
    title: title.trim(),
    parentId: typeof parentId === "number" ? parentId : null,
    notes: typeof notes === "string" ? notes : undefined,
    resources: typeof resources === "string" ? resources : undefined,
  });

  return Response.json({ concept }, { status: 201 });
}
