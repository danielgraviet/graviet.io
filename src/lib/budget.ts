import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { neon } from "@neondatabase/serverless";

export const STARTER_CATEGORIES = [
  "Gas & Fuel",
  "Groceries",
  "Dining",
  "Flights",
  "Travel",
  "Bills",
  "Shopping",
  "Health",
  "Entertainment",
  "Other",
] as const;

export type BudgetAccount = {
  id: number;
  plaidAccountId: string;
  name: string;
  mask: string | null;
  type: string | null;
  subtype: string | null;
  selected: boolean;
};

export type BudgetCategory = { id: number; name: string };

export type BudgetTransaction = {
  id: number;
  occurredOn: string;
  amount: number;
  merchant: string;
  pending: boolean;
  categoryId: number | null;
  category: string;
  account: string;
};

export type BudgetDashboard = {
  connected: boolean;
  needsAccountSelection: boolean;
  accounts: BudgetAccount[];
  categories: BudgetCategory[];
  totalSpending: number;
  transactionCount: number;
  categoryTotals: { categoryId: number; name: string; total: number }[];
  monthlyTotals: { month: string; total: number }[];
  transactions: BudgetTransaction[];
};

type BudgetItemRow = {
  id: number;
  plaid_item_id: string;
  access_token_encrypted: string;
  sync_cursor: string | null;
};

type PlaidAccount = {
  id: string;
  name?: string;
  mask?: string | null;
  type?: string;
  subtype?: string | null;
};

type PlaidTransaction = {
  transaction_id: string;
  account_id: string;
  date: string;
  authorized_date?: string | null;
  amount: number;
  merchant_name?: string | null;
  name?: string | null;
  pending?: boolean;
  personal_finance_category?: { primary?: string | null; detailed?: string | null } | null;
};

function sql() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not configured.");
  return neon(url);
}

function encryptionKey() {
  const value = process.env.BUDGET_TOKEN_ENCRYPTION_KEY;
  if (!value) throw new Error("BUDGET_TOKEN_ENCRYPTION_KEY is not configured.");
  const key = Buffer.from(value, "base64");
  if (key.length !== 32) {
    throw new Error("BUDGET_TOKEN_ENCRYPTION_KEY must be a base64-encoded 32-byte key.");
  }
  return key;
}

export function encryptBudgetToken(value: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv, tag, encrypted].map((part) => part.toString("base64url")).join(".");
}

