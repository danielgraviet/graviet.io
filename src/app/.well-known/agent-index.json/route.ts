import { NextResponse } from "next/server";

export const runtime = "nodejs";

const BASE_URL = "https://www.graviet.io";

/**
 * Organization agent index for DNS-AID (_index._agents).
 * @see https://datatracker.ietf.org/doc/draft-mozleywilliams-dnsop-dnsaid/
 */
const index = {
  version: 1,
  publisher: "graviet.io",
  updated: "2026-08-13",
  agents: [
    {
      name: "site",
      description:
        "Personal site discovery surfaces: API catalog, sitemap, and public tools docs.",
      endpoint: `${BASE_URL}/`,
      protocols: ["https"],
      wellKnown: {
        "api-catalog": `${BASE_URL}/.well-known/api-catalog`,
        "agent-index": `${BASE_URL}/.well-known/agent-index.json`,
        "mcp-server-card": `${BASE_URL}/.well-known/mcp/server-card.json`,
      },
      docs: [`${BASE_URL}/about`, `${BASE_URL}/tools`],
    },
    {
      name: "site-mcp",
      description:
        "Read-only MCP server for blog posts, page markdown, and agent indexes.",
      endpoint: `${BASE_URL}/mcp`,
      protocols: ["mcp", "https"],
      wellKnown: {
        "mcp-server-card": `${BASE_URL}/.well-known/mcp/server-card.json`,
      },
      docs: [`${BASE_URL}/.well-known/mcp/server-card.json`],
    },
    {
      name: "ttfb-tool",
      description:
        "Measure time to first byte from an ephemeral Daytona sandbox.",
      endpoint: `${BASE_URL}/api/tools/ttfb`,
      protocols: ["https"],
      docs: [`${BASE_URL}/tools/ttfb`],
    },
  ],
};

export async function GET() {
  return NextResponse.json(index, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
      Link: `</.well-known/api-catalog>; rel="api-catalog"`,
    },
  });
}

export async function HEAD() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
      Link: `</.well-known/api-catalog>; rel="api-catalog"`,
    },
  });
}
