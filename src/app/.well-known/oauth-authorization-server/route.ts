import { authorizationServerMetadata } from "@/lib/agent-auth";

export const runtime = "nodejs";

export function GET() {
  return Response.json(authorizationServerMetadata(), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
