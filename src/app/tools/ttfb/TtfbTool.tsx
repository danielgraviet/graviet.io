"use client";

import { FormEvent, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Loader2, Lock, Timer, Zap } from "lucide-react";
import type { TtfbProbeResult } from "@/lib/ttfb";

type ProbeState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; result: TtfbProbeResult };

export default function TtfbTool() {
  const [url, setUrl] = useState("");
  const [password, setPassword] = useState("");
  const [probe, setProbe] = useState<ProbeState>({ status: "idle" });

  const fastestHop = useMemo(() => {
    if (probe.status !== "success") {
      return null;
    }

    return probe.result.hops.reduce((fastest, hop) =>
      hop.ttfbMs < fastest.ttfbMs ? hop : fastest,
    );
  }, [probe]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setProbe({ status: "loading" });

    try {
      const response = await fetch("/api/tools/ttfb", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, password }),
      });
      const payload = await response.json();

      if (!response.ok) {
        setProbe({
          status: "error",
          message: payload.error || "The TTFB probe failed.",
        });
        return;
      }

      setProbe({ status: "success", result: payload as TtfbProbeResult });
    } catch {
      setProbe({
        status: "error",
        message: "The TTFB probe failed before it reached the server.",
      });
    }
  }

  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmit} className="border-y border-border py-5">
        <div className="grid gap-4 md:grid-cols-[1fr_14rem_auto] md:items-end">
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-text-secondary">
              URL
            </span>
            <input
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="https://example.com"
              className="w-full border border-border bg-background px-3 py-2.5 text-base outline-none transition-colors focus:border-foreground"
              disabled={probe.status === "loading"}
            />
          </label>
          <label className="block">
            <span className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-text-secondary">
              <Lock className="h-3.5 w-3.5" />
              Password
            </span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
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
            <p className="mb-3 text-sm font-semibold text-text-secondary">
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
      <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-text-secondary">
        {icon}
        {label}
      </p>
      <p className="text-2xl font-semibold">{value}</p>
    </div>
  );
}
