import { getAllPosts } from "@/lib/posts";
import { buildPageMarkdown } from "@/lib/page-markdown";
import { SITE_ORIGIN } from "@/lib/agent-auth";

export const runtime = "nodejs";

type JsonRpcId = string | number | null;

type JsonRpcRequest = {
  jsonrpc?: string;
  id?: JsonRpcId;
  method?: string;
  params?: Record<string, unknown>;
};

const PROTOCOL_VERSION = "2025-06-18";

const TOOLS = [
  {
    name: "list_blog_posts",
    description: "List public blog posts on graviet.io",
    inputSchema: {
      type: "object",
      properties: {},
      additionalProperties: false,
    },
  },
  {
    name: "get_page_markdown",
    description:
      "Return a markdown representation of a public site path (e.g. /, /about, /blog/slug)",
    inputSchema: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "Site path beginning with /",
        },
      },
      required: ["path"],
      additionalProperties: false,
    },
  },
  {
    name: "get_agent_index",
    description: "Return the public DNS-AID / agent index document URL and summary",
    inputSchema: {
      type: "object",
      properties: {},
      additionalProperties: false,
    },
  },
];

function rpcResult(id: JsonRpcId, result: unknown) {
  return Response.json(
    { jsonrpc: "2.0", id: id ?? null, result },
    {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    },
  );
}

function rpcError(id: JsonRpcId, code: number, message: string) {
  return Response.json(
    {
      jsonrpc: "2.0",
      id: id ?? null,
      error: { code, message },
    },
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    },
  );
}

async function callTool(name: string, args: Record<string, unknown>) {
  if (name === "list_blog_posts") {
    const posts = await getAllPosts();
    const payload = posts.map((post) => ({
      title: post.title,
      slug: post.slug,
      url: `${SITE_ORIGIN}/blog/${post.slug}`,
      publishedAt: post.publishedAt,
      excerpt: post.excerpt,
      tags: post.tags,
    }));
    return {
      content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
    };
  }

  if (name === "get_page_markdown") {
    const pathValue = typeof args.path === "string" ? args.path : "";
    if (!pathValue.startsWith("/")) {
      return {
        content: [{ type: "text", text: "path must start with /" }],
        isError: true,
      };
    }
    const markdown = await buildPageMarkdown(pathValue);
    if (!markdown) {
      return {
        content: [
          {
            type: "text",
            text: `Markdown not available for path: ${pathValue}`,
          },
        ],
        isError: true,
      };
    }
    return { content: [{ type: "text", text: markdown }] };
  }

  if (name === "get_agent_index") {
    const payload = {
      url: `${SITE_ORIGIN}/.well-known/agent-index.json`,
      serverCard: `${SITE_ORIGIN}/.well-known/mcp/server-card.json`,
      apiCatalog: `${SITE_ORIGIN}/.well-known/api-catalog`,
      authMd: `${SITE_ORIGIN}/auth.md`,
    };
    return {
      content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
    };
  }

  return {
    content: [{ type: "text", text: `Unknown tool: ${name}` }],
    isError: true,
  };
}

async function handleRpc(body: JsonRpcRequest) {
  const id = body.id ?? null;
  const method = body.method;

  if (!method) {
    return rpcError(id, -32600, "Invalid Request");
  }

  switch (method) {
    case "initialize":
      return rpcResult(id, {
        protocolVersion: PROTOCOL_VERSION,
        capabilities: {
          tools: {},
          resources: {},
          prompts: {},
        },
        serverInfo: {
          name: "io.graviet.site",
          version: "1.0.0",
        },
        instructions:
          "Read-only MCP for public graviet.io content. Use list_blog_posts, get_page_markdown, and get_agent_index.",
      });
    case "notifications/initialized":
    case "ping":
      return rpcResult(id, {});
    case "tools/list":
      return rpcResult(id, { tools: TOOLS });
    case "tools/call": {
      const params = body.params ?? {};
      const name = typeof params.name === "string" ? params.name : "";
      const args =
        params.arguments && typeof params.arguments === "object"
          ? (params.arguments as Record<string, unknown>)
          : {};
      if (!name) {
        return rpcError(id, -32602, "Missing tool name");
      }
      const result = await callTool(name, args);
      return rpcResult(id, result);
    }
    case "resources/list":
      return rpcResult(id, { resources: [] });
    case "prompts/list":
      return rpcResult(id, { prompts: [] });
    default:
      return rpcError(id, -32601, `Method not found: ${method}`);
  }
}

export async function GET() {
  return Response.json(
    {
      name: "io.graviet.site",
      version: "1.0.0",
      transport: "streamable-http",
      serverCard: `${SITE_ORIGIN}/.well-known/mcp/server-card.json`,
      protocolVersion: PROTOCOL_VERSION,
    },
    {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    },
  );
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return rpcError(null, -32700, "Parse error");
  }

  if (Array.isArray(body)) {
    const results = [];
    for (const item of body) {
      const response = await handleRpc(
        item && typeof item === "object" ? (item as JsonRpcRequest) : {},
      );
      results.push(await response.json());
    }
    return Response.json(results, {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }

  return handleRpc(
    body && typeof body === "object" ? (body as JsonRpcRequest) : {},
  );
}

export function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Accept",
    },
  });
}
