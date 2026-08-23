"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { learnQuery } from "@/lib/learn/client";

type Topic = {
  id: number;
  subjectId: number;
  title: string;
  status: string;
  mastery: string;
  notes: string;
  resources: string;
  noteLink: string;
};

type Card = {
  id: number;
  front: string;
  back: string;
  dueAt: string;
};

const STATUSES = ["todo", "learning", "known"] as const;
const MASTERY = ["learning", "practiced", "proficient", "mastered"] as const;

export default function LearnTopic({ id }: { id: number }) {
  const [topic, setTopic] = useState<Topic | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    setError(null);
    try {
      const response = await fetch(
        `/api/tools/learn/topics/${id}/cards?${learnQuery()}`,
      );
      const payload = await response.json();
      if (!response.ok) {
        setError(payload.error || "Failed to load topic.");
        return;
      }
      setTopic(payload.topic as Topic);
      setCards(payload.cards as Card[]);
    } catch {
      setError("Failed to reach the server.");
    }
  }

  useEffect(() => {
    load();
  }, [id]);

  async function patchTopic(partial: Partial<Topic>) {
    if (!topic) return;
    const next = { ...topic, ...partial };
    setTopic(next);
    await fetch(`/api/tools/learn/topics/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(partial),
    });
  }

  async function handleAddCard(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!front.trim() || !back.trim()) return;
    setSaving(true);
    try {
      const response = await fetch(`/api/tools/learn/topics/${id}/cards`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          front: front.trim(),
          back: back.trim(),
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        setError(payload.error || "Failed to add card.");
        return;
      }
      setCards((prev) => [...prev, payload.card]);
      setFront("");
      setBack("");
    } finally {
      setSaving(false);
    }
  }

  async function handleParse() {
    if (!topic?.notes.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const parsed = await fetch("/api/tools/learn/cards/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: topic.notes }),
      });
      const payload = await parsed.json();
      if (!parsed.ok) {
        setError(payload.error || "Failed to parse notes.");
        return;
      }
      const pairs = payload.cards as { front: string; back: string }[];
      if (pairs.length === 0) {
        setError("No Q:/A: pairs found. Use lines like Q: ... and A: ...");
        return;
      }
      for (const pair of pairs) {
        const response = await fetch(`/api/tools/learn/topics/${id}/cards`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            front: pair.front,
            back: pair.back,
            source: "parsed",
          }),
        });
        const created = await response.json();
        if (response.ok) {
          setCards((prev) => [...prev, created.card]);
        }
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteCard(cardId: number) {
    if (!confirm("Delete this card?")) return;
    await fetch(`/api/tools/learn/cards/${cardId}`, { method: "DELETE" });
    setCards((prev) => prev.filter((card) => card.id !== cardId));
  }

  if (!topic) {
    return <p className="text-sm text-text-secondary">{error || "Loading…"}</p>;
  }

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/tools/learn"
          className="text-sm text-text-secondary underline decoration-border underline-offset-4"
        >
          Learn
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">{topic.title}</h1>
      </div>

      {error && <p className="text-sm text-text-secondary">{error}</p>}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-text-secondary">
            Status
          </span>
          <select
            value={topic.status}
            onChange={(event) => patchTopic({ status: event.target.value })}
            className="w-full border border-border bg-background px-3 py-2.5 text-base outline-none focus:border-foreground"
          >
            {STATUSES.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-text-secondary">
            Mastery
          </span>
          <select
            value={topic.mastery}
            onChange={(event) => patchTopic({ mastery: event.target.value })}
            className="w-full border border-border bg-background px-3 py-2.5 text-base outline-none focus:border-foreground"
          >
            {MASTERY.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="block">
        <span className="mb-2 block text-sm font-semibold text-text-secondary">
          Lesson notes
        </span>
        <textarea
          value={topic.notes}
          onChange={(event) => setTopic({ ...topic, notes: event.target.value })}
          onBlur={(event) => patchTopic({ notes: event.currentTarget.value })}
          rows={8}
          placeholder={"Paste the lesson, then Q: / A: pairs:\nQ: What is cache coherence?\nA: ..."}
          className="w-full border border-border bg-background px-3 py-2.5 text-base outline-none focus:border-foreground"
        />
      </label>

      <label className="block">
        <span className="mb-2 block text-sm font-semibold text-text-secondary">
          Notion link
        </span>
        <input
          value={topic.noteLink}
          onChange={(event) => setTopic({ ...topic, noteLink: event.target.value })}
          onBlur={(event) => patchTopic({ noteLink: event.currentTarget.value })}
          className="w-full border border-border bg-background px-3 py-2.5 text-base outline-none focus:border-foreground"
        />
      </label>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleParse}
          disabled={saving}
          className="inline-flex h-11 items-center border border-foreground bg-foreground px-4 text-sm font-semibold text-background disabled:opacity-60"
        >
          Parse Q/A from notes
        </button>
        <Link
          href="/tools/learn/review"
          className="inline-flex h-11 items-center border border-border px-4 text-sm font-semibold hover:border-foreground"
        >
          Review due cards
        </Link>
      </div>

      <form onSubmit={handleAddCard} className="space-y-3 border-y border-border py-5">
        <p className="text-sm font-semibold text-text-secondary">Add card</p>
        <textarea
          value={front}
          onChange={(event) => setFront(event.target.value)}
          rows={2}
          placeholder="Front (question)"
          className="w-full border border-border bg-background px-3 py-2.5 text-base outline-none focus:border-foreground"
        />
        <textarea
          value={back}
          onChange={(event) => setBack(event.target.value)}
          rows={3}
          placeholder="Back (answer)"
          className="w-full border border-border bg-background px-3 py-2.5 text-base outline-none focus:border-foreground"
        />
        <button
          type="submit"
          disabled={saving || !front.trim() || !back.trim()}
          className="inline-flex h-11 items-center border border-border px-4 text-sm font-semibold hover:border-foreground disabled:opacity-60"
        >
          Save card
        </button>
      </form>

      <div className="border-t border-border">
        {cards.length === 0 ? (
          <p className="py-4 text-sm text-text-secondary">
            No cards yet. Paste Q/A into notes or add one above.
          </p>
        ) : (
          cards.map((card) => (
            <article key={card.id} className="border-b border-border py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 space-y-2">
                  <p className="whitespace-pre-wrap font-semibold">{card.front}</p>
                  <p className="whitespace-pre-wrap text-sm text-text-secondary">
                    {card.back}
                  </p>
                  <p className="text-xs text-text-secondary">
                    Due {card.dueAt.slice(0, 10)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteCard(card.id)}
                  className="text-text-secondary hover:text-foreground"
                  aria-label="Delete card"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
