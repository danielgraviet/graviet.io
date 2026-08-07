"use client";

import { FormEvent, KeyboardEvent, useMemo, useState } from "react";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Flame,
  Lock,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";

const PAGE_SIZE = 7;

type WorkLogEntry = {
  id: number;
  occurredOn: string;
  title: string;
  body: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
};

type WorkLogStreak = {
  current: number;
  longest: number;
  loggedToday: boolean;
  lastLoggedOn: string | null;
};

function localToday(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatEntryForCopy(entry: WorkLogEntry): string {
  const lines = [
    entry.title.trim() || "Untitled",
    entry.occurredOn,
  ];

  if (entry.tags.length > 0) {
    lines.push(entry.tags.map((tag) => `#${tag}`).join(" "));
  }

  lines.push("", entry.body.trim());
  return lines.join("\n");
}

function normalizeTagInput(value: string): string {
  return value.trim().toLowerCase();
}

export default function WorkLogTool() {
  const [password, setPassword] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [entries, setEntries] = useState<WorkLogEntry[] | null>(null);
  const [streak, setStreak] = useState<WorkLogStreak | null>(null);
  const [knownTags, setKnownTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [activeTag, setActiveTag] = useState("");
  const [draftQuery, setDraftQuery] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const [occurredOn, setOccurredOn] = useState(localToday);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagDraft, setTagDraft] = useState("");
  const [suggesting, setSuggesting] = useState(false);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const tagSuggestions = useMemo(() => {
    const draft = normalizeTagInput(tagDraft);
    if (!draft) return [];
    return knownTags
      .filter((tag) => tag.includes(draft) && !tags.includes(tag))
      .slice(0, 6);
  }, [knownTags, tagDraft, tags]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  async function loadEntries(
    pwd: string,
    options?: { q?: string; tag?: string; page?: number },
  ) {
    setLoading(true);
    setAuthError(null);
    setError(null);

    const q = options?.q ?? searchQuery;
    const tag = options?.tag ?? activeTag;
    const nextPage = options?.page ?? page;
    const params = new URLSearchParams({
      password: pwd,
      today: localToday(),
      page: String(nextPage),
    });
    if (q.trim()) params.set("q", q.trim());
    if (tag.trim()) params.set("tag", tag.trim());

    try {
      const response = await fetch(`/api/tools/work-log?${params.toString()}`);
      const payload = await response.json();

      if (!response.ok) {
        setAuthError(payload.error || "Failed to load the work log.");
        setUnlocked(false);
        return;
      }

      setEntries(payload.entries as WorkLogEntry[]);
      setTotal(typeof payload.total === "number" ? payload.total : 0);
      setPage(typeof payload.page === "number" ? payload.page : nextPage);
      setStreak(payload.streak as WorkLogStreak);
      setKnownTags(payload.knownTags as string[]);
      setUnlocked(true);
    } catch {
      setAuthError("Failed to reach the server.");
      setUnlocked(false);
    } finally {
      setLoading(false);
    }
  }

  function handleUnlock(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(1);
    loadEntries(password, { page: 1 });
  }

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSearchQuery(draftQuery);
    setPage(1);
    loadEntries(password, { q: draftQuery, tag: activeTag, page: 1 });
  }

  function toggleTagFilter(tag: string) {
    const next = activeTag === tag ? "" : tag;
    setActiveTag(next);
    setPage(1);
    loadEntries(password, { q: searchQuery, tag: next, page: 1 });
  }

  function goToPage(nextPage: number) {
    const clamped = Math.min(Math.max(1, nextPage), totalPages);
    setPage(clamped);
    loadEntries(password, { page: clamped });
  }

  function addTag(raw: string) {
    const value = normalizeTagInput(raw);
    if (!value || tags.includes(value)) {
      setTagDraft("");
      return;
    }
    setTags((prev) => [...prev, value]);
    setTagDraft("");
  }

  function removeTag(tag: string) {
    setTags((prev) => prev.filter((item) => item !== tag));
  }

  function handleTagKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      addTag(tagDraft);
    } else if (event.key === "Backspace" && !tagDraft && tags.length > 0) {
      setTags((prev) => prev.slice(0, -1));
    }
  }

  function resetComposer() {
    setEditingId(null);
    setOccurredOn(localToday());
    setTitle("");
    setBody("");
    setTags([]);
    setTagDraft("");
  }

  function startEdit(entry: WorkLogEntry) {
    setEditingId(entry.id);
    setOccurredOn(entry.occurredOn);
    setTitle(entry.title);
    setBody(entry.body);
    setTags(entry.tags);
    setTagDraft("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSuggestTags() {
    const text = [title, body].filter(Boolean).join("\n");
    if (!text.trim()) return;

    setSuggesting(true);
    setError(null);

    try {
      const response = await fetch("/api/tools/work-log/suggest-tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, text }),
      });
      const payload = await response.json();

      if (!response.ok) {
        setError(payload.error || "Failed to suggest tags.");
        return;
      }

      const suggested = payload.tags as string[];
      setTags((prev) => {
        const next = [...prev];
        for (const tag of suggested) {
          if (!next.includes(tag)) next.push(tag);
        }
        return next;
      });
      if (Array.isArray(payload.knownTags)) {
        setKnownTags(payload.knownTags as string[]);
      }
    } catch {
      setError("Failed to suggest tags.");
    } finally {
      setSuggesting(false);
    }
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!body.trim()) return;

    setSaving(true);
    setError(null);

    try {
      const payload = {
        password,
        title: title.trim(),
        body: body.trim(),
        tags,
        occurredOn,
        today: localToday(),
      };

      const response = await fetch(
        editingId
          ? `/api/tools/work-log/${editingId}`
          : "/api/tools/work-log",
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to save entry.");
        return;
      }

      if (data.streak) setStreak(data.streak as WorkLogStreak);
      if (Array.isArray(data.knownTags)) {
        setKnownTags(data.knownTags as string[]);
      }

      resetComposer();
      setPage(1);
      await loadEntries(password, { q: searchQuery, tag: activeTag, page: 1 });
    } catch {
      setError("Failed to save entry.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(entry: WorkLogEntry) {
    if (!confirm(`Delete entry from ${entry.occurredOn}?`)) return;

    setError(null);

    try {
      const params = new URLSearchParams({
        password,
        today: localToday(),
      });
      const response = await fetch(
        `/api/tools/work-log/${entry.id}?${params.toString()}`,
        { method: "DELETE" },
      );
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to delete entry.");
        return;
      }

      if (data.streak) setStreak(data.streak as WorkLogStreak);
      if (Array.isArray(data.knownTags)) {
        setKnownTags(data.knownTags as string[]);
      }
      if (editingId === entry.id) resetComposer();

      const remainingOnPage = (entries?.length ?? 1) - 1;
      const nextPage =
        remainingOnPage <= 0 && page > 1 ? page - 1 : page;
      await loadEntries(password, {
        q: searchQuery,
        tag: activeTag,
        page: nextPage,
      });
    } catch {
      setError("Failed to delete entry.");
    }
  }

  async function handleCopy(entry: WorkLogEntry) {
    try {
      await navigator.clipboard.writeText(formatEntryForCopy(entry));
      setCopiedId(entry.id);
      window.setTimeout(() => {
        setCopiedId((current) => (current === entry.id ? null : current));
      }, 1500);
    } catch {
      setError("Failed to copy entry.");
    }
  }

  if (!unlocked) {
    return (
      <form onSubmit={handleUnlock} className="border-y border-border py-5">
        <label className="block">
          <span className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-text-secondary">
            <Lock className="h-3.5 w-3.5" />
            Password
          </span>
          <div className="flex gap-3">
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full max-w-xs border border-border bg-background px-3 py-2.5 text-base outline-none transition-colors focus:border-foreground"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading}
              className="inline-flex h-11 items-center justify-center border border-foreground bg-foreground px-4 text-sm font-semibold text-background transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Unlock
            </button>
          </div>
        </label>
        {authError && (
          <p className="mt-3 text-sm text-text-secondary">{authError}</p>
        )}
      </form>
    );
  }

  return (
    <div className="space-y-8">
      {streak && (
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-y border-border py-4 text-sm">
          <span className="inline-flex items-center gap-2 font-semibold">
            <Flame
              className={`h-4 w-4 ${streak.current > 0 ? "text-foreground" : "text-text-secondary"}`}
            />
            {streak.current} day streak
          </span>
          <span className="text-text-secondary">
            Longest: {streak.longest}
          </span>
          <span className="text-text-secondary">
            {streak.loggedToday
              ? "Logged today"
              : "No entry for today yet"}
          </span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-4 border-b border-border pb-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-text-secondary">
            {editingId ? "Edit entry" : "New entry"}
          </h2>
          {editingId && (
            <button
              type="button"
              onClick={resetComposer}
              className="text-sm text-text-secondary underline decoration-border underline-offset-4 hover:text-foreground"
            >
              Cancel edit
            </button>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-[10rem_1fr]">
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-text-secondary">
              Date
            </span>
            <input
              type="date"
              value={occurredOn}
              onChange={(event) => setOccurredOn(event.target.value)}
              className="w-full border border-border bg-background px-3 py-2.5 text-base outline-none transition-colors focus:border-foreground"
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-text-secondary">
              Title
            </span>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Short label (optional)"
              className="w-full border border-border bg-background px-3 py-2.5 text-base outline-none transition-colors focus:border-foreground"
            />
          </label>
        </div>

        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-text-secondary">
            What did you do?
          </span>
          <textarea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            rows={5}
            required
            placeholder="Shipped X, fixed Y, learned Z…"
            className="w-full border border-border bg-background px-3 py-2.5 text-base outline-none transition-colors focus:border-foreground"
          />
        </label>

        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm font-semibold text-text-secondary">
              Tags
            </span>
            <button
              type="button"
              onClick={handleSuggestTags}
              disabled={suggesting || (!title.trim() && !body.trim())}
              className="inline-flex items-center gap-1.5 text-sm text-text-secondary transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Sparkles className="h-3.5 w-3.5" />
              {suggesting ? "Suggesting…" : "Suggest tags"}
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => removeTag(tag)}
                className="inline-flex items-center gap-1 border border-border px-2.5 py-1 text-xs font-semibold transition-colors hover:border-foreground"
              >
                {tag}
                <X className="h-3 w-3" />
              </button>
            ))}
          </div>

          <input
            value={tagDraft}
            onChange={(event) => setTagDraft(event.target.value)}
            onKeyDown={handleTagKeyDown}
            onBlur={() => {
              if (tagDraft.trim()) addTag(tagDraft);
            }}
            placeholder="Add tag, press Enter"
            className="w-full border border-border bg-background px-3 py-2.5 text-base outline-none transition-colors focus:border-foreground"
          />

          {tagSuggestions.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tagSuggestions.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => addTag(tag)}
                  className="border border-dashed border-border px-2.5 py-1 text-xs text-text-secondary transition-colors hover:border-foreground hover:text-foreground"
                >
                  {tag}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={saving || !body.trim()}
          className="inline-flex h-11 items-center justify-center gap-2 border border-foreground bg-foreground px-4 text-sm font-semibold text-background transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Plus className="h-4 w-4" />
          {editingId ? "Save changes" : "Add entry"}
        </button>
      </form>

      <form onSubmit={handleSearch} className="space-y-3">
        <label className="block">
          <span className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-text-secondary">
            <Search className="h-3.5 w-3.5" />
            Search
          </span>
          <div className="flex gap-3">
            <input
              value={draftQuery}
              onChange={(event) => setDraftQuery(event.target.value)}
              placeholder="Full-text search…"
              className="w-full border border-border bg-background px-3 py-2.5 text-base outline-none transition-colors focus:border-foreground"
            />
            <button
              type="submit"
              disabled={loading}
              className="inline-flex h-11 items-center justify-center border border-border px-4 text-sm font-semibold transition-colors hover:border-foreground disabled:opacity-60"
            >
              Search
            </button>
          </div>
        </label>

        {knownTags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {knownTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTagFilter(tag)}
                className={`border px-2.5 py-1 text-xs font-semibold transition-colors ${
                  activeTag === tag
                    ? "border-foreground bg-foreground text-background"
                    : "border-border text-text-secondary hover:border-foreground hover:text-foreground"
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        )}
      </form>

      {error && <p className="text-sm text-text-secondary">{error}</p>}

      {loading && entries === null ? (
        <p className="text-sm text-text-secondary">Loading…</p>
      ) : !entries || entries.length === 0 ? (
        <p className="text-sm text-text-secondary">
          {searchQuery || activeTag
            ? "No entries match this search."
            : "Nothing logged yet. Add your first entry above."}
        </p>
      ) : (
        <div className="space-y-4">
          <div className="border-t border-border">
            {entries.map((entry) => (
              <article key={entry.id} className="border-b border-border py-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <time className="text-sm font-semibold text-text-secondary">
                        {entry.occurredOn}
                      </time>
                      <h3 className="text-base font-semibold">
                        {entry.title.trim() || "Untitled"}
                      </h3>
                    </div>
                    {entry.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {entry.tags.map((tag) => (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => toggleTagFilter(tag)}
                            className="border border-border px-2 py-0.5 text-xs text-text-secondary transition-colors hover:border-foreground hover:text-foreground"
                          >
                            {tag}
                          </button>
                        ))}
                      </div>
                    )}
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                      {entry.body}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleCopy(entry)}
                      className="inline-flex items-center gap-1.5 border border-border px-2.5 py-1.5 text-xs font-semibold transition-colors hover:border-foreground"
                      aria-label="Copy entry"
                    >
                      {copiedId === entry.id ? (
                        <>
                          <Check className="h-3.5 w-3.5" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          Copy
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => startEdit(entry)}
                      className="text-text-secondary transition-colors hover:text-foreground"
                      aria-label="Edit entry"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(entry)}
                      className="text-text-secondary transition-colors hover:text-foreground"
                      aria-label="Delete entry"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {total > PAGE_SIZE && (
            <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
              <span className="text-text-secondary">
                Page {page} of {totalPages}
                <span className="mx-1.5">·</span>
                {total} entries
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => goToPage(page - 1)}
                  disabled={loading || page <= 1}
                  className="inline-flex h-9 items-center gap-1 border border-border px-3 text-xs font-semibold transition-colors hover:border-foreground disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  Newer
                </button>
                <button
                  type="button"
                  onClick={() => goToPage(page + 1)}
                  disabled={loading || page >= totalPages}
                  className="inline-flex h-9 items-center gap-1 border border-border px-3 text-xs font-semibold transition-colors hover:border-foreground disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Older
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
