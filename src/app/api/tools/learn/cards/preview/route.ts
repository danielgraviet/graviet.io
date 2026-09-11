import { renderLearnMarkdown } from "@/lib/learn/markdown";
import { readJson, requirePassword, unauthorized } from "@/lib/learn/http";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await readJson(request);
  if (body instanceof Response) return body;
  if (!requirePassword(request, body)) return unauthorized();
  const markdown = typeof body.markdown === "string" ? body.markdown : "";
  return Response.json({ html: await renderLearnMarkdown(markdown) });
}
