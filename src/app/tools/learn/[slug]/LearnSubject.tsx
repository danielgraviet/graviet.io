"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { learnQuery } from "@/lib/learn/client";

type Topic = {
  id: number;
  title: string;
  kind: string;
  status: string;
  mastery: string;
  dueCount: number;
  cardCount: number;
};

type Domain = {
  id: number;
  title: string;
  goal: string;
  resources: string;
  topics: Topic[];
};

type Detail = {
  subject: { id: number; title: string; description: string };
  domains: Domain[];
  inboxTopics: Topic[];
};

export default function LearnSubject({ slug }: { slug: string }) {
  const [detail, setDetail] = useState<Detail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");

  async function load() {
    setError(null);
    try {
      const response = await fetch(
        `/api/tools/learn/subjects/${encodeURIComponent(slug)}?${learnQuery()}`,
      );
      const payload = await response.json();
      if (!response.ok) {
        setError(payload.error || "Failed to load subject.");
        return;
      }
      setDetail(payload as Detail);
    } catch {
      setError("Failed to reach the server.");
    }
  }

  useEffect(() => {
    load();
  }, [slug]);

  async function handleAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!detail || !newTitle.trim()) return;
    const response = await fetch("/api/tools/learn/topics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subjectId: detail.subject.id,
        title: newTitle.trim(),
      }),
    });
    const payload = await response.json();
    if (!response.ok) {
      setError(payload.error || "Failed to add topic.");
      return;
    }
    setNewTitle("");
    setDetail((prev) =>
      prev
        ? { ...prev, inboxTopics: [...prev.inboxTopics, payload.topic] }
        : prev,
    );
  }

  if (!detail) {
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
        <h1 className="mt-2 text-3xl tracking-tight">
          {detail.subject.title}
        </h1>
        {detail.subject.description && (
          <p className="mt-2 text-sm text-text-secondary">{detail.subject.description}</p>
        )}
      </div>

      {error && <p className="text-sm text-text-secondary">{error}</p>}

      <form onSubmit={handleAdd} className="flex gap-3">
        <input
          value={newTitle}
          onChange={(event) => setNewTitle(event.target.value)}
          placeholder="Add a topic"
          className="w-full border border-border bg-background px-3 py-2.5 text-base outline-none transition-colors focus:border-foreground"
        />
        <button
          type="submit"
          className="inline-flex h-11 shrink-0 items-center gap-2 border border-border px-4 text-sm font-semibold hover:border-foreground"
        >
          <Plus className="h-4 w-4" />
          Add
        </button>
      </form>

      {detail.domains.length === 0 && detail.inboxTopics.length === 0 && (
        <p className="text-sm text-text-secondary">No topics yet. Add one above.</p>
      )}

      {detail.inboxTopics.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold text-text-secondary">Topics</h2>
          <TopicList topics={detail.inboxTopics} />
        </section>
      )}

      {detail.domains.map((domain) => (
        <section key={domain.id} className="space-y-3">
          <div>
            <h2 className="text-xl font-semibold">{domain.title}</h2>
            <p className="text-sm text-text-secondary">{domain.goal}</p>
            {domain.resources && (
              <p className="mt-1 whitespace-pre-wrap text-sm text-text-secondary">
                {domain.resources}
              </p>
            )}
          </div>
          <TopicList topics={domain.topics.filter((topic) => topic.kind === "topic")} />
          {domain.topics.some((topic) => topic.kind === "project") && (
            <>
              <h3 className="text-sm font-semibold text-text-secondary">Projects</h3>
              <TopicList topics={domain.topics.filter((topic) => topic.kind === "project")} />
            </>
          )}
        </section>
      ))}
    </div>
  );
}

function TopicList({ topics }: { topics: Topic[] }) {
  if (topics.length === 0) return null;

  return (
    <div className="border-t border-border">
      {topics.map((topic) => (
        <Link
          key={topic.id}
          href={`/tools/learn/topic/${topic.id}`}
          className="flex items-baseline justify-between gap-3 border-b border-border py-3 text-sm transition-colors hover:text-text-secondary"
        >
          <span className="font-semibold">{topic.title}</span>
          <span className="shrink-0 text-xs text-text-secondary">
            {topic.dueCount > 0 ? `${topic.dueCount} due` : `${topic.cardCount} cards`}
            <span className="mx-1">·</span>
            {topic.mastery}
          </span>
        </Link>
      ))}
    </div>
  );
}
