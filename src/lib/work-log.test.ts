import { describe, expect, it } from "vitest";

import { computeStreak } from "./work-log";

describe("computeStreak", () => {
  it("treats Friday and Monday as consecutive workdays", () => {
    expect(computeStreak(["2026-08-21", "2026-08-24"], "2026-08-24")).toMatchObject({
      current: 2,
      longest: 2,
      loggedToday: true,
    });
  });

  it("ignores weekend entries", () => {
    expect(computeStreak(["2026-08-21", "2026-08-22", "2026-08-23"], "2026-08-24")).toMatchObject({
      current: 1,
      longest: 1,
      loggedToday: false,
      lastLoggedOn: "2026-08-21",
    });
  });

  it("keeps a Friday streak active over the weekend", () => {
    expect(computeStreak(["2026-08-21"], "2026-08-23")).toMatchObject({
      current: 1,
      longest: 1,
      loggedToday: false,
    });
  });
});
