/**
 * Shared logic for /browser-benchmark. Everything here is deterministic so every
 * browser renders and processes exactly the same workload.
 */

/** Bump when a test's workload or measurement changes, so old JSON isn't compared blindly. */
export const TEST_VERSION = "1.0.0";

export const INTERACTION_ROWS = 2000;
export const INTERACTION_REPETITIONS = 15;
export const WORKLOAD_TAB_COUNT = 20;
export const VIDEO_DURATION_SECONDS = 300;
export const VIDEO_SRC = "/browser-benchmark/test-video.mp4";

/** localStorage key the workload tabs write their activation timings to. */
export const TAB_ACTIVATIONS_KEY = "browser-benchmark:tab-activations";

export function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/** mulberry32: small seeded PRNG so every browser generates identical rows. */
export function seededRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type WorkloadRow = {
  id: number;
  name: string;
  team: string;
  status: "open" | "review" | "done";
  score: number;
  updated: number;
};

const WORDS = ["cache", "kernel", "router", "shader", "parser", "socket", "tensor", "worker", "buffer", "sampler", "planner", "index"];
const TEAMS = ["infra", "web", "data", "ml", "mobile", "security"];
const STATUSES: WorkloadRow["status"][] = ["open", "review", "done"];

export function generateRows(count: number, seed = 42): WorkloadRow[] {
  const random = seededRandom(seed);
  const pick = <T,>(list: readonly T[]) => list[Math.floor(random() * list.length)];
  return Array.from({ length: count }, (_, index) => ({
    id: index + 1,
    name: `${pick(WORDS)}-${pick(WORDS)}-${String(index + 1).padStart(4, "0")}`,
    team: pick(TEAMS),
    status: pick(STATUSES),
    score: Math.round(random() * 10000) / 100,
    updated: 1_700_000_000 + Math.floor(random() * 30_000_000),
  }));
}

export type InteractionStep = { query: string; sortKey: "score" | "name" | "updated"; descending: boolean };

/** Fixed sequence of filter + reorder operations; repetition i uses step i % length. */
export const INTERACTION_STEPS: InteractionStep[] = [
  { query: "cache", sortKey: "score", descending: true },
  { query: "er", sortKey: "name", descending: false },
  { query: "", sortKey: "updated", descending: true },
  { query: "ml", sortKey: "score", descending: false },
  { query: "o", sortKey: "name", descending: true },
];

export function applyInteraction(rows: WorkloadRow[], step: InteractionStep): WorkloadRow[] {
  const query = step.query.toLowerCase();
  const filtered = query
    ? rows.filter((row) => row.name.includes(query) || row.team.includes(query) || row.status.includes(query))
    : rows.slice();
  const direction = step.descending ? -1 : 1;
  return filtered.sort((a, b) => {
    const left = a[step.sortKey];
    const right = b[step.sortKey];
    if (left === right) return a.id - b.id;
    return (left < right ? -1 : 1) * direction;
  });
}

export type Measurement = { label: string; unit: string; runs: (number | null)[]; median: number | null; note?: string };

export type TestResult = {
  test: "page-load" | "interaction" | "tab-workload" | "video";
  startedAt: string;
  foregroundAtStart: boolean;
  foregroundThroughout: boolean;
  runCount: number;
  measurements: Measurement[];
};

export type BenchmarkReport = {
  testVersion: string;
  userAgent: string;
  /** Best-effort guess; Arc and Brave both report a Chrome user agent. */
  browserHint: string;
  exportedAt: string;
  screen: { width: number; height: number; devicePixelRatio: number };
  hardwareConcurrency: number | null;
  results: TestResult[];
};

export function measurement(label: string, unit: string, runs: (number | null)[], note?: string): Measurement {
  const numeric = runs.filter((value): value is number => typeof value === "number" && Number.isFinite(value));
  return { label, unit, runs, median: median(numeric), ...(note ? { note } : {}) };
}

export type TabActivation = { tab: number; ms: number; at: string };

/**
 * When the local measurement script opens a page with ?report=1 (served through its
 * same-origin proxy), results are also POSTed to it. Never sent otherwise.
 */
export function reportToScript(payload: Record<string, unknown>) {
  if (new URLSearchParams(window.location.search).get("report") !== "1") return;
  void fetch("/__bench/report", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload), keepalive: true }).catch(() => {});
}
