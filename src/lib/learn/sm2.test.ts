import { describe, expect, it } from "vitest";
import { applySm2, newCardSchedule } from "./sm2";

describe("SM-2", () => {
  const now = new Date("2026-08-13T12:00:00.000Z");

  it("makes new cards due immediately", () => {
    const card = newCardSchedule(now);
    expect(card.dueAt).toBe(now.toISOString());
    expect(card.ease).toBe(2.5);
    expect(card.intervalDays).toBe(0);
    expect(card.repetitions).toBe(0);
  });

  it("schedules Good as 1 day, then 6 days, then ease-multiplied", () => {
    const first = applySm2(newCardSchedule(now), "good", now);
    expect(first.intervalDays).toBe(1);
    expect(first.repetitions).toBe(1);
    expect(first.dueAt).toBe("2026-08-14T12:00:00.000Z");

    const second = applySm2(first, "good", now);
    expect(second.intervalDays).toBe(6);
    expect(second.repetitions).toBe(2);

    const third = applySm2(second, "good", now);
    expect(third.intervalDays).toBe(15);
    expect(third.repetitions).toBe(3);
  });

  it("treats Again as a lapse due tomorrow", () => {
    const next = applySm2(
      { ...newCardSchedule(now), ease: 2.5, repetitions: 4, intervalDays: 20, lapses: 0 },
      "again",
      now,
    );
    expect(next.repetitions).toBe(0);
    expect(next.intervalDays).toBe(1);
    expect(next.lapses).toBe(1);
    expect(next.ease).toBe(2.3);
  });

  it("applies Hard as a 1.2x interval with a small ease penalty", () => {
    const next = applySm2(
      { ...newCardSchedule(now), intervalDays: 10, repetitions: 3, ease: 2.5 },
      "hard",
      now,
    );
    expect(next.intervalDays).toBe(12);
    expect(next.ease).toBe(2.35);
    expect(next.repetitions).toBe(4);
  });

  it("applies Easy as Good times 1.3 with an ease bonus", () => {
    const next = applySm2(
      { ...newCardSchedule(now), intervalDays: 10, repetitions: 3, ease: 2.5 },
      "easy",
      now,
    );
    expect(next.intervalDays).toBe(32.5);
    expect(next.ease).toBe(2.65);
  });

  it("never lets ease drop below 1.3", () => {
    const next = applySm2(
      { ...newCardSchedule(now), ease: 1.35 },
      "again",
      now,
    );
    expect(next.ease).toBe(1.3);
  });
});
