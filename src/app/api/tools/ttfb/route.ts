import { runDaytonaTtfbProbe, TtfbProbeError } from "@/lib/daytona-ttfb";
import { buildTtfbProbeInput, TtfbInputError } from "@/lib/ttfb";
import { verifyToolsPassword } from "@/lib/tools-auth";

export const runtime = "nodejs";
export const maxDuration = 45;

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Send a JSON request body." }, { status: 400 });
  }

  const payload = body && typeof body === "object" ? body : {};
  const { password, url } = payload as { password?: unknown; url?: unknown };

  if (!verifyToolsPassword(password)) {
    return Response.json({ error: "Invalid tools password." }, { status: 401 });
  }

  try {
    const input = buildTtfbProbeInput(url);
    const result = await runDaytonaTtfbProbe(input);

    return Response.json(result);
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