export function decryptBudgetToken(value: string) {
  const [ivRaw, tagRaw, encryptedRaw] = value.split(".");
  if (!ivRaw || !tagRaw || !encryptedRaw) throw new Error("Invalid encrypted budget token.");
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), Buffer.from(ivRaw, "base64url"));
  decipher.setAuthTag(Buffer.from(tagRaw, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(encryptedRaw, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}

let schemaReady: Promise<void> | null = null;

export async function ensureBudgetSchema() {
  if (!schemaReady) {
    schemaReady = (async () => {
      const db = sql();
      await db`CREATE TABLE IF NOT EXISTS budget_items (
        id serial PRIMARY KEY,
        plaid_item_id text NOT NULL UNIQUE,
        access_token_encrypted text NOT NULL,
        sync_cursor text,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )`;
      await db`CREATE TABLE IF NOT EXISTS budget_accounts (
        id serial PRIMARY KEY,
        item_id integer NOT NULL REFERENCES budget_items(id) ON DELETE CASCADE,
        plaid_account_id text NOT NULL UNIQUE,
        name text NOT NULL,
        mask text,
        type text,
        subtype text,
        selected boolean NOT NULL DEFAULT false,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )`;
      await db`CREATE TABLE IF NOT EXISTS budget_categories (
        id serial PRIMARY KEY,
        name text NOT NULL UNIQUE,
        created_at timestamptz NOT NULL DEFAULT now()
      )`;
      await db`CREATE TABLE IF NOT EXISTS budget_merchant_rules (
        id serial PRIMARY KEY,
        merchant_key text NOT NULL UNIQUE,
        category_id integer NOT NULL REFERENCES budget_categories(id) ON DELETE CASCADE,
        updated_at timestamptz NOT NULL DEFAULT now()
      )`;
      await db`CREATE TABLE IF NOT EXISTS budget_transactions (
        id serial PRIMARY KEY,
        plaid_transaction_id text NOT NULL UNIQUE,
        account_id integer NOT NULL REFERENCES budget_accounts(id) ON DELETE CASCADE,
        occurred_on date NOT NULL,
        authorized_on date,
        amount numeric(14,2) NOT NULL,
        merchant_name text NOT NULL,
        pending boolean NOT NULL DEFAULT false,
        plaid_category text,
        category_id integer REFERENCES budget_categories(id) ON DELETE SET NULL,
        manual_category_id integer REFERENCES budget_categories(id) ON DELETE SET NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )`;
      await db`CREATE INDEX IF NOT EXISTS budget_transactions_occurred_on_idx ON budget_transactions (occurred_on DESC)`;
      await db`CREATE INDEX IF NOT EXISTS budget_transactions_account_idx ON budget_transactions (account_id)`;
      for (const category of STARTER_CATEGORIES) {
        await db`INSERT INTO budget_categories (name) VALUES (${category}) ON CONFLICT (name) DO NOTHING`;
      }
    })().catch((error) => {
      schemaReady = null;
      throw error;
    });
  }
  await schemaReady;
}

export async function listBudgetCategories(): Promise<BudgetCategory[]> {
  await ensureBudgetSchema();
  const rows = (await sql()`SELECT id, name FROM budget_categories ORDER BY name`) as BudgetCategory[];
  return rows;
}

export async function createBudgetCategory(name: unknown): Promise<BudgetCategory> {
  if (typeof name !== "string" || !/^[\p{L}\p{N}& /-]{2,48}$/u.test(name.trim())) {
    throw new Error("Category names must be 2–48 characters.");
  }
  await ensureBudgetSchema();
  const rows = (await sql()`INSERT INTO budget_categories (name) VALUES (${name.trim()})
    ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
    RETURNING id, name`) as BudgetCategory[];
  return rows[0]!;
}

export async function listBudgetAccounts(): Promise<BudgetAccount[]> {
  await ensureBudgetSchema();
  const rows = (await sql()`SELECT id, plaid_account_id, name, mask, type, subtype, selected
    FROM budget_accounts ORDER BY created_at`) as {
      id: number;
      plaid_account_id: string;
      name: string;
      mask: string | null;
      type: string | null;
      subtype: string | null;
      selected: boolean;
    }[];
  return rows.map((row) => ({
    id: row.id,
    plaidAccountId: row.plaid_account_id,
    name: row.name,
    mask: row.mask,
    type: row.type,
    subtype: row.subtype,
    selected: row.selected,
  }));
}

export async function storePlaidItem(input: {
  itemId: string;
  accessToken: string;
  accounts: PlaidAccount[];
}) {
  await ensureBudgetSchema();
  const db = sql();
  const rows = (await db`INSERT INTO budget_items (plaid_item_id, access_token_encrypted)
    VALUES (${input.itemId}, ${encryptBudgetToken(input.accessToken)})
    ON CONFLICT (plaid_item_id) DO UPDATE SET access_token_encrypted = EXCLUDED.access_token_encrypted, updated_at = now()
    RETURNING id`) as { id: number }[];
  const itemId = rows[0]!.id;
  for (const account of input.accounts) {
    await db`INSERT INTO budget_accounts (item_id, plaid_account_id, name, mask, type, subtype)
      VALUES (${itemId}, ${account.id}, ${account.name || "Wells Fargo account"}, ${account.mask || null}, ${account.type || null}, ${account.subtype || null})
      ON CONFLICT (plaid_account_id) DO UPDATE SET
        item_id = EXCLUDED.item_id, name = EXCLUDED.name, mask = EXCLUDED.mask,
        type = EXCLUDED.type, subtype = EXCLUDED.subtype, updated_at = now()`;
  }
  return listBudgetAccounts();
}

export async function setSelectedBudgetAccounts(plaidAccountIds: unknown) {
  if (!Array.isArray(plaidAccountIds) || !plaidAccountIds.every((id) => typeof id === "string")) {
    throw new Error("Select at least one account.");
  }
  await ensureBudgetSchema();
  const ids = [...new Set(plaidAccountIds)];
  if (ids.length === 0) throw new Error("Select at least one account.");
  const db = sql();
  const valid = (await db`SELECT plaid_account_id FROM budget_accounts WHERE plaid_account_id = ANY(${ids})`) as { plaid_account_id: string }[];
  if (valid.length !== ids.length) throw new Error("An unknown account was selected.");
  await db`UPDATE budget_accounts SET selected = plaid_account_id = ANY(${ids}), updated_at = now()`;
  return listBudgetAccounts();
}

function merchantKey(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().slice(0, 180);
}

function mapPlaidCategory(value: string | null | undefined) {
  const category = value?.toLowerCase() || "";
  if (category.includes("gas") || category.includes("fuel")) return "Gas & Fuel";
  if (category.includes("grocery")) return "Groceries";
  if (category.includes("restaurant") || category.includes("dining")) return "Dining";
  if (category.includes("airline") || category.includes("flight")) return "Flights";
  if (category.includes("travel") || category.includes("lodging")) return "Travel";
  if (category.includes("utility") || category.includes("bill")) return "Bills";
  if (category.includes("medical") || category.includes("health")) return "Health";
  if (category.includes("entertainment")) return "Entertainment";
  if (category.includes("shop") || category.includes("retail")) return "Shopping";
  return "Other";
}

async function categoryByName(name: string) {
  const rows = (await sql()`SELECT id, name FROM budget_categories WHERE name = ${name}`) as BudgetCategory[];
  return rows[0] ?? null;
}

export async function syncBudgetTransactions() {
  await ensureBudgetSchema();
  const db = sql();
  const items = (await db`SELECT id, plaid_item_id, access_token_encrypted, sync_cursor FROM budget_items`) as BudgetItemRow[];
  let changed = 0;
  for (const item of items) {
    const accessToken = decryptBudgetToken(item.access_token_encrypted);
    let cursor = item.sync_cursor || "";
    let hasMore = true;
    const added: PlaidTransaction[] = [];
    const modified: PlaidTransaction[] = [];
    const removed: { transaction_id: string }[] = [];
    while (hasMore) {
      const response = await plaidRequest<{
        added: PlaidTransaction[];
        modified: PlaidTransaction[];
        removed: { transaction_id: string }[];
        next_cursor: string;
        has_more: boolean;
      }>("/transactions/sync", { access_token: accessToken, cursor });
      added.push(...response.added);
      modified.push(...response.modified);
      removed.push(...response.removed);
      cursor = response.next_cursor;
      hasMore = response.has_more;
    }
    const accounts = await listBudgetAccounts();
    const accountByPlaid = new Map(accounts.map((account) => [account.plaidAccountId, account]));
    for (const transaction of [...added, ...modified]) {
      const account = accountByPlaid.get(transaction.account_id);
      if (!account || !account.selected) continue;
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 90);
      const date = new Date(`${transaction.date}T00:00:00Z`);
      if (Number.isNaN(date.getTime()) || date < cutoff) continue;
      const merchant = transaction.merchant_name || transaction.name || "Unknown merchant";
      const key = merchantKey(merchant);
      const ruleRows = key
        ? (await db`SELECT category_id FROM budget_merchant_rules WHERE merchant_key = ${key}`) as { category_id: number }[]
        : [];
      const mapped = await categoryByName(
        mapPlaidCategory(
          transaction.personal_finance_category?.detailed ?? transaction.personal_finance_category?.primary,
        ),
      );
      const ruleCategoryId = ruleRows[0]?.category_id ?? null;
      await db`INSERT INTO budget_transactions (
        plaid_transaction_id, account_id, occurred_on, authorized_on, amount, merchant_name,
        pending, plaid_category, category_id
      ) VALUES (
        ${transaction.transaction_id}, ${account.id}, ${transaction.date}, ${transaction.authorized_date || null},
        ${transaction.amount}, ${merchant}, ${Boolean(transaction.pending)},
        ${transaction.personal_finance_category?.primary || null}, ${ruleCategoryId ?? mapped?.id ?? null}
      ) ON CONFLICT (plaid_transaction_id) DO UPDATE SET
        account_id = EXCLUDED.account_id, occurred_on = EXCLUDED.occurred_on,
        authorized_on = EXCLUDED.authorized_on, amount = EXCLUDED.amount,
        merchant_name = EXCLUDED.merchant_name, pending = EXCLUDED.pending,
        plaid_category = EXCLUDED.plaid_category,
        category_id = CASE WHEN budget_transactions.manual_category_id IS NULL THEN EXCLUDED.category_id ELSE budget_transactions.category_id END,
        updated_at = now()`;
      changed += 1;
    }
    for (const transaction of removed) {
      await db`DELETE FROM budget_transactions WHERE plaid_transaction_id = ${transaction.transaction_id}`;
    }
    await db`UPDATE budget_items SET sync_cursor = ${cursor}, updated_at = now() WHERE id = ${item.id}`;
  }
  return { changed };
}

export async function updateBudgetTransaction(input: {
  id: unknown;
  categoryId: unknown;
  saveRule?: unknown;
}) {
  if (!Number.isInteger(input.id) || !Number.isInteger(input.categoryId)) {
    throw new Error("Invalid transaction or category.");
  }
  await ensureBudgetSchema();
  const db = sql();
  const categories = (await db`SELECT id FROM budget_categories WHERE id = ${input.categoryId}`) as { id: number }[];
  if (!categories[0]) throw new Error("Unknown category.");
  const rows = (await db`UPDATE budget_transactions SET manual_category_id = ${input.categoryId}, category_id = ${input.categoryId}, updated_at = now()
    WHERE id = ${input.id} RETURNING merchant_name`) as { merchant_name: string }[];
  if (!rows[0]) throw new Error("Unknown transaction.");
  if (input.saveRule === true) {
    const key = merchantKey(rows[0].merchant_name);
    if (key) {
      await db`INSERT INTO budget_merchant_rules (merchant_key, category_id) VALUES (${key}, ${input.categoryId})
        ON CONFLICT (merchant_key) DO UPDATE SET category_id = EXCLUDED.category_id, updated_at = now()`;
    }
  }
}

function isMonth(value: string | null | undefined): value is string {
  return Boolean(value && /^\d{4}-(0[1-9]|1[0-2])$/.test(value));
}

export async function getBudgetDashboard(month?: string | null): Promise<BudgetDashboard> {
  await ensureBudgetSchema();
  const selectedMonth = isMonth(month) ? month : new Date().toISOString().slice(0, 7);
  const accounts = await listBudgetAccounts();
  const categories = await listBudgetCategories();
  const connected = accounts.length > 0;
  const needsAccountSelection = connected && !accounts.some((account) => account.selected);
  const db = sql();
  const totalRows = (await db`SELECT COALESCE(SUM(amount), 0)::float AS total, count(*)::int AS count
    FROM budget_transactions t JOIN budget_accounts a ON a.id = t.account_id
    WHERE a.selected = true AND t.pending = false AND t.amount > 0 AND to_char(t.occurred_on, 'YYYY-MM') = ${selectedMonth}`) as { total: number; count: number }[];
  const categoryRows = (await db`SELECT c.id AS category_id, c.name, COALESCE(SUM(t.amount), 0)::float AS total
    FROM budget_transactions t JOIN budget_accounts a ON a.id = t.account_id
    JOIN budget_categories c ON c.id = COALESCE(t.manual_category_id, t.category_id)
    WHERE a.selected = true AND t.pending = false AND t.amount > 0 AND to_char(t.occurred_on, 'YYYY-MM') = ${selectedMonth}
    GROUP BY c.id, c.name ORDER BY total DESC`) as { category_id: number; name: string; total: number }[];
  const transactionRows = (await db`SELECT t.id, t.occurred_on, t.amount::float AS amount, t.merchant_name, t.pending,
      COALESCE(c.name, 'Other') AS category, c.id AS category_id, a.name AS account
    FROM budget_transactions t JOIN budget_accounts a ON a.id = t.account_id
    LEFT JOIN budget_categories c ON c.id = COALESCE(t.manual_category_id, t.category_id)
    WHERE a.selected = true AND t.amount > 0 AND to_char(t.occurred_on, 'YYYY-MM') = ${selectedMonth}
    ORDER BY t.occurred_on DESC, t.id DESC LIMIT 200`) as {
      id: number; occurred_on: string; amount: number; merchant_name: string; pending: boolean;
      category: string; category_id: number | null; account: string;
    }[];
  const trendRows = (await db`SELECT to_char(date_trunc('month', t.occurred_on), 'YYYY-MM') AS month,
      COALESCE(SUM(t.amount), 0)::float AS total
    FROM budget_transactions t JOIN budget_accounts a ON a.id = t.account_id
    WHERE a.selected = true AND t.pending = false AND t.amount > 0 AND t.occurred_on >= (date_trunc('month', CURRENT_DATE) - interval '5 months')
    GROUP BY 1 ORDER BY 1`) as { month: string; total: number }[];
  return {
    connected,
    needsAccountSelection,
    accounts,
    categories,
    totalSpending: totalRows[0]?.total ?? 0,
    transactionCount: totalRows[0]?.count ?? 0,
    categoryTotals: categoryRows.map((row) => ({ categoryId: row.category_id, name: row.name, total: row.total })),
    monthlyTotals: trendRows,
    transactions: transactionRows.map((row) => ({
      id: row.id,
      occurredOn: String(row.occurred_on).slice(0, 10),
      amount: row.amount,
      merchant: row.merchant_name,
      pending: row.pending,
      categoryId: row.category_id,
      category: row.category,
      account: row.account,
    })),
  };
}

function plaidBaseUrl() {
  const env = process.env.PLAID_ENV || "sandbox";
  if (env === "production") return "https://production.plaid.com";
  if (env === "development") return "https://development.plaid.com";
  return "https://sandbox.plaid.com";
}

export async function plaidRequest<T>(path: string, payload: Record<string, unknown>): Promise<T> {
  const clientId = process.env.PLAID_CLIENT_ID;
  const secret = process.env.PLAID_SECRET;
  if (!clientId || !secret) throw new Error("Plaid is not configured. Add PLAID_CLIENT_ID and PLAID_SECRET.");
  const response = await fetch(`${plaidBaseUrl()}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ client_id: clientId, secret, ...payload }),
    cache: "no-store",
  });
  const body = (await response.json()) as T & { error_message?: string };
  if (!response.ok) throw new Error(body.error_message || "Plaid request failed.");
  return body;
}
