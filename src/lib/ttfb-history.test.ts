import { describe, expect, it } from "vitest";
import {
  TTFB_WATCHLIST,
  summarizeWatchlist,
  toStoredMs,
  trackedHostname,
  watchlistSiteForHostname,
} from "./ttfb-watchlist";

describe("TTFB watchlist", () => {
  it("tracks graviet.io, daytona.io, and gunterinjurylaw.com", () => {
    expect(TTFB_WATCHLIST.map((site) => site.hostname)).toEqual([
      "graviet.io",
      "daytona.io",
      "gunterinjurylaw.com",
    ]);
  });

  it("rounds fractional milliseconds for integer columns", () => {
    expect(toStoredMs(820.9)).toBe(821);
    expect(toStoredMs(340.2)).toBe(340);
  });

  it("strips www and matches tracked sites", () => {
    expect(trackedHostname("www.graviet.io")).toBe("graviet.io");
    expect(watchlistSiteForHostname("www.daytona.io")?.hostname).toBe("daytona.io");
    expect(watchlistSiteForHostname("example.com")).toBeNull();
  });

  it("summarizes latest, average, and history per site", () => {
    const stats = summarizeWatchlist({
      "graviet.io": [
        {
          ttfbMs: 120,
          totalMs: 200,
          status: 200,
          region: "us",
          measuredAt: "2026-08-23T20:00:00.000Z",
        },
        {
          ttfbMs: 80,
          totalMs: 150,
          status: 200,
          region: "us",
          measuredAt: "2026-08-22T20:00:00.000Z",
        },
      ],
    });

    const graviet = stats.find((site) => site.hostname === "graviet.io");
    expect(graviet?.sampleCount).toBe(2);
    expect(graviet?.latest?.ttfbMs).toBe(120);
    expect(graviet?.averageTtfbMs).toBe(100);
    expect(graviet?.minTtfbMs).toBe(80);
    expect(stats.find((site) => site.hostname === "daytona.io")?.sampleCount).toBe(0);
  });
});
