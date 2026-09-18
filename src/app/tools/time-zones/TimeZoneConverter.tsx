"use client";

import { useEffect, useMemo, useState } from "react";

const zones = [
  { id: "utah", name: "Utah", city: "Salt Lake City", zone: "America/Denver", accent: "bg-[#e8f0eb]" },
  { id: "croatia", name: "Croatia", city: "Zagreb", zone: "Europe/Zagreb", accent: "bg-[#f4e9df]" },
  { id: "sf", name: "San Francisco", city: "San Francisco", zone: "America/Los_Angeles", accent: "bg-[#e8eaf2]" },
] as const;

function parts(date: Date, timeZone: string) {
  return new Intl.DateTimeFormat("en-US", { timeZone, weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit", hour12: true, timeZoneName: "short" }).formatToParts(date).reduce<Record<string, string>>((acc, part) => { acc[part.type] = part.value; return acc; }, {});
}

function offset(date: Date, timeZone: string) {
  const p = new Intl.DateTimeFormat("en-US", { timeZone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" }).formatToParts(date).reduce<Record<string, number>>((acc, part) => { if (part.type !== "literal") acc[part.type] = Number(part.value); return acc; }, {});
  return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - date.getTime();
}

function localToInstant(value: string, timeZone: string) {
  const [date, time] = value.split("T");
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  let instant = new Date(Date.UTC(year, month - 1, day, hour, minute));
  instant = new Date(instant.getTime() - offset(instant, timeZone));
  return instant;
}

function inputValue(date: Date, timeZone: string) {
  const p = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(date).reduce<Record<string, string>>((acc, part) => { acc[part.type] = part.value; return acc; }, {});
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
}

export default function TimeZoneConverter() {
  const [now, setNow] = useState(() => new Date());
  const [anchor, setAnchor] = useState("utah");
  const [value, setValue] = useState(() => inputValue(new Date(), "America/Denver"));
  const [hour12, setHour12] = useState(true);

  useEffect(() => { const timer = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(timer); }, []);
  const instant = useMemo(() => localToInstant(value, zones.find((z) => z.id === anchor)!.zone), [value, anchor]);
  const display = (date: Date, zone: string) => {
    const p = parts(date, zone);
    return { time: new Intl.DateTimeFormat("en-US", { timeZone: zone, hour: "numeric", minute: "2-digit", hour12: hour12 }).format(date), date: `${p.weekday}, ${p.month} ${p.day}`, zone: p.timeZoneName };
  };

  return <div className="mx-auto max-w-4xl py-2">
    <div className="mb-10 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div><h1 className="text-4xl tracking-tight md:text-5xl">Time zones</h1></div>
      <div className="flex self-start rounded-full border border-border bg-muted p-1 font-sans text-xs"><button onClick={() => setHour12(true)} className={`rounded-full px-3 py-1.5 ${hour12 ? "bg-foreground text-background" : "text-text-secondary"}`}>AM / PM</button><button onClick={() => setHour12(false)} className={`rounded-full px-3 py-1.5 ${!hour12 ? "bg-foreground text-background" : "text-text-secondary"}`}>24 hour</button></div>
    </div>

    <section className="mb-8 rounded-2xl border border-border bg-[#fafafa] p-4 sm:p-6"><div className="mb-4 flex flex-wrap items-center justify-between gap-3"><h2 className="font-sans text-sm font-semibold">Compare a time</h2><button onClick={() => { setAnchor("utah"); setValue(inputValue(new Date(), "America/Denver")); }} className="font-sans text-xs text-text-secondary underline underline-offset-4 hover:text-foreground">Use current time</button></div><div className="flex flex-col gap-3 sm:flex-row sm:items-center"><select value={anchor} onChange={(e) => { const next = e.target.value; setValue(inputValue(instant, zones.find((z) => z.id === next)!.zone)); setAnchor(next); }} className="rounded-lg border border-border bg-white px-3 py-2.5 font-sans text-sm"><option value="utah">Utah time</option><option value="croatia">Croatia time</option><option value="sf">San Francisco time</option></select><input aria-label="Time to compare" type="datetime-local" value={value} onChange={(e) => setValue(e.target.value)} className="min-w-0 flex-1 rounded-lg border border-border bg-white px-3 py-2.5 font-sans text-sm" /></div></section>

    <div className="grid gap-4 md:grid-cols-3">{zones.map((zone) => { const d = display(instant, zone.zone); const live = display(now, zone.zone); return <article key={zone.id} className="overflow-hidden rounded-2xl border border-border bg-white"><div className={`h-2 ${zone.accent}`} /><div className="p-5"><div className="flex items-start justify-between"><div><h2 className="text-2xl tracking-tight">{zone.name}</h2><p className="font-sans text-xs text-text-secondary">{zone.city} · {d.zone}</p></div><span className="signal-dot mt-1 h-2 w-2 rounded-full bg-[#6f9a7d]" title="Live" /></div><div className="mt-10"><p className="font-sans text-4xl tracking-tight">{d.time}</p><p className="mt-1 font-sans text-sm text-text-secondary">{d.date}</p></div><div className="mt-7 border-t border-border pt-3"><p className="font-sans text-[11px] uppercase tracking-wider text-text-secondary">Right now</p><p className="mt-1 font-sans text-sm">{live.time} <span className="text-text-secondary">· {live.date}</span></p></div></div></article>; })}</div>
  </div>;
}
