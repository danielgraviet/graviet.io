#!/usr/bin/env node
/**
 * One-command browser comparison for /browser-benchmark (macOS only).
 *
 * For each installed browser it measures what a web page cannot (launch time,
 * whole-browser memory and CPU, on-disk size) and also drives the benchmark
 * page and collects its page-level results. The two kinds of data go to
 * separate CSV files and are never combined into one score.
 *
 * The script runs a local server that proxies the site, so the pages are
 * same-origin with it and can post their results back without any clicking.
 *
 * Usage:
 *   node scripts/browser-benchmark/measure.mjs
 *
 * See scripts/browser-benchmark/README.md for exactly what is counted.
 */

import { execFile } from "node:child_process";
import { createServer } from "node:http";
import { appendFile, mkdir, access } from "node:fs/promises";
import { homedir, hostname } from "node:os";
import { join } from "node:path";
import { createInterface } from "node:readline/promises";
import { Readable } from "node:stream";
import { promisify } from "node:util";

const run = promisify(execFile);
const HOME = homedir();

const BROWSERS = {
  safari: {
    name: "Safari",
    app: "/Applications/Safari.app",
    bundleId: "com.apple.Safari",
    // Safari's own binary plus the WebKit XPC services it uses. Those services are
    // shared with other WebKit apps (Mail, Messages, App Store), so quit those first.
    matches: (command) =>
      command.endsWith("/Safari.app/Contents/MacOS/Safari") ||
      /\/com\.apple\.WebKit\.(WebContent|Networking|GPU)(\.xpc)?\//.test(command) ||
      /\/com\.apple\.WebKit\.(WebContent|Networking|GPU)$/.test(command),
    profileDirs: ["Library/Safari", "Library/Containers/com.apple.Safari", "Library/Caches/com.apple.Safari", "Library/WebKit/com.apple.Safari"],
    selectTab: (n) => `tell application "Safari" to set current tab of front window to tab ${n} of front window`,
  },
  arc: {
    name: "Arc",
    app: "/Applications/Arc.app",
    bundleId: "company.thebrowser.Browser",
    matches: (command) => command.startsWith("/Applications/Arc.app/"),
    profileDirs: ["Library/Application Support/Arc", "Library/Caches/Arc", "Library/Caches/company.thebrowser.Browser"],
    selectTab: (n) => `tell application "Arc" to tell front window to tell tab ${n} to select`,
  },
  chrome: {
    name: "Google Chrome",
    app: "/Applications/Google Chrome.app",
    bundleId: "com.google.Chrome",
    matches: (command) => command.startsWith("/Applications/Google Chrome.app/"),
    profileDirs: ["Library/Application Support/Google/Chrome", "Library/Caches/Google/Chrome"],
    selectTab: (n) => `tell application "Google Chrome" to set active tab index of front window to ${n}`,
  },
  brave: {
    name: "Brave Browser",
    app: "/Applications/Brave Browser.app",
    bundleId: "com.brave.Browser",
    matches: (command) => command.startsWith("/Applications/Brave Browser.app/"),
    profileDirs: ["Library/Application Support/BraveSoftware/Brave-Browser", "Library/Caches/BraveSoftware/Brave-Browser"],
    selectTab: (n) => `tell application "Brave Browser" to set active tab index of front window to ${n}`,
  },
};

const SCENARIOS = ["storage", "startup", "page", "tabs", "video"];
const TAB_COUNT = 20;
const TAB_SWITCH_ROUNDS = 2;

function parseArgs(argv) {
  const options = { browser: "all", scenario: "all", runs: 5, baseUrl: "https://www.graviet.io", out: "benchmark-results", settle: 15, tabsSettle: 60, idle: 120, video: 300, interval: 5, yes: false };
  for (let i = 0; i < argv.length; i++) {
    const [flag, value] = [argv[i], argv[i + 1]];
    const take = () => { i++; return value; };
    if (flag === "--browser") options.browser = take();
    else if (flag === "--scenario") options.scenario = take();
    else if (flag === "--runs") options.runs = Number(take());
    else if (flag === "--base-url") options.baseUrl = take().replace(/\/$/, "");
    else if (flag === "--out") options.out = take();
    else if (flag === "--settle") options.settle = Number(take());
    else if (flag === "--tabs-settle") options.tabsSettle = Number(take());
    else if (flag === "--idle") options.idle = Number(take());
    else if (flag === "--video") options.video = Number(take());
    else if (flag === "--interval") options.interval = Number(take());
    else if (flag === "--yes" || flag === "-y") options.yes = true;
    else if (flag === "--help" || flag === "-h") options.help = true;
    else throw new Error(`Unknown argument: ${flag}`);
  }
  return options;
}

