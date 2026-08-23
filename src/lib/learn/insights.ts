import type { LearnRating } from "@/lib/learn/sm2";

export const MATURE_INTERVAL_DAYS = 21;
export const LEECH_MIN_REVIEWS = 4;
export const WEAK_TOPIC_MIN_REVIEWS = 5;

export type InsightReview = {
  cardId: number;
  rating: LearnRating;
  reviewedAt: string;
};

export type InsightCard = {
  id: number;
  front: string;
  ease: number;
  intervalDays: number;
  repetitions: number;
  lapses: number;
  dueAt: string;
  lastReviewedAt: string | null;
  topicId: number | null;
  topicTitle: string | null;
  subjectSlug: string | null;
  domainTitle: string | null;
};

export type LeechCard = {
  cardId: number;
  front: string;
  topicId: number | null;
  topicTitle: string | null;
  subjectSlug: string | null;
  lapses: number;
  againRate: number;
  reviews: number;
  ease: number;
  score: number;
};

export type WeakTopic = {
  topicId: number;
  title: string;
  subjectSlug: string | null;
  domainTitle: string | null;
  reviews: number;
  againRate: number;
  meanEase: number;
};

export type AtRiskCard = {
  cardId: number;
  front: string;
  topicId: number | null;
  topicTitle: string | null;
  subjectSlug: string | null;
  dueAt: string;
  ease: number;
  lapses: number;
  retrievability: number | null;
  score: number;
};

export type LearnInsights = {
  week: {
    reviewsThisWeek: number;
    reviewsLastWeek: number;
    againRateThisWeek: number | null;
    daysReviewedThisWeek: number;
    dueToday: number;
    dueNext7: number;
    dueNext14: number;
    overdue: number;
    loadNote: string | null;
  };
  study: {
    leeches: LeechCard[];
    weakTopics: WeakTopic[];
    atRisk: AtRiskCard[];
  };
  memory: {
    young: number;
    mature: number;
    unseen: number;
    meanEase: number | null;
    lowEase: number;
    overdue: number;
    meanRetrievability: number | null;
  };
  ratings: {
    again: number;
    hard: number;
    good: number;
    easy: number;
    total: number;
    easyThenAgain: number;
  };
};

