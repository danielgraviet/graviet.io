"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { learnQuery, localToday } from "@/lib/learn/client";
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

export default function LearnReview() {
  const [cards, setCards] = useState<Card[] | null>(null);
  const [due, setDue] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const current = cards?.[0] ?? null;

  async function load() {
    setError(null);
    try {
      const response = await fetch(`/api/tools/learn/review/queue?${learnQuery()}`);
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
    load();
  }, []);

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
      setRevealed(false);
    } catch {
      setError("Failed to save review.");
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (!current) return;
      if (event.key === " " || event.key === "Enter") {
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
  }, [current, revealed, saving]);

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
      <p className="text-sm text-text-secondary">{due} due</p>
      {error && <p className="text-sm text-text-secondary">{error}</p>}

      <article className="border-y border-border py-6">
        <p className="whitespace-pre-wrap text-lg font-semibold leading-relaxed">
          {current.front}
        </p>
        {revealed ? (
          <p className="mt-6 whitespace-pre-wrap text-base leading-relaxed text-text-secondary">
            {current.back}
          </p>
        ) : (
          <button
            type="button"
            onClick={() => setRevealed(true)}
            className="mt-6 inline-flex h-11 items-center border border-foreground bg-foreground px-4 text-sm font-semibold text-background"
          >
            Reveal
          </button>
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
