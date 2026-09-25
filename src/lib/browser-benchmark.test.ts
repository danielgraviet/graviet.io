import { describe, expect, it } from "vitest";
import { applyInteraction, generateRows, INTERACTION_STEPS, measurement, median } from "./browser-benchmark";

describe("browser benchmark helpers", () => {
  it("computes medians for odd, even, and empty inputs", () => {
    expect(median([5, 1, 3])).toBe(3);
    expect(median([4, 1, 3, 2])).toBe(2.5);
    expect(median([])).toBeNull();
  });

  it("generates identical rows for the same seed", () => {
    expect(generateRows(50)).toEqual(generateRows(50));
    expect(generateRows(50, 1)).not.toEqual(generateRows(50, 2));
  });

  it("filters and sorts deterministically", () => {
    const rows = generateRows(500);
    const step = INTERACTION_STEPS[0];
    const result = applyInteraction(rows, step);
    expect(result.every((row) => [row.name, row.team, row.status].some((value) => value.includes(step.query)))).toBe(true);
    for (let i = 1; i < result.length; i++) expect(result[i - 1].score).toBeGreaterThanOrEqual(result[i].score);
    expect(rows[0].id).toBe(1);
  });

  it("ignores unavailable runs when taking the median", () => {
    expect(measurement("Dropped frames", "frames", [null, 2, 4])).toMatchObject({ median: 3, runs: [null, 2, 4] });
    expect(measurement("Dropped frames", "frames", [null]).median).toBeNull();
  });
});
