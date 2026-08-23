import { runDaytonaTtfbProbe, TtfbProbeError } from "@/lib/daytona-ttfb";
import { getTtfbWatchlist, recordTtfbSample } from "@/lib/ttfb-history";
import { buildTtfbProbeInput, TtfbInputError } from "@/lib/ttfb";
import { isToolsAuthenticated } from "@/lib/tools-auth";

export const runtime = "nodejs";
export const maxDuration = 45;

export async function GET(request: Request) {
  if (!isToolsAuthenticated(request)) {
    return Response.json({ error: "Invalid tools password." }, { status: 401 });
  }

  try {
    const watchlist = await getTtfbWatchlist();
    return Response.json({ watchlist });
  } catch (error) {
    console.error("TTFB history load failed", error);
    return Response.json({ error: "Failed to load TTFB history." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Send a JSON request body." }, { status: 400 });
  }

  const payload = body && typeof body === "object" ? body : {};
  const { password, url } = payload as { password?: unknown; url?: unknown };

  if (!isToolsAuthenticated(request, password)) {
    return Response.json({ error: "Invalid tools password." }, { status: 401 });
  }

  try {
    const input = buildTtfbProbeInput(url);
    const result = await runDaytonaTtfbProbe(input);

    try {
      await recordTtfbSample(result);
    } catch (error) {
      console.error("TTFB history save failed", error);
    }

    const watchlist = await getTtfbWatchlist().catch(() => []);
    return Response.json({ ...result, watchlist });
  } catch (error) {
    if (error instanceof TtfbInputError) {
      return Response.json({ error: error.message }, { status: 400 });
    }

    if (error instanceof TtfbProbeError) {
      return Response.json({ error: error.message }, { status: 502 });
    }

    console.error("TTFB probe failed", error);

    return Response.json(
      { error: "The TTFB probe failed. Check the URL and try again." },
      { status: 502 },
    );
  }
}
