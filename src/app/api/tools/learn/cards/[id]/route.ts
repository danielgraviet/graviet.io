import { deleteCard, updateCard } from "@/lib/learn/learn";
import { readJson, requirePassword, unauthorized } from "@/lib/learn/http";

export const runtime = "nodejs";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const body = await readJson(request);
  if (body instanceof Response) return body;
  if (!requirePassword(request, body)) return unauthorized();

  const id = Number((await params).id);
  if (!Number.isInteger(id)) {
    return Response.json({ error: "Invalid card id." }, { status: 400 });
  }

  try {
    const card = await updateCard(id, {
      front: typeof body.front === "string" ? body.front : undefined,
      back: typeof body.back === "string" ? body.back : undefined,
    });
    if (!card) return Response.json({ error: "Card not found." }, { status: 404 });
    return Response.json({ card });
  } catch (error) {
    console.error("learn card PATCH failed", error);
    return Response.json({ error: "Failed to update card." }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!requirePassword(request)) return unauthorized();
  const id = Number((await params).id);
  if (!Number.isInteger(id)) {
    return Response.json({ error: "Invalid card id." }, { status: 400 });
  }

  try {
    await deleteCard(id);
    return Response.json({ ok: true });
  } catch (error) {
    console.error("learn card DELETE failed", error);
    return Response.json({ error: "Failed to delete card." }, { status: 500 });
  }
}
