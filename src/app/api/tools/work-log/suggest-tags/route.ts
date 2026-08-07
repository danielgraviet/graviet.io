import { listKnownTags, suggestTags } from "@/lib/work-log-tags";
import { verifyToolsPassword } from "@/lib/tools-auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Send a JSON request body." }, { status: 400 });
  }

  const payload = body && typeof body === "object" ? body : {};
  const { password, text } = payload as {
    password?: unknown;
    text?: unknown;
  };

  if (!verifyToolsPassword(password)) {
    return Response.json({ error: "Invalid tools password." }, { status: 401 });
  }

  if (typeof text !== "string" || text.trim().length === 0) {
    return Response.json({ error: "Text is required." }, { status: 400 });
  }

  try {
    const knownTags = await listKnownTags();
    const tags = await suggestTags(text, knownTags);
    return Response.json({ tags, knownTags });
  } catch (error) {
    console.error("work-log suggest-tags failed", error);
    return Response.json(
      { error: "Failed to suggest tags." },
      { status: 500 },
    );
  }
}
