import { NextResponse } from "next/server";

export const runtime = "nodejs";

const BASE_URL = "https://www.graviet.io";

/**
 * RFC 9727 API catalog (application/linkset+json).
 * Advertises public site surfaces agents can use; private tool APIs stay undisclosed.
 */
const catalog = {
  linkset: [
    {
      anchor: `${BASE_URL}/`,
      "api-catalog": [{ href: `${BASE_URL}/.well-known/api-catalog` }],
      describedby: [
        {
          href: `${BASE_URL}/sitemap.xml`,
          type: "application/xml",
        },
      ],
      "service-doc": [
        {
          href: `${BASE_URL}/about`,
          type: "text/html",
        },
        {
          href: `${BASE_URL}/tools`,
          type: "text/html",
        },
      ],
    },
    {
      anchor: `${BASE_URL}/api/tools/ttfb`,
      "service-doc": [
        {
          href: `${BASE_URL}/tools/ttfb`,
          type: "text/html",
        },
      ],
      item: [{ href: `${BASE_URL}/api/tools/ttfb` }],
    },
  ],
};

function catalogResponse() {
  return NextResponse.json(catalog, {
    status: 200,
    headers: {
      "Content-Type":
        'application/linkset+json; profile="https://www.rfc-editor.org/info/rfc9727"',
      Link: `</.well-known/api-catalog>; rel="api-catalog"`,
      "Cache-Control": "public, max-age=3600",
    },
  });
}

export async function GET() {
  return catalogResponse();
}

export async function HEAD() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Content-Type":
        'application/linkset+json; profile="https://www.rfc-editor.org/info/rfc9727"',
      Link: `</.well-known/api-catalog>; rel="api-catalog"`,
      "Cache-Control": "public, max-age=3600",
    },
  });
}
