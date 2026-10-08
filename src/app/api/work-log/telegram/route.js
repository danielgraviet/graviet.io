import {
  automationDatabase,
  ensureSchema,
  processUpdate,
} from "../../../../../scripts/work-log-automation.mjs";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request) {
  const secret = process.env.WORK_LOG_TELEGRAM_WEBHOOK_SECRET;
  if (!secret) return Response.json({ error: "Webhook secret is not configured." }, { status: 500 });
  if (request.headers.get("x-telegram-bot-api-secret-token") !== secret) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  let update;
  try {
    update = await request.json();
  } catch {
    return Response.json({ error: "Invalid update body." }, { status: 400 });
  }
  if (!Number.isSafeInteger(update?.update_id)) {
    return Response.json({ error: "Missing Telegram update ID." }, { status: 400 });
  }

  const db = automationDatabase();
  try {
    await ensureSchema(db);
    const claimed = await db`
      INSERT INTO work_log_automation_webhook_updates (update_id)
      VALUES (${update.update_id})
      ON CONFLICT (update_id) DO NOTHING
      RETURNING update_id
    `;
    if (!claimed.length) return Response.json({ ok: true, duplicate: true });

    try {
      await processUpdate(db, update);
    } catch (error) {
      await db`DELETE FROM work_log_automation_webhook_updates WHERE update_id = ${update.update_id}`;
      throw error;
    }
    return Response.json({ ok: true });
  } catch (error) {
    console.error("Telegram work-log webhook failed:", error);
    return Response.json({ error: "Could not process Telegram update." }, { status: 500 });
  }
}
