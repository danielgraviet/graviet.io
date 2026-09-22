"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, Clipboard, Share2, Users, X } from "lucide-react";
import type { MeetingPoll, MeetingSlot } from "@/lib/meetings";

function slotKey(slot: MeetingSlot) {
  return "date" in slot ? `${slot.date}-${slot.period}` : slot.startsAt;
}

function dateLabel(slot: MeetingSlot) {
  if ("date" in slot) {
    const date = new Intl.DateTimeFormat(undefined, { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" }).format(new Date(`${slot.date}T12:00:00Z`));
    const period = { morning: "Morning · 8 am–12 pm", afternoon: "Afternoon · 12–5 pm", evening: "Evening · 5–10 pm" }[slot.period];
    return `${date} · ${period}`;
  }
  return new Intl.DateTimeFormat(undefined, { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(slot.startsAt));
}

function dateOnlyLabel(value: string) {
  return new Intl.DateTimeFormat(undefined, { weekday: "long", month: "short", day: "numeric", timeZone: "UTC" }).format(new Date(`${value}T12:00:00Z`));
}

function participantIdFor(pollId: string) {
  const key = `meet-participant-${pollId}`;
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID().replaceAll("-", "");
    localStorage.setItem(key, id);
  }
  return id;
}

export default function MeetingPollPage({ id }: { id: string }) {
  const [poll, setPoll] = useState<MeetingPoll | null>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [answers, setAnswers] = useState<(boolean | null)[]>([]);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [organizer, setOrganizer] = useState(false);

  const load = useCallback(async () => {
    try {
      const response = await fetch(`/api/meetings/${id}`, { cache: "no-store" });
      if (!response.ok) throw new Error("This poll could not be found.");
      const data = await response.json() as MeetingPoll;
      setPoll(data);
      const participantId = participantIdFor(id);
      const existing = data.responses.find((r) => r.participantId === participantId);
      if (existing) {
        setName(existing.name);
        setAnswers(existing.availability);
        setSaved(true);
      } else {
        setAnswers(data.slots.map(() => null));
      }
      setOrganizer(Boolean(localStorage.getItem(`meet-organizer-${id}`)));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not load this poll.");
    } finally { setLoading(false); }
  }, [id]);

  useEffect(() => { void load(); }, [load]);

  const counts = useMemo(() => poll?.slots.map((_, index) => poll.responses.filter((r) => r.availability[index]).length) ?? [], [poll]);
  const broadGroups = useMemo(() => {
    if (!poll || !poll.slots.every((slot) => "date" in slot)) return [];
    const groups = new Map<string, number[]>();
    poll.slots.forEach((slot, index) => {
      if (!("date" in slot)) return;
      groups.set(slot.date, [...(groups.get(slot.date) ?? []), index]);
    });
    return [...groups.entries()].map(([date, indices]) => ({ date, indices }));
  }, [poll]);
  const isBroadPoll = broadGroups.length > 0;
  const maxCount = Math.max(0, ...counts);
  const bestCount = counts.length && poll?.responses.length ? counts.filter((count) => count === maxCount).length : 0;
  async function share() {
    if (navigator.share) {
      try { await navigator.share({ title: poll?.title ?? "Meeting poll", text: "Pick the times you can make it:", url: window.location.href }); } catch { /* Share sheet dismissed. */ }
    } else await copyLink();
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch { setError("Could not copy the link. You can copy it from your browser's address bar."); }
  }

  async function submit() {
    if (!poll) return;
    setError("");
    if (!name.trim()) return setError("Add your name so the group knows who can make it.");
    if (isBroadPoll && !answers.some((answer) => answer === true)) return setError("Choose at least one time window you can make.");
    if (!isBroadPoll && answers.some((answer) => answer === null)) return setError("Choose yes or no for each time.");
    const response = await fetch(`/api/meetings/${id}`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), participantId: participantIdFor(id), availability: answers.map((answer) => answer === true) }),
    });
    const data = await response.json();
    if (!response.ok) return setError(data.error ?? "Could not save your response.");
    setSaved(true);
    await load();
  }

  async function closePoll() {
    const organizerKey = localStorage.getItem(`meet-organizer-${id}`);
    if (!organizerKey) return;
    const response = await fetch(`/api/meetings/${id}/close`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ organizerKey }) });
    const data = await response.json();
    if (!response.ok) return setError(data.error ?? "Could not close the poll.");
    await load();
  }

  if (loading) return <div className="mx-auto max-w-2xl py-20 text-center text-text-secondary">Loading poll…</div>;
  if (!poll) return <div className="mx-auto max-w-2xl py-20 text-center"><h1 className="text-3xl">Poll unavailable</h1><p className="mt-3 text-text-secondary">{error || "This poll could not be found."}</p></div>;

  return (
    <main className="mx-auto max-w-2xl py-8 sm:py-14">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm font-semibold text-text-secondary">Group poll</div>
        <div className="flex gap-2">
          <button onClick={copyLink} className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm font-semibold hover:bg-muted"><Clipboard size={15} />{copied ? "Copied" : "Copy link"}</button>
          <button onClick={share} className="inline-flex items-center gap-2 rounded-xl bg-foreground px-3 py-2 text-sm font-semibold text-white hover:opacity-80"><Share2 size={15} />Share</button>
        </div>
      </div>
      <div className="mb-7">
        <div className="mb-3 inline-flex items-center gap-1.5 text-sm text-text-secondary"><Users size={15} /> {poll.responses.length} {poll.responses.length === 1 ? "response" : "responses"}{poll.closed && <span className="ml-1 rounded-full bg-muted px-2 py-0.5">Closed</span>}</div>
        <h1 className="text-4xl tracking-tight sm:text-5xl">{poll.title}</h1>
        <p className="mt-3 text-text-secondary">Dates and time windows use the organizer&apos;s time zone ({poll.timeZone}). Let the group know which ones work for you.</p>
      </div>

      {poll.responses.length > 0 && <section aria-label="Availability results" className="mb-8 rounded-2xl border border-border bg-muted/60 p-5 sm:p-6">
        <div className="mb-4"><h2 className="text-xl">Best times so far</h2><p className="mt-1 text-sm text-text-secondary">{maxCount === poll.responses.length ? "Everyone can make it." : `${maxCount} of ${poll.responses.length} people can make it.`}</p></div>
        <div className="space-y-2">
          {poll.slots.map((slot, i) => <div key={slotKey(slot)} className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-3 ${counts[i] === maxCount ? "border-neutral-500 bg-white" : "border-border bg-white/60"}`}><span className="text-sm font-semibold">{dateLabel(slot)}</span><span className="shrink-0 text-sm text-text-secondary">{counts[i]}/{poll.responses.length}{counts[i] === maxCount && <span className="ml-2 rounded-full bg-foreground px-2 py-0.5 text-xs text-white">Best</span>}</span></div>)}
        </div>
        {bestCount > 1 && <p className="mt-3 text-xs text-text-secondary">{bestCount} times are tied for the most availability.</p>}
      </section>}

      {!poll.closed ? <section className="rounded-2xl border border-border bg-white p-5 shadow-sm sm:p-7">
        <div className="mb-5"><h2 className="text-xl">Can you make it?</h2><p className="mt-1 text-sm text-text-secondary">{isBroadPoll ? "Tap every time window that works for you." : "Choose yes or no for each option."}</p></div>
        <label htmlFor="your-name" className="mb-2 block text-sm font-semibold">Your name</label>
        <input id="your-name" autoComplete="name" maxLength={60} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Alex" className="mb-5 w-full rounded-xl border border-border px-4 py-3 outline-none focus:border-neutral-500" />
        {isBroadPoll ? <div className="space-y-2">
          {broadGroups.map(({ date, indices }) => <div key={date} className="rounded-xl border border-border p-3"><h3 className="mb-2 text-sm font-semibold">{dateOnlyLabel(date)}</h3><div className="grid grid-cols-3 gap-2">
            {indices.map((index) => {
              const slot = poll.slots[index];
              if (!("date" in slot)) return null;
              const label = slot.period[0].toUpperCase() + slot.period.slice(1);
              return <button key={slotKey(slot)} type="button" aria-pressed={answers[index] === true} onClick={() => setAnswers(answers.map((value, i) => i === index ? (value === true ? null : true) : value))} className={`rounded-lg border px-2 py-2.5 text-xs font-semibold transition sm:text-sm ${answers[index] === true ? "border-emerald-700 bg-emerald-50 text-emerald-800" : "border-border text-text-secondary hover:bg-muted"}`}>{label}</button>;
            })}
          </div></div>)}
        </div> : <div className="space-y-2">
          {poll.slots.map((slot, i) => <div key={slotKey(slot)} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-3"><span className="text-sm font-semibold">{dateLabel(slot)}</span><div className="flex gap-2">
            <button type="button" aria-pressed={answers[i] === true} onClick={() => setAnswers(answers.map((v, j) => j === i ? true : v))} className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-semibold ${answers[i] === true ? "border-emerald-700 bg-emerald-50 text-emerald-800" : "border-border text-text-secondary hover:bg-muted"}`}><Check size={15} />Yes</button>
            <button type="button" aria-pressed={answers[i] === false} onClick={() => setAnswers(answers.map((v, j) => j === i ? false : v))} className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-semibold ${answers[i] === false ? "border-neutral-600 bg-neutral-100 text-neutral-800" : "border-border text-text-secondary hover:bg-muted"}`}><X size={15} />No</button>
          </div></div>)}
        </div>}
        {error && <p role="alert" className="mt-4 text-sm text-red-700">{error}</p>}
        <button onClick={submit} className="mt-5 w-full rounded-xl bg-foreground px-5 py-3.5 font-semibold text-white transition hover:opacity-80">{saved ? "Update my response" : "Send my response"}</button>
      </section> : <div className="rounded-2xl border border-border p-6 text-center text-text-secondary">This poll is closed. Thanks for helping make a plan!</div>}

      {poll.responses.length > 0 && <section className="mt-7"><h2 className="mb-3 text-lg">Responses</h2><div className="overflow-x-auto rounded-2xl border border-border"><table className="w-full min-w-[420px] border-collapse text-left text-sm"><thead><tr className="bg-muted"><th className="sticky left-0 bg-muted px-3 py-3">Name</th>{poll.slots.map((slot) => <th key={slotKey(slot)} className="px-3 py-3 text-center">{dateLabel(slot)}</th>)}</tr></thead><tbody>{poll.responses.map((response) => <tr key={response.participantId} className="border-t border-border"><th className="sticky left-0 bg-white px-3 py-3 font-semibold">{response.name}</th>{response.availability.map((yes, i) => <td key={i} className="px-3 py-3 text-center"><span className={yes ? "font-semibold text-emerald-700" : "text-text-secondary"}>{yes ? "Yes" : "No"}</span></td>)}</tr>)}</tbody></table></div></section>}

      {organizer && !poll.closed && <button onClick={closePoll} className="mt-8 text-sm text-text-secondary underline decoration-border underline-offset-4 hover:text-foreground">Close this poll</button>}
      <p className="mt-8 text-center text-xs text-text-secondary">No account needed. Your response can be updated from this browser.</p>
    </main>
  );
}
