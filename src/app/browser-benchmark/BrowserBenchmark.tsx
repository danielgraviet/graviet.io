"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { Download, Film, Gauge, Layers, MousePointerClick } from "lucide-react";
import {
  applyInteraction,
  generateRows,
  INTERACTION_REPETITIONS,
  INTERACTION_ROWS,
  INTERACTION_STEPS,
  measurement,
  median,
  reportToScript,
  TAB_ACTIVATIONS_KEY,
  TEST_VERSION,
  VIDEO_DURATION_SECONDS,
  VIDEO_SRC,
  WORKLOAD_TAB_COUNT,
  type BenchmarkReport,
  type Measurement,
  type TabActivation,
  type TestResult,
} from "@/lib/browser-benchmark";

const RESULTS_KEY = "browser-benchmark:results";
const PAGE_LOAD_PLAN_KEY = "browser-benchmark:page-load-plan";
const PAGE_LOAD_RUNS = 5;

type PageLoadRun = Record<string, number | null>;
/** `carry` holds results from earlier in an autostarted sequence, reported together at the end. */
type PageLoadPlan = { remaining: number; startedAt: string; foregroundAtStart: boolean; foregroundThroughout: boolean; runs: PageLoadRun[]; carry?: TestResult[] };

const PAGE_LOAD_METRICS: { key: string; label: string }[] = [
  { key: "responseStart", label: "Time to first byte" },
  { key: "responseEnd", label: "Response complete" },
  { key: "domInteractive", label: "DOM interactive" },
  { key: "domContentLoaded", label: "DOMContentLoaded finished" },
  { key: "loadEventEnd", label: "Load event finished" },
  { key: "firstContentfulPaint", label: "First contentful paint" },
];

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage blocked (private window, strict settings). Results stay in memory for this visit.
  }
}

function afterNextPaint() {
  return new Promise<number>((resolve) => {
    requestAnimationFrame(() => {
      const channel = new MessageChannel();
      channel.port1.onmessage = () => resolve(performance.now());
      channel.port2.postMessage(null);
    });
  });
}

const round = (value: number) => Math.round(value * 10) / 10;
const isForeground = () => document.visibilityState === "visible";

function readNavigationTiming(): PageLoadRun | null {
  const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
  if (!nav) return null;
  const fcp = performance.getEntriesByName("first-contentful-paint")[0];
  const ms = (value: number) => (value > 0 ? round(value - nav.startTime) : null);
  return {
    responseStart: ms(nav.responseStart),
    responseEnd: ms(nav.responseEnd),
    domInteractive: ms(nav.domInteractive),
    domContentLoaded: ms(nav.domContentLoadedEventEnd),
    loadEventEnd: ms(nav.loadEventEnd),
    firstContentfulPaint: fcp ? round(fcp.startTime) : null,
  };
}

