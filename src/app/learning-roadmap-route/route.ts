import { readFile } from "node:fs/promises";
import path from "node:path";

export async function GET() {
  const html = await readFile(
    path.join(
      process.cwd(),
      "src/app/learning-roadmap/roadmap.html",
    ),
    "utf8",
  );

  return new Response(html, {
    headers: {
      "content-type": "text/html; charset=utf-8",
    },
  });
}