export function shiftIsoDate(dateStr: string, days: number): string {
  const date = new Date(`${dateStr}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function reviewDate(reviewedAt: string): string {
  return reviewedAt.slice(0, 10);
}

export function daysBetween(fromIso: string, toIso: string): number {
  const from = Date.parse(fromIso);
  const to = Date.parse(toIso);
  if (!Number.isFinite(from) || !Number.isFinite(to)) return 0;
  return Math.max(0, (to - from) / (1000 * 60 * 60 * 24));
}

export function retrievability(
  lastReviewedAt: string | null,
  intervalDays: number,
  now: Date,
): number | null {
  if (!lastReviewedAt) return null;
  const stability = Math.max(intervalDays, 0.5);
  const elapsed = daysBetween(lastReviewedAt, now.toISOString());
  return Math.exp(-elapsed / stability);
}

export function laplaceAgainRate(againCount: number, reviews: number): number {
  return (againCount + 1) / (reviews + 4);
}

export function difficultyScore(input: {
  lapses: number;
  ease: number;
  againRate: number;
}): number {
  const lapsePart = Math.min(input.lapses / 5, 1);
  const easePart = Math.min(Math.max(2.5 - input.ease, 0) / 1.2, 1);
  return 0.5 * lapsePart + 0.3 * easePart + 0.2 * input.againRate;
}

export function isLeech(input: {
  lapses: number;
  reviews: number;
  againCount: number;
}): boolean {
  if (input.reviews < LEECH_MIN_REVIEWS) return false;
  const againRate = input.againCount / input.reviews;
  return input.lapses >= 3 || againRate >= 0.45;
}

export function countEasyThenAgain(
  reviews: InsightReview[],
  maxGapDays = 7,
): number {
  const byCard = new Map<number, InsightReview[]>();
  for (const review of reviews) {
    const list = byCard.get(review.cardId) ?? [];
    list.push(review);
    byCard.set(review.cardId, list);
  }

  let count = 0;
  for (const list of byCard.values()) {
    const ordered = [...list].sort((a, b) =>
      a.reviewedAt < b.reviewedAt ? -1 : a.reviewedAt > b.reviewedAt ? 1 : 0,
    );
    for (let i = 0; i < ordered.length - 1; i += 1) {
      if (ordered[i].rating !== "easy" || ordered[i + 1].rating !== "again") {
        continue;
      }
      if (daysBetween(ordered[i].reviewedAt, ordered[i + 1].reviewedAt) <= maxGapDays) {
        count += 1;
      }
    }
  }
  return count;
}

function inRange(date: string, start: string, end: string): boolean {
  return date >= start && date <= end;
}

function dueOnOrBefore(dueAt: string, dateStr: string): boolean {
  return dueAt.slice(0, 10) <= dateStr;
}

function truncateFront(front: string): string {
  const compact = front.replace(/\s+/g, " ").trim();
  if (compact.length <= 90) return compact;
  return `${compact.slice(0, 87)}...`;
}

export function buildLearnInsights(input: {
  cards: InsightCard[];
  reviews: InsightReview[];
  today: string;
  now?: Date;
}): LearnInsights {
  const now = input.now ?? new Date(`${input.today}T12:00:00.000Z`);
  const thisWeekStart = shiftIsoDate(input.today, -6);
  const lastWeekStart = shiftIsoDate(input.today, -13);
  const lastWeekEnd = shiftIsoDate(input.today, -7);
  const inThreeDays = shiftIsoDate(input.today, 3);
  const inSevenDays = shiftIsoDate(input.today, 7);
  const inFourteenDays = shiftIsoDate(input.today, 14);
  const last30Start = shiftIsoDate(input.today, -29);

  const reviewsThisWeek = input.reviews.filter((review) =>
    inRange(reviewDate(review.reviewedAt), thisWeekStart, input.today),
  );
  const reviewsLastWeek = input.reviews.filter((review) =>
    inRange(reviewDate(review.reviewedAt), lastWeekStart, lastWeekEnd),
  );
  const againThisWeek = reviewsThisWeek.filter((review) => review.rating === "again").length;
  const daysReviewedThisWeek = new Set(
    reviewsThisWeek.map((review) => reviewDate(review.reviewedAt)),
  ).size;

  const dueToday = input.cards.filter((card) => dueOnOrBefore(card.dueAt, input.today)).length;
  const dueNext7 = input.cards.filter((card) => dueOnOrBefore(card.dueAt, inSevenDays)).length;
  const dueNext14 = input.cards.filter((card) => dueOnOrBefore(card.dueAt, inFourteenDays)).length;
  const overdue = input.cards.filter(
    (card) => card.lastReviewedAt && card.dueAt.slice(0, 10) < input.today,
  ).length;

  let loadNote: string | null = null;
  if (dueNext7 >= 8 && reviewsThisWeek.length < dueNext7 * 0.5) {
    loadNote = "The next 7 days have more due cards than you cleared this week.";
  } else if (overdue >= 10) {
    loadNote = "Overdue cards are stacking. Clear the oldest due pile first.";
  }

  const reviewsByCard = new Map<number, InsightReview[]>();
  for (const review of input.reviews) {
    const list = reviewsByCard.get(review.cardId) ?? [];
    list.push(review);
    reviewsByCard.set(review.cardId, list);
  }

  const leeches: LeechCard[] = [];
  for (const card of input.cards) {
    const cardReviews = reviewsByCard.get(card.id) ?? [];
    const againCount = cardReviews.filter((review) => review.rating === "again").length;
    if (!isLeech({ lapses: card.lapses, reviews: cardReviews.length, againCount })) {
      continue;
    }
    const againRate = againCount / cardReviews.length;
    leeches.push({
      cardId: card.id,
      front: truncateFront(card.front),
      topicId: card.topicId,
      topicTitle: card.topicTitle,
      subjectSlug: card.subjectSlug,
      lapses: card.lapses,
      againRate,
      reviews: cardReviews.length,
      ease: card.ease,
      score: difficultyScore({ lapses: card.lapses, ease: card.ease, againRate }),
    });
  }
  leeches.sort((a, b) => b.score - a.score || b.lapses - a.lapses);

  const topicStats = new Map<
    number,
    {
      title: string;
      subjectSlug: string | null;
      domainTitle: string | null;
      reviews: number;
      again: number;
      easeSum: number;
      easeCount: number;
    }
  >();
  for (const card of input.cards) {
    if (card.topicId == null || !card.topicTitle) continue;
    const current = topicStats.get(card.topicId) ?? {
      title: card.topicTitle,
      subjectSlug: card.subjectSlug,
      domainTitle: card.domainTitle,
      reviews: 0,
      again: 0,
      easeSum: 0,
      easeCount: 0,
    };
    if (card.lastReviewedAt) {
      current.easeSum += card.ease;
      current.easeCount += 1;
    }
    topicStats.set(card.topicId, current);
  }

  const cardById = new Map(input.cards.map((card) => [card.id, card]));
  for (const review of input.reviews) {
    const card = cardById.get(review.cardId);
    if (!card || card.topicId == null) continue;
    const current = topicStats.get(card.topicId);
    if (!current) continue;
    current.reviews += 1;
    if (review.rating === "again") current.again += 1;
  }

  const weakTopics: WeakTopic[] = [...topicStats.entries()]
    .filter(([, stats]) => stats.reviews >= WEAK_TOPIC_MIN_REVIEWS)
    .map(([topicId, stats]) => ({
      topicId,
      title: stats.title,
      subjectSlug: stats.subjectSlug,
      domainTitle: stats.domainTitle,
      reviews: stats.reviews,
      againRate: laplaceAgainRate(stats.again, stats.reviews),
      meanEase: stats.easeCount ? stats.easeSum / stats.easeCount : 2.5,
    }))
    .sort((a, b) => b.againRate - a.againRate || a.meanEase - b.meanEase)
    .slice(0, 5);

  const atRisk: AtRiskCard[] = input.cards
    .filter((card) => card.lastReviewedAt && dueOnOrBefore(card.dueAt, inThreeDays))
    .map((card) => {
      const cardReviews = reviewsByCard.get(card.id) ?? [];
      const againCount = cardReviews.filter((review) => review.rating === "again").length;
      const againRate =
        cardReviews.length === 0 ? 0.25 : againCount / cardReviews.length;
      return {
        cardId: card.id,
        front: truncateFront(card.front),
        topicId: card.topicId,
        topicTitle: card.topicTitle,
        subjectSlug: card.subjectSlug,
        dueAt: card.dueAt,
        ease: card.ease,
        lapses: card.lapses,
        retrievability: retrievability(card.lastReviewedAt, card.intervalDays, now),
        score: difficultyScore({ lapses: card.lapses, ease: card.ease, againRate }),
      };
    })
    .filter(
      (card) => card.score >= 0.28 || (card.retrievability != null && card.retrievability < 0.4),
    )
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);

  const seen = input.cards.filter((card) => card.lastReviewedAt);
  const young = seen.filter((card) => card.intervalDays < MATURE_INTERVAL_DAYS).length;
  const mature = seen.filter((card) => card.intervalDays >= MATURE_INTERVAL_DAYS).length;
  const unseen = input.cards.length - seen.length;
  const meanEase =
    seen.length === 0
      ? null
      : Math.round((seen.reduce((sum, card) => sum + card.ease, 0) / seen.length) * 100) / 100;
  const lowEase = seen.filter((card) => card.ease < 2).length;
  const duePile = input.cards.filter(
    (card) => dueOnOrBefore(card.dueAt, input.today) && card.lastReviewedAt,
  );
  const retrievabilities = duePile
    .map((card) => retrievability(card.lastReviewedAt, card.intervalDays, now))
    .filter((value): value is number => value != null);
  const meanRetrievability =
    retrievabilities.length === 0
      ? null
      : Math.round(
          (retrievabilities.reduce((sum, value) => sum + value, 0) / retrievabilities.length) *
            100,
        ) / 100;

  const recentReviews = input.reviews.filter((review) =>
    inRange(reviewDate(review.reviewedAt), last30Start, input.today),
  );
  const ratingCounts = { again: 0, hard: 0, good: 0, easy: 0 };
  for (const review of recentReviews) {
    ratingCounts[review.rating] += 1;
  }

  return {
    week: {
      reviewsThisWeek: reviewsThisWeek.length,
      reviewsLastWeek: reviewsLastWeek.length,
      againRateThisWeek:
        reviewsThisWeek.length === 0 ? null : againThisWeek / reviewsThisWeek.length,
      daysReviewedThisWeek,
      dueToday,
      dueNext7,
      dueNext14,
      overdue,
      loadNote,
    },
    study: {
      leeches: leeches.slice(0, 8),
      weakTopics,
      atRisk,
    },
    memory: {
      young,
      mature,
      unseen,
      meanEase,
      lowEase,
      overdue,
      meanRetrievability,
    },
    ratings: {
      ...ratingCounts,
      total: recentReviews.length,
      easyThenAgain: countEasyThenAgain(input.reviews),
    },
  };
}
