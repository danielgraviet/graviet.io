import { getNetworkGraph, shortestPath } from "@/lib/network";
import { verifyToolsPassword } from "@/lib/tools-auth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  if (!verifyToolsPassword(params.get("password"))) return Response.json({ error: "Invalid tools password." }, { status: 401 });
  const targetId = Number(params.get("targetId"));
  if (!Number.isInteger(targetId)) return Response.json({ error: "A target person is required." }, { status: 400 });
  const graph = await getNetworkGraph();
  const path = shortestPath(graph, targetId);
  return Response.json({ path, distance: path ? path.length - 1 : null });
}
