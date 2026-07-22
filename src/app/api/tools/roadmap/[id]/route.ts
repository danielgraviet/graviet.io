import { deleteConcept, isConceptStatus, updateConcept } from "@/lib/roadmap";
import { verifyToolsPassword } from "@/lib/tools-auth";

export const runtime = "nodejs";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: idParam } = await params;
  const id = Number(idParam);

  if (!Number.isInteger(id)) {
    return Response.json({ error: "Invalid concept id." }, { status: 400 });
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Send a JSON request body." }, { status: 400 });
  }

  const payload = body && typeof body === "object" ? body : {};
  const { password, title, status, parentId, notes, resources } = payload as {
    password?: unknown;
    title?: unknown;
    status?: unknown;
    parentId?: unknown;
    notes?: unknown;
    resources?: unknown;
  };

  if (!verifyToolsPassword(password)) {
    return Response.json({ error: "Invalid tools password." }, { status: 401 });
  }

  if (status !== undefined && !isConceptStatus(status)) {
    return Response.json({ error: "Invalid status." }, { status: 400 });
  }

  const concept = await updateConcept(id, {
    title: typeof title === "string" ? title : undefined,
    status: isConceptStatus(status) ? status : undefined,
    parentId:
      parentId === undefined
        ? undefined
        : typeof parentId === "number"
          ? parentId
          : null,
    notes: typeof notes === "string" ? notes : undefined,
    resources: typeof resources === "string" ? resources : undefined,
  });

  if (!concept) {
    return Response.json({ error: "Concept not found." }, { status: 404 });
  }

  return Response.json({ concept });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: idParam } = await params;
  const id = Number(idParam);

  if (!Number.isInteger(id)) {
    return Response.json({ error: "Invalid concept id." }, { status: 400 });
  }

  const password = new URL(request.url).searchParams.get("password");

  if (!verifyToolsPassword(password)) {
    return Response.json({ error: "Invalid tools password." }, { status: 401 });
  }

  await deleteConcept(id);

  return Response.json({ ok: true });
}