function browserHint() {
  const ua = navigator.userAgent;
  if ("brave" in navigator) return "Brave";
  if (getComputedStyle(document.documentElement).getPropertyValue("--arc-palette-title")) return "Arc";
  if (/Edg\//.test(ua)) return "Edge";
  if (/Chrome\//.test(ua)) return "Chrome (or another Chromium browser)";
  if (/Safari\//.test(ua) && /Version\//.test(ua)) return "Safari";
  if (/Firefox\//.test(ua)) return "Firefox";
  return "Unknown";
}

/** Tracks whether the page stayed visible from start() until read. */
function useForegroundTracker() {
  const stayed = useRef(true);
  useEffect(() => {
    const onChange = () => { if (!isForeground()) stayed.current = false; };
    document.addEventListener("visibilitychange", onChange);
    return () => document.removeEventListener("visibilitychange", onChange);
  }, []);
  return useMemo(() => ({
    start: () => { stayed.current = isForeground(); return stayed.current; },
    stayed: () => stayed.current && isForeground(),
  }), []);
}

function formatValue(value: number | null, unit: string) {
  if (value === null) return "unavailable";
  return `${Number.isInteger(value) ? value : value.toFixed(1)} ${unit}`;
}

function Measurements({ result }: { result: TestResult | undefined }) {
  if (!result) return <p className="text-sm text-text-secondary">No result yet.</p>;
  return (
    <div className="space-y-3">
      <p className="text-xs text-text-secondary">
        {new Date(result.startedAt).toLocaleString()} · {result.runCount} {result.runCount === 1 ? "run" : "runs"} ·{" "}
        {result.foregroundThroughout ? "foreground throughout" : result.foregroundAtStart ? "tab was hidden during the test" : "started in background"}
      </p>
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted text-left"><tr><th className="px-3 py-2 font-semibold">Metric</th><th className="px-3 py-2 font-semibold">Median</th><th className="px-3 py-2 font-semibold">Runs</th></tr></thead>
          <tbody>
            {result.measurements.map((m) => (
              <tr key={m.label} className="border-t border-border align-top">
                <td className="px-3 py-2">{m.label}{m.note && <span className="block text-xs text-text-secondary">{m.note}</span>}</td>
                <td className="whitespace-nowrap px-3 py-2 font-semibold tabular-nums">{formatValue(m.median, m.unit)}</td>
                <td className="px-3 py-2 text-xs tabular-nums text-text-secondary">{m.runs.map((run) => (run === null ? "unavailable" : run)).join(", ")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Card({ icon: Icon, title, children, description }: { icon: typeof Gauge; title: string; description: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-white p-5 shadow-sm sm:p-7">
      <div className="flex items-center gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-muted"><Icon size={18} /></span><h2 className="text-2xl tracking-tight">{title}</h2></div>
      <div className="mt-3 space-y-2 text-[15px] leading-relaxed text-text-secondary">{description}</div>
      <div className="mt-5 space-y-4 font-sans">{children}</div>
    </section>
  );
}

const buttonClass = "rounded-xl bg-foreground px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-80 disabled:opacity-40";
const secondaryButtonClass = "rounded-xl border border-border px-4 py-2.5 text-sm font-semibold transition hover:bg-muted disabled:opacity-40";

export default function BrowserBenchmark() {
  const [results, setResults] = useState<TestResult[]>([]);
  const [status, setStatus] = useState<Record<string, string>>({});
  const foreground = useForegroundTracker();

  const saveResult = useCallback((result: TestResult) => {
    setResults((current) => {
      const next = [...current.filter((item) => item.test !== result.test), result];
      writeJson(RESULTS_KEY, next);
      return next;
    });
  }, []);
  const latest = (test: TestResult["test"]) => results.find((result) => result.test === test);
  const say = (test: string, message: string) => setStatus((current) => ({ ...current, [test]: message }));

  // ---- Page load: reload the page N times and read Navigation Timing after each load.
  const [pageLoadRunning, setPageLoadRunning] = useState(false);
  useEffect(() => {
    setResults(readJson<TestResult[]>(RESULTS_KEY, []));
    const plan = readJson<PageLoadPlan | null>(PAGE_LOAD_PLAN_KEY, null);
    if (!plan) return;
    setPageLoadRunning(true);
    const record = () => setTimeout(() => {
      const run = readNavigationTiming();
      const next: PageLoadPlan = { ...plan, remaining: plan.remaining - 1, runs: run ? [...plan.runs, run] : plan.runs, foregroundThroughout: plan.foregroundThroughout && isForeground() };
      if (next.remaining > 0) {
        writeJson(PAGE_LOAD_PLAN_KEY, next);
        say("page-load", `Recorded load ${next.runs.length} of ${PAGE_LOAD_RUNS}. Reloading…`);
        setTimeout(() => window.location.reload(), 400);
        return;
      }
      writeJson(PAGE_LOAD_PLAN_KEY, null);
      setPageLoadRunning(false);
      say("page-load", "");
      const result: TestResult = {
        test: "page-load",
        startedAt: next.startedAt,
        foregroundAtStart: next.foregroundAtStart,
        foregroundThroughout: next.foregroundThroughout,
        runCount: next.runs.length,
        measurements: PAGE_LOAD_METRICS.map(({ key, label }) => measurement(label, "ms", next.runs.map((r) => r[key] ?? null), key === "responseStart" ? "Reloads, so the HTTP cache is warm after the first run." : undefined)),
      };
      saveResult(result);
      reportToScript({ kind: "page", results: [...(next.carry ?? []), result] });
      // Drop ?autostart so a manual refresh doesn't start another sequence.
      const url = new URL(window.location.href);
      url.searchParams.delete("autostart");
      window.history.replaceState(null, "", url);
    }, 0);
    if (document.readyState === "complete") record();
    else window.addEventListener("load", record, { once: true });
  }, [saveResult]);

  function startPageLoad(carry?: TestResult[]) {
    const fg = foreground.start();
    writeJson(PAGE_LOAD_PLAN_KEY, { remaining: PAGE_LOAD_RUNS, startedAt: new Date().toISOString(), foregroundAtStart: fg, foregroundThroughout: fg, runs: [], carry } satisfies PageLoadPlan);
    window.location.reload();
  }

  // ---- Interaction: filter + reorder a fixed list, time from click to the next painted frame.
  const allRows = useMemo(() => generateRows(INTERACTION_ROWS), []);
  const [stepIndex, setStepIndex] = useState<number | null>(null);
  const visibleRows = useMemo(() => (stepIndex === null ? allRows : applyInteraction(allRows, INTERACTION_STEPS[stepIndex % INTERACTION_STEPS.length])), [allRows, stepIndex]);
  const [interactionRunning, setInteractionRunning] = useState(false);

  async function runInteraction() {
    setInteractionRunning(true);
    const startedAt = new Date().toISOString();
    const fgStart = foreground.start();
    const runs: number[] = [];
    // One unrecorded warm-up so JIT and layout caches start in the same state everywhere.
    for (let i = -1; i < INTERACTION_REPETITIONS; i++) {
      say("interaction", i < 0 ? "Warming up…" : `Repetition ${i + 1} of ${INTERACTION_REPETITIONS}…`);
      await new Promise((resolve) => setTimeout(resolve, 120));
      const start = performance.now();
      flushSync(() => setStepIndex(Math.max(i, 0)));
      const painted = await afterNextPaint();
      if (i >= 0) runs.push(round(painted - start));
    }
    say("interaction", "");
    setInteractionRunning(false);
    const result: TestResult = {
      test: "interaction",
      startedAt,
      foregroundAtStart: fgStart,
      foregroundThroughout: foreground.stayed(),
      runCount: runs.length,
      measurements: [measurement("Filter + reorder to next paint", "ms", runs, `${INTERACTION_ROWS} rows, ${INTERACTION_STEPS.length} rotating filter/sort steps, 1 warm-up excluded.`)],
    };
    saveResult(result);
    return result;
  }

  // ---- Tab workload: open 20 identical tabs; each tab reports activation-to-paint via localStorage.
  const [opened, setOpened] = useState<number | null>(null);
  const [activations, setActivations] = useState<TabActivation[]>([]);
  useEffect(() => {
    const load = () => setActivations(readJson<TabActivation[]>(TAB_ACTIVATIONS_KEY, []));
    load();
    window.addEventListener("storage", load);
    window.addEventListener("focus", load);
    return () => { window.removeEventListener("storage", load); window.removeEventListener("focus", load); };
  }, []);
  const tabUrls = useMemo(() => Array.from({ length: WORKLOAD_TAB_COUNT }, (_, i) => `/browser-benchmark/workload?tab=${i + 1}`), []);

  function openTabs() {
    let count = 0;
    for (const url of tabUrls) if (window.open(url, "_blank")) count++;
    setOpened(count);
  }

  function saveTabResult() {
    saveResult({
      test: "tab-workload",
      startedAt: activations[0]?.at ?? new Date().toISOString(),
      foregroundAtStart: true,
      foregroundThroughout: true,
      runCount: activations.length,
      measurements: [measurement("Tab activation to next paint", "ms", activations.map((a) => a.ms), "Measured inside each workload tab, from its visibilitychange event to the next frame. Excludes browser work before the page is told it is visible.")],
    });
  }

  function clearActivations() {
    writeJson(TAB_ACTIVATIONS_KEY, null);
    setActivations([]);
  }

  // ---- Video: play a fixed local file for five minutes and read playback quality.
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoElapsed, setVideoElapsed] = useState<number | null>(null);
  // The measurement script passes ?seconds=N to match its own sampling window.
  const [videoDuration, setVideoDuration] = useState(VIDEO_DURATION_SECONDS);
  const videoStop = useRef<((completed: boolean) => void) | null>(null);

  const runVideo = useCallback(async () => {
    const video = videoRef.current;
    if (!video || videoStop.current) return;
    const startedAt = new Date().toISOString();
    const fgStart = foreground.start();
    const duration = Number(new URLSearchParams(window.location.search).get("seconds")) || VIDEO_DURATION_SECONDS;
    setVideoDuration(duration);
    let waiting = 0;
    let firstFrameMs: number | null = null;
    // Only stalls after the first frame count; the initial buffer is covered by "Play to first frame".
    const onWaiting = () => { if (firstFrameMs !== null) waiting++; };
    video.addEventListener("waiting", onWaiting);
    video.currentTime = 0;
    const playStart = performance.now();
    video.addEventListener("playing", () => { firstFrameMs = round(performance.now() - playStart); }, { once: true });
    try {
      await video.play();
    } catch (error) {
      video.removeEventListener("waiting", onWaiting);
      say("video", `Playback did not start: ${error instanceof Error ? error.message : String(error)}`);
      return;
    }
    say("video", "");
    const clockStart = performance.now();
    setVideoElapsed(0);
    const timer = setInterval(() => {
      const elapsed = (performance.now() - clockStart) / 1000;
      setVideoElapsed(elapsed);
      if (elapsed >= duration) videoStop.current?.(true);
    }, 500);

    videoStop.current = (completed) => {
      clearInterval(timer);
      videoStop.current = null;
      video.pause();
      video.removeEventListener("waiting", onWaiting);
      setVideoElapsed(null);
      const seconds = round((performance.now() - clockStart) / 1000);
      const legacy = video as HTMLVideoElement & { webkitDroppedFrameCount?: number; webkitDecodedFrameCount?: number };
      const quality = typeof video.getVideoPlaybackQuality === "function" ? video.getVideoPlaybackQuality() : null;
      const dropped = quality ? quality.droppedVideoFrames : legacy.webkitDroppedFrameCount ?? null;
      const total = quality ? quality.totalVideoFrames : legacy.webkitDecodedFrameCount ?? null;
      const run = { seconds, firstFrameMs, waiting, dropped, total, droppedPct: dropped !== null && total ? round((dropped / total) * 1000) / 10 : null };
      const fgThroughout = foreground.stayed();
      reportToScript({
        kind: "video",
        result: {
          test: "video", startedAt, foregroundAtStart: fgStart, foregroundThroughout: fgThroughout, runCount: 1,
          measurements: [
            measurement("Played for", "s", [seconds], completed ? undefined : "Stopped early."),
            measurement("Play to first frame", "ms", [run.firstFrameMs]),
            measurement("Rebuffering (waiting) events", "events", [run.waiting]),
            measurement("Dropped frames", "frames", [run.dropped]),
            measurement("Total frames", "frames", [run.total]),
            measurement("Dropped frame share", "%", [run.droppedPct]),
          ],
        },
      });

      setResults((current) => {
        const previous = current.find((r) => r.test === "video");
        const prior = (label: string) => previous?.measurements.find((m) => m.label === label);
        const append = (label: string, unit: string, value: number | null, note?: string): Measurement =>
          measurement(label, unit, [...(prior(label)?.runs ?? []), value], note ?? prior(label)?.note);
        const result: TestResult = {
          test: "video",
          startedAt: previous?.startedAt ?? startedAt,
          foregroundAtStart: (previous?.foregroundAtStart ?? true) && fgStart,
          foregroundThroughout: (previous?.foregroundThroughout ?? true) && fgThroughout,
          runCount: (previous?.runCount ?? 0) + 1,
          measurements: [
            append("Played for", "s", seconds, completed ? undefined : "A run was stopped early; compare only full-length runs."),
            append("Play to first frame", "ms", run.firstFrameMs),
            append("Rebuffering (waiting) events", "events", run.waiting),
            append("Dropped frames", "frames", run.dropped),
            append("Total frames", "frames", run.total),
            append("Dropped frame share", "%", run.droppedPct),
          ],
        };
        const next = [...current.filter((r) => r.test !== "video"), result];
        writeJson(RESULTS_KEY, next);
        return next;
      });
    };
  }, [foreground]);

  // The local measurement script opens ?autostart=video or ?autostart=page so runs begin without a click.
  const autostarted = useRef(false);
  const runInteractionRef = useRef(runInteraction);
  const startPageLoadRef = useRef(startPageLoad);
  useEffect(() => {
    runInteractionRef.current = runInteraction;
    startPageLoadRef.current = startPageLoad;
  });
  useEffect(() => {
    const mode = new URLSearchParams(window.location.search).get("autostart");
    // A page-load plan in progress means this is one of its reloads, not a fresh start.
    if (autostarted.current || !mode || readJson<PageLoadPlan | null>(PAGE_LOAD_PLAN_KEY, null)) return;
    autostarted.current = true;
    if (mode === "video") void runVideo();
    if (mode === "page") void (async () => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const interaction = await runInteractionRef.current();
      startPageLoadRef.current([interaction]);
    })();
  }, [runVideo]);

  // ---- Export
  function downloadReport() {
    const report: BenchmarkReport = {
      testVersion: TEST_VERSION,
      userAgent: navigator.userAgent,
      browserHint: browserHint(),
      exportedAt: new Date().toISOString(),
      screen: { width: screen.width, height: screen.height, devicePixelRatio: window.devicePixelRatio },
      hardwareConcurrency: navigator.hardwareConcurrency ?? null,
      results,
    };
    const url = URL.createObjectURL(new Blob([JSON.stringify(report, null, 2)], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `browser-benchmark-${report.browserHint.split(" ")[0].toLowerCase()}-${report.exportedAt.replace(/[:.]/g, "-")}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function clearResults() {
    writeJson(RESULTS_KEY, null);
    setResults([]);
  }

  const tabMedian = median(activations.map((a) => a.ms));

  return (
    <div className="mx-auto max-w-3xl py-2">
      <div className="mb-10">
        <p className="font-sans text-xs uppercase tracking-wider text-text-secondary">Test version {TEST_VERSION}</p>
        <h1 className="mt-2 text-4xl tracking-tight sm:text-5xl">Browser benchmark</h1>
        <p className="mt-4 text-lg leading-relaxed text-text-secondary">
          Four small tests you can run in Safari, Arc, Chrome, and Brave on the same machine. They measure what a web page can see about itself. They cannot measure a browser&apos;s total memory, CPU, or disk use; for that I use a separate script on my Mac.
        </p>
        <p className="mt-3 text-sm text-text-secondary">Results stay in this browser. Nothing is uploaded; download the JSON if you want to keep it.</p>
      </div>

      <div className="space-y-6">
        <Card icon={Gauge} title="Page load" description={<p>Reloads this page {PAGE_LOAD_RUNS} times and reads the browser&apos;s Navigation Timing for each load. All times are milliseconds from the start of navigation.</p>}>
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" className={buttonClass} onClick={() => startPageLoad()} disabled={pageLoadRunning}>{pageLoadRunning ? "Running…" : `Run ${PAGE_LOAD_RUNS} reloads`}</button>
            {status["page-load"] && <span className="text-sm text-text-secondary">{status["page-load"]}</span>}
          </div>
          <Measurements result={latest("page-load")} />
        </Card>

        <Card icon={MousePointerClick} title="Interaction" description={<p>Filters and reorders the same {INTERACTION_ROWS.toLocaleString()}-row list {INTERACTION_REPETITIONS} times, measuring from each update until the next frame is painted.</p>}>
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" className={buttonClass} onClick={runInteraction} disabled={interactionRunning}>{interactionRunning ? "Running…" : `Run ${INTERACTION_REPETITIONS} repetitions`}</button>
            {status.interaction && <span className="text-sm text-text-secondary">{status.interaction}</span>}
          </div>
          <div className="max-h-56 overflow-auto rounded-xl border border-border">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-muted text-left"><tr>{["#", "Name", "Team", "Status", "Score"].map((h) => <th key={h} className="px-3 py-1.5 font-semibold">{h}</th>)}</tr></thead>
              <tbody>{visibleRows.map((row) => <tr key={row.id} className="border-t border-border"><td className="px-3 py-1 text-text-secondary">{row.id}</td><td className="px-3 py-1">{row.name}</td><td className="px-3 py-1">{row.team}</td><td className="px-3 py-1">{row.status}</td><td className="px-3 py-1 tabular-nums">{row.score.toFixed(2)}</td></tr>)}</tbody>
            </table>
          </div>
          <Measurements result={latest("interaction")} />
        </Card>

        <Card icon={Layers} title="Tab workload" description={<>
          <p>Opens {WORKLOAD_TAB_COUNT} identical tabs with text, images, a table, and a small widget. Click through them; each tab records the time from becoming visible to its next painted frame.</p>
          <p>This does not measure total browser memory. Pair it with Activity Monitor or the local script for that.</p>
        </>}>
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" className={buttonClass} onClick={openTabs}>Open {WORKLOAD_TAB_COUNT} test tabs</button>
            <button type="button" className={secondaryButtonClass} onClick={saveTabResult} disabled={activations.length === 0}>Save result</button>
            <button type="button" className={secondaryButtonClass} onClick={clearActivations} disabled={activations.length === 0}>Clear activations</button>
          </div>
          {opened !== null && opened < WORKLOAD_TAB_COUNT && (
            <p className="rounded-xl bg-muted px-4 py-3 text-sm">Opened {opened} of {WORKLOAD_TAB_COUNT}. Your browser blocked the rest as pop-ups. Allow pop-ups for this site, or open the remaining tabs manually below (⌘-click each link).</p>
          )}
          <details className="text-sm">
            <summary className="cursor-pointer text-text-secondary">Manual fallback: open tabs yourself</summary>
            <div className="mt-2 flex flex-wrap gap-2">{tabUrls.map((url, i) => <a key={url} href={url} target="_blank" rel="noopener" className="rounded-lg border border-border px-2.5 py-1 hover:bg-muted">Tab {i + 1}</a>)}</div>
          </details>
          <p className="text-sm">{activations.length} activations recorded{tabMedian !== null && <> · median <span className="font-semibold tabular-nums">{tabMedian.toFixed(1)} ms</span></>}</p>
          <Measurements result={latest("tab-workload")} />
        </Card>

        <Card icon={Film} title="Video" description={<>
          <p>Plays the same 1080p, 30 fps H.264 file, hosted on this site, for {VIDEO_DURATION_SECONDS / 60} minutes (muted, looping), then reads the browser&apos;s playback-quality counters. Each run is added to the list.</p>
          <p>Metrics the browser does not expose show as “unavailable”.</p>
        </>}>
          <video ref={videoRef} src={VIDEO_SRC} muted loop playsInline preload="auto" className="aspect-video w-full rounded-xl border border-border bg-black" />
          <div className="flex flex-wrap items-center gap-3">
            {videoElapsed === null
              ? <button type="button" className={buttonClass} onClick={() => void runVideo()}>Play for {VIDEO_DURATION_SECONDS / 60} minutes</button>
              : <button type="button" className={secondaryButtonClass} onClick={() => videoStop.current?.(false)}>Stop early</button>}
            {videoElapsed !== null && <span className="text-sm tabular-nums text-text-secondary">{Math.floor(videoElapsed)} / {videoDuration} s</span>}
            {status.video && <span className="text-sm text-red-700">{status.video}</span>}
          </div>
          <Measurements result={latest("video")} />
        </Card>

        <section className="rounded-2xl border border-border bg-muted/60 p-5 font-sans sm:p-7">
          <h2 className="font-serif text-2xl tracking-tight">Results</h2>
          <p className="mt-2 text-sm text-text-secondary">The file includes your user agent, test version, timestamps, run counts, and whether the tab stayed in the foreground.</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button type="button" className={`${buttonClass} inline-flex items-center gap-2`} onClick={downloadReport} disabled={results.length === 0}><Download size={16} /> Download JSON</button>
            <button type="button" className={secondaryButtonClass} onClick={clearResults} disabled={results.length === 0}>Clear results</button>
          </div>
        </section>
      </div>
    </div>
  );
}
