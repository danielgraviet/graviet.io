"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Loader2, Timer, Zap } from "lucide-react";
import type { TtfbProbeResult } from "@/lib/ttfb";
import { TTFB_WATCHLIST, type TtfbWatchlistStats } from "@/lib/ttfb-watchlist";

type ProbeState =
  | { status: "idle" }
  | { status: "loading"; url: string }
  | { status: "error"; message: string }
  | { status: "success"; result: TtfbProbeResult };

function formatWhen(value: string) {
  return new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function TtfbTool() {
  const [url, setUrl] = useState<string>(TTFB_WATCHLIST[0].url);
  const [probe, setProbe] = useState<ProbeState>({ status: "idle" });
  const [watchlist, setWatchlist] = useState<TtfbWatchlistStats[]>([]);

  const fastestHop = useMemo(() => {
    if (probe.status !== "success") return null;
    return probe.result.hops.reduce((fastest, hop) =>
      hop.ttfbMs < fastest.ttfbMs ? hop : fastest,
    );
  }, [probe]);

  useEffect(() => {
    void loadHistory();
  }, []);

  async function loadHistory() {
    try {
      const response = await fetch("/api/tools/ttfb");
      const payload = await response.json();
      if (response.ok && Array.isArray(payload.watchlist)) {
        setWatchlist(payload.watchlist as TtfbWatchlistStats[]);
      }
    } catch {
      // History is secondary to measuring.
    }
  }

  async function measure(targetUrl: string) {
    setUrl(targetUrl);
    setProbe({ status: "loading", url: targetUrl });

    try {
      const response = await fetch("/api/tools/ttfb", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: targetUrl }),
      });
      const payload = await response.json();

      if (!response.ok) {
        setProbe({
          status: "error",
          message: payload.error || "The TTFB probe failed.",
        });
        return;
      }

      if (Array.isArray(payload.watchlist)) {
        setWatchlist(payload.watchlist as TtfbWatchlistStats[]);
      }

      const { watchlist: _ignored, ...result } = payload as TtfbProbeResult & {
        watchlist?: TtfbWatchlistStats[];
      };
      setProbe({ status: "success", result });
    } catch {
      setProbe({
        status: "error",
        message: "The TTFB probe failed before it reached the server.",
      });
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void measure(url);
  }

  return (
    <div className="space-y-10">
      <section>
        <p className="mb-3 text-sm text-text-secondary">Saved sites</p>
        <div className="border-t border-border">
          {TTFB_WATCHLIST.map((site) => {
            const stats = watchlist.find((item) => item.hostname === site.hostname);
            const measuring = probe.status === "loading" && probe.url === site.url;
            return (
              <div key={site.hostname} className="border-b border-border py-4">
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => void measure(site.url)}
                    disabled={probe.status === "loading"}
                    className="text-left text-base font-semibold underline decoration-border underline-offset-4 hover:text-text-secondary disabled:opacity-60"
                  >
                    {site.label}
                  </button>
                  <span className="text-sm text-text-secondary">
                    {measuring
                      ? "Measuring…"
                      : stats?.latest
                        ? `${stats.latest.ttfbMs.toLocaleString()} ms latest`
                        : "No samples yet"}
                  </span>
                </div>
                {stats && stats.sampleCount > 0 && (
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-text-secondary">
                    <span>Avg {stats.averageTtfbMs?.toLocaleString()} ms</span>
                    <span>Min {stats.minTtfbMs?.toLocaleString()} ms</span>
                    <span>Max {stats.maxTtfbMs?.toLocaleString()} ms</span>
                    <span>
                      {stats.sampleCount} sample{stats.sampleCount === 1 ? "" : "s"}
                    </span>
                  </div>
                )}
                {stats && stats.history.length > 0 && (
                  <HistoryBars samples={stats.history} />
                )}
              </div>
            );
          })}
        </div>
      </section>

      <form onSubmit={handleSubmit} className="border-y border-border py-5">
        <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
          <label className="block">
            <span className="mb-2 block text-sm text-text-secondary">URL</span>
            <input
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="https://example.com"
              className="w-full border border-border bg-background px-3 py-2.5 text-base outline-none transition-colors focus:border-foreground"
              disabled={probe.status === "loading"}
            />
          </label>
          <button
            type="submit"
            disabled={probe.status === "loading"}
            className="inline-flex h-11 items-center justify-center gap-2 border border-foreground bg-foreground px-4 text-sm font-semibold text-background transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {probe.status === "loading" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Zap className="h-4 w-4" />
            )}
            Measure
          </button>
        </div>
      </form>

      {probe.status === "error" && (
        <div className="border border-border bg-muted px-4 py-3 text-sm text-text-secondary">
          {probe.message}
        </div>
      )}

      {probe.status === "success" && (
        <div className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-3">
            <Metric
              label="Final TTFB"
              value={`${probe.result.finalTtfbMs.toLocaleString()} ms`}
              icon={<Timer className="h-4 w-4" />}
            />
            <Metric
              label="Total"
              value={`${probe.result.totalMs.toLocaleString()} ms`}
            />
            <Metric
              label="Status"
              value={String(probe.result.finalStatus)}
            />
          </div>

          <div>
            <p className="mb-3 text-sm text-text-secondary">
              Daytona region: {probe.result.region}
            </p>
            <div className="border-t border-border">
              {probe.result.hops.map((hop, index) => (
                <div
                  key={`${hop.url}-${index}`}
                  className="grid gap-2 border-b border-border py-4 sm:grid-cols-[6rem_1fr_8rem] sm:items-center"
                >
                  <div className="text-sm font-semibold">
                    {index === 0 ? "Initial" : `Hop ${index + 1}`}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm">{hop.url}</p>
                    {hop.location && (
                      <p className="truncate text-xs text-text-secondary">
                        Redirected to {hop.location}
                      </p>
                    )}
                  </div>
                  <div className="text-sm text-text-secondary sm:text-right">
                    <span className="font-semibold text-foreground">
                      {hop.ttfbMs.toLocaleString()} ms
                    </span>{" "}
                    / {hop.status}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {fastestHop && (
            <p className="text-sm text-text-secondary">
              Fastest observed hop was {fastestHop.ttfbMs.toLocaleString()} ms.
            </p>
          )}
        </div>
      )}

      {watchlist.some((site) => site.history.length > 0) && (
        <section>
          <p className="mb-3 text-sm text-text-secondary">Recent samples</p>
          <div className="border-t border-border">
            {watchlist
              .flatMap((site) =>
                site.history.map((sample) => ({
                  ...sample,
                  hostname: site.hostname,
                  label: site.label,
                })),
              )
              .sort(
                (a, b) =>
                  new Date(b.measuredAt).getTime() -
                  new Date(a.measuredAt).getTime(),
              )
              .slice(0, 12)
              .map((sample) => (
                <div
                  key={`${sample.hostname}-${sample.measuredAt}`}
                  className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border py-3 text-sm"
                >
                  <span className="font-semibold">{sample.label}</span>
                  <span>{sample.ttfbMs.toLocaleString()} ms</span>
                  <span className="text-text-secondary">
                    {formatWhen(sample.measuredAt)}
                  </span>
                </div>
              ))}
          </div>
        </section>
      )}
    </div>
  );
}

function HistoryBars({ samples }: { samples: TtfbWatchlistStats["history"] }) {
  const chronological = [...samples].reverse();
  const max = Math.max(...chronological.map((sample) => sample.ttfbMs), 1);

  return (
    <div className="mt-3 flex h-10 items-end gap-1">
      {chronological.map((sample, index) => (
        <div
          key={`${sample.measuredAt}-${index}`}
          title={`${sample.ttfbMs} ms · ${formatWhen(sample.measuredAt)}`}
          className="w-2 bg-foreground/70"
          style={{ height: `${Math.max(12, Math.round((sample.ttfbMs / max) * 40))}px` }}
        />
      ))}
    </div>
  );
}

function Metric({
  icon,
  label,
  value,
}: {
  icon?: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="border border-border p-4">
      <p className="mb-2 flex items-center gap-2 text-sm text-text-secondary">
        {icon}
        {label}
      </p>
      <p className="text-2xl font-semibold">{value}</p>
    </div>
  );
}
