import { SITE_ORIGIN } from "@/lib/agent-auth";

export const runtime = "nodejs";

/**
 * MCP Server Card (SEP-1649 / PR #2127 discovery path).
 * @see https://github.com/modelcontextprotocol/modelcontextprotocol/pull/2127
 */
const serverCard = {
  $schema:
    "https://static.modelcontextprotocol.io/schemas/mcp-server-card/v1.json",
  version: "1.0",
  protocolVersion: "2025-06-18",
  serverInfo: {
    name: "io.graviet.site",
    title: "graviet.io",
    version: "1.0.0",
    description:
      "Public discovery MCP for Daniel Graviet's personal site — blog posts, pages, and agent indexes.",
    homepage: SITE_ORIGIN,
  },
  websiteUrl: SITE_ORIGIN,
  transport: {
    type: "streamable-http",
    endpoint: "/mcp",
    url: `${SITE_ORIGIN}/mcp`,
  },
  remotes: [
    {
      type: "streamable-http",
      url: `${SITE_ORIGIN}/mcp`,
    },
  ],
  capabilities: {
    tools: { listChanged: false },
    resources: { listChanged: false },
    prompts: { listChanged: false },
  },
  authentication: {
    required: false,
    schemes: [],
  },
  instructions:
    "Read-only tools for public site content. Prefer Accept: text/markdown on HTML pages, and see /.well-known/api-catalog and /auth.md for broader agent discovery.",
};

export function GET() {
  return Response.json(serverCard, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

export function HEAD() {
  return new Response(null, {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
