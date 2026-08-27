"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Check, ChevronDown, ChevronUp, Clock3, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import type { OrbitContact, OrbitPerson, OrbitStatus } from "@/lib/orbit";

const STATUS_META: Record<OrbitStatus, { label: string; dot: string; description: string }> = {
  red: { label: "Needs attention", dot: "bg-[#a26873]", description: "It has been a while" },
  orange: { label: "Stay close", dot: "bg-[#b66a35]", description: "Worth checking in" },
  green: { label: "Feeling good", dot: "bg-[#3d7775]", description: "Recently connected" },
};

function localToday() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function formatDate(value: string | null) {
  if (!value) return "No contact logged";
  const date = new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00` : value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";
  try {
    return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(date);
  } catch {
    return "Date unavailable";
  }
}

async function readPayload(response: Response) {
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error || "Something went wrong.");
  return payload;
}

export default function OrbitTool() {
  const [people, setPeople] = useState<OrbitPerson[] | null>(null);
  const [query, setQuery] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [contacts, setContacts] = useState<Record<number, OrbitContact[]>>({});
  const [loadingHistory, setLoadingHistory] = useState<number | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadPeople() {
    try {
      const payload = await readPayload(await fetch("/api/tools/orbit"));
      setPeople(payload.people);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not load Orbit.");
    }
  }

  useEffect(() => {
    // The initial request synchronizes this client view with the server-backed list.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadPeople();
  }, []);

  const visiblePeople = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase();
    return (people ?? []).filter((person) => !needle || person.name.toLocaleLowerCase().includes(needle));
  }, [people, query]);

  const counts = useMemo(() => ({
    red: (people ?? []).filter((person) => person.status === "red").length,
    orange: (people ?? []).filter((person) => person.status === "orange").length,
    green: (people ?? []).filter((person) => person.status === "green").length,
  }), [people]);

  async function addPerson(event: FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      await readPayload(await fetch("/api/tools/orbit", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: newName }),
      }));
      setNewName("");
      setShowAdd(false);
      await loadPeople();
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Could not add person."); }
  }

  async function updatePerson(person: OrbitPerson, changes: { name?: string; status?: OrbitStatus }) {
    setBusyId(person.id);
    setError(null);
    try {
      await readPayload(await fetch(`/api/tools/orbit/${person.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: changes.name ?? person.name, status: changes.status ?? person.status }),
      }));
      await loadPeople();
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Could not update person."); }
    finally { setBusyId(null); }
  }

  async function logContact(person: OrbitPerson, contactedOn = localToday(), note = "") {
    setBusyId(person.id);
    setError(null);
    try {
      await readPayload(await fetch(`/api/tools/orbit/${person.id}/contacts`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contactedOn, note }),
      }));
      setContacts((current) => { const next = { ...current }; delete next[person.id]; return next; });
      await loadPeople();
      if (expandedId === person.id) await loadContacts(person.id, true);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Could not log contact."); }
    finally { setBusyId(null); }
  }

  async function loadContacts(personId: number, force = false) {
    if (!force && contacts[personId]) return;
    setLoadingHistory(personId);
    try {
      const payload = await readPayload(await fetch(`/api/tools/orbit/${personId}/contacts`));
      setContacts((current) => ({ ...current, [personId]: payload.contacts }));
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Could not load history."); }
    finally { setLoadingHistory(null); }
  }

  async function toggleExpanded(personId: number) {
    const next = expandedId === personId ? null : personId;
    setExpandedId(next);
    if (next) await loadContacts(next);
  }

  async function removePerson(person: OrbitPerson) {
    if (!window.confirm(`Remove ${person.name} and their contact history from Orbit?`)) return;
    setBusyId(person.id);
    try {
      await readPayload(await fetch(`/api/tools/orbit/${person.id}`, { method: "DELETE" }));
      setExpandedId(null);
      await loadPeople();
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Could not remove person."); }
    finally { setBusyId(null); }
  }

  return (
    <div className="mx-auto max-w-3xl py-3 md:py-8">
      <header className="mb-8 border-b border-border pb-7">
        <p className="mb-3 font-sans text-xs font-semibold uppercase tracking-[0.18em] text-[#3d7775]">Private tool</p>
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-5xl tracking-tight md:text-6xl">Orbit</h1>
            <p className="mt-3 max-w-lg text-lg leading-relaxed text-text-secondary">Keep the people who matter from drifting too far away.</p>
          </div>
          <button onClick={() => setShowAdd((value) => !value)} className="inline-flex w-fit items-center gap-2 bg-foreground px-4 py-2.5 font-sans text-sm font-semibold text-background hover:opacity-80">
            {showAdd ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />} {showAdd ? "Close" : "Add person"}
          </button>
        </div>
      </header>

      {showAdd && (
        <form onSubmit={addPerson} className="mb-6 flex flex-col gap-3 border-y border-border bg-muted/50 p-4 sm:flex-row">
          <input autoFocus required value={newName} onChange={(event) => setNewName(event.target.value)} placeholder="Name" aria-label="Name" className="min-w-0 flex-1 border border-border bg-background px-3 py-2.5 outline-none focus:border-foreground" />
          <button className="bg-foreground px-5 py-2.5 font-sans text-sm font-semibold text-background">Add to Orbit</button>
        </form>
      )}

      <div className="mb-6 grid grid-cols-3 border border-border">
        {(["red", "orange", "green"] as OrbitStatus[]).map((status, index) => (
          <div key={status} className={`p-3 sm:p-4 ${index ? "border-l border-border" : ""}`}>
            <p className="flex items-center gap-2 font-sans text-[11px] font-semibold uppercase tracking-[0.1em] text-text-secondary"><span className={`h-2.5 w-2.5 rounded-full ${STATUS_META[status].dot}`} />{STATUS_META[status].label}</p>
            <p className="mt-1 text-2xl">{counts[status]}</p>
          </div>
        ))}
      </div>

      <label className="mb-3 flex items-center gap-2 border-b border-border px-1">
        <Search className="h-4 w-4 text-text-secondary" />
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find someone" className="w-full bg-transparent py-2.5 outline-none placeholder:text-text-secondary" />
      </label>
      {error && <div role="alert" className="mb-3 border border-[#a26873]/40 bg-[#a26873]/10 px-3 py-2 text-sm text-[#7d4650]">{error}</div>}

      {people === null ? <p className="py-12 text-center text-text-secondary">Bringing your people into view…</p> : visiblePeople.length === 0 ? <p className="py-12 text-center text-text-secondary">No one in Orbit matches that search.</p> : (
        <div className="border-t border-border">
          {visiblePeople.map((person) => (
            <div key={person.id} className="border-b border-border">
              <div className="grid gap-3 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                <button onClick={() => toggleExpanded(person.id)} className="min-w-0 text-left">
                  <span className="flex items-center gap-3">
                    <span className={`h-3 w-3 shrink-0 rounded-full ${STATUS_META[person.status].dot}`} />
                    <span className="truncate text-lg font-semibold">{person.name}</span>
                    {expandedId === person.id ? <ChevronUp className="h-4 w-4 shrink-0 text-text-secondary" /> : <ChevronDown className="h-4 w-4 shrink-0 text-text-secondary" />}
                  </span>
                  <span className="mt-1.5 flex flex-wrap gap-x-3 pl-6 font-sans text-xs text-text-secondary">
                    <span>{STATUS_META[person.status].label}</span><span>{formatDate(person.lastContactedOn)}</span>
                    {person.latestContactNote && <span className="max-w-xs truncate">“{person.latestContactNote}”</span>}
                  </span>
                </button>
                <div className="flex items-center gap-2 pl-6 sm:pl-0">
                  <select aria-label={`Status for ${person.name}`} value={person.status} disabled={busyId === person.id} onChange={(event) => updatePerson(person, { status: event.target.value as OrbitStatus })} className="border border-border bg-background px-2 py-2 font-sans text-xs outline-none focus:border-foreground">
                    <option value="red">Red</option><option value="orange">Orange</option><option value="green">Green</option>
                  </select>
                  <button disabled={busyId === person.id} onClick={() => logContact(person)} className="inline-flex items-center gap-1.5 bg-foreground px-3 py-2 font-sans text-xs font-semibold text-background disabled:opacity-50"><Check className="h-3.5 w-3.5" /> Contacted today</button>
                </div>
              </div>
              {expandedId === person.id && (
                <PersonDetails person={person} contacts={contacts[person.id]} loading={loadingHistory === person.id} busy={busyId === person.id} onLog={(date, note) => logContact(person, date, note)} onEdit={(name) => updatePerson(person, { name })} onRemove={() => removePerson(person)} onRefresh={async () => { await loadContacts(person.id, true); await loadPeople(); }} onError={setError} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PersonDetails({ person, contacts, loading, busy, onLog, onEdit, onRemove, onRefresh, onError }: { person: OrbitPerson; contacts?: OrbitContact[]; loading: boolean; busy: boolean; onLog: (date: string, note: string) => Promise<void>; onEdit: (name: string) => Promise<void>; onRemove: () => void; onRefresh: () => Promise<void>; onError: (message: string) => void }) {
  const [date, setDate] = useState(localToday);
  const [note, setNote] = useState("");
  const [editingName, setEditingName] = useState(false);
  const [name, setName] = useState(person.name);
  const [editingContact, setEditingContact] = useState<OrbitContact | null>(null);

  async function submitContact(event: FormEvent) { event.preventDefault(); await onLog(date, note); setNote(""); }
  async function saveName(event: FormEvent) { event.preventDefault(); await onEdit(name); setEditingName(false); }
  async function saveContact(event: FormEvent) {
    event.preventDefault();
    if (!editingContact) return;
    try {
      await readPayload(await fetch(`/api/tools/orbit/contacts/${editingContact.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contactedOn: editingContact.contactedOn, note: editingContact.note }) }));
      setEditingContact(null); await onRefresh();
    } catch (caught) { onError(caught instanceof Error ? caught.message : "Could not update contact."); }
  }
  async function removeContact(contact: OrbitContact) {
    if (!window.confirm("Delete this contact entry?")) return;
    try { await readPayload(await fetch(`/api/tools/orbit/contacts/${contact.id}`, { method: "DELETE" })); await onRefresh(); }
    catch (caught) { onError(caught instanceof Error ? caught.message : "Could not delete contact."); }
  }

  return (
    <div className="mb-4 ml-6 border-l border-border pl-4 sm:ml-6 sm:grid sm:grid-cols-[1fr_1fr] sm:gap-6">
      <div>
        <p className="mb-3 font-sans text-[11px] font-semibold uppercase tracking-[0.12em] text-text-secondary">Log contact</p>
        <form onSubmit={submitContact} className="space-y-2">
          <input type="date" required value={date} onChange={(event) => setDate(event.target.value)} className="w-full border border-border bg-background px-3 py-2 font-sans text-sm outline-none focus:border-foreground" />
          <textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Optional note — what did you catch up about?" rows={2} className="w-full resize-y border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground" />
          <button disabled={busy} className="bg-foreground px-3 py-2 font-sans text-xs font-semibold text-background disabled:opacity-50">Save contact</button>
        </form>
        <div className="mt-5 flex gap-3 border-t border-border pt-3 font-sans text-xs">
          <button onClick={() => setEditingName((value) => !value)} className="inline-flex items-center gap-1 text-text-secondary hover:text-foreground"><Pencil className="h-3.5 w-3.5" /> Edit name</button>
          <button onClick={onRemove} className="inline-flex items-center gap-1 text-[#8a4d58] hover:text-[#65343d]"><Trash2 className="h-3.5 w-3.5" /> Remove</button>
        </div>
        {editingName && <form onSubmit={saveName} className="mt-3 flex gap-2"><input required value={name} onChange={(event) => setName(event.target.value)} className="min-w-0 flex-1 border border-border px-2 py-1.5 text-sm outline-none" /><button className="border border-foreground px-2 font-sans text-xs">Save</button></form>}
      </div>
      <div className="mt-6 sm:mt-0">
        <p className="mb-3 font-sans text-[11px] font-semibold uppercase tracking-[0.12em] text-text-secondary">History · {person.contactCount}</p>
        {loading ? <p className="text-sm text-text-secondary">Loading history…</p> : !contacts?.length ? <p className="flex items-center gap-2 text-sm text-text-secondary"><Clock3 className="h-4 w-4" /> No contacts logged yet.</p> : (
          <div className="max-h-64 space-y-3 overflow-y-auto pr-1">
            {contacts.map((contact) => editingContact?.id === contact.id ? (
              <form key={contact.id} onSubmit={saveContact} className="space-y-2 border-b border-border pb-3">
                <input type="date" value={editingContact.contactedOn} onChange={(event) => setEditingContact({ ...editingContact, contactedOn: event.target.value })} className="w-full border border-border px-2 py-1 font-sans text-xs" />
                <input value={editingContact.note} onChange={(event) => setEditingContact({ ...editingContact, note: event.target.value })} placeholder="Note" className="w-full border border-border px-2 py-1 text-sm" />
                <span className="flex gap-2"><button className="font-sans text-xs font-semibold">Save</button><button type="button" onClick={() => setEditingContact(null)} className="font-sans text-xs text-text-secondary">Cancel</button></span>
              </form>
            ) : (
              <div key={contact.id} className="border-b border-border pb-3 last:border-0">
                <div className="flex items-center justify-between gap-2"><time className="font-sans text-xs font-semibold">{formatDate(contact.contactedOn)}</time><span className="flex gap-2"><button aria-label="Edit contact" onClick={() => setEditingContact(contact)}><Pencil className="h-3.5 w-3.5 text-text-secondary" /></button><button aria-label="Delete contact" onClick={() => removeContact(contact)}><Trash2 className="h-3.5 w-3.5 text-text-secondary" /></button></span></div>
                {contact.note && <p className="mt-1 text-sm leading-relaxed text-text-secondary">{contact.note}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
