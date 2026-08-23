"use client";

import { FormEvent, useMemo, useState } from "react";
import { Check, ChevronRight, Link2, Lock, Plus, Search, Users } from "lucide-react";
import type { NetworkGraph, NetworkPerson } from "@/lib/network";

const WIDTH = 900;
const HEIGHT = 540;

export default function NetworkTool() {
  const [password, setPassword] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [graph, setGraph] = useState<NetworkGraph | null>(null);
  const [targetId, setTargetId] = useState<number | null>(null);
  const [path, setPath] = useState<number[] | null>(null);
  const [pathResolved, setPathResolved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPersonForm, setShowPersonForm] = useState(false);
  const [showRelationshipForm, setShowRelationshipForm] = useState(false);

  async function unlock(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/tools/network?password=${encodeURIComponent(password)}`);
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Could not unlock the graph.");
      setGraph(payload.graph);
      setUnlocked(true);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not reach the server.");
    } finally { setLoading(false); }
  }

  async function refresh() {
    const response = await fetch(`/api/tools/network?password=${encodeURIComponent(password)}`);
    const payload = await response.json();
    if (response.ok) setGraph(payload.graph);
    else setError(payload.error || "Could not refresh the graph.");
  }

  async function selectTarget(id: number) {
    setTargetId(id);
    setPathResolved(false);
    const response = await fetch(`/api/tools/network/path?password=${encodeURIComponent(password)}&targetId=${id}`);
    const payload = await response.json();
    if (response.ok) {
      setPath(payload.path);
      setPathResolved(true);
    }
  }

  if (!unlocked) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 md:px-6 md:py-20">
        <div className="mb-10 max-w-xl"><p className="mb-3 font-mono text-xs uppercase tracking-[0.18em] text-[#3d7775]">Private instrument / 01</p><h1 className="text-4xl tracking-tight md:text-6xl">Your network, rendered.</h1><p className="mt-5 text-lg leading-relaxed text-text-secondary">A living map of the people you have met and the paths that connect them.</p></div>
        <form onSubmit={unlock} className="border-y border-border py-5">
          <label className="block"><span className="mb-2 flex items-center gap-2 text-sm font-semibold text-text-secondary"><Lock className="h-4 w-4" />Tools password</span><div className="flex max-w-lg gap-3"><input autoFocus type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="min-w-0 flex-1 border border-border bg-background px-3 py-2.5 outline-none focus:border-foreground" /><button disabled={loading} className="inline-flex items-center gap-2 bg-foreground px-5 py-2.5 text-sm font-semibold text-background disabled:opacity-50">Unlock <ChevronRight className="h-4 w-4" /></button></div></label>
          {error && <p className="mt-3 text-sm text-[#a26873]">{error}</p>}
        </form>
      </div>
    );
  }

  const people = graph?.people ?? [];
  const relationships = graph?.relationships ?? [];
  const selected = people.find((person) => person.id === targetId) ?? null;
  const pathSet = new Set(path ?? []);
  const confirmedEdges = relationships.filter((edge) => edge.status === "confirmed");
  const directCount = graph ? confirmedEdges.filter((edge) => edge.sourceId === graph.rootId || edge.targetId === graph.rootId).length : 0;

  return (
    <div className="lab-grid min-h-screen">
      <div className="mx-auto max-w-6xl px-4 py-8 md:px-6 md:py-12">
        <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><p className="mb-3 font-mono text-xs uppercase tracking-[0.18em] text-[#3d7775]">Private instrument / 01</p><h1 className="text-4xl tracking-tight md:text-6xl">How close are you?</h1><p className="mt-4 max-w-xl leading-relaxed text-text-secondary">Start with people you know. Then follow sourced public associations to estimate how many hops separate you from anyone in the graph.</p></div><div className="flex gap-2"><button onClick={() => setShowPersonForm((value) => !value)} className="inline-flex items-center gap-2 border border-border bg-background px-3 py-2 text-sm font-semibold hover:border-foreground"><Plus className="h-4 w-4" /> Person</button><button onClick={() => setShowRelationshipForm((value) => !value)} className="inline-flex items-center gap-2 bg-foreground px-3 py-2 text-sm font-semibold text-background"><Link2 className="h-4 w-4" /> Connection</button></div></div>

        {(showPersonForm || showRelationshipForm) && <div className="mb-8 grid gap-5 border-y border-border bg-background/70 p-5 md:grid-cols-2">{showPersonForm && <PersonForm password={password} onDone={() => { setShowPersonForm(false); refresh(); }} />}{showRelationshipForm && graph && <RelationshipForm password={password} people={people} onDone={() => { setShowRelationshipForm(false); refresh(); }} />}</div>}

        <div className="mb-5 grid grid-cols-2 gap-px border border-border bg-border md:grid-cols-4"><Stat label="people" value={people.length} /><Stat label="network edges" value={confirmedEdges.length} /><Stat label="your edges" value={directCount} /><Stat label="distance" value={path ? `${path.length - 1} hops` : "—"} /></div>

        <div className="grid gap-5 lg:grid-cols-[1fr_19rem]">
          <div className="overflow-hidden border border-border bg-background"><GraphCanvas graph={graph!} selectedPath={pathSet} targetId={targetId} onSelect={selectTarget} /></div>
          <aside className="border border-border bg-background p-5"><label className="mb-5 block"><span className="mb-2 block font-mono text-[10px] uppercase tracking-[0.16em] text-text-secondary">Find a path from me</span><div className="flex items-center gap-2 border-b border-border"><Search className="h-4 w-4 text-text-secondary" /><input placeholder="Search people" className="w-full bg-transparent py-2 text-sm outline-none" onChange={(event) => { const result = people.find((person) => person.name.toLowerCase().includes(event.target.value.toLowerCase())); if (result && event.target.value) selectTarget(result.id); }} /></div></label><div className="space-y-1">{people.filter((person) => person.id !== graph?.rootId).map((person) => <button key={person.id} onClick={() => selectTarget(person.id)} className={`flex w-full items-center justify-between border-b border-border py-3 text-left text-sm transition-colors hover:bg-muted ${targetId === person.id ? "text-[#3d7775]" : ""}`}><span>{person.name}</span><span className="font-mono text-[10px] text-text-secondary">{person.notable ? "notable" : "person"}</span></button>)}</div>{selected && <div className="mt-5 border-t border-border pt-4"><p className="font-semibold">{selected.name}</p><p className="mt-1 text-sm leading-relaxed text-text-secondary">{selected.occupation || selected.description || "No profile details yet."}</p>{selected.profileUrl && <a href={selected.profileUrl} target="_blank" rel="noreferrer" className="mt-3 inline-block text-xs text-[#3d7775] underline">Open profile</a>}</div>}</aside>
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_19rem]"> <div className="border border-border bg-background p-5">{selected && path ? <PathResult graph={graph!} path={path} selected={selected} /> : selected && pathResolved ? <div className="flex min-h-28 items-center gap-4 text-text-secondary"><Users className="h-7 w-7" strokeWidth={1.25} /><p>No confirmed path to {selected.name} is known yet.</p></div> : <div className="flex min-h-28 items-center gap-4 text-text-secondary"><Users className="h-7 w-7" strokeWidth={1.25} /><p>Search for anyone in the public network to see how many hops away they are.</p></div>}</div><div className="border border-border bg-background p-5"><p className="mb-4 font-mono text-[10px] uppercase tracking-[0.16em] text-text-secondary">Edge legend</p><div className="space-y-3 text-sm text-text-secondary"><p><span className="font-semibold text-foreground">Personal</span> — you met or know this person.</p><p><span className="font-semibold text-foreground">Public</span> — sourced association, collaboration, or meeting.</p><p><span className="font-semibold text-foreground">Potential</span> — a weaker lead that needs review.</p></div></div></div>
      </div>
    </div>
  );
}

function GraphCanvas({ graph, selectedPath, targetId, onSelect }: { graph: NetworkGraph; selectedPath: Set<number>; targetId: number | null; onSelect: (id: number) => void }) {
  const { positions, treeEdges, depths } = useMemo(() => {
    const adjacency = new Map<number, number[]>();
    for (const person of graph.people) adjacency.set(person.id, []);
    for (const edge of graph.relationships) {
      if (edge.status !== "confirmed") continue;
      adjacency.get(edge.sourceId)?.push(edge.targetId);
      adjacency.get(edge.targetId)?.push(edge.sourceId);
    }

    const depths = new Map<number, number>([[graph.rootId, 0]]);
    const parents = new Map<number, number>();
    const queue = [graph.rootId];
    while (queue.length) {
      const current = queue.shift()!;
      for (const next of adjacency.get(current) ?? []) {
        if (depths.has(next)) continue;
        depths.set(next, (depths.get(current) ?? 0) + 1);
        parents.set(next, current);
        queue.push(next);
      }
    }

    // Keep disconnected people visible at the highest level instead of hiding them.
    for (const person of graph.people) {
      if (!depths.has(person.id)) depths.set(person.id, 0);
    }

    const layers = new Map<number, number[]>();
    for (const [id, depth] of depths) {
      const layer = layers.get(depth) ?? [];
      layer.push(id);
      layers.set(depth, layer);
    }
    const maxDepth = Math.max(...layers.keys(), 0);
    const positions = new Map<number, { x: number; y: number }>();
    for (const [depth, ids] of layers) {
      const y = depth === 0 ? HEIGHT - 54 : HEIGHT - 54 - ((HEIGHT - 105) * depth) / Math.max(maxDepth, 1);
      ids.sort((a, b) => a - b);
      ids.forEach((id, index) => {
        const x = WIDTH * (index + 1) / (ids.length + 1);
        positions.set(id, { x, y });
      });
    }
    return { positions, treeEdges: new Set([...parents].map(([child, parent]) => `${Math.min(child, parent)}-${Math.max(child, parent)}`)), depths };
  }, [graph]);

  return <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="h-auto w-full" role="img" aria-label="Rooted network tree"><defs><pattern id="network-grid" width="32" height="32" patternUnits="userSpaceOnUse"><path d="M 32 0 L 0 0 0 32" fill="none" stroke="#e5e5e5" strokeWidth="0.6" /></pattern></defs><rect width={WIDTH} height={HEIGHT} fill="url(#network-grid)" /><text x="24" y="28" className="fill-text-secondary font-mono text-[10px] uppercase tracking-[0.16em]">public network / farther away ↑</text>{graph.relationships.map((edge) => { const a = positions.get(edge.sourceId); const b = positions.get(edge.targetId); if (!a || !b) return null; const active = selectedPath.has(edge.sourceId) && selectedPath.has(edge.targetId); const isTreeEdge = treeEdges.has(`${Math.min(edge.sourceId, edge.targetId)}-${Math.max(edge.sourceId, edge.targetId)}`); return <line key={edge.id} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={active ? "#3d7775" : isTreeEdge ? "#aebbb7" : "#d8dedc"} strokeWidth={active ? 3.5 : isTreeEdge ? 2 : 1} strokeDasharray={edge.status === "draft" || !isTreeEdge ? "5 5" : undefined} opacity={active ? 1 : isTreeEdge ? 0.9 : 0.65} />; })}{graph.people.map((person) => { const point = positions.get(person.id)!; const root = person.id === graph.rootId; const active = selectedPath.has(person.id); const depth = depths.get(person.id) ?? 0; return <g key={person.id} onClick={() => onSelect(person.id)} className="cursor-pointer"><circle cx={point.x} cy={point.y} r={root ? 26 : active || targetId === person.id ? 19 : 14} fill={root ? "#161918" : active ? "#3d7775" : "#fff"} stroke={root ? "#161918" : active ? "#3d7775" : person.notable ? "#b66a35" : "#9aa7a3"} strokeWidth={2} /><text x={point.x} y={point.y + (root ? 45 : 34)} textAnchor="middle" className="fill-foreground text-[11px]">{person.name}</text>{!root && <text x={point.x} y={point.y - 24} textAnchor="middle" className="fill-text-secondary font-mono text-[9px]">{depth} hop{depth === 1 ? "" : "s"}</text>}</g>; })}<text x={WIDTH / 2} y={HEIGHT - 14} textAnchor="middle" className="fill-text-secondary font-mono text-[10px] uppercase tracking-[0.16em]">you / root</text></svg>;
}

function PathResult({ graph, path, selected }: { graph: NetworkGraph; path: number[]; selected: NetworkPerson }) { const byId = new Map(graph.people.map((person) => [person.id, person])); const edges = path.slice(0, -1).map((id, index) => graph.relationships.find((edge) => edge.status === "confirmed" && ((edge.sourceId === id && edge.targetId === path[index + 1]) || (edge.targetId === id && edge.sourceId === path[index + 1])))).filter(Boolean); const personal = edges.filter((edge) => edge!.edgeKind === "personal").length; return <div><div className="flex items-start justify-between gap-4"><div><p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#3d7775]">Potential distance</p><h2 className="mt-1 text-3xl tracking-tight">{path.length - 1} {path.length - 1 === 1 ? "hop" : "hops"}</h2></div><Check className="h-6 w-6 text-[#3d7775]" /></div><p className="mt-5 flex flex-wrap items-center gap-2 text-sm">{path.map((id, index) => <span key={id} className="inline-flex items-center gap-2"><span className="border border-border px-2 py-1 font-semibold">{byId.get(id)?.name}</span>{index < path.length - 1 && <ChevronRight className="h-4 w-4 text-text-secondary" />}</span>)}</p><p className="mt-4 text-sm text-text-secondary">{personal} personal {personal === 1 ? "edge" : "edges"}; {edges.length - personal} public or potential {edges.length - personal === 1 ? "edge" : "edges"}.</p><div className="mt-4 space-y-2 border-t border-border pt-3">{edges.map((edge, index) => edge && <div key={edge.id} className="text-xs text-text-secondary"><span className="font-semibold text-foreground">{byId.get(path[index])?.name} → {byId.get(path[index + 1])?.name}</span> · {edge.type} · {edge.confidence}% confidence {edge.evidence[0]?.url && <a href={edge.evidence[0].url} target="_blank" rel="noreferrer" className="text-[#3d7775] underline">source</a>}</div>)}</div><p className="mt-3 text-sm leading-relaxed text-text-secondary">This is a plausible route, not a guaranteed introduction. Review the sources before treating it as an outreach path to {selected.name}.</p></div>; }

function Stat({ label, value }: { label: string; value: string | number }) { return <div className="bg-background p-4"><p className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-secondary">{label}</p><p className="mt-2 text-2xl tracking-tight">{value}</p></div>; }

function PersonForm({ password, onDone }: { password: string; onDone: () => void }) { const [name, setName] = useState(""); const [occupation, setOccupation] = useState(""); const [error, setError] = useState(""); async function submit(event: FormEvent) { event.preventDefault(); const response = await fetch("/api/tools/network", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password, kind: "person", name, occupation, notable: true }) }); const payload = await response.json(); if (!response.ok) setError(payload.error); else onDone(); } return <form onSubmit={submit} className="space-y-3"><p className="font-semibold">Add person</p><input required value={name} onChange={(event) => setName(event.target.value)} placeholder="Name" className="w-full border border-border px-3 py-2 text-sm outline-none focus:border-foreground" /><input value={occupation} onChange={(event) => setOccupation(event.target.value)} placeholder="Occupation or context" className="w-full border border-border px-3 py-2 text-sm outline-none focus:border-foreground" /><button className="bg-foreground px-3 py-2 text-sm font-semibold text-background">Save person</button>{error && <p className="text-sm text-[#a26873]">{error}</p>}</form>; }

function RelationshipForm({ password, people, onDone }: { password: string; people: NetworkPerson[]; onDone: () => void }) { const [sourceId, setSourceId] = useState(people[0]?.id ?? 0); const [targetId, setTargetId] = useState(people[1]?.id ?? 0); const [type, setType] = useState("public_association"); const [edgeKind, setEdgeKind] = useState("potential"); const [evidenceNote, setEvidenceNote] = useState(""); const [evidenceUrl, setEvidenceUrl] = useState(""); const [status, setStatus] = useState("confirmed"); const [error, setError] = useState(""); async function submit(event: FormEvent) { event.preventDefault(); const response = await fetch("/api/tools/network", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password, kind: "relationship", sourceId, targetId, type, edgeKind, status, evidenceNote, evidenceUrl }) }); const payload = await response.json(); if (!response.ok) setError(payload.error); else onDone(); } return <form onSubmit={submit} className="space-y-3"><p className="font-semibold">Add network edge</p><div className="grid gap-3 sm:grid-cols-2"><select value={sourceId} onChange={(event) => setSourceId(Number(event.target.value))} className="border border-border bg-background px-3 py-2 text-sm">{people.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}</select><select value={targetId} onChange={(event) => setTargetId(Number(event.target.value))} className="border border-border bg-background px-3 py-2 text-sm">{people.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}</select></div><div className="grid gap-3 sm:grid-cols-2"><input required value={type} onChange={(event) => setType(event.target.value)} placeholder="Relationship type" className="w-full border border-border px-3 py-2 text-sm outline-none focus:border-foreground" /><select value={edgeKind} onChange={(event) => setEdgeKind(event.target.value)} className="border border-border bg-background px-3 py-2 text-sm"><option value="personal">Personal</option><option value="public">Public</option><option value="potential">Potential</option></select></div><input required value={evidenceNote} onChange={(event) => setEvidenceNote(event.target.value)} placeholder="What supports this connection?" className="w-full border border-border px-3 py-2 text-sm outline-none focus:border-foreground" /><input value={evidenceUrl} onChange={(event) => setEvidenceUrl(event.target.value)} placeholder="Source URL" className="w-full border border-border px-3 py-2 text-sm outline-none focus:border-foreground" /><div className="flex items-center justify-between gap-3"><select value={status} onChange={(event) => setStatus(event.target.value)} className="border border-border bg-background px-3 py-2 text-sm"><option value="confirmed">Include in paths</option><option value="draft">Save as draft</option></select><button className="bg-foreground px-3 py-2 text-sm font-semibold text-background">Save edge</button></div>{error && <p className="text-sm text-[#a26873]">{error}</p>}</form>; }
