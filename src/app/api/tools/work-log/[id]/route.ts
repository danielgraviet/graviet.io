import { listKnownTags } from "@/lib/work-log-tags";
import {
  deleteWorkLogEntry,
  getWorkLogStreak,
  isValidDateString,
  normalizeTags,
  updateWorkLogEntry,
} from "@/lib/work-log";
import { isToolsAuthenticated } from "@/lib/tools-auth";

export const runtime = "nodejs";

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: idParam } = await params;
  const id = Number(idParam);

  if (!Number.isInteger(id)) {
    return Response.json({ error: "Invalid entry id." }, { status: 400 });
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Send a JSON request body." }, { status: 400 });
  }

  const payload = body && typeof body === "object" ? body : {};
  const {
    password,
    title,
    body: entryBody,
    tags,
    occurredOn,
    today: todayParam,
  } = payload as {
    password?: unknown;
    title?: unknown;
    body?: unknown;
    tags?: unknown;
    occurredOn?: unknown;
    today?: unknown;
  };

  if (!isToolsAuthenticated(request, password)) {
    return Response.json({ error: "Invalid tools password." }, { status: 401 });
  }

  if (occurredOn !== undefined && !isValidDateString(occurredOn)) {
    return Response.json({ error: "Invalid occurredOn date." }, { status: 400 });
  }

  if (entryBody !== undefined && typeof entryBody !== "string") {
    return Response.json({ error: "Body must be a string." }, { status: 400 });
  }

  if (
    typeof entryBody === "string" &&
    entryBody.trim().length === 0
  ) {
    return Response.json({ error: "Body is required." }, { status: 400 });
  }

  try {
    const entry = await updateWorkLogEntry(id, {
      title: typeof title === "string" ? title.trim() : undefined,
      body: typeof entryBody === "string" ? entryBody.trim() : undefined,
      tags: tags !== undefined ? normalizeTags(tags) : undefined,
      occurredOn: isValidDateString(occurredOn) ? occurredOn : undefined,
    });

    if (!entry) {
      return Response.json({ error: "Entry not found." }, { status: 404 });
    }

    const today = isValidDateString(todayParam) ? todayParam : todayUtc();
    const [streak, knownTags] = await Promise.all([
      getWorkLogStreak(today),
      listKnownTags(),
    ]);

    return Response.json({ entry, streak, knownTags });
  } catch (error) {
    console.error("work-log PATCH failed", error);
    return Response.json(
      { error: "Failed to update work log entry." },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: idParam } = await params;
  const id = Number(idParam);

  if (!Number.isInteger(id)) {
    return Response.json({ error: "Invalid entry id." }, { status: 400 });
  }

  const url = new URL(request.url);
  const password = url.searchParams.get("password");
  const todayParam = url.searchParams.get("today");

  if (!isToolsAuthenticated(request, password)) {
    return Response.json({ error: "Invalid tools password." }, { status: 401 });
  }

  try {
    await deleteWorkLogEntry(id);

    const today = isValidDateString(todayParam) ? todayParam : todayUtc();
    const [streak, knownTags] = await Promise.all([
      getWorkLogStreak(today),
      listKnownTags(),
    ]);

    return Response.json({ ok: true, streak, knownTags });
  } catch (error) {
    console.error("work-log DELETE failed", error);
    return Response.json(
      { error: "Failed to delete work log entry." },
      { status: 500 },
    );
  }
}
