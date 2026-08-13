"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { Flame, Plus } from "lucide-react";
import LearnUnlock from "./LearnUnlock";
import { getLearnPassword, learnQuery } from "@/lib/learn/client";

type Subject = {
  id: number;
  slug: string;
  title: string;
  description: string;
  dueCount: number;
  topicCount: number;
};

type Stats = {
  due: number;
  streak: {
    current: number;
    longest: number;
    reviewedToday: boolean;
  };
};

export default function LearnHub() {
  const [password, setPassword] = useState("");
  const [subjects, setSubjects] = useState<Subject[] | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");

  async function load(pwd: string) {
    setError(null);
    try {
      const [subjectsRes, statsRes] = await Promise.all([
        fetch(`/api/tools/learn/subjects?${learnQuery(pwd)}`),
        fetch(`/api/tools/learn/review/stats?${learnQuery(pwd)}`),
      ]);
      const subjectsPayload = await subjectsRes.json();
      const statsPayload = await statsRes.json();

      if (!subjectsRes.ok) {
        setError(subjectsPayload.error || "Failed to load.");
        setPassword("");
        return;
      }

      setSubjects(subjectsPayload.subjects as Subject[]);
      if (statsRes.ok) setStats(statsPayload.stats as Stats);
    } catch {
      setError("Failed to reach the server.");
    }
  }

  useEffect(() => {
    const stored = getLearnPassword();
    if (stored) {
      setPassword(stored);
      load(stored);
    }
  }, []);

  async function handleAddSubject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!newTitle.trim()) return;

    const response = await fetch("/api/tools/learn/subjects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password, title: newTitle.trim() }),
    });
    const payload = await response.json();
    if (!response.ok) {
      setError(payload.error || "Failed to create subject.");
      return;
    }
    setNewTitle("");
    setSubjects((prev) => (prev ? [...prev, payload.subject] : [payload.subject]));
  }

  if (!password) {
    return <LearnUnlock onUnlock={(pwd) => { setPassword(pwd); load(pwd); }} />;
  }

  return (
    <div className="space-y-8">
      {stats && (
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-y border-border py-4 text-sm">
          <span className="inline-flex items-center gap-2 font-semibold">
            <Flame
              className={`h-4 w-4 ${stats.streak.current > 0 ? "text-foreground" : "text-text-secondary"}`}
            />
            {stats.streak.current} day review streak
          </span>
          <span className="text-text-secondary">Longest: {stats.streak.longest}</span>
          <span className="text-text-secondary">
            {stats.due} card{stats.due === 1 ? "" : "s"} due
          </span>
          {stats.streak.reviewedToday ? (
            <span className="text-text-secondary">Reviewed today</span>
          ) : (
            <span className="text-text-secondary">No review yet today</span>
          )}
        </div>
      )}

      <Link
        href="/tools/learn/review"
        className="inline-flex h-11 items-center justify-center border border-foreground bg-foreground px-4 text-sm font-semibold text-background transition-opacity hover:opacity-80"
      >
        Start review
      </Link>

      {error && <p className="text-sm text-text-secondary">{error}</p>}

      <form onSubmit={handleAddSubject} className="flex gap-3">
        <input
          value={newTitle}
          onChange={(event) => setNewTitle(event.target.value)}
          placeholder="New subject (e.g. Linear Algebra)"
          className="w-full border border-border bg-background px-3 py-2.5 text-base outline-none transition-colors focus:border-foreground"
        />
        <button
          type="submit"
          className="inline-flex h-11 shrink-0 items-center gap-2 border border-border px-4 text-sm font-semibold transition-colors hover:border-foreground"
        >
          <Plus className="h-4 w-4" />
          Add
        </button>
      </form>

      <div className="border-t border-border">
        {(subjects ?? []).map((subject) => (
          <Link
            key={subject.id}
            href={`/tools/learn/${subject.slug}`}
            className="block border-b border-border py-4 transition-colors hover:text-text-secondary"
          >
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="text-base font-semibold">{subject.title}</h2>
              <span className="text-xs font-semibold text-text-secondary">
                {subject.dueCount} due · {subject.topicCount} topics
              </span>
            </div>
            {subject.description && (
              <p className="mt-1 text-sm text-text-secondary">{subject.description}</p>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
