/**
 * Content negotiation helpers for Markdown for Agents.
 * @see https://developers.cloudflare.com/fundamentals/reference/markdown-for-agents/
 */

type AcceptPart = {
  type: string;
  q: number;
};

function parseAccept(header: string | null): AcceptPart[] {
  if (!header) return [];

  return header.split(",").map((part) => {
    const [rawType, ...params] = part.trim().split(";");
    const qParam = params.find((param) => param.trim().startsWith("q="));
    const q = qParam ? Number.parseFloat(qParam.trim().slice(2)) : 1;
    return {
      type: rawType.trim().toLowerCase(),
      q: Number.isFinite(q) ? q : 1,
    };
  });
}

function bestQuality(parts: AcceptPart[], type: string): number {
  return parts
    .filter((part) => part.type === type)
    .reduce((max, part) => Math.max(max, part.q), -1);
}

/**
 * True when the client prefers text/markdown over text/html.
 * Matches typical agent requests: `Accept: text/markdown`.
 */
export function prefersMarkdown(acceptHeader: string | null): boolean {
  const parts = parseAccept(acceptHeader);
  const markdownQ = bestQuality(parts, "text/markdown");
  if (markdownQ < 0) return false;

  const htmlQ = bestQuality(parts, "text/html");
  if (htmlQ < 0) return true;

  return markdownQ >= htmlQ;
}

/** Rough token estimate (~4 chars/token), matching common agent heuristics. */
export function estimateMarkdownTokens(markdown: string): number {
  if (!markdown) return 0;
  return Math.max(1, Math.ceil(markdown.length / 4));
}

export function markdownResponse(markdown: string, status = 200): Response {
  const tokens = estimateMarkdownTokens(markdown);
  return new Response(markdown, {
    status,
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "x-markdown-tokens": String(tokens),
      Vary: "Accept",
      "Cache-Control": "public, max-age=60",
    },
  });
}