const HELP = `Usage: node scripts/browser-benchmark/measure.mjs [options]

  --browser <all|${Object.keys(BROWSERS).join("|")}>[,…]   default: all installed
  --scenario <all|${SCENARIOS.join("|")}>[,…]   default: all
  --runs <n>          runs per scenario (median is reported)        default: 5
  --base-url <url>    site hosting /browser-benchmark               default: https://www.graviet.io
  --out <dir>         where CSV files are appended                   default: benchmark-results
  --settle <s>        wait after startup before sampling             default: 15
  --tabs-settle <s>   wait after opening 20 tabs before sampling     default: 60
  --idle <s>          idle sampling window with 20 tabs              default: 120
  --video <s>         video playback and sampling window             default: 300
  --interval <s>      seconds between samples                        default: 5
  --yes               skip the one confirmation prompt at the start`;

const sleep = (seconds) => new Promise((resolve) => setTimeout(resolve, seconds * 1000));
const medianOf = (values) => {
  const sorted = values.filter(Number.isFinite).sort((a, b) => a - b);
  if (!sorted.length) return null;
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};

// ---------------------------------------------------------------------------
// CSV output (long format: one row per observation, easy to pivot for charts)

const OBSERVATION_COLUMNS = ["timestamp", "session_id", "browser", "browser_version", "scenario", "run", "sample", "elapsed_s", "metric", "value", "unit", "detail"];
const PROCESS_COLUMNS = ["timestamp", "session_id", "browser", "scenario", "run", "sample", "pid", "cpu_pct", "mem_mb", "command"];
const PAGE_COLUMNS = ["timestamp", "session_id", "browser", "browser_version", "scenario", "run", "test", "metric", "run_index", "value", "unit", "foreground_throughout", "note"];
const SESSION_COLUMNS = ["session_id", "started_at", "browser", "browser_version", "app_path", "mac_model", "macos_version", "power_source", "host", "base_url", "runs", "settle_s", "tabs_settle_s", "idle_s", "video_s", "interval_s"];

