"use client";

import { useEffect, useMemo, useState } from "react";
import { generateRows, reportToScript, TAB_ACTIVATIONS_KEY, type TabActivation } from "@/lib/browser-benchmark";

const TABLE_ROWS = 150;
const PARAGRAPHS = [
  "This tab is one of twenty identical copies used to approximate a working set of documentation and development tabs. Every browser receives the same text, images, table, and widget, generated from a fixed seed.",
  "When you switch to this tab, it records the time between the browser reporting the tab as visible and the next painted frame. That is a page-level signal only. It does not include the time the browser spent before telling the page it was visible, and it cannot see total browser memory.",
  "The table below holds a deterministic set of rows. The widget next to it re-sorts a slice of that data on every click, which keeps a small amount of live JavaScript state in each tab, like a real app would.",
];

function afterNextPaint(callback: () => void) {
  requestAnimationFrame(() => {
    const channel = new MessageChannel();
    channel.port1.onmessage = callback;
    channel.port2.postMessage(null);
  });
}

function recordActivation(entry: TabActivation) {
  reportToScript({ kind: "tab-activation", ...entry });
  try {
    const current: TabActivation[] = JSON.parse(localStorage.getItem(TAB_ACTIVATIONS_KEY) ?? "[]");
    localStorage.setItem(TAB_ACTIVATIONS_KEY, JSON.stringify([...current, entry].slice(-500)));
  } catch {
    // Storage blocked: the tab still works, it just can't report.
  }
}

export default function WorkloadTab({ tab }: { tab: number }) {
  const rows = useMemo(() => generateRows(TABLE_ROWS, 7), []);
  const [last, setLast] = useState<number | null>(null);
  const [clicks, setClicks] = useState(0);
  const widgetRows = useMemo(() => [...rows].sort((a, b) => ((a.score * (clicks + 1)) % 97) - ((b.score * (clicks + 1)) % 97)).slice(0, 8), [rows, clicks]);

  useEffect(() => {
    document.title = `Workload tab ${tab || "?"}`;
    function onVisibility(event: Event) {
      if (document.visibilityState !== "visible") return;
      const start = event.timeStamp;
      afterNextPaint(() => {
        const ms = Math.round((performance.now() - start) * 10) / 10;
        setLast(ms);
        recordActivation({ tab, ms, at: new Date().toISOString() });
      });
    }
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [tab]);

  return (
    <div className="mx-auto max-w-3xl py-2">
      <p className="font-sans text-xs uppercase tracking-wider text-text-secondary">Browser benchmark · workload tab {tab || ""}</p>
      <h1 className="mt-2 text-4xl tracking-tight">A representative working tab</h1>
      <p className="mt-3 font-sans text-sm text-text-secondary">
        Last activation to paint: {last === null ? "switch away and back to measure" : `${last} ms`}
      </p>

      <div className="mt-8 space-y-4 text-[17px] leading-[1.7]">
        {PARAGRAPHS.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        {[1, 2, 3].map((index) => (
          // Plain <img> on purpose: every browser should decode the same file, not a format negotiated by the image optimizer.
          // eslint-disable-next-line @next/next/no-img-element
          <img key={index} src={`/browser-benchmark/workload-${index}.jpg`} alt={`Fixed benchmark image ${index}`} width={1200} height={675} className="h-auto w-full rounded-xl border border-border" />
        ))}
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-[1fr_16rem]">
        <div className="max-h-96 overflow-auto rounded-xl border border-border">
          <table className="w-full font-sans text-sm">
            <thead className="sticky top-0 bg-muted text-left"><tr>{["#", "Name", "Team", "Status", "Score"].map((heading) => <th key={heading} className="px-3 py-2 font-semibold">{heading}</th>)}</tr></thead>
            <tbody>
              {rows.map((row) => <tr key={row.id} className="border-t border-border"><td className="px-3 py-1.5 text-text-secondary">{row.id}</td><td className="px-3 py-1.5">{row.name}</td><td className="px-3 py-1.5">{row.team}</td><td className="px-3 py-1.5">{row.status}</td><td className="px-3 py-1.5 tabular-nums">{row.score.toFixed(2)}</td></tr>)}
            </tbody>
          </table>
        </div>
        <section className="self-start rounded-xl border border-border bg-white p-4 font-sans">
          <div className="flex items-center justify-between"><h2 className="text-sm font-semibold">Widget</h2><span className="text-xs text-text-secondary">{clicks} shuffles</span></div>
          <ol className="mt-3 space-y-1 text-sm">{widgetRows.map((row) => <li key={row.id} className="flex justify-between gap-2"><span className="truncate">{row.name}</span><span className="tabular-nums text-text-secondary">{row.score.toFixed(1)}</span></li>)}</ol>
          <button type="button" onClick={() => setClicks((count) => count + 1)} className="mt-4 w-full rounded-lg bg-foreground px-3 py-2 text-sm font-semibold text-white hover:opacity-80">Shuffle</button>
        </section>
      </div>
    </div>
  );
}
