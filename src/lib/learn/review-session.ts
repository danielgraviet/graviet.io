import { isLearnRating, type LearnRating } from "./sm2";

export const REVIEW_SESSION_KEY = "learn-review-session-v1";

export type ReviewSessionCard = {
  id: number;
  front: string;
  back: string;
  lastReviewedAt: string | null;
};

export type PendingReview = {
  reviewId: string;
  cardId: number;
  rating: LearnRating;
  reviewedAt: string;
  originalLastReviewedAt: string | null;
};

export type ReviewSession = {
  version: 1;
  today: string;
  totalDue: number;
  cards: ReviewSessionCard[];
  pendingReviews: PendingReview[];
};

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === "string";
}

function isCard(value: unknown): value is ReviewSessionCard {
  if (!value || typeof value !== "object") return false;
  const card = value as Record<string, unknown>;
  return (
    Number.isInteger(card.id) &&
    typeof card.front === "string" &&
    typeof card.back === "string" &&
    isNullableString(card.lastReviewedAt)
  );
}

function isPendingReview(value: unknown): value is PendingReview {
  if (!value || typeof value !== "object") return false;
  const review = value as Record<string, unknown>;
  return (
    typeof review.reviewId === "string" &&
    review.reviewId.length > 0 &&
    Number.isInteger(review.cardId) &&
    isLearnRating(review.rating) &&
    typeof review.reviewedAt === "string" &&
    isNullableString(review.originalLastReviewedAt)
  );
}

export function parseReviewSession(value: string | null): ReviewSession | null {
  if (!value) return null;
  try {
    const session = JSON.parse(value) as Record<string, unknown>;
    if (
      session.version !== 1 ||
      typeof session.today !== "string" ||
      !Array.isArray(session.cards) ||
      !session.cards.every(isCard) ||
      !Array.isArray(session.pendingReviews) ||
      !session.pendingReviews.every(isPendingReview)
    ) {
      return null;
    }
    return {
      ...(session as ReviewSession),
      totalDue: Number.isInteger(session.totalDue)
        ? Math.max(0, Number(session.totalDue))
        : session.cards.length,
    };
  } catch {
    return null;
  }
}

export function parseReviewBatch(value: unknown): PendingReview[] | null {
  if (!Array.isArray(value) || value.length > 50) return null;
  const reviews: PendingReview[] = [];
  const reviewIds = new Set<string>();
  const cardIds = new Set<number>();

  for (const valueReview of value) {
    if (!valueReview || typeof valueReview !== "object") return null;
    const review = valueReview as Record<string, unknown>;
    const cardId = Number(review.cardId);
    const reviewedAt =
      typeof review.reviewedAt === "string"
        ? new Date(review.reviewedAt)
        : null;
    if (
      typeof review.reviewId !== "string" ||
      review.reviewId.length < 8 ||
      review.reviewId.length > 100 ||
      !Number.isInteger(cardId) ||
      !isLearnRating(review.rating) ||
      !reviewedAt ||
      Number.isNaN(reviewedAt.getTime()) ||
      !isNullableString(review.originalLastReviewedAt) ||
      reviewIds.has(review.reviewId) ||
      cardIds.has(cardId)
    ) {
      return null;
    }
    if (
      typeof review.originalLastReviewedAt === "string" &&
      Number.isNaN(new Date(review.originalLastReviewedAt).getTime())
    ) {
      return null;
    }
    reviewIds.add(review.reviewId);
    cardIds.add(cardId);
    reviews.push({
      reviewId: review.reviewId,
      cardId,
      rating: review.rating,
      reviewedAt: reviewedAt.toISOString(),
      originalLastReviewedAt: review.originalLastReviewedAt,
    });
  }
  return reviews;
}

export function addReview(
  session: ReviewSession,
  rating: LearnRating,
  reviewId: string,
  reviewedAt: string,
): ReviewSession {
  const card = session.cards[0];
  if (!card) return session;
  return {
    ...session,
    totalDue: Math.max(0, session.totalDue - 1),
    cards: session.cards.slice(1),
    pendingReviews: [
      ...session.pendingReviews,
      {
        reviewId,
        cardId: card.id,
        rating,
        reviewedAt,
        originalLastReviewedAt: card.lastReviewedAt,
      },
    ],
  };
}
