import { readFileSync } from "node:fs";
import { spawn } from "node:child_process";
import { resolve } from "node:path";

function readLocalEnv() {
  const values = { ...process.env };
  for (const filename of [".env", ".env.local"]) {
    try {
      for (const line of readFileSync(resolve(filename), "utf8").split(/\r?\n/)) {
        const valueLine = line.trim();
        if (!valueLine || valueLine.startsWith("#")) continue;
        const splitAt = valueLine.indexOf("=");
        if (splitAt < 1) continue;
        const key = valueLine.slice(0, splitAt).trim();
        let value = valueLine.slice(splitAt + 1).trim();
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        values[key] ||= value;
      }
    } catch {}
  }
  return values;
}

const env = readLocalEnv();
const children = [];
const next = spawn(process.execPath, [resolve("node_modules/next/dist/bin/next"), "dev"], {
  stdio: "inherit",
  env: process.env,
});
children.push(next);

const automationKeys = [
  "DATABASE_URL",
  "OPENROUTER_API_KEY",
  "OPENROUTER_MODEL",
  "WORK_LOG_TELEGRAM_BOT_TOKEN",
  "WORK_LOG_TELEGRAM_CHAT_ID",
  "WORK_LOG_TELEGRAM_USER_ID",
];
const missing = automationKeys.filter((key) => !env[key]);
if (missing.length) {
  console.log(`Daily Work Log poller is off; missing local settings: ${missing.join(", ")}`);
} else {
  const poller = spawn(process.execPath, [resolve("scripts/work-log-automation.mjs"), "--watch"], {
    stdio: "inherit",
    env: process.env,
  });
  children.push(poller);
  console.log("Daily Work Log poller is running; Telegram messages are checked every 5 seconds.");
}

function stopChildren(code = 0) {
  for (const child of children) if (child.exitCode === null) child.kill("SIGTERM");
  process.exit(code);
}

for (const child of children) {
  child.on("exit", (code) => stopChildren(code ?? 0));
}
process.on("SIGINT", () => stopChildren(130));
process.on("SIGTERM", () => stopChildren(143));
