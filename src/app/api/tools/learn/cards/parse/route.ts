import { parseQaPairs } from "@/lib/learn/parse-qa";
import { readJson, requirePassword, unauthorized } from "@/lib/learn/http";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await readJson(request);
  if (body instanceof Response) return body;
  if (!requirePassword(request, body)) return unauthorized();

  const notes = typeof body.notes === "string" ? body.notes : "";
  const cards = parseQaPairs(notes);
  return Response.json({ cards });
}
