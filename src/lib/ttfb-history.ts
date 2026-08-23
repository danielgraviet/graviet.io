import { neon } from "@neondatabase/serverless";
import type { TtfbProbeResult } from "@/lib/ttfb";
import {
  TTFB_WATCHLIST,
  toStoredMs,
  watchlistSiteForHostname,
  type TtfbSample,
  type TtfbWatchlistStats,
} from "@/lib/ttfb-watchlist";

export {
  TTFB_WATCHLIST,
  summarizeWatchlist,
  trackedHostname,
  watchlistSiteForHostname,
} from "@/lib/ttfb-watchlist";
export type { TtfbSample, TtfbWatchlistStats, TtfbWatchSite } from "@/lib/ttfb-watchlist";

type SampleRow = {
  hostname: string;
  url: string;
  final_ttfb_ms: number;
  total_ms: number;
  final_status: number;
  region: string;
  measured_at: string | Date;
};

type AggregateRow = {
  hostname: string;
  sample_count: number;
  average_ttfb_ms: number;
  min_ttfb_ms: number;
  max_ttfb_ms: number;
};

function sql() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not configured.");
  }
  return neon(url);
}

function mapRow(row: SampleRow): TtfbSample & { hostname: string } {
  return {
    hostname: row.hostname,
    ttfbMs: Number(row.final_ttfb_ms),
    totalMs: Number(row.total_ms),
    status: Number(row.final_status),
    region: row.region,
    measuredAt:
      typeof row.measured_at === "string"
        ? row.measured_at
        : new Date(row.measured_at).toISOString(),
  };
}

let schemaReady: Promise<void> | null = null;

export async function ensureTtfbHistorySchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = (async () => {
      const db = sql();
      await db`
        CREATE TABLE IF NOT EXISTS ttfb_samples (
          id serial PRIMARY KEY,
          hostname text NOT NULL,
          url text NOT NULL,
          final_ttfb_ms integer NOT NULL,
          total_ms integer NOT NULL,
          final_status integer NOT NULL,
          region text NOT NULL DEFAULT '',
          measured_at timestamptz NOT NULL DEFAULT now()
        )
      `;
      await db`
        CREATE INDEX IF NOT EXISTS ttfb_samples_host_measured_idx
        ON ttfb_samples (hostname, measured_at DESC)
      `;
    })().catch((error) => {
      schemaReady = null;
      throw error;
    });
  }

  await schemaReady;
}

export async function recordTtfbSample(result: TtfbProbeResult): Promise<void> {
  const site = watchlistSiteForHostname(result.hostname);
  if (!site) return;

  await ensureTtfbHistorySchema();
  const db = sql();
  await db`
    INSERT INTO ttfb_samples (
      hostname, url, final_ttfb_ms, total_ms, final_status, region
    )
    VALUES (
      ${site.hostname},
      ${result.finalUrl},
      ${toStoredMs(result.finalTtfbMs)},
      ${toStoredMs(result.totalMs)},
      ${Math.round(result.finalStatus)},
      ${result.region}
    )
  `;
}

export async function getTtfbWatchlist(): Promise<TtfbWatchlistStats[]> {
  await ensureTtfbHistorySchema();
  const db = sql();
  const hostnames = TTFB_WATCHLIST.map((site) => site.hostname);

  const aggregates = (await db`
    SELECT
      hostname,
      COUNT(*)::int AS sample_count,
      ROUND(AVG(final_ttfb_ms))::int AS average_ttfb_ms,
      MIN(final_ttfb_ms)::int AS min_ttfb_ms,
      MAX(final_ttfb_ms)::int AS max_ttfb_ms
    FROM ttfb_samples
    WHERE hostname = ANY(${hostnames})
    GROUP BY hostname
  `) as unknown as AggregateRow[];

  const rows = (await db`
    SELECT hostname, url, final_ttfb_ms, total_ms, final_status, region, measured_at
    FROM ttfb_samples
    WHERE hostname = ANY(${hostnames})
    ORDER BY measured_at DESC
    LIMIT 300
  `) as unknown as SampleRow[];

  const samplesByHost: Record<string, TtfbSample[]> = {};
  for (const row of rows) {
    const sample = mapRow(row);
    const list = samplesByHost[sample.hostname] ?? [];
    if (list.length < 20) {
      list.push({
        ttfbMs: sample.ttfbMs,
        totalMs: sample.totalMs,
        status: sample.status,
        region: sample.region,
        measuredAt: sample.measuredAt,
      });
      samplesByHost[sample.hostname] = list;
    }
  }

  const aggregateByHost = Object.fromEntries(
    aggregates.map((row) => [row.hostname, row]),
  );

  return TTFB_WATCHLIST.map((site) => {
    const history = samplesByHost[site.hostname] ?? [];
    const aggregate = aggregateByHost[site.hostname];

    return {
      hostname: site.hostname,
      label: site.label,
      url: site.url,
      sampleCount: aggregate ? Number(aggregate.sample_count) : 0,
      latest: history[0] ?? null,
      averageTtfbMs: aggregate ? Number(aggregate.average_ttfb_ms) : null,
      minTtfbMs: aggregate ? Number(aggregate.min_ttfb_ms) : null,
      maxTtfbMs: aggregate ? Number(aggregate.max_ttfb_ms) : null,
      history,
    };
  });
}
