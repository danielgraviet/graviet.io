import { buildPageMarkdown } from "@/lib/page-markdown";
import { markdownResponse } from "@/lib/markdown-negotiation";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const pathname = url.searchParams.get("path") || "/";

  if (!pathname.startsWith("/")) {
    return new Response("Invalid path.", { status: 400 });
  }

  const markdown = await buildPageMarkdown(pathname);
  if (markdown === null) {
    return new Response("Markdown not available for this path.", {
      status: 406,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        Vary: "Accept",
      },
    });
  }

  return markdownResponse(markdown);
}
