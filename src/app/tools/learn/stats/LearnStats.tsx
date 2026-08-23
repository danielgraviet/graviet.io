"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { learnQuery } from "@/lib/learn/client";
import type { LearnInsights } from "@/lib/learn/insights";

function percent(value: number | null): string {
  if (value == null) return "—";
  return `${Math.round(value * 100)}%`;
}

function formatDue(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function topicHref(topicId: number | null): string | null {
  return topicId == null ? null : `/tools/learn/topic/${topicId}`;
}

export default function LearnStats() {
  const [insights, setInsights] = useState<LearnInsights | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setError(null);
      try {
        const response = await fetch(`/api/tools/learn/insights?${learnQuery()}`);
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload.error || "Failed to load stats.");
        }
        if (!cancelled) setInsights(payload.insights as LearnInsights);
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error ? loadError.message : "Failed to load stats.",
          );
        }
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!insights) {
    return <p className="text-sm text-text-secondary">{error || "Loading…"}</p>;
  }

  const { week, study, memory, ratings } = insights;
  const ratingMax = Math.max(ratings.again, ratings.hard, ratings.good, ratings.easy, 1);

  return (
    <div className="space-y-10">
      <Link
        href="/tools/learn"
        className="text-sm text-text-secondary underline decoration-border underline-offset-4"
      >
        Learn
      </Link>

      {error && <p className="text-sm text-text-secondary">{error}</p>}

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-text-secondary">This week</h2>
        <dl className="border-y border-border">
          <StatRow
            label="Reviews"
            value={`${week.reviewsThisWeek} this week · ${week.reviewsLastWeek} last week`}
          />
          <StatRow label="Again rate" value={percent(week.againRateThisWeek)} />
          <StatRow
            label="Days reviewed"
            value={`${week.daysReviewedThisWeek} of 7`}
          />
          <StatRow
            label="Due"
            value={`${week.dueToday} today · ${week.dueNext7} in 7 days · ${week.dueNext14} in 14 days`}
          />
          <StatRow label="Overdue" value={String(week.overdue)} />
        </dl>
        {week.loadNote && (
          <p className="text-sm text-text-secondary">{week.loadNote}</p>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-text-secondary">What to study</h2>
        {study.leeches.length === 0 &&
        study.weakTopics.length === 0 &&
        study.atRisk.length === 0 ? (
          <p className="border-y border-border py-4 text-sm text-text-secondary">
            Not enough review history yet. Keep rating cards and this list will fill in.
          </p>
        ) : (
          <div className="space-y-8">
            <InsightList
              title="Leeches"
              empty="No leeches. Cards that keep lapsing will show up here."
              items={study.leeches.map((card) => ({
                key: `leech-${card.cardId}`,
                href: topicHref(card.topicId),
                title: card.front,
                meta: `${card.topicTitle ?? "No topic"} · ${card.lapses} lapses · ${percent(card.againRate)} again`,
              }))}
            />
            <InsightList
              title="Weak topics"
              empty="Need at least 5 reviews in a topic before ranking it."
              items={study.weakTopics.map((topic) => ({
                key: `topic-${topic.topicId}`,
                href: topicHref(topic.topicId),
                title: topic.title,
                meta: `${topic.domainTitle ?? "No domain"} · ${topic.reviews} reviews · ${percent(topic.againRate)} fail rate`,
              }))}
            />
            <InsightList
              title="At risk soon"
              empty="Nothing fragile is due in the next 3 days."
              items={study.atRisk.map((card) => ({
                key: `risk-${card.cardId}`,
                href: topicHref(card.topicId),
                title: card.front,
                meta: `${formatDue(card.dueAt)} · ease ${card.ease.toFixed(2)} · R ${percent(card.retrievability)}`,
              }))}
            />
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-text-secondary">Memory</h2>
        <dl className="border-y border-border">
          <StatRow
            label="Young / mature / unseen"
            value={`${memory.young} / ${memory.mature} / ${memory.unseen}`}
          />
          <StatRow
            label="Mean ease"
            value={memory.meanEase == null ? "—" : memory.meanEase.toFixed(2)}
          />
          <StatRow label="Ease under 2.0" value={String(memory.lowEase)} />
          <StatRow
            label="Due-pile retrievability"
            value={percent(memory.meanRetrievability)}
          />
        </dl>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-text-secondary">Ratings (30 days)</h2>
        {ratings.total === 0 ? (
          <p className="border-y border-border py-4 text-sm text-text-secondary">
            No ratings in the last 30 days.
          </p>
        ) : (
          <div className="space-y-2 border-y border-border py-4">
            {(
              [
                ["Again", ratings.again],
                ["Hard", ratings.hard],
                ["Good", ratings.good],
                ["Easy", ratings.easy],
              ] as const
            ).map(([label, count]) => (
              <div key={label} className="flex items-center gap-3 text-sm">
                <span className="w-14 shrink-0 text-text-secondary">{label}</span>
                <div className="h-2 flex-1 bg-muted">
                  <div
                    className="h-2 bg-foreground"
                    style={{ width: `${Math.round((count / ratingMax) * 100)}%` }}
                  />
                </div>
                <span className="w-8 text-right tabular-nums">{count}</span>
              </div>
            ))}
            {ratings.easyThenAgain > 0 && (
              <p className="pt-2 text-sm text-text-secondary">
                Easy then Again {ratings.easyThenAgain} time
                {ratings.easyThenAgain === 1 ? "" : "s"} within a week. You may be
                marking Easy too soon.
              </p>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-border py-3 last:border-b-0">
      <dt className="text-sm text-text-secondary">{label}</dt>
      <dd className="text-right text-sm font-semibold">{value}</dd>
    </div>
  );
}

function InsightList({
  title,
  empty,
  items,
}: {
  title: string;
  empty: string;
  items: { key: string; href: string | null; title: string; meta: string }[];
}) {
  return (
    <div>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-secondary">
        {title}
      </h3>
      {items.length === 0 ? (
        <p className="text-sm text-text-secondary">{empty}</p>
      ) : (
        <div className="border-t border-border">
          {items.map((item) => {
            const body = (
              <>
                <p className="font-semibold">{item.title}</p>
                <p className="mt-1 text-xs text-text-secondary">{item.meta}</p>
              </>
            );
            const className =
              "block border-b border-border py-3 text-sm transition-colors hover:text-text-secondary";
            return item.href ? (
              <Link key={item.key} href={item.href} className={className}>
                {body}
              </Link>
            ) : (
              <div key={item.key} className={className}>
                {body}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
