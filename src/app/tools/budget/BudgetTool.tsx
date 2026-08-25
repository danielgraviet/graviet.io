"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { Check, ChevronLeft, ChevronRight, CreditCard, Link2, Loader2, Lock, RefreshCw, Tags } from "lucide-react";
import type { BudgetAccount, BudgetDashboard } from "@/lib/budget";

declare global {
  interface Window {
    Plaid?: {
      create: (config: {
        token: string;
        receivedRedirectUri?: string;
        onSuccess: (publicToken: string, metadata: { accounts: { id: string; name?: string; mask?: string | null; type?: string; subtype?: string | null }[] }) => void;
        onExit?: (error: { display_message?: string; error_message?: string } | null) => void;
      }) => { open: () => void };
    };
  }
}

const CHART_COLORS = ["#3d7775", "#6e8f5c", "#b4834f", "#77749a", "#a26873", "#6991ad", "#8a8272", "#555"];

type Subscription = {
  name: string;
  kind: "Work" | "Personal";
  cost: number | null;
  billingPeriod: "month" | "year";
  card: string | null;
  detail?: string;
  estimated?: boolean;
};

// Subscriptions are intentionally maintained by hand and are not derived from Plaid transactions.
const SUBSCRIPTIONS: Subscription[] = [
  { name: "X", kind: "Work", cost: 8, billingPeriod: "month", card: "Brex" },
  { name: "ChatGPT", kind: "Personal", cost: 20, billingPeriod: "month", card: null },
  { name: "Cursor", kind: "Personal", cost: 20, billingPeriod: "month", card: null },
  { name: "Notability", kind: "Personal", cost: 19.99, billingPeriod: "year", card: null },
  { name: "iCloud+", kind: "Personal", cost: 1, billingPeriod: "month", card: null, detail: "50 GB" },
  { name: "Bookends", kind: "Personal", cost: 30, billingPeriod: "year", card: null, detail: "Reading app", estimated: true },
];

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

function monthLabel(value: string) {
  return new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(
    new Date(`${value}-01T12:00:00`),
  );
}

function moveMonth(value: string, amount: number) {
  const date = new Date(`${value}-01T12:00:00`);
  date.setMonth(date.getMonth() + amount);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function money(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}

async function jsonFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
  });
  const payload = (await response.json()) as T & { error?: string };
  if (!response.ok) throw new Error(payload.error || "Request failed.");
  return payload;
}

