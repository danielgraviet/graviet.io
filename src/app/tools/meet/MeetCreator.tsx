"use client";

import { useMemo, useState } from "react";
import { CalendarDays, Check, Clock3, Sun, Sunset } from "lucide-react";
import type { MeetingDaypart } from "@/lib/meetings";

type DayFilter = "any" | "weekdays" | "weekends";
const PERIODS: { id: MeetingDaypart; title: string; hours: string; icon: typeof Sun }[] = [
  { id: "morning", title: "Morning", hours: "8 am–12 pm", icon: Sun },
  { id: "afternoon", title: "Afternoon", hours: "12–5 pm", icon: Sun },
  { id: "evening", title: "Evening", hours: "5–10 pm", icon: Sunset },
];

function localDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function dateFromKey(key: string) {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day, 12);
}

function formatDate(key: string, options: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat(undefined, options).format(dateFromKey(key));
}

function nextDays(count: number) {
  const today = new Date();
  return Array.from({ length: count }, (_, index) => {
    const day = new Date(today.getFullYear(), today.getMonth(), today.getDate() + index + 1, 12);
    return { key: localDateKey(day), weekday: day.getDay() >= 1 && day.getDay() <= 5 };
  });
}

export default function MeetCreator() {
  const days = useMemo(() => nextDays(21), []);
  const initialDates = days.slice(0, 7).map((day) => day.key);
  const [title, setTitle] = useState("");
  const [dayFilter, setDayFilter] = useState<DayFilter>("any");
  const [selectedDates, setSelectedDates] = useState<string[]>(initialDates);
  const [selectedPeriods, setSelectedPeriods] = useState<MeetingDaypart[]>(["morning", "afternoon", "evening"]);
  const [step, setStep] = useState<1 | 2>(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const visibleDays = days.filter((day) => dayFilter === "any" || (dayFilter === "weekdays" ? day.weekday : !day.weekday));
  const activeDates = visibleDays.filter((day) => selectedDates.includes(day.key)).map((day) => day.key);
  const optionCount = activeDates.length * selectedPeriods.length;

  function chooseDayFilter(filter: DayFilter) {
    setDayFilter(filter);
    const matching = days.filter((day) => filter === "any" || (filter === "weekdays" ? day.weekday : !day.weekday));
    const kept = selectedDates.filter((date) => matching.some((day) => day.key === date));
    setSelectedDates(kept.length ? kept : matching.slice(0, Math.min(4, matching.length)).map((day) => day.key));
  }

  function toggleDate(date: string) {
    setSelectedDates((current) => current.includes(date) ? current.filter((value) => value !== date) : [...current, date]);
  }

  function togglePeriod(period: MeetingDaypart) {
    setSelectedPeriods((current) => current.includes(period) ? current.filter((value) => value !== period) : [...current, period]);
  }

  function continueToPeriods() {
    setError("");
    if (!title.trim()) return setError("Give your get-together a name.");
    if (activeDates.length === 0) return setError("Choose at least one date.");
    setStep(2);
  }

  async function create() {
    setError("");
    if (!title.trim()) return setError("Give your get-together a name.");
    if (activeDates.length === 0) return setError("Choose at least one date.");
    if (selectedPeriods.length === 0) return setError("Choose at least one part of the day.");
    if (optionCount < 2) return setError("Choose at least two date and time options.");
    if (optionCount > 84) return setError("Choose fewer dates or parts of the day. Polls can have up to 84 options.");

    setBusy(true);
    try {
      const periods = PERIODS.map(({ id }) => id).filter((period) => selectedPeriods.includes(period));
      const response = await fetch("/api/meetings", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(), timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          slots: activeDates.flatMap((date) => periods.map((period) => ({ date, period }))),
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Could not create this poll.");
      localStorage.setItem(`meet-organizer-${result.id}`, result.organizerKey);
      window.location.href = `/meet/${result.id}`;
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not create this poll.");
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-2xl py-8 sm:py-14">
      <div className="mb-9">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 text-sm text-text-secondary"><CalendarDays size={15} /> A simpler way to make plans</div>
        <h1 className="text-4xl tracking-tight sm:text-5xl">Find a time<br />for everyone.</h1>
        <p className="mt-4 max-w-lg text-lg leading-relaxed text-text-secondary">Start broad, narrow it down, then share the options with your group.</p>
      </div>

      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-text-secondary"><span className={`grid h-7 w-7 place-items-center rounded-full ${step === 1 ? "bg-foreground text-white" : "bg-muted"}`}>{step === 1 ? "1" : <Check size={14} />}</span><span>Pick days</span><span className="mx-1 h-px w-8 bg-border" /><span className={`grid h-7 w-7 place-items-center rounded-full ${step === 2 ? "bg-foreground text-white" : "bg-muted"}`}>2</span><span className={step === 2 ? "text-foreground" : ""}>Pick a time of day</span></div>

      {step === 1 ? <section className="space-y-7 rounded-2xl border border-border bg-white p-5 shadow-sm sm:p-7">
        <div>
          <label className="mb-2 block text-sm font-semibold" htmlFor="meeting-title">What are you planning?</label>
          <input id="meeting-title" maxLength={100} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Dinner, game night, catch-up…" className="w-full rounded-xl border border-border bg-background px-4 py-3 text-base outline-none focus:border-neutral-500" />
        </div>

        <div>
          <div className="mb-3"><h2 className="text-lg">What kind of days work?</h2><p className="text-sm text-text-secondary">Start broad, then pick the exact dates.</p></div>
          <div className="grid grid-cols-3 gap-2">
            {([ ["any", "Any day"], ["weekdays", "Weekdays"], ["weekends", "Weekends"] ] as const).map(([filter, label]) => <button key={filter} type="button" aria-pressed={dayFilter === filter} onClick={() => chooseDayFilter(filter)} className={`rounded-xl border px-2 py-3 text-sm font-semibold transition ${dayFilter === filter ? "border-foreground bg-muted text-foreground" : "border-border text-text-secondary hover:bg-muted"}`}>{label}</button>)}
          </div>
        </div>

        <div>
          <div className="mb-3 flex items-baseline justify-between gap-3"><div><h2 className="text-lg">Choose specific days</h2><p className="text-sm text-text-secondary">The next three weeks, in your local time.</p></div><span className="text-sm text-text-secondary">{activeDates.length} selected</span></div>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {visibleDays.map(({ key }) => {
              const selected = activeDates.includes(key);
              return <button key={key} type="button" aria-pressed={selected} onClick={() => toggleDate(key)} className={`rounded-xl border px-2 py-2.5 text-left transition ${selected ? "border-foreground bg-muted" : "border-border hover:bg-muted/60"}`}>
                <span className="block text-xs text-text-secondary">{formatDate(key, { weekday: "short" })}</span><span className="mt-0.5 block text-sm font-semibold">{formatDate(key, { month: "short", day: "numeric" })}</span>
              </button>;
            })}
          </div>
        </div>
        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
        <button type="button" onClick={continueToPeriods} className="w-full rounded-xl bg-foreground px-5 py-3.5 font-semibold text-white transition hover:opacity-80">Choose time of day <span aria-hidden>→</span></button>
      </section> : <section className="space-y-6 rounded-2xl border border-border bg-white p-5 shadow-sm sm:p-7">
        <div><h2 className="text-xl">What part of the day?</h2><p className="mt-1 text-sm text-text-secondary">Pick one or more broad windows.</p></div>
        <div className="rounded-xl bg-muted/60 px-4 py-3"><p className="text-sm font-semibold">{title}</p><p className="mt-1 text-sm text-text-secondary">{activeDates.map((date) => formatDate(date, { weekday: "short", month: "short", day: "numeric" })).join(" · ")}</p></div>
        <div className="grid gap-2 sm:grid-cols-3">
          {PERIODS.map(({ id: period, title: label, hours, icon: Icon }) => {
            const selected = selectedPeriods.includes(period);
            return <button key={period} type="button" aria-pressed={selected} onClick={() => togglePeriod(period)} className={`flex items-center gap-3 rounded-xl border px-3 py-3 text-left transition ${selected ? "border-foreground bg-muted" : "border-border hover:bg-muted/60"}`}>
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white"><Icon size={18} /></span><span className="min-w-0 flex-1"><span className="block text-sm font-semibold">{label}</span><span className="block text-xs text-text-secondary">{hours}</span></span>{selected && <Check size={16} />}
            </button>;
          })}
        </div>
        <div className="border-t border-border pt-5">
          <div className="mb-3 flex items-center justify-between"><div><h2 className="text-lg">Poll options</h2><p className="text-sm text-text-secondary">{optionCount} {optionCount === 1 ? "date and time window" : "date and time windows"} · times use your local zone</p></div><Clock3 size={19} className="text-text-secondary" /></div>
          <div className="max-h-52 space-y-1.5 overflow-y-auto rounded-xl bg-muted/60 p-2">
            {activeDates.flatMap((date) => PERIODS.filter(({ id: period }) => selectedPeriods.includes(period)).map(({ id: period, title: label }) => <div key={`${date}-${period}`} className="flex items-center justify-between rounded-lg bg-white px-3 py-2 text-sm"><span className="font-medium">{formatDate(date, { weekday: "short", month: "short", day: "numeric" })}</span><span className="text-text-secondary">{label}</span></div>))}
            {optionCount === 0 && <p className="p-3 text-center text-sm text-text-secondary">Choose a part of the day to see poll options.</p>}
          </div>
          {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
          <div className="mt-4 flex gap-2"><button type="button" onClick={() => { setError(""); setStep(1); }} className="rounded-xl border border-border px-4 py-3.5 font-semibold hover:bg-muted">Back</button><button type="button" onClick={create} disabled={busy || optionCount < 2} className="flex-1 rounded-xl bg-foreground px-5 py-3.5 font-semibold text-white transition hover:opacity-80 disabled:opacity-50">{busy ? "Creating…" : "Create poll"}</button></div>
        </div>
      </section>}
      <p className="mt-4 text-center text-sm text-text-secondary">Friends need no account. Share the poll link in Messages or anywhere else.</p>
    </main>
  );
}