const csvCell = (value) => {
  const text = value === null || value === undefined ? "" : String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

async function appendCsv(path, columns, rows) {
  if (!rows.length) return;
  let exists = true;
  try { await access(path); } catch { exists = false; }
  const header = exists ? "" : `${columns.join(",")}\n`;
  await appendFile(path, header + rows.map((row) => columns.map((column) => csvCell(row[column])).join(",")).join("\n") + "\n");
}

// ---------------------------------------------------------------------------
// System probes

async function text(command, args) {
  try { return (await run(command, args, { maxBuffer: 64 * 1024 * 1024 })).stdout.trim(); } catch { return ""; }
}

async function environment(browser) {
  const [version, model, macos, power] = await Promise.all([
    text("defaults", ["read", join(browser.app, "Contents/Info"), "CFBundleShortVersionString"]),
    text("sysctl", ["-n", "hw.model"]),
    text("sw_vers", ["-productVersion"]),
    text("pmset", ["-g", "batt"]),
  ]);
  return { version, model, macos, power: power.match(/'([^']+)'/)?.[1] ?? "unknown" };
}

/** PIDs whose executable path belongs to this browser, per BROWSERS[x].matches. */
async function browserProcesses(browser) {
  const output = await text("ps", ["-axo", "pid=,comm="]);
  return output.split("\n").map((line) => line.trim().match(/^(\d+)\s+(.*)$/)).filter(Boolean)
    .map(([, pid, command]) => ({ pid: Number(pid), command })).filter(({ command }) => browser.matches(command));
}

function parseMemMb(value) {
  const match = value.replace(/[+-]$/, "").match(/^([\d.]+)([BKMG]?)$/);
  if (!match) return null;
  const scale = { B: 1 / 1024 / 1024, K: 1 / 1024, M: 1, G: 1024, "": 1 / 1024 / 1024 }[match[2]];
  return Number(match[1]) * scale;
}

/**
 * One sample of per-process CPU and memory from `top`. The second of two
 * one-second samples is used because top's first CPU reading is not a delta.
 * MEM is top's physical footprint, the same figure Activity Monitor shows.
 */
async function sample(browser) {
  const processes = await browserProcesses(browser);
  const wanted = new Map(processes.map((p) => [p.pid, p.command]));
  const output = await text("top", ["-l", "2", "-s", "1", "-stats", "pid,cpu,mem"]);
  const lines = output.split("\n");
  const lastHeader = lines.map((line, i) => (/^PID\s/.test(line) ? i : -1)).filter((i) => i >= 0).pop() ?? lines.length;
  const rows = [];
  for (const line of lines.slice(lastHeader + 1)) {
    const [pid, cpu, mem] = line.trim().split(/\s+/);
    if (!wanted.has(Number(pid))) continue;
    rows.push({ pid: Number(pid), cpu: Number(cpu), memMb: parseMemMb(mem), command: wanted.get(Number(pid)) });
  }
  return {
    processes: rows,
    totalCpu: rows.reduce((sum, row) => sum + (row.cpu || 0), 0),
    totalMemMb: rows.reduce((sum, row) => sum + (row.memMb || 0), 0),
  };
}

async function duMb(path) {
  try {
    const { stdout } = await run("du", ["-sk", path], { maxBuffer: 16 * 1024 * 1024 });
    return { mb: Number(stdout.split(/\s+/)[0]) / 1024, partial: false };
  } catch (error) {
    // du exits non-zero when some entries are unreadable but still prints a total.
    const kb = Number(String(error.stdout ?? "").split(/\s+/)[0]);
    if (Number.isFinite(kb) && kb > 0) return { mb: kb / 1024, partial: true };
    return { mb: null, partial: true };
  }
}

// ---------------------------------------------------------------------------
// Browser control

async function quitBrowser(browser) {
  await text("osascript", ["-e", `tell application id "${browser.bundleId}" to quit`]);
  for (let waited = 0; waited < 30; waited++) {
    if (!(await browserProcesses(browser)).length) return true;
    await sleep(1);
  }
  return false;
}

async function openUrl(browser, url) {
  await run("open", ["-a", browser.app, url]);
}

/**
 * Browsers treat a window covered by another app as hidden: pages stop painting
 * and video is throttled. Bring the browser to the front before page-level work.
 */
async function activate(browser) {
  await text("osascript", ["-e", `tell application id "${browser.bundleId}" to activate`]);
  await sleep(1);
}

async function isFrontmost(browser) {
  const front = await text("osascript", ["-e", 'tell application "System Events" to get bundle identifier of first process whose frontmost is true']);
  return front === browser.bundleId;
}

async function selectTab(browser, n) {
  try {
    await run("osascript", ["-e", browser.selectTab(n)]);
    return true;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Local server
//
//   /__bench/start   tiny page that calls /__bench/ready on its load event (startup timing)
//   /__bench/report  where the benchmark pages POST their results (?report=1)
//   everything else  proxied to --base-url, so the pages share this origin

const HOP_HEADERS = new Set(["content-encoding", "content-length", "transfer-encoding", "connection", "keep-alive", "strict-transport-security", "set-cookie", "alt-svc"]);
const FORWARD_HEADERS = ["accept", "accept-language", "user-agent", "range", "if-none-match", "if-modified-since", "content-type"];

async function startLocalServer(target) {
  const readyWaiters = new Map();
  const reports = [];
  const reportWaiters = [];

  async function proxy(request, response) {
    const headers = {};
    for (const name of FORWARD_HEADERS) if (request.headers[name]) headers[name] = request.headers[name];
    const upstream = await fetch(target + request.url, { headers, redirect: "manual" });
    const outgoing = {};
    upstream.headers.forEach((value, key) => {
      if (HOP_HEADERS.has(key)) return;
      outgoing[key] = key === "location" ? value.replace(target, "") : value;
    });
    response.writeHead(upstream.status, outgoing);
    if (upstream.body) Readable.fromWeb(upstream.body).pipe(response);
    else response.end();
  }

  const server = createServer((request, response) => {
    const url = new URL(request.url, "http://127.0.0.1");
    if (url.pathname === "/__bench/start") {
      const token = url.searchParams.get("token") ?? "";
      response.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" });
      response.end(`<!doctype html><meta charset="utf-8"><title>Startup ${token}</title><h1>Browser started</h1><p>Measuring. You can leave this window alone.</p><script>addEventListener("load",()=>fetch("/__bench/ready?token=${encodeURIComponent(token)}",{method:"POST"}))</script>`);
      return;
    }
    if (url.pathname === "/__bench/ready") {
      readyWaiters.get(url.searchParams.get("token"))?.(performance.now());
      response.writeHead(204).end();
      return;
    }
    if (url.pathname === "/__bench/report" && request.method === "POST") {
      let body = "";
      request.on("data", (chunk) => { body += chunk; });
      request.on("end", () => {
        response.writeHead(204).end();
        try {
          const report = JSON.parse(body);
          reports.push(report);
          for (const waiter of [...reportWaiters]) waiter(report);
        } catch {
          // Ignore malformed reports.
        }
      });
      return;
    }
    proxy(request, response).catch((error) => {
      if (!response.headersSent) response.writeHead(502, { "Content-Type": "text/plain" });
      response.end(`Proxy error: ${error.message}`);
    });
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;

  return {
    origin,
    startUrl: (token) => `${origin}/__bench/start?token=${token}`,
    waitForReady: (token, timeoutSeconds) => new Promise((resolve) => {
      const timer = setTimeout(() => { readyWaiters.delete(token); resolve(null); }, timeoutSeconds * 1000);
      readyWaiters.set(token, (at) => { clearTimeout(timer); readyWaiters.delete(token); resolve(at); });
    }),
    /** Resolves with the first report (already received or future) matching `predicate`, or null on timeout. */
    waitForReport: (predicate, timeoutSeconds) => new Promise((resolve) => {
      const existing = reports.find(predicate);
      if (existing) return resolve(existing);
      const waiter = (report) => {
        if (!predicate(report)) return;
        clearTimeout(timer);
        reportWaiters.splice(reportWaiters.indexOf(waiter), 1);
        resolve(report);
      };
      const timer = setTimeout(() => { reportWaiters.splice(reportWaiters.indexOf(waiter), 1); resolve(null); }, timeoutSeconds * 1000);
      reportWaiters.push(waiter);
    }),
    /** Removes and returns every report so far matching `predicate`. */
    take: (predicate) => {
      const taken = reports.filter(predicate);
      for (const report of taken) reports.splice(reports.indexOf(report), 1);
      return taken;
    },
    close: () => new Promise((resolve) => { server.closeAllConnections?.(); server.close(resolve); }),
  };
}

// ---------------------------------------------------------------------------
// Scenarios

function createRecorder(context) {
  const observations = [];
  const processRows = [];
  const pageRows = [];
  return {
    observe(scenario, runNumber, sampleIndex, elapsed, metric, value, unit, detail = "") {
      observations.push({ timestamp: new Date().toISOString(), session_id: context.sessionId, browser: context.key, browser_version: context.version, scenario, run: runNumber, sample: sampleIndex, elapsed_s: elapsed === null ? "" : elapsed.toFixed(1), metric, value: value === null || value === undefined ? "" : Number(value.toFixed(3)), unit, detail });
    },
    processes(scenario, runNumber, sampleIndex, rows) {
      const timestamp = new Date().toISOString();
      for (const row of rows) processRows.push({ timestamp, session_id: context.sessionId, browser: context.key, scenario, run: runNumber, sample: sampleIndex, pid: row.pid, cpu_pct: row.cpu, mem_mb: row.memMb?.toFixed(1), command: row.command });
    },
    /** A page-level TestResult (see src/lib/browser-benchmark.ts) → one row per individual run. */
    pageResult(scenario, runNumber, result) {
      const timestamp = new Date().toISOString();
      for (const m of result.measurements) {
        m.runs.forEach((value, index) => pageRows.push({ timestamp, session_id: context.sessionId, browser: context.key, browser_version: context.version, scenario, run: runNumber, test: result.test, metric: m.label, run_index: index + 1, value: value ?? "", unit: m.unit, foreground_throughout: result.foregroundThroughout, note: m.note ?? "" }));
      }
    },
    async flush() {
      await appendCsv(join(context.out, "observations.csv"), OBSERVATION_COLUMNS, observations.splice(0));
      await appendCsv(join(context.out, "processes.csv"), PROCESS_COLUMNS, processRows.splice(0));
      await appendCsv(join(context.out, "page-metrics.csv"), PAGE_COLUMNS, pageRows.splice(0));
    },
  };
}

/** Samples repeatedly for `seconds`, recording per-sample totals. Returns the sample totals. */
async function sampleWindow(context, recorder, scenario, runNumber, seconds) {
  const totals = [];
  const start = Date.now();
  for (let index = 0; (Date.now() - start) / 1000 < seconds || index === 0; index++) {
    const tick = Date.now();
    const result = await sample(context.browser);
    const elapsed = (Date.now() - start) / 1000;
    recorder.observe(scenario, runNumber, index, elapsed, "total_mem", result.totalMemMb, "MB");
    recorder.observe(scenario, runNumber, index, elapsed, "total_cpu", result.totalCpu, "% of one core");
    recorder.observe(scenario, runNumber, index, elapsed, "process_count", result.processes.length, "processes");
    recorder.processes(scenario, runNumber, index, result.processes);
    totals.push(result);
    await recorder.flush();
    process.stdout.write(`\r    sample ${index + 1}: ${result.totalMemMb.toFixed(0)} MB, ${result.totalCpu.toFixed(1)}% CPU, ${result.processes.length} processes   `);
    await sleep(Math.max(0, context.options.interval - (Date.now() - tick) / 1000));
  }
  process.stdout.write("\n");
  return totals;
}

async function ensureQuit(context) {
  if (await quitBrowser(context.browser)) return;
  console.log(`    ${context.browser.name} did not quit within 30 s; force-quitting.`);
  for (const { pid } of await browserProcesses(context.browser)) await text("kill", ["-9", String(pid)]);
  await sleep(2);
}

async function scenarioStorage(context, recorder) {
  console.log("\n▸ Storage");
  const app = await duMb(context.browser.app);
  recorder.observe("storage", 1, 0, null, "app_size", app.mb, "MB", `${context.browser.app}${app.partial ? " (partial: some files unreadable)" : ""}`);
  console.log(`    app: ${app.mb?.toFixed(0) ?? "unreadable"} MB${app.partial ? " (partial)" : ""}`);
  let profileTotal = 0;
  for (const relative of context.browser.profileDirs) {
    const path = join(HOME, relative);
    try { await access(path); } catch { recorder.observe("storage", 1, 0, null, "profile_dir_size", null, "MB", `${path} (missing)`); continue; }
    const size = await duMb(path);
    profileTotal += size.mb ?? 0;
    recorder.observe("storage", 1, 0, null, "profile_dir_size", size.mb, "MB", `${path}${size.partial ? " (partial: grant Terminal Full Disk Access for a complete figure)" : ""}`);
    console.log(`    ${relative}: ${size.mb?.toFixed(0) ?? "unreadable"} MB${size.partial ? " (partial)" : ""}`);
    await recorder.flush();
  }
  recorder.observe("storage", 1, 0, null, "profile_size", profileTotal, "MB", "sum of profile_dir_size rows");
  context.summary.push(["storage", "app size", app.mb, "MB"], ["storage", "profile size", profileTotal, "MB"]);
  await recorder.flush();
}

async function scenarioStartup(context, recorder) {
  console.log(`\n▸ Startup (${context.options.runs} runs)`);
  const launchTimes = [];
  const memories = [];
  for (let runNumber = 1; runNumber <= context.options.runs; runNumber++) {
    await ensureQuit(context);
    await sleep(3);
    const token = `${context.sessionId}-${runNumber}`;
    const ready = context.server.waitForReady(token, 90);
    const launchedAt = performance.now();
    await openUrl(context.browser, context.server.startUrl(token));
    const readyAt = await ready;
    const launchMs = readyAt === null ? null : readyAt - launchedAt;
    recorder.observe("startup", runNumber, 0, null, "launch_to_page_load", launchMs, "ms", "from `open -a` to the local start page's load event");
    console.log(`  run ${runNumber}: ${launchMs === null ? "timed out" : `${launchMs.toFixed(0)} ms`} to page load; settling ${context.options.settle}s`);
    if (launchMs !== null) launchTimes.push(launchMs);
    await recorder.flush();
    await sleep(context.options.settle);
    const totals = await sampleWindow(context, recorder, "startup", runNumber, context.options.interval * 2);
    memories.push(medianOf(totals.map((t) => t.totalMemMb)));
    await recorder.flush();
  }
  context.summary.push(["startup", "launch to page load", medianOf(launchTimes), "ms"], ["startup", "memory after settling", medianOf(memories), "MB"]);
}

/** Page load (5 reloads) and interaction (15 repetitions), run by the page itself. Once per browser. */
async function scenarioPage(context, recorder) {
  console.log("\n▸ Page load and interaction (on the benchmark page)");
  await ensureQuit(context);
  await sleep(3);
  context.server.take((r) => r.kind === "page");
  await openUrl(context.browser, `${context.server.origin}/browser-benchmark?autostart=page&report=1`);
  await activate(context.browser);
  const report = await context.server.waitForReport((r) => r.kind === "page", 180);
  if (!report) {
    console.log("    no result from the page within 3 minutes (is /browser-benchmark deployed at --base-url?)");
    return;
  }
  for (const result of report.results) recorder.pageResult("page", 1, result);
  const pick = (test, label) => report.results.find((r) => r.test === test)?.measurements.find((m) => m.label === label)?.median ?? null;
  const interaction = pick("interaction", "Filter + reorder to next paint");
  const load = pick("page-load", "Load event finished");
  console.log(`    interaction ${interaction ?? "n/a"} ms · load event ${load ?? "n/a"} ms (medians)`);
  context.summary.push(["page", "interaction to paint", interaction, "ms"], ["page", "load event finished", load, "ms"]);
  await recorder.flush();
}

function workloadUrls(context, count) {
  return Array.from({ length: count }, (_, i) => `${context.server.origin}/browser-benchmark/workload?tab=${i + 1}&report=1`);
}

async function launchWithTabs(context, urls) {
  await ensureQuit(context);
  await sleep(3);
  // Launch straight into the first URL so there's no extra new-tab page in the count.
  await openUrl(context.browser, urls[0]);
  await sleep(5);
  for (const url of urls.slice(1)) {
    await openUrl(context.browser, url);
    await sleep(0.5);
  }
}

async function scenarioTabs(context, recorder) {
  console.log(`\n▸ ${TAB_COUNT} tabs: idle, then tab switching (${context.options.runs} runs)`);
  const memories = [];
  const cpus = [];
  const switches = [];
  for (let runNumber = 1; runNumber <= context.options.runs; runNumber++) {
    await launchWithTabs(context, workloadUrls(context, TAB_COUNT));
    console.log(`  run ${runNumber}: opened ${TAB_COUNT} tabs; settling ${context.options.tabsSettle}s, then sampling ${context.options.idle}s idle`);
    await sleep(context.options.tabsSettle);
    const totals = await sampleWindow(context, recorder, "tabs_idle", runNumber, context.options.idle);
    memories.push(medianOf(totals.map((t) => t.totalMemMb)));
    cpus.push(medianOf(totals.map((t) => t.totalCpu)));

    // Switch through every tab via AppleScript; each workload tab reports its activation-to-paint time.
    await activate(context.browser);
    context.server.take((r) => r.kind === "tab-activation");
    let selected = 0;
    for (let round = 0; round < TAB_SWITCH_ROUNDS; round++) {
      for (let n = 1; n <= TAB_COUNT; n++) {
        if (await selectTab(context.browser, n)) selected++;
        await sleep(0.8);
      }
    }
    const frontmost = await isFrontmost(context.browser);
    recorder.observe("tabs_switch", runNumber, 0, null, "browser_frontmost", frontmost ? 1 : 0, "boolean", "checked after tab switching; 0 means another app covered the browser");
    await sleep(2);
    const activations = context.server.take((r) => r.kind === "tab-activation").map((r) => r.ms);
    recorder.pageResult("tabs_switch", runNumber, {
      test: "tab-workload", foregroundThroughout: true,
      measurements: [{ label: "Tab activation to next paint", unit: "ms", runs: activations, note: `${selected} AppleScript tab switches` }],
    });
    const runMedian = medianOf(activations);
    if (runMedian !== null) switches.push(runMedian);
    if (!frontmost) console.log(`    ⚠ ${context.browser.name} was not the frontmost app; its pages may have been hidden`);
    console.log(`    tab switching: ${activations.length} of ${selected} switches recorded${selected === 0 ? " (AppleScript tab selection failed for this browser)" : ""}, median ${runMedian?.toFixed(1) ?? "n/a"} ms`);
    await recorder.flush();
  }
  context.summary.push(
    ["tabs_idle", "memory, 20 tabs", medianOf(memories), "MB"],
    ["tabs_idle", "idle CPU, 20 tabs", medianOf(cpus), "% of one core"],
    ["tabs_switch", "tab activation to paint", medianOf(switches), "ms"],
  );
}

async function scenarioVideo(context, recorder) {
  console.log(`\n▸ Video with 19 background tabs (${context.options.runs} runs)`);
  const memoryGrowth = [];
  const cpus = [];
  const dropped = [];
  for (let runNumber = 1; runNumber <= context.options.runs; runNumber++) {
    context.server.take((r) => r.kind === "video");
    await launchWithTabs(context, [...workloadUrls(context, 19), `${context.server.origin}/browser-benchmark?autostart=video&report=1&seconds=${context.options.video}`]);
    await activate(context.browser);
    console.log(`  run ${runNumber}: video page is the last, foreground tab. Sampling ${context.options.video}s.`);
    await sleep(5);
    const totals = await sampleWindow(context, recorder, "video", runNumber, context.options.video);
    const frontmost = await isFrontmost(context.browser);
    recorder.observe("video", runNumber, 0, null, "browser_frontmost", frontmost ? 1 : 0, "boolean", "checked at the end of playback; 0 means another app covered the browser");
    if (!frontmost) console.log(`    ⚠ ${context.browser.name} was not the frontmost app at the end; playback may have been throttled`);
    const growth = totals.length > 1 ? totals.at(-1).totalMemMb - totals[0].totalMemMb : null;
    recorder.observe("video", runNumber, totals.length - 1, null, "mem_change", growth, "MB", "last sample minus first sample");
    memoryGrowth.push(growth);
    cpus.push(medianOf(totals.map((t) => t.totalCpu)));

    const report = await context.server.waitForReport((r) => r.kind === "video", 30);
    if (report) {
      recorder.pageResult("video", runNumber, report.result);
      const share = report.result.measurements.find((m) => m.label === "Dropped frame share")?.runs[0];
      if (Number.isFinite(share)) dropped.push(share);
      console.log(`    page: ${report.result.measurements.map((m) => `${m.label} ${m.runs[0] ?? "unavailable"}${m.runs[0] === null ? "" : ` ${m.unit}`}`).join(" · ")}`);
    } else {
      console.log("    no playback report from the page (video may not have autoplayed)");
    }
    await recorder.flush();
  }
  context.summary.push(
    ["video", "CPU during playback", medianOf(cpus), "% of one core"],
    ["video", "memory change over window", medianOf(memoryGrowth), "MB"],
    ["video", "dropped frame share", medianOf(dropped), "%"],
  );
}

// ---------------------------------------------------------------------------

async function measureBrowser(key, options, scenarios, server) {
  const browser = BROWSERS[key];
  const env = await environment(browser);
  const sessionId = `${key}-${new Date().toISOString().replace(/[:.]/g, "-")}`;
  const context = { key, browser, options, sessionId, version: env.version, out: options.out, summary: [], server };

  console.log(`\n━━ ${browser.name} ${env.version} · ${env.model} · macOS ${env.macos} · ${env.power}`);
  await appendCsv(join(options.out, "sessions.csv"), SESSION_COLUMNS, [{
    session_id: sessionId, started_at: new Date().toISOString(), browser: key, browser_version: env.version, app_path: browser.app,
    mac_model: env.model, macos_version: env.macos, power_source: env.power, host: hostname(), base_url: options.baseUrl, runs: options.runs,
    settle_s: options.settle, tabs_settle_s: options.tabsSettle, idle_s: options.idle, video_s: options.video, interval_s: options.interval,
  }]);

  const recorder = createRecorder(context);
  const handlers = { storage: scenarioStorage, startup: scenarioStartup, page: scenarioPage, tabs: scenarioTabs, video: scenarioVideo };
  for (const scenario of scenarios) {
    try {
      await handlers[scenario](context, recorder);
    } catch (error) {
      // Everything recorded so far is already on disk; note the failure and move on.
      console.log(`\n    ✗ ${scenario} failed: ${error.message}. Continuing with the next scenario.`);
      recorder.observe(scenario, "", "", null, "scenario_failed", null, "", error.message);
    } finally {
      await recorder.flush();
    }
  }
  // Storage alone never launches the browser, so leave it running in that case.
  if (scenarios.some((scenario) => scenario !== "storage")) await quitBrowser(browser);
  return { name: `${browser.name} ${env.version}`, summary: context.summary };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) { console.log(HELP); return; }
  if (process.platform !== "darwin") throw new Error("This script only runs on macOS.");

  const requested = options.browser === "all" ? Object.keys(BROWSERS) : options.browser.split(",");
  for (const key of requested) if (!BROWSERS[key]) throw new Error(`Unknown browser "${key}". Choose from: ${Object.keys(BROWSERS).join(", ")}`);
  const browsers = [];
  for (const key of requested) {
    try { await access(BROWSERS[key].app); browsers.push(key); } catch { console.log(`Skipping ${BROWSERS[key].name}: ${BROWSERS[key].app} not found.`); }
  }
  if (!browsers.length) throw new Error("None of the requested browsers are installed.");
  const scenarios = options.scenario === "all" ? SCENARIOS : options.scenario.split(",");
  for (const scenario of scenarios) if (!SCENARIOS.includes(scenario)) throw new Error(`Unknown scenario "${scenario}".`);

  const check = await fetch(`${options.baseUrl}/browser-benchmark`, { method: "HEAD" }).catch(() => null);
  if (!check?.ok && scenarios.some((s) => ["page", "tabs", "video"].includes(s))) {
    throw new Error(`${options.baseUrl}/browser-benchmark is not reachable (${check?.status ?? "no response"}). Deploy it, or pass --base-url http://localhost:3000 with the dev server running.`);
  }

  await mkdir(options.out, { recursive: true });
  const minutes = Math.round(browsers.length * (
    (scenarios.includes("startup") ? options.runs * (options.settle + options.interval * 2 + 10) : 0) +
    (scenarios.includes("page") ? 60 : 0) +
    (scenarios.includes("tabs") ? options.runs * (25 + options.tabsSettle + options.idle + TAB_COUNT * TAB_SWITCH_ROUNDS) : 0) +
    (scenarios.includes("video") ? options.runs * (25 + options.video) : 0)
  ) / 60);

  console.log(`Browsers: ${browsers.map((key) => BROWSERS[key].name).join(", ")}`);
  console.log(`Scenarios: ${scenarios.join(", ")} · ${options.runs} runs each · about ${minutes} minutes`);
  console.log(`Saving to ${options.out}/ as it goes: every sample is written immediately, so stopping early (or Ctrl-C) keeps everything recorded so far.`);
  if (browsers.includes("safari")) console.log("⚠ Safari's WebKit helper processes are shared with Mail, Messages, and other WebKit apps. Quit those first.");
  if (!options.yes) {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    await rl.question(`\nBefore starting:\n  • Plug in, and close apps you don't need.\n  • Set each browser to open a new window on launch (not restore previous tabs).\n  • Don't touch the computer until it finishes; each browser will be quit and relaunched.\nPress Enter to begin. `);
    rl.close();
  }

  const server = await startLocalServer(options.baseUrl);
  const reports = [];
  try {
    for (const key of browsers) {
      try {
        reports.push(await measureBrowser(key, options, scenarios, server));
      } catch (error) {
        console.log(`\n✗ ${BROWSERS[key].name} failed: ${error.message}. Continuing with the next browser.`);
      }
    }
  } finally {
    await server.close();
  }

  console.log(`\nMedians (raw data: ${options.out}/observations.csv for whole-browser, ${options.out}/page-metrics.csv for page-level)`);
  for (const { name, summary } of reports) {
    console.log(`\n  ${name}`);
    for (const [scenario, label, value, unit] of summary) console.log(`    ${scenario.padEnd(12)} ${label.padEnd(28)} ${value === null ? "n/a" : value.toFixed(1)} ${unit}`);
  }
}

main().catch((error) => {
  console.error(`\n${error.message}`);
  process.exit(1);
});
