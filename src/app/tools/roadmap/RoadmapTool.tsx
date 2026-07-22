"use client";

import { FormEvent, useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Lock, Plus, Trash2 } from "lucide-react";

type ConceptStatus = "todo" | "learning" | "known";

type Concept = {
  id: number;
  title: string;
  slug: string;
  status: ConceptStatus;
  parentId: number | null;
  notes: string;
  resources: string;
  createdAt: string;
  updatedAt: string;
};

type Tree = Concept & { children: Tree[] };

const STATUS_LABEL: Record<ConceptStatus, string> = {
  todo: "Todo",
  learning: "Learning",
  known: "Known",
};

const STATUS_ORDER: ConceptStatus[] = ["todo", "learning", "known"];

const STATUS_CLASS: Record<ConceptStatus, string> = {
  todo: "border-border text-text-secondary",
  learning: "border-foreground text-foreground",
  known: "border-foreground bg-foreground text-background",
};

function buildTree(concepts: Concept[]): Tree[] {
  const byId = new Map<number, Tree>(
    concepts.map((concept) => [concept.id, { ...concept, children: [] }]),
  );
  const roots: Tree[] = [];

  for (const concept of byId.values()) {
    if (concept.parentId !== null && byId.has(concept.parentId)) {
      byId.get(concept.parentId)!.children.push(concept);
    } else {
      roots.push(concept);
    }
  }

  return roots;
}

