import { registerTelegramWebhook, runScheduledAutomation } from "../../../../../scripts/work-log-automation.mjs";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return Response.json({ error: "CRON_SECRET is not configured." }, { status: 500 });
  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const origin = new URL(request.url).origin;
    await registerTelegramWebhook(`${origin}/api/work-log/telegram`);
    await runScheduledAutomation();
    return Response.json({ ok: true });
  } catch (error) {
    console.error("Work-log Vercel cron failed:", error);
    return Response.json({ error: "Work-log automation failed." }, { status: 500 });
  }
}
