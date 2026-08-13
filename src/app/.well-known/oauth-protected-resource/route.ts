import { protectedResourceMetadata } from "@/lib/agent-auth";

export const runtime = "nodejs";

export function GET() {
  return Response.json(protectedResourceMetadata(), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