export default function RoadmapTool() {
  const [password, setPassword] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [concepts, setConcepts] = useState<Concept[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newParentId, setNewParentId] = useState<string>("");
  const [collapsed, setCollapsed] = useState<Set<number>>(new Set());

  const tree = useMemo(() => (concepts ? buildTree(concepts) : []), [concepts]);

  async function loadConcepts(pwd: string) {
    setLoading(true);
    setAuthError(null);

    try {
      const response = await fetch(
        `/api/tools/roadmap?password=${encodeURIComponent(pwd)}`,
      );
      const payload = await response.json();

      if (!response.ok) {
        setAuthError(payload.error || "Failed to load the roadmap.");
        setUnlocked(false);
        return;
      }

      setConcepts(payload.concepts as Concept[]);
      setUnlocked(true);
    } catch {
      setAuthError("Failed to reach the server.");
    } finally {
      setLoading(false);
    }
  }

  function handleUnlock(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    loadConcepts(password);
  }

  async function handleAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!newTitle.trim()) {
      return;
    }

    const response = await fetch("/api/tools/roadmap", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        password,
        title: newTitle.trim(),
        parentId: newParentId ? Number(newParentId) : null,
      }),
    });

    if (response.ok) {
      const payload = await response.json();
      setConcepts((prev) => (prev ? [...prev, payload.concept] : [payload.concept]));
      setNewTitle("");
    }
  }

  async function cycleStatus(concept: Concept) {
    const nextIndex = (STATUS_ORDER.indexOf(concept.status) + 1) % STATUS_ORDER.length;
    const nextStatus = STATUS_ORDER[nextIndex];

    setConcepts((prev) =>
      prev
        ? prev.map((c) => (c.id === concept.id ? { ...c, status: nextStatus } : c))
        : prev,
    );

    await fetch(`/api/tools/roadmap/${concept.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password, status: nextStatus }),
    });
  }

  async function saveNotes(concept: Concept, notes: string, resources: string) {
    setConcepts((prev) =>
      prev
        ? prev.map((c) => (c.id === concept.id ? { ...c, notes, resources } : c))
        : prev,
    );

    await fetch(`/api/tools/roadmap/${concept.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password, notes, resources }),
    });
  }

  async function removeConcept(concept: Concept) {
    if (!confirm(`Delete "${concept.title}" and any subtopics?`)) {
      return;
    }

    setConcepts((prev) => (prev ? prev.filter((c) => c.id !== concept.id) : prev));

    await fetch(`/api/tools/roadmap/${concept.id}?password=${encodeURIComponent(password)}`, {
      method: "DELETE",
    });
  }

  function toggleCollapsed(id: number) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
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
      <form onSubmit={handleAdd} className="border-y border-border py-5">
        <div className="grid gap-4 md:grid-cols-[1fr_14rem_auto] md:items-end">
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-text-secondary">
              New concept
            </span>
            <input
              value={newTitle}
              onChange={(event) => setNewTitle(event.target.value)}
              placeholder="e.g. Copy-on-write filesystems"
              className="w-full border border-border bg-background px-3 py-2.5 text-base outline-none transition-colors focus:border-foreground"
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-text-secondary">
              Parent
            </span>
            <select
              value={newParentId}
              onChange={(event) => setNewParentId(event.target.value)}
              className="w-full border border-border bg-background px-3 py-2.5 text-base outline-none transition-colors focus:border-foreground"
            >
              <option value="">— top level —</option>
              {(concepts ?? []).map((concept) => (
                <option key={concept.id} value={concept.id}>
                  {concept.title}
                </option>
              ))}
            </select>
          </label>
          <button
            type="submit"
            className="inline-flex h-11 items-center justify-center gap-2 border border-foreground bg-foreground px-4 text-sm font-semibold text-background transition-opacity hover:opacity-80"
          >
            <Plus className="h-4 w-4" />
            Add
          </button>
        </div>
      </form>

      {tree.length === 0 ? (
        <p className="text-sm text-text-secondary">
          Nothing tracked yet. Add your first concept above.
        </p>
      ) : (
        <div className="border-t border-border">
          {tree.map((node) => (
            <ConceptNode
              key={node.id}
              node={node}
              depth={0}
              collapsed={collapsed}
              onToggleCollapsed={toggleCollapsed}
              onCycleStatus={cycleStatus}
              onSaveNotes={saveNotes}
              onDelete={removeConcept}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ConceptNode({
  node,
  depth,
  collapsed,
  onToggleCollapsed,
  onCycleStatus,
  onSaveNotes,
  onDelete,
}: {
  node: Tree;
  depth: number;
  collapsed: Set<number>;
  onToggleCollapsed: (id: number) => void;
  onCycleStatus: (concept: Concept) => void;
  onSaveNotes: (concept: Concept, notes: string, resources: string) => void;
  onDelete: (concept: Concept) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [notes, setNotes] = useState(node.notes);
  const [resources, setResources] = useState(node.resources);
  const isCollapsed = collapsed.has(node.id);
  const hasChildren = node.children.length > 0;

  return (
    <div style={{ marginLeft: depth ? `${depth * 1.5}rem` : undefined }}>
      <div className="flex flex-col gap-2 border-b border-border py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="flex min-w-0 items-center gap-2">
          {hasChildren ? (
            <button
              type="button"
              onClick={() => onToggleCollapsed(node.id)}
              className="text-text-secondary transition-colors hover:text-foreground"
              aria-label={isCollapsed ? "Expand" : "Collapse"}
            >
              {isCollapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
          ) : (
            <span className="w-4" />
          )}
          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            className="truncate text-left text-base font-semibold underline decoration-border underline-offset-4 transition-colors hover:text-text-secondary"
          >
            {node.title}
          </button>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => onCycleStatus(node)}
            className={`border px-2.5 py-1 text-xs font-semibold transition-colors ${STATUS_CLASS[node.status]}`}
          >
            {STATUS_LABEL[node.status]}
          </button>
          <button
            type="button"
            onClick={() => onDelete(node)}
            className="text-text-secondary transition-colors hover:text-foreground"
            aria-label="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="space-y-3 border-b border-border bg-muted px-4 py-4 sm:px-6">
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-text-secondary">
              Notes
            </span>
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              onBlur={() => onSaveNotes(node, notes, resources)}
              rows={3}
              className="w-full border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-foreground"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-text-secondary">
              Resources
            </span>
            <textarea
              value={resources}
              onChange={(event) => setResources(event.target.value)}
              onBlur={() => onSaveNotes(node, notes, resources)}
              rows={2}
              className="w-full border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-foreground"
            />
          </label>
        </div>
      )}

      {!isCollapsed &&
        node.children.map((child) => (
          <ConceptNode
            key={child.id}
            node={child}
            depth={depth + 1}
            collapsed={collapsed}
            onToggleCollapsed={onToggleCollapsed}
            onCycleStatus={onCycleStatus}
            onSaveNotes={onSaveNotes}
            onDelete={onDelete}
          />
        ))}
    </div>
  );
}
