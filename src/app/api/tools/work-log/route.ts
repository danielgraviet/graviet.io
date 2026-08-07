import { listKnownTags } from "@/lib/work-log-tags";
import {
  WORK_LOG_PAGE_SIZE,
  createWorkLogEntry,
  getWorkLogStreak,
  isValidDateString,
  listWorkLogEntries,
  normalizeTags,
} from "@/lib/work-log";
import { verifyToolsPassword } from "@/lib/tools-auth";

export const runtime = "nodejs";

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const password = params.get("password");

  if (!verifyToolsPassword(password)) {
    return Response.json({ error: "Invalid tools password." }, { status: 401 });
  }

  const query = params.get("q")?.trim() || undefined;
  const tag = params.get("tag")?.trim().toLowerCase() || undefined;
  const todayParam = params.get("today");
  const today = isValidDateString(todayParam) ? todayParam : todayUtc();
  const pageRaw = Number(params.get("page") ?? "1");
  const page = Number.isInteger(pageRaw) && pageRaw > 0 ? pageRaw : 1;

  try {
    const [list, streak, knownTags] = await Promise.all([
      listWorkLogEntries({ query, tag, page, limit: WORK_LOG_PAGE_SIZE }),
      getWorkLogStreak(today),
      listKnownTags(),
    ]);

    return Response.json({
      entries: list.entries,
      total: list.total,
      page: list.page,
      pageSize: list.pageSize,
      streak,
      knownTags,
    });
  } catch (error) {
    console.error("work-log GET failed", error);
    return Response.json(
      { error: "Failed to load work log." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
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

  if (!verifyToolsPassword(password)) {
    return Response.json({ error: "Invalid tools password." }, { status: 401 });
  }

  if (typeof entryBody !== "string" || entryBody.trim().length === 0) {
    return Response.json({ error: "Body is required." }, { status: 400 });
  }

  if (occurredOn !== undefined && !isValidDateString(occurredOn)) {
    return Response.json({ error: "Invalid occurredOn date." }, { status: 400 });
  }

  try {
    const entry = await createWorkLogEntry({
      title: typeof title === "string" ? title.trim() : "",
      body: entryBody.trim(),
      tags: normalizeTags(tags),
      occurredOn: isValidDateString(occurredOn) ? occurredOn : undefined,
    });

    const today = isValidDateString(todayParam) ? todayParam : todayUtc();
    const [streak, knownTags] = await Promise.all([
      getWorkLogStreak(today),
      listKnownTags(),
    ]);

    return Response.json({ entry, streak, knownTags }, { status: 201 });
  } catch (error) {
    console.error("work-log POST failed", error);
    return Response.json(
      { error: "Failed to create work log entry." },
      { status: 500 },
    );
  }
}
