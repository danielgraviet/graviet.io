/**
 * /robots.txt — RFC 9309 + Content Signals + explicit AI crawler rules.
 * @see https://contentsignals.org/
 * @see https://www.rfc-editor.org/rfc/rfc9309
 */

export const runtime = "nodejs";

const DISALLOW = [
  "/api/",
  "/agent/",
  "/oauth2/",
  "/tools/roadmap",
  "/tools/work-log",
  "/learning-roadmap-route",
  "/daytona-search-demo",
  "/interview-tool",
];

const AI_CRAWLERS = [
  "GPTBot",
  "OAI-SearchBot",
  "Claude-Web",
  "Google-Extended",
  "Amazonbot",
  "anthropic-ai",
  "Bytespider",
  "CCBot",
  "Applebot-Extended",
];

/** Open personal site: searchable, usable as AI input, and trainable. */
const CONTENT_SIGNAL = "ai-train=yes, search=yes, ai-input=yes";

function block(userAgents: string[]): string {
  return [
    ...userAgents.map((agent) => `User-agent: ${agent}`),
    "Allow: /",
    ...DISALLOW.map((path) => `Disallow: ${path}`),
    `Content-Signal: ${CONTENT_SIGNAL}`,
    "",
  ].join("\n");
}

export function GET() {
  const body = [
    "# graviet.io robots.txt",
    "# Content Signals: https://contentsignals.org/",
    "",
    block(["*"]),
    block(AI_CRAWLERS),
    "Sitemap: https://www.graviet.io/sitemap.xml",
    "",
  ].join("\n");

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
