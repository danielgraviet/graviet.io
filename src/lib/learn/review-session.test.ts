import { describe, expect, it } from "vitest";
import {
  addReview,
  parseReviewBatch,
  parseReviewSession,
  type ReviewSession,
} from "./review-session";

const session: ReviewSession = {
  version: 1,
  today: "2026-09-02",
  totalDue: 140,
  cards: [
    { id: 7, front: "Question", back: "Answer", lastReviewedAt: null },
    {
      id: 8,
      front: "Next",
      back: "Later",
      lastReviewedAt: "2026-08-01T00:00:00.000Z",
    },
  ],
  pendingReviews: [],
};

describe("review session", () => {
  it("moves a rated card into the durable review journal", () => {
    const next = addReview(
      session,
      "good",
      "review-1",
      "2026-09-02T12:00:00.000Z",
    );

    expect(next.cards.map((card) => card.id)).toEqual([8]);
    expect(next.totalDue).toBe(139);
    expect(next.pendingReviews).toEqual([
      {
        reviewId: "review-1",
        cardId: 7,
        rating: "good",
        reviewedAt: "2026-09-02T12:00:00.000Z",
        originalLastReviewedAt: null,
      },
    ]);
  });

  it("round-trips a valid stored session", () => {
    expect(parseReviewSession(JSON.stringify(session))).toEqual(session);
  });

  it("restores sessions saved before the total-due field existed", () => {
    const olderSession = { ...session, totalDue: undefined };
    expect(parseReviewSession(JSON.stringify(olderSession))?.totalDue).toBe(2);
  });

  it("rejects malformed or outdated stored data", () => {
    expect(parseReviewSession("not json")).toBeNull();
    expect(
      parseReviewSession(JSON.stringify({ ...session, version: 2 })),
    ).toBeNull();
    expect(
      parseReviewSession(JSON.stringify({ ...session, cards: [{ id: "7" }] })),
    ).toBeNull();
  });

  it("validates and normalizes a batch for the server", () => {
    const review = {
      reviewId: "review-123",
      cardId: 42,
      rating: "good",
      reviewedAt: "2026-09-02T12:00:00.000Z",
      originalLastReviewedAt: null,
    };
    expect(parseReviewBatch([review])).toEqual([review]);
    expect(
      parseReviewBatch([review, { ...review, reviewId: "review-456" }]),
    ).toBeNull();
    expect(parseReviewBatch([review, { ...review, cardId: 43 }])).toBeNull();
    expect(parseReviewBatch([{ ...review, rating: "perfect" }])).toBeNull();
    expect(
      parseReviewBatch([{ ...review, reviewedAt: "not-a-date" }]),
    ).toBeNull();
    expect(
      parseReviewBatch(Array.from({ length: 51 }, () => review)),
    ).toBeNull();
  });
});
