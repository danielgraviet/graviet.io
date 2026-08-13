export const LEARN_RATINGS = ["again", "hard", "good", "easy"] as const;

export type LearnRating = (typeof LEARN_RATINGS)[number];

export type Sm2State = {
  ease: number;
  intervalDays: number;
  repetitions: number;
  lapses: number;
  dueAt: string;
  lastReviewedAt: string | null;
};

export function isLearnRating(value: unknown): value is LearnRating {
  return typeof value === "string" && LEARN_RATINGS.includes(value as LearnRating);
}

export function newCardSchedule(now = new Date()): Sm2State {
  return {
    ease: 2.5,
    intervalDays: 0,
    repetitions: 0,
    lapses: 0,
    dueAt: now.toISOString(),
    lastReviewedAt: null,
  };
}

function addDays(now: Date, days: number): Date {
  const next = new Date(now.getTime());
  next.setUTCDate(next.getUTCDate() + Math.max(1, Math.round(days)));
  return next;
}

export function applySm2(
  current: Sm2State,
  rating: LearnRating,
  now = new Date(),
): Sm2State {
  let ease = current.ease;
  let intervalDays = current.intervalDays;
  let repetitions = current.repetitions;
  let lapses = current.lapses;

  if (rating === "again") {
    repetitions = 0;
    intervalDays = 1;
    ease = Math.max(1.3, ease - 0.2);
    lapses += 1;
  } else if (rating === "hard") {
    intervalDays = Math.max(1, intervalDays * 1.2);
    ease = Math.max(1.3, ease - 0.15);
    repetitions += 1;
  } else if (rating === "good") {
    if (repetitions === 0) intervalDays = 1;
    else if (repetitions === 1) intervalDays = 6;
    else intervalDays = intervalDays * ease;
    repetitions += 1;
  } else {
    if (repetitions === 0) intervalDays = 1;
    else if (repetitions === 1) intervalDays = 6;
    else intervalDays = intervalDays * ease;
    intervalDays *= 1.3;
    ease += 0.15;
    repetitions += 1;
  }

  return {
    ease: Math.round(ease * 100) / 100,
    intervalDays: Math.round(intervalDays * 100) / 100,
    repetitions,
    lapses,
    dueAt: addDays(now, intervalDays).toISOString(),
    lastReviewedAt: now.toISOString(),
  };
}
