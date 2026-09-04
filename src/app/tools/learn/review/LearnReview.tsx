"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { learnQuery, localToday } from "@/lib/learn/client";
import {
  checkLearningAnswer,
  type LearningCheck,
} from "@/lib/learn/learning-check";
import type { LearnRating } from "@/lib/learn/sm2";
import {
  addReview,
  parseReviewSession,
  REVIEW_SESSION_KEY,
  type ReviewSession,
  type ReviewSessionCard,
} from "@/lib/learn/review-session";

const RATINGS: { id: LearnRating; label: string; hint: string }[] = [
  { id: "again", label: "Again", hint: "1" },
  { id: "hard", label: "Hard", hint: "2" },
  { id: "good", label: "Good", hint: "3 / Enter" },
  { id: "easy", label: "Easy", hint: "4" },
];

const TYPED_MODE_KEY = "learn-typed-answer-mode";

type Subject = {
  id: number;
  slug: string;
  title: string;
  dueCount: number;
};

export default function LearnReview() {
  const [session, setSession] = useState<ReviewSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [remainingDue, setRemainingDue] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState("");
  const ratingLocked = useRef(false);
  const [typedMode, setTypedMode] = useState(
    () =>
      typeof window !== "undefined" &&
      window.localStorage.getItem(TYPED_MODE_KEY) === "true",
  );
  const [typedAnswer, setTypedAnswer] = useState("");
  const [learningCheck, setLearningCheck] = useState<LearningCheck | null>(
    null,
  );

  const current = session?.cards[0] ?? null;

  async function load(subjectSlug = selectedSubject, skipStored = false) {
    setLoading(true);
    setError(null);
    setSaved(false);
    const stored = skipStored
      ? null
      : parseReviewSession(window.localStorage.getItem(REVIEW_SESSION_KEY));
    if (stored) {
      setSelectedSubject(stored.subjectSlug ?? "");
      setSession(stored);
      setLoading(false);
      return;
    }
    window.localStorage.removeItem(REVIEW_SESSION_KEY);
    try {
      const response = await fetch(
        `/api/tools/learn/review/queue?${learnQuery(
          subjectSlug ? { subject: subjectSlug } : undefined,
        )}`,
      );
      const payload = await response.json();
      if (!response.ok) {
        setError(payload.error || "Failed to load queue.");
        return;
      }
      const cards = payload.cards as ReviewSessionCard[];
      setSubjects(payload.subjects as Subject[]);
      const next: ReviewSession = {
        version: 1,
        today: localToday(),
        subjectSlug: subjectSlug || null,
        totalDue: payload.stats?.due ?? cards.length,
        cards,
        pendingReviews: [],
      };
      setSession(next);
      if (cards.length > 0) {
        window.localStorage.setItem(REVIEW_SESSION_KEY, JSON.stringify(next));
      }
      setRevealed(false);
    } catch {
      setError("Failed to reach the server.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // Queue loading is intentionally kicked off once when the review screen mounts.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    // `load` intentionally captures only the initial subject selection.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    async function loadSubjects() {
      try {
        const response = await fetch(`/api/tools/learn/subjects?${learnQuery()}`);
        const payload = await response.json();
        if (response.ok) setSubjects(payload.subjects as Subject[]);
      } catch {
        // A stored review session remains usable while offline.
      }
    }
    loadSubjects();
  }, []);

  function changeSubject(subjectSlug: string) {
    if (session?.pendingReviews.length) return;
    window.localStorage.removeItem(REVIEW_SESSION_KEY);
    setSelectedSubject(subjectSlug);
    setSession(null);
    resetAnswer();
    void load(subjectSlug, true);
  }

  function resetAnswer() {
    setRevealed(false);
    setTypedAnswer("");
    setLearningCheck(null);
    setCopied(false);
  }

  function toggleTypedMode() {
    const next = !typedMode;
    setTypedMode(next);
    window.localStorage.setItem(TYPED_MODE_KEY, String(next));
    resetAnswer();
  }

  function checkAnswer() {
    if (!current || !typedAnswer.trim()) return;
    setLearningCheck(checkLearningAnswer(typedAnswer, current.back));
    setRevealed(true);
  }

  function rate(rating: LearnRating) {
    if (!session || !current || saving || ratingLocked.current) return;
    ratingLocked.current = true;
    setError(null);
    try {
      const next = addReview(
        session,
        rating,
        window.crypto.randomUUID(),
        new Date().toISOString(),
      );
      window.localStorage.setItem(REVIEW_SESSION_KEY, JSON.stringify(next));
      setSession(next);
      resetAnswer();
    } catch {
      ratingLocked.current = false;
      setError("Could not save this answer locally. Please try again.");
    }
  }

  async function copyQuestionAndAnswer() {
    if (!current) return;
    const content = `Question:\n${current.front}\n\nMy answer:\n${typedAnswer.trim()}`;
    try {
      await window.navigator.clipboard.writeText(content);
      setCopied(true);
    } catch {
      setError("Could not copy to the clipboard.");
    }
  }

  async function saveSession() {
    if (!session || session.pendingReviews.length === 0 || saving) return;
    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/tools/learn/review/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reviews: session.pendingReviews,
          today: session.today,
          subjectSlug: session.subjectSlug,
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        setError(payload.error || "Failed to save review session.");
        return;
      }
      window.localStorage.removeItem(REVIEW_SESSION_KEY);
      setRemainingDue(payload.stats?.due ?? 0);
      setSession(null);
      setSaved(true);
    } catch {
      setError(
        "Failed to reach the server. Your reviews are still saved locally.",
      );
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    ratingLocked.current = false;
  }, [current?.id]);

  useEffect(() => {
    function warnBeforeLeaving(event: BeforeUnloadEvent) {
      if (!session?.pendingReviews.length) return;
      event.preventDefault();
      event.returnValue = "";
    }
    window.addEventListener("beforeunload", warnBeforeLeaving);
    return () => window.removeEventListener("beforeunload", warnBeforeLeaving);
  }, [session?.pendingReviews.length]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (!current) return;
      if (event.repeat) return;
      const target = event.target as HTMLElement | null;
      if (target?.matches("input, textarea, select, [contenteditable='true']"))
        return;
      if (!typedMode && (event.key === " " || event.key === "Enter")) {
        event.preventDefault();
        setRevealed(true);
      }
      if (!revealed) return;
      if (event.key === "1") {
        event.preventDefault();
        rate("again");
      }
      if (event.key === "2") {
        event.preventDefault();
        rate("hard");
      }
      if (event.key === "3") {
        event.preventDefault();
        rate("good");
      }
      if (event.key === "4") {
        event.preventDefault();
        rate("easy");
      }
      if (event.key === "Enter" && !target?.matches("button, a")) {
        event.preventDefault();
        rate("good");
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // `rate` uses the current render's card and saving state, both listed above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, revealed, saving, typedMode]);

  if (loading) {
    return <p className="text-sm text-text-secondary">{error || "Loading…"}</p>;
  }

  if (saved) {
    return (
      <div className="space-y-4 border-y border-border py-6">
        <p className="text-base font-semibold">Reviews saved.</p>
        <p className="text-sm text-text-secondary">
          {remainingDue > 0
            ? "There are more cards ready if you want another session."
            : "You are caught up for now."}
        </p>
        <div className="flex flex-wrap gap-4">
          {remainingDue > 0 && (
            <button
              type="button"
              onClick={() => load()}
              className="text-sm font-semibold underline decoration-border underline-offset-4"
            >
              Review more
            </button>
          )}
          <Link
            href="/tools/learn"
            className="inline-flex text-sm font-semibold underline decoration-border underline-offset-4"
          >
            Back to Learn
          </Link>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <p className="text-sm text-text-secondary">
        {error || "No review session."}
      </p>
    );
  }

  if (!current) {
    const hasPendingReviews = session.pendingReviews.length > 0;
    return (
      <div className="space-y-4 border-y border-border py-6">
        <label className="grid max-w-xs gap-1 text-xs font-semibold text-text-secondary">
          Study
          <select
            value={selectedSubject}
            disabled={saving || hasPendingReviews}
            onChange={(event) => changeSubject(event.target.value)}
            className="h-9 border border-border bg-background px-3 text-sm font-semibold text-foreground outline-none focus:border-foreground disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="">All subjects</option>
            {subjects.map((subject) => (
              <option key={subject.id} value={subject.slug}>
                {subject.title} ({subject.dueCount})
              </option>
            ))}
          </select>
        </label>
        <p className="text-base font-semibold">
          {hasPendingReviews ? "Session complete." : "Caught up."}
        </p>
        <p className="text-sm text-text-secondary">
          {hasPendingReviews
            ? "Save your reviews to finish."
            : "No cards are due. Add Q/A on a topic, or come back tomorrow."}
        </p>
        {error && <p className="text-sm text-text-secondary">{error}</p>}
        {hasPendingReviews ? (
          <button
            type="button"
            disabled={saving}
            onClick={saveSession}
            className="inline-flex h-11 items-center border border-foreground bg-foreground px-4 text-sm font-semibold text-background disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        ) : (
          <Link
            href="/tools/learn"
            className="inline-flex text-sm font-semibold underline decoration-border underline-offset-4"
          >
            Back to Learn
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-3">
          <p className="text-sm text-text-secondary">{session.totalDue} due</p>
          <button
            type="button"
            disabled={saving || session.pendingReviews.length === 0}
            onClick={saveSession}
            className="inline-flex h-9 items-center border border-foreground px-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
        <div className="flex flex-wrap items-end gap-4">
          <label className="grid gap-1 text-xs font-semibold text-text-secondary">
            Study
            <select
              value={selectedSubject}
              disabled={saving || session.pendingReviews.length > 0}
              onChange={(event) => changeSubject(event.target.value)}
              className="h-9 border border-border bg-background px-3 text-sm font-semibold text-foreground outline-none focus:border-foreground disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">All subjects</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.slug}>
                  {subject.title} ({subject.dueCount})
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            role="switch"
            aria-checked={typedMode}
            onClick={toggleTypedMode}
            className="inline-flex h-9 items-center gap-2 text-sm font-semibold"
          >
            <span
              aria-hidden="true"
              className={`relative h-6 w-10 shrink-0 rounded-full border transition-colors ${
                typedMode
                  ? "border-foreground bg-foreground"
                  : "border-border bg-muted"
              }`}
            >
              <span
                className={`absolute left-1 top-1 h-4 w-4 rounded-full transition-[transform,background-color] ${
                  typedMode
                    ? "translate-x-4 bg-background"
                    : "translate-x-0 bg-foreground"
                }`}
              />
            </span>
            Type answer
          </button>
        </div>
      </div>
      {session.pendingReviews.length > 0 && (
        <p className="text-xs text-text-secondary">
          Save this session before changing subjects.
        </p>
      )}
      {error && <p className="text-sm text-text-secondary">{error}</p>}

      <article className="border-y border-border py-6">
        <p className="whitespace-pre-wrap text-lg font-semibold leading-relaxed">
          {current.front}
        </p>
        <button
          type="button"
          onClick={copyQuestionAndAnswer}
          className="mt-3 text-xs font-semibold text-text-secondary underline decoration-border underline-offset-4"
        >
          {copied ? "Copied" : "Copy question + answer"}
        </button>
        {typedMode && !revealed && (
          <form
            className="mt-6 space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              checkAnswer();
            }}
          >
            <label
              htmlFor="learning-answer"
              className="block text-sm font-semibold"
            >
              Your answer
            </label>
            <textarea
              id="learning-answer"
              rows={4}
              autoFocus
              value={typedAnswer}
              onChange={(event) => {
                setTypedAnswer(event.target.value);
                setCopied(false);
              }}
              onKeyDown={(event) => {
                if (
                  event.key === "Enter" &&
                  !event.shiftKey &&
                  !event.nativeEvent.isComposing
                ) {
                  event.preventDefault();
                  checkAnswer();
                }
              }}
              placeholder="Explain what you remember…"
              aria-describedby="learning-answer-shortcut"
              className="w-full resize-y border border-border bg-background p-3 text-base leading-relaxed outline-none transition-colors placeholder:text-text-secondary focus:border-foreground"
            />
            <p
              id="learning-answer-shortcut"
              className="text-xs text-text-secondary"
            >
              Enter to check · Shift+Enter for a new line
            </p>
            <button
              type="submit"
              disabled={!typedAnswer.trim()}
              className="inline-flex h-11 items-center border border-foreground bg-foreground px-4 text-sm font-semibold text-background disabled:cursor-not-allowed disabled:opacity-40"
            >
              Check answer
            </button>
          </form>
        )}
        {revealed ? (
          <div className="mt-6 space-y-4">
            {learningCheck && (
              <div className="border border-border bg-muted p-3 text-sm">
                <p className="font-semibold">
                  {learningCheck.hasMatch
                    ? "You found matching words."
                    : "No matching words yet."}
                </p>
                <p className="mt-1 text-text-secondary">
                  {learningCheck.matched.length} of{" "}
                  {learningCheck.answerWordCount} answer words matched
                  {learningCheck.matched.length > 0 &&
                    `: ${learningCheck.matched.join(", ")}`}
                  .
                </p>
              </div>
            )}
            <div>
              {typedMode && (
                <p className="mb-1 text-sm font-semibold">Answer</p>
              )}
              <p className="whitespace-pre-wrap text-base leading-relaxed text-text-secondary">
                {current.back}
              </p>
            </div>
          </div>
        ) : (
          !typedMode && (
            <div className="mt-6">
              <button
                type="button"
                onClick={() => setRevealed(true)}
                className="inline-flex h-11 items-center border border-foreground bg-foreground px-4 text-sm font-semibold text-background"
              >
                Reveal
              </button>
            </div>
          )
        )}
      </article>

      {revealed && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {RATINGS.map((item) => (
            <button
              key={item.id}
              type="button"
              disabled={saving}
              onClick={() => rate(item.id)}
              className="border border-border px-3 py-3 text-sm font-semibold transition-colors hover:border-foreground disabled:opacity-60"
            >
              {item.label}
              <span className="mt-1 block text-xs font-normal text-text-secondary">
                {item.hint}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
