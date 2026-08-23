export const TTFB_WATCHLIST = [
  { hostname: "graviet.io", label: "graviet.io", url: "https://graviet.io" },
  { hostname: "daytona.io", label: "daytona.io", url: "https://daytona.io" },
  {
    hostname: "gunterinjurylaw.com",
    label: "gunterinjurylaw.com",
    url: "https://gunterinjurylaw.com",
  },
] as const;

export type TtfbWatchSite = (typeof TTFB_WATCHLIST)[number];

export type TtfbSample = {
  ttfbMs: number;
  totalMs: number;
  status: number;
  region: string;
  measuredAt: string;
};

export type TtfbWatchlistStats = {
  hostname: string;
  label: string;
  url: string;
  sampleCount: number;
  latest: TtfbSample | null;
  averageTtfbMs: number | null;
  minTtfbMs: number | null;
  maxTtfbMs: number | null;
  history: TtfbSample[];
};

export function trackedHostname(hostname: string): string {
  return hostname.trim().toLowerCase().replace(/^www\./, "");
}

export function toStoredMs(value: number): number {
  return Math.round(value);
}

export function watchlistSiteForHostname(hostname: string): TtfbWatchSite | null {
  const tracked = trackedHostname(hostname);
  return TTFB_WATCHLIST.find((site) => site.hostname === tracked) ?? null;
}

export function summarizeWatchlist(
  samplesByHost: Record<string, TtfbSample[]>,
): TtfbWatchlistStats[] {
  return TTFB_WATCHLIST.map((site) => {
    const history = samplesByHost[site.hostname] ?? [];
    const ttfbs = history.map((sample) => sample.ttfbMs);
    const averageTtfbMs =
      ttfbs.length === 0
        ? null
        : Math.round(ttfbs.reduce((sum, value) => sum + value, 0) / ttfbs.length);

    return {
      hostname: site.hostname,
      label: site.label,
      url: site.url,
      sampleCount: history.length,
      latest: history[0] ?? null,
      averageTtfbMs,
      minTtfbMs: ttfbs.length ? Math.min(...ttfbs) : null,
      maxTtfbMs: ttfbs.length ? Math.max(...ttfbs) : null,
      history,
    };
  });
}
