import { describe, expect, it } from "vitest";
import {
  buildLearnInsights,
  countEasyThenAgain,
  difficultyScore,
  isLeech,
  laplaceAgainRate,
  retrievability,
  shiftIsoDate,
  type InsightCard,
} from "./insights";

function card(overrides: Partial<InsightCard> & Pick<InsightCard, "id" | "front">): InsightCard {
  return {
    ease: 2.5,
    intervalDays: 1,
    repetitions: 1,
    lapses: 0,
    dueAt: "2026-08-23T12:00:00.000Z",
    lastReviewedAt: "2026-08-22T12:00:00.000Z",
    topicId: 1,
    topicTitle: "Caches",
    subjectSlug: "ai-runtime-systems",
    domainTitle: "Computer Architecture",
    ...overrides,
  };
}

describe("learn insights", () => {
  it("shifts calendar dates in UTC", () => {
    expect(shiftIsoDate("2026-08-23", -6)).toBe("2026-08-17");
    expect(shiftIsoDate("2026-03-01", -1)).toBe("2026-02-28");
  });

  it("marks leeches by lapses or again-rate after enough reviews", () => {
    expect(isLeech({ lapses: 3, reviews: 4, againCount: 1 })).toBe(true);
    expect(isLeech({ lapses: 0, reviews: 8, againCount: 4 })).toBe(true);
    expect(isLeech({ lapses: 2, reviews: 3, againCount: 3 })).toBe(false);
    expect(isLeech({ lapses: 0, reviews: 6, againCount: 1 })).toBe(false);
  });

  it("smooths again-rate and scores difficulty", () => {
    expect(laplaceAgainRate(0, 0)).toBe(0.25);
    expect(laplaceAgainRate(3, 6)).toBe(0.4);
    expect(difficultyScore({ lapses: 5, ease: 1.3, againRate: 1 })).toBeCloseTo(1, 5);
    expect(difficultyScore({ lapses: 0, ease: 2.5, againRate: 0 })).toBe(0);
  });

  it("decays retrievability as time passes the interval", () => {
    const now = new Date("2026-08-23T12:00:00.000Z");
    const fresh = retrievability("2026-08-23T12:00:00.000Z", 10, now);
    const stale = retrievability("2026-08-13T12:00:00.000Z", 10, now);
    expect(fresh).toBeCloseTo(1, 5);
    expect(stale).toBeCloseTo(Math.exp(-1), 5);
    expect(retrievability(null, 10, now)).toBeNull();
  });

  it("counts Easy followed by Again within a week", () => {
    expect(
      countEasyThenAgain([
        { cardId: 1, rating: "easy", reviewedAt: "2026-08-10T12:00:00.000Z" },
        { cardId: 1, rating: "again", reviewedAt: "2026-08-12T12:00:00.000Z" },
        { cardId: 2, rating: "easy", reviewedAt: "2026-08-01T12:00:00.000Z" },
        { cardId: 2, rating: "again", reviewedAt: "2026-08-20T12:00:00.000Z" },
      ]),
    ).toBe(1);
  });

  it("builds week, leech, weak-topic, and forecast stats", () => {
    const insights = buildLearnInsights({
      today: "2026-08-23",
      now: new Date("2026-08-23T12:00:00.000Z"),
      cards: [
        card({
          id: 1,
          front: "What is a cache line?",
          lapses: 4,
          ease: 1.6,
          intervalDays: 2,
          dueAt: "2026-08-22T12:00:00.000Z",
        }),
        card({
          id: 2,
          front: "TLB miss path",
          topicId: 1,
          lapses: 0,
          ease: 2.6,
          intervalDays: 30,
          dueAt: "2026-08-30T12:00:00.000Z",
          lastReviewedAt: "2026-08-20T12:00:00.000Z",
        }),
        card({
          id: 3,
          front: "Unseen fact",
          lastReviewedAt: null,
          repetitions: 0,
          intervalDays: 0,
          dueAt: "2026-08-23T12:00:00.000Z",
          topicId: 2,
          topicTitle: "Paging",
        }),
      ],
      reviews: [
        { cardId: 1, rating: "again", reviewedAt: "2026-08-18T12:00:00.000Z" },
        { cardId: 1, rating: "again", reviewedAt: "2026-08-19T12:00:00.000Z" },
        { cardId: 1, rating: "hard", reviewedAt: "2026-08-20T12:00:00.000Z" },
        { cardId: 1, rating: "again", reviewedAt: "2026-08-21T12:00:00.000Z" },
        { cardId: 1, rating: "again", reviewedAt: "2026-08-22T12:00:00.000Z" },
        { cardId: 2, rating: "good", reviewedAt: "2026-08-20T12:00:00.000Z" },
        { cardId: 2, rating: "easy", reviewedAt: "2026-08-10T12:00:00.000Z" },
        { cardId: 2, rating: "again", reviewedAt: "2026-08-12T12:00:00.000Z" },
        { cardId: 2, rating: "good", reviewedAt: "2026-08-08T12:00:00.000Z" },
        { cardId: 2, rating: "good", reviewedAt: "2026-08-09T12:00:00.000Z" },
      ],
    });

    expect(insights.week.reviewsThisWeek).toBe(6);
    expect(insights.week.reviewsLastWeek).toBe(2);
    expect(insights.week.daysReviewedThisWeek).toBe(5);
    expect(insights.week.dueToday).toBe(2);
    expect(insights.week.overdue).toBe(1);
    expect(insights.week.loadNote).toBeNull();

    expect(insights.study.leeches[0]?.cardId).toBe(1);
    expect(insights.study.weakTopics[0]?.topicId).toBe(1);
    expect(insights.study.atRisk[0]?.cardId).toBe(1);

    expect(insights.memory.unseen).toBe(1);
    expect(insights.memory.mature).toBe(1);
    expect(insights.memory.young).toBe(1);
    expect(insights.memory.lowEase).toBe(1);
    expect(insights.ratings.easyThenAgain).toBe(1);
    expect(insights.ratings.again).toBeGreaterThan(0);
  });
});
