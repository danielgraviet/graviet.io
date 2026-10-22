"use client";

import { useCallback, useEffect, useState } from "react";
import { LoaderCircle, RefreshCw } from "lucide-react";

type TranscriptMessage = { role: "bot" | "user"; text: string };
type GTLead = {
  id: string;
  submitted_at: string;
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  business_name: string;
  business_type: string;
  goal: string;
  transcript: TranscriptMessage[];
};

export default function GTIntakeInbox() {
  const [leads, setLeads] = useState<GTLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/gt-intake", { cache: "no-store" });
      if (!response.ok) throw new Error("Could not load GT inquiries.");
      const payload = (await response.json()) as { leads: GTLead[] };
      setLeads(payload.leads);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Could not load GT inquiries.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  return (
    <section className="mx-auto max-w-3xl space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="font-sans text-xs font-semibold uppercase tracking-[0.16em] text-text-secondary">
            Graviet Technologies
          </p>
          <h1 className="mt-2 text-3xl tracking-tight">GT inquiries</h1>
          <p className="mt-2 text-sm text-text-secondary">
            Requests submitted through the GT intake chat. Stored separately
            from Gunter Injury Law.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="mt-1 inline-flex shrink-0 items-center gap-2 border border-border px-3 py-2 text-sm transition-colors hover:border-foreground disabled:opacity-50"
        >
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </header>

      {error && (
        <p
          className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          role="alert"
        >
          {error}
        </p>
      )}
      {loading && (
        <p className="flex items-center gap-2 py-8 text-sm text-text-secondary">
          <LoaderCircle size={16} className="animate-spin" /> Loading inquiries…
        </p>
      )}
      {!loading && !error && leads.length === 0 && (
        <div className="border-y border-border py-10 text-center">
          <h2 className="text-lg font-semibold">No GT inquiries yet</h2>
          <p className="mt-2 text-sm text-text-secondary">
            New requests will appear here after someone submits the GT intake
            chat.
          </p>
        </div>
      )}
      {!loading && leads.length > 0 && (
        <div className="divide-y divide-border border-y border-border">
          {leads.map((lead) => (
            <article key={lead.id} className="py-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold">
                    {lead.first_name} {lead.last_name}
                  </h2>
                  <a
                    className="text-sm text-text-secondary underline underline-offset-2 hover:text-foreground"
                    href={`mailto:${lead.email}`}
                  >
                    {lead.email}
                  </a>
                  <div>
                    <a
                      className="text-sm text-text-secondary underline underline-offset-2 hover:text-foreground"
                      href={`tel:${lead.phone}`}
                    >
                      {lead.phone}
                    </a>
                  </div>
                </div>
                <time
                  className="text-xs text-text-secondary"
                  dateTime={lead.submitted_at}
                >
                  {new Date(lead.submitted_at).toLocaleString()}
                </time>
              </div>
              <dl className="mt-4 grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-xs text-text-secondary">Type</dt>
                  <dd className="mt-0.5">{lead.business_type}</dd>
                </div>
                <div>
                  <dt className="text-xs text-text-secondary">Goal</dt>
                  <dd className="mt-0.5">{lead.goal}</dd>
                </div>
              </dl>
              <details className="mt-4 border-t border-border pt-3">
                <summary className="cursor-pointer text-sm font-medium">
                  View conversation
                </summary>
                <ol className="mt-3 space-y-2 text-sm">
                  {lead.transcript.map((message, index) => (
                    <li
                      key={`${lead.id}-${index}`}
                      className="grid grid-cols-[4rem_1fr] gap-3"
                    >
                      <span className="text-xs font-semibold uppercase text-text-secondary">
                        {message.role === "bot" ? "GT" : "Visitor"}
                      </span>
                      <span className="whitespace-pre-wrap">
                        {message.text}
                      </span>
                    </li>
                  ))}
                </ol>
              </details>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
