"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { learnQuery, localToday } from "@/lib/learn/client";
import {
  checkLearningAnswer,
  type LearningCheck,
} from "@/lib/learn/learning-check";
import type { LearnRating } from "@/lib/learn/sm2";

type Card = {
  id: number;
  front: string;
  back: string;
};

const RATINGS: { id: LearnRating; label: string; hint: string }[] = [
  { id: "again", label: "Again", hint: "1" },
  { id: "hard", label: "Hard", hint: "2" },
  { id: "good", label: "Good", hint: "3" },
  { id: "easy", label: "Easy", hint: "4" },
];

const TYPED_MODE_KEY = "learn-typed-answer-mode";

export default function LearnReview() {
  const [cards, setCards] = useState<Card[] | null>(null);
  const [due, setDue] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [typedMode, setTypedMode] = useState(
    () =>
      typeof window !== "undefined" &&
      window.localStorage.getItem(TYPED_MODE_KEY) === "true",
  );
  const [typedAnswer, setTypedAnswer] = useState("");
  const [learningCheck, setLearningCheck] = useState<LearningCheck | null>(
    null,
  );

  const current = cards?.[0] ?? null;

  async function load() {
    setError(null);
    try {
      const response = await fetch(
        `/api/tools/learn/review/queue?${learnQuery()}`,
      );
      const payload = await response.json();
      if (!response.ok) {
        setError(payload.error || "Failed to load queue.");
        return;
      }
      setCards(payload.cards as Card[]);
      setDue(payload.stats?.due ?? (payload.cards as Card[]).length);
      setRevealed(false);
    } catch {
      setError("Failed to reach the server.");
    }
  }

  useEffect(() => {
    // Queue loading is intentionally kicked off once when the review screen mounts.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, []);

  function resetAnswer() {
    setRevealed(false);
    setTypedAnswer("");
    setLearningCheck(null);
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

  async function rate(rating: LearnRating) {
    if (!current || saving) return;
    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/tools/learn/review/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cardId: current.id,
          rating,
          today: localToday(),
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        setError(payload.error || "Failed to save review.");
        return;
      }
      setCards(payload.cards as Card[]);
      setDue(payload.stats?.due ?? 0);
      resetAnswer();
    } catch {
      setError("Failed to save review.");
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (!current) return;
      const target = event.target as HTMLElement | null;
      if (target?.matches("input, textarea, select, [contenteditable='true']"))
        return;
      if (!typedMode && (event.key === " " || event.key === "Enter")) {
        event.preventDefault();
        setRevealed(true);
      }
      if (!revealed) return;
      if (event.key === "1") rate("again");
      if (event.key === "2") rate("hard");
      if (event.key === "3") rate("good");
      if (event.key === "4") rate("easy");
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // `rate` uses the current render's card and saving state, both listed above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, revealed, saving, typedMode]);

  if (cards === null) {
    return <p className="text-sm text-text-secondary">{error || "Loading…"}</p>;
  }

  if (!current) {
    return (
      <div className="space-y-4 border-y border-border py-6">
        <p className="text-base font-semibold">Caught up.</p>
        <p className="text-sm text-text-secondary">
          No cards are due. Add Q/A on a topic, or come back tomorrow.
        </p>
        <Link
          href="/tools/learn"
          className="inline-flex text-sm font-semibold underline decoration-border underline-offset-4"
        >
          Back to Learn
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-text-secondary">{due} due</p>
        <button
          type="button"
          role="switch"
          aria-checked={typedMode}
          onClick={toggleTypedMode}
          className="inline-flex items-center gap-2 text-sm font-semibold"
        >
          <span
            aria-hidden="true"
            className={`relative h-5 w-9 border transition-colors ${
              typedMode
                ? "border-foreground bg-foreground"
                : "border-border bg-background"
            }`}
          >
            <span
              className={`absolute top-0.5 h-3.5 w-3.5 bg-background transition-transform ${
                typedMode
                  ? "translate-x-4"
                  : "translate-x-0.5 border border-border"
              }`}
            />
          </span>
          Type answer
        </button>
      </div>
      {error && <p className="text-sm text-text-secondary">{error}</p>}

      <article className="border-y border-border py-6">
        <p className="whitespace-pre-wrap text-lg font-semibold leading-relaxed">
          {current.front}
        </p>
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
              onChange={(event) => setTypedAnswer(event.target.value)}
              placeholder="Explain what you remember…"
              className="w-full resize-y border border-border bg-background p-3 text-base leading-relaxed outline-none transition-colors placeholder:text-text-secondary focus:border-foreground"
            />
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
            <button
              type="button"
              onClick={() => setRevealed(true)}
              className="mt-6 inline-flex h-11 items-center border border-foreground bg-foreground px-4 text-sm font-semibold text-background"
            >
              Reveal
            </button>
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