export default function BudgetTool() {
  const [dashboard, setDashboard] = useState<BudgetDashboard | null>(null);
  const [password, setPassword] = useState("");
  const [month, setMonth] = useState(currentMonth);
  const [status, setStatus] = useState<"checking" | "locked" | "ready">("checking");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<BudgetAccount[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [newCategory, setNewCategory] = useState("");

  const loadDashboard = useCallback(async (targetMonth = month) => {
    try {
      const data = await jsonFetch<BudgetDashboard>(`/api/tools/budget/dashboard?month=${targetMonth}`);
      setDashboard(data);
      setAccounts(data.accounts);
      setSelectedIds(data.accounts.filter((account) => account.selected).map((account) => account.plaidAccountId));
      setStatus("ready");
      setError(null);
    } catch (loadError) {
      if (loadError instanceof Error && loadError.message === "Unlock the budget to continue.") {
        setStatus("locked");
      } else {
        setError(loadError instanceof Error ? loadError.message : "Unable to load the budget.");
      }
    }
  }, [month]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    if (!window.location.search.includes("oauth_state_id=")) return;
    const token = window.localStorage.getItem("budget_plaid_link_token");
    if (!token) return;
    void openPlaidLink(token, window.location.href);
    // OAuth re-entry should only run once for the redirect that Plaid supplies.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function unlock(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await jsonFetch("/api/tools/budget/session", {
        method: "POST",
        body: JSON.stringify({ password }),
      });
      setPassword("");
      await loadDashboard();
    } catch (unlockError) {
      setError(unlockError instanceof Error ? unlockError.message : "Unable to unlock the budget.");
    } finally {
      setLoading(false);
    }
  }

  function loadPlaidScript() {
    return new Promise<void>((resolve, reject) => {
      if (window.Plaid) return resolve();
      const existing = document.querySelector<HTMLScriptElement>('script[data-plaid-link="true"]');
      if (existing) {
        existing.addEventListener("load", () => resolve(), { once: true });
        existing.addEventListener("error", () => reject(new Error("Unable to load Plaid Link.")), { once: true });
        return;
      }
      const script = document.createElement("script");
      script.src = "https://cdn.plaid.com/link/v2/stable/link-initialize.js";
      script.async = true;
      script.dataset.plaidLink = "true";
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Unable to load Plaid Link."));
      document.head.appendChild(script);
    });
  }

  async function openPlaidLink(linkToken?: string, receivedRedirectUri?: string) {
    setLoading(true);
    setError(null);
    try {
      const token = linkToken || (await jsonFetch<{ linkToken: string }>("/api/tools/budget/link-token", { method: "POST" })).linkToken;
      window.localStorage.setItem("budget_plaid_link_token", token);
      await loadPlaidScript();
      if (!window.Plaid) throw new Error("Plaid Link did not initialize.");
      window.Plaid.create({
        token,
        ...(receivedRedirectUri ? { receivedRedirectUri } : {}),
        onSuccess: (publicToken, metadata) => {
          void completePlaidLink(publicToken, metadata.accounts);
        },
        onExit: (plaidError) => {
          if (plaidError) setError(plaidError.display_message || plaidError.error_message || "Wells Fargo connection was canceled.");
          setLoading(false);
        },
      }).open();
    } catch (linkError) {
      setError(linkError instanceof Error ? linkError.message : "Unable to start Wells Fargo connection.");
      setLoading(false);
    }
  }

  async function completePlaidLink(publicToken: string, linkedAccounts: { id: string; name?: string; mask?: string | null; type?: string; subtype?: string | null }[]) {
    try {
      const result = await jsonFetch<{ accounts: BudgetAccount[] }>("/api/tools/budget/exchange", {
        method: "POST",
        body: JSON.stringify({ publicToken, accounts: linkedAccounts }),
      });
      window.localStorage.removeItem("budget_plaid_link_token");
      window.history.replaceState({}, "", "/tools/budget");
      setAccounts(result.accounts);
      setSelectedIds([]);
      setDashboard((current) => current ? { ...current, connected: true, needsAccountSelection: true, accounts: result.accounts } : current);
    } catch (exchangeError) {
      setError(exchangeError instanceof Error ? exchangeError.message : "Unable to save Wells Fargo connection.");
    } finally {
      setLoading(false);
    }
  }

  async function saveAccounts() {
    if (selectedIds.length === 0) {
      setError("Choose at least one account to include.");
      return;
    }
    setLoading(true);
    try {
      await jsonFetch("/api/tools/budget/accounts", {
        method: "POST",
        body: JSON.stringify({ accountIds: selectedIds }),
      });
      await jsonFetch("/api/tools/budget/sync", { method: "POST", body: "{}" });
      await loadDashboard();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save account choices.");
    } finally {
      setLoading(false);
    }
  }

  async function sync() {
    setLoading(true);
    try {
      await jsonFetch("/api/tools/budget/sync", { method: "POST", body: "{}" });
      await loadDashboard();
    } catch (syncError) {
      setError(syncError instanceof Error ? syncError.message : "Unable to sync transactions.");
    } finally {
      setLoading(false);
    }
  }

  async function disconnect() {
    if (!window.confirm("Disconnect this bank item and delete its imported transactions from this budget?")) return;
    setLoading(true);
    try {
      const result = await jsonFetch<{ remoteRemovalFailed: boolean }>("/api/tools/budget/connection", { method: "DELETE" });
      setDashboard(null);
      setAccounts([]);
      setSelectedIds([]);
      setError(result.remoteRemovalFailed ? "The local connection was removed. Plaid could not confirm remote removal, so revoke it in Plaid or Wells Fargo as well." : null);
    } catch (disconnectError) {
      setError(disconnectError instanceof Error ? disconnectError.message : "Unable to disconnect the account.");
    } finally {
      setLoading(false);
    }
  }

  async function changeCategory(transactionId: number, categoryId: number, saveRule = false) {
    try {
      await jsonFetch(`/api/tools/budget/transactions/${transactionId}`, {
        method: "PATCH",
        body: JSON.stringify({ categoryId, saveRule }),
      });
      await loadDashboard();
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Unable to update category.");
    }
  }

  async function addCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      await jsonFetch("/api/tools/budget/categories", { method: "POST", body: JSON.stringify({ name: newCategory }) });
      setNewCategory("");
      await loadDashboard();
    } catch (categoryError) {
      setError(categoryError instanceof Error ? categoryError.message : "Unable to create category.");
    }
  }

  if (status === "checking") {
    return <p className="border-y border-border py-5 text-sm text-text-secondary">Loading your budget…</p>;
  }

  if (status === "locked") {
    return (
      <p className="border-y border-border py-5 text-sm text-text-secondary">
        {error || "Unable to load the budget."}
      </p>
    );
  }

  if (!dashboard?.connected) {
    return <ConnectState loading={loading} error={error} onConnect={() => void openPlaidLink()} />;
  }

  if (dashboard.needsAccountSelection) {
    return <AccountSelection accounts={accounts} selectedIds={selectedIds} setSelectedIds={setSelectedIds} loading={loading} error={error} onSave={() => void saveAccounts()} onDisconnect={() => void disconnect()} />;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3 border-y border-border py-4">
        <div className="flex items-center gap-1">
          <button aria-label="Previous month" onClick={() => { const next = moveMonth(month, -1); setMonth(next); void loadDashboard(next); }} className="p-2 text-text-secondary hover:text-foreground"><ChevronLeft className="h-4 w-4" /></button>
          <p className="min-w-40 text-center font-semibold">{monthLabel(month)}</p>
          <button aria-label="Next month" disabled={month >= currentMonth()} onClick={() => { const next = moveMonth(month, 1); setMonth(next); void loadDashboard(next); }} className="p-2 text-text-secondary hover:text-foreground disabled:opacity-30"><ChevronRight className="h-4 w-4" /></button>
        </div>
        <div className="flex gap-2"><button onClick={() => void sync()} disabled={loading} className="inline-flex h-9 items-center gap-2 border border-border px-3 text-sm font-semibold hover:border-foreground disabled:opacity-60">
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh transactions
        </button><button onClick={() => void disconnect()} disabled={loading} className="h-9 border border-border px-3 text-sm font-semibold text-text-secondary hover:border-foreground hover:text-foreground disabled:opacity-60">Disconnect account</button></div>
      </div>
      {error && <p className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      <div className="grid gap-4 sm:grid-cols-3">
        <Metric label="Spent this month" value={money(dashboard.totalSpending)} />
        <Metric label="Posted transactions" value={String(dashboard.transactionCount)} />
        <Metric label="Included accounts" value={String(dashboard.accounts.filter((account) => account.selected).length)} />
      </div>
      <Subscriptions subscriptions={SUBSCRIPTIONS} />
      <div className="grid gap-6">
        <CategoryChart totals={dashboard.categoryTotals} />
        <TrendChart totals={dashboard.monthlyTotals} />
      </div>
      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div><h2 className="text-xl font-semibold">Transactions</h2><p className="text-sm text-text-secondary">Change a category once, then remember it for future purchases.</p></div>
          <form onSubmit={addCategory} className="flex gap-2">
            <input value={newCategory} onChange={(event) => setNewCategory(event.target.value)} placeholder="New category" className="w-36 border border-border px-2 py-1.5 text-sm outline-none focus:border-foreground" />
            <button className="border border-border px-3 text-sm font-semibold hover:border-foreground"><Tags className="inline h-3.5 w-3.5" /> Add</button>
          </form>
        </div>
        <div className="border-t border-border">
          {dashboard.transactions.length === 0 ? <p className="py-5 text-sm text-text-secondary">No transactions for this month yet.</p> : dashboard.transactions.map((transaction) => (
            <div key={transaction.id} className="grid gap-2 border-b border-border py-3 md:grid-cols-[minmax(0,1fr)_10rem_8rem_7rem] md:items-center">
              <div className="min-w-0"><p className="truncate font-semibold">{transaction.merchant}</p><p className="text-xs text-text-secondary">{transaction.occurredOn} · {transaction.account}{transaction.pending ? " · Pending" : ""}</p></div>
              <select value={transaction.categoryId || ""} onChange={(event) => void changeCategory(transaction.id, Number(event.target.value))} className="border border-border bg-background px-2 py-1.5 text-sm outline-none focus:border-foreground">
                {dashboard.categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
              </select>
              <button onClick={() => transaction.categoryId && void changeCategory(transaction.id, transaction.categoryId, true)} disabled={!transaction.categoryId} className="text-left text-xs font-semibold text-text-secondary underline underline-offset-2 hover:text-foreground disabled:no-underline disabled:opacity-30">Remember merchant</button>
              <p className="text-right font-semibold">{money(transaction.amount)}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function ConnectState({ loading, error, onConnect }: { loading: boolean; error: string | null; onConnect: () => void }) {
  return <div className="max-w-2xl border-y border-border py-8"><Link2 className="mb-4 h-6 w-6 text-text-secondary" /><h2 className="text-xl font-semibold">Connect Wells Fargo</h2><p className="mt-2 max-w-xl leading-relaxed text-text-secondary">Link your shared debit or checking account through Wells Fargo’s secure sign-in flow. This app never sees or stores your Wells Fargo password.</p>{error && <p className="mt-4 text-sm text-red-700">{error}</p>}<button disabled={loading} onClick={onConnect} className="mt-5 inline-flex h-11 items-center gap-2 bg-foreground px-4 text-sm font-semibold text-background disabled:opacity-60">{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />} Connect Wells Fargo</button></div>;
}

function AccountSelection({ accounts, selectedIds, setSelectedIds, loading, error, onSave, onDisconnect }: { accounts: BudgetAccount[]; selectedIds: string[]; setSelectedIds: (ids: string[]) => void; loading: boolean; error: string | null; onSave: () => void; onDisconnect: () => void }) {
  return <div className="max-w-2xl border-y border-border py-8"><h2 className="text-xl font-semibold">Choose accounts to include</h2><p className="mt-2 text-text-secondary">Only selected accounts will appear in your shared spending dashboard.</p><div className="mt-5 border-t border-border">{accounts.map((account) => { const checked = selectedIds.includes(account.plaidAccountId); return <label key={account.plaidAccountId} className="flex cursor-pointer items-center justify-between gap-4 border-b border-border py-4"><span><span className="block font-semibold">{account.name}{account.mask ? ` ··${account.mask}` : ""}</span><span className="text-sm text-text-secondary">{[account.type, account.subtype].filter(Boolean).join(" · ")}</span></span><input type="checkbox" checked={checked} onChange={() => setSelectedIds(checked ? selectedIds.filter((id) => id !== account.plaidAccountId) : [...selectedIds, account.plaidAccountId])} className="h-4 w-4 accent-black" /></label>; })}</div>{error && <p className="mt-4 text-sm text-red-700">{error}</p>}<div className="mt-5 flex flex-wrap gap-3"><button disabled={loading || selectedIds.length === 0} onClick={onSave} className="inline-flex h-11 items-center gap-2 bg-foreground px-4 text-sm font-semibold text-background disabled:opacity-60">{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Save and import 90 days</button><button disabled={loading} onClick={onDisconnect} className="h-11 border border-border px-4 text-sm font-semibold text-text-secondary hover:border-foreground hover:text-foreground">Disconnect account</button></div></div>;
}

function Metric({ label, value }: { label: string; value: string }) { return <div className="border border-border p-4"><p className="text-sm font-semibold text-text-secondary">{label}</p><p className="mt-2 text-2xl font-semibold">{value}</p></div>; }

function Subscriptions({ subscriptions }: { subscriptions: Subscription[] }) {
  const monthlyEquivalent = subscriptions.reduce(
    (total, subscription) => total + (subscription.cost === null ? 0 : subscription.cost / (subscription.billingPeriod === "year" ? 12 : 1)),
    0,
  );

  return (
    <section className="border border-border p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-text-secondary" />
            <h2 className="text-lg font-semibold">Subscriptions</h2>
          </div>
          <p className="mt-1 text-sm text-text-secondary">Maintained manually, separate from Plaid transactions.</p>
        </div>
        <div className="text-right">
          <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">Est. monthly equivalent</p>
          <p className="mt-1 text-xl font-semibold">{money(monthlyEquivalent)}</p>
        </div>
      </div>
      <div className="mt-5 border-t border-border">
        {subscriptions.map((subscription) => (
          <div key={`${subscription.kind}-${subscription.name}`} className="grid gap-2 border-b border-border py-3 sm:grid-cols-[minmax(0,1fr)_8rem_10rem_7rem] sm:items-center">
            <div>
              <p className="font-semibold">{subscription.name}</p>
              {subscription.detail && <p className="text-xs text-text-secondary">{subscription.detail}</p>}
            </div>
            <p className="text-sm text-text-secondary">{subscription.kind}</p>
            <p className="text-sm">
              <span className="sm:hidden">Card: </span>
              {subscription.card || <span className="text-text-secondary">Not specified</span>}
            </p>
            <p className="font-semibold sm:text-right">
              {subscription.cost === null
                ? <span className="text-sm font-normal text-text-secondary">Price not specified</span>
                : `${subscription.estimated ? "~" : ""}${money(subscription.cost)}/${subscription.billingPeriod === "year" ? "yr" : "mo"}`}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function CategoryChart({ totals }: { totals: BudgetDashboard["categoryTotals"] }) {
  const total = totals.reduce((sum, item) => sum + item.total, 0);
  const segments = totals.map((item, index) => {
    const start = totals.slice(0, index).reduce(
      (sum, previous) => sum + (total ? (previous.total / total) * 100 : 0),
      0,
    );
    const end = start + (total ? (item.total / total) * 100 : 0);
    return `${CHART_COLORS[index % CHART_COLORS.length]} ${start}% ${end}%`;
  });
  return <section className="border border-border p-5"><h2 className="text-lg font-semibold">Spending by category</h2>{total === 0 ? <p className="mt-6 text-sm text-text-secondary">Transactions will appear here after your first sync.</p> : <div className="mt-5 grid gap-6 sm:grid-cols-[10rem_1fr] sm:items-center"><div className="relative mx-auto h-40 w-40 rounded-full" style={{ background: `conic-gradient(${segments.join(",")})` }}><div className="absolute inset-8 flex items-center justify-center rounded-full bg-background text-center text-sm font-semibold">{money(total)}</div></div><div className="space-y-2">{totals.slice(0, 6).map((item, index) => <div key={item.categoryId} className="flex items-center justify-between gap-3 text-sm"><span className="flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-full" style={{ background: CHART_COLORS[index % CHART_COLORS.length] }} />{item.name}</span><span className="font-semibold">{money(item.total)}</span></div>)}</div></div>}</section>;
}

function TrendChart({ totals }: { totals: BudgetDashboard["monthlyTotals"] }) {
  const max = Math.max(...totals.map((item) => item.total), 1);
  return <section className="border border-border p-5"><h2 className="text-lg font-semibold">Six-month spending</h2>{totals.length === 0 ? <p className="mt-6 text-sm text-text-secondary">Monthly history will appear after your first sync.</p> : <div className="mt-6 flex h-44 items-stretch gap-3">{totals.map((item) => <div key={item.month} className="flex min-w-0 flex-1 flex-col gap-2 text-center"><div className="flex min-h-0 flex-1 items-end justify-center"><div className="relative min-h-1 w-full bg-[#dbe9e8]" style={{ height: `${Math.max((item.total / max) * 100, 3)}%` }}><span className="absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs font-semibold">{money(item.total)}</span></div></div><span className="text-xs text-text-secondary">{new Date(`${item.month}-01T12:00:00`).toLocaleString("en-US", { month: "short" })}</span></div>)}</div>}</section>;
}
