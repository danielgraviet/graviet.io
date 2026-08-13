import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prefersMarkdown } from "@/lib/markdown-negotiation";

/**
 * RFC 8288 Link headers for agent discovery on the homepage.
 * @see https://www.rfc-editor.org/rfc/rfc8288
 * @see https://www.rfc-editor.org/rfc/rfc9727#section-3
 */
const HOMEPAGE_LINK_HEADER = [
  '</.well-known/api-catalog>; rel="api-catalog"',
  '</.well-known/mcp/server-card.json>; rel="describedby"',
  '</.well-known/oauth-protected-resource>; rel="oauth-protected-resource"',
  '</auth.md>; rel="service-doc"',
  '</.well-known/agent-index.json>; rel="describedby"',
  '</sitemap.xml>; rel="describedby"',
  '</about>; rel="service-doc"',
  '</tools>; rel="service-doc"',
].join(", ");

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Avoid negotiation loops when the markdown builder fetches HTML.
  if (request.headers.get("x-markdown-skip") === "1") {
    return NextResponse.next();
  }

  if (
    prefersMarkdown(request.headers.get("accept")) &&
    !pathname.startsWith("/api/") &&
    !pathname.startsWith("/_next/") &&
    !pathname.startsWith("/.well-known/markdown")
  ) {
    const rewriteUrl = request.nextUrl.clone();
    rewriteUrl.pathname = "/.well-known/markdown";
    rewriteUrl.search = "";
    rewriteUrl.searchParams.set("path", pathname || "/");
    return NextResponse.rewrite(rewriteUrl);
  }

  const response = NextResponse.next();

  if (pathname === "/") {
    response.headers.set("Link", HOMEPAGE_LINK_HEADER);
  }

  return response;
}

export const config = {
  matcher: [
    "/",
    "/about",
    "/contact",
    "/projects",
    "/blog",
    "/blog/:path*",
    "/library",
    "/lifestyle",
    "/tools",
    "/tools/:path*",
    "/interview-tool",
  ],
};
