import { neon } from "@neondatabase/serverless";

export type WorkLogEntry = {
  id: number;
  occurredOn: string;
  title: string;
  body: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
};

export type WorkLogStreak = {
  current: number;
  longest: number;
  loggedToday: boolean;
  lastLoggedOn: string | null;
};

type WorkLogRow = {
  id: number;
  occurred_on: string;
  title: string;
  body: string;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
};

function sql() {
  const url = process.env.DATABASE_URL;

  if (!url) {
    throw new Error("DATABASE_URL is not configured.");
  }

  return neon(url);
}

function mapRow(row: WorkLogRow): WorkLogEntry {
  return {
    id: row.id,
    occurredOn: String(row.occurred_on).slice(0, 10),
    title: row.title,
    body: row.body,
    tags: Array.isArray(row.tags) ? row.tags : [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function normalizeTags(tags: unknown): string[] {
  if (!Array.isArray(tags)) {
    return [];
  }

  const seen = new Set<string>();
  const normalized: string[] = [];

  for (const tag of tags) {
    if (typeof tag !== "string") continue;
    const value = tag.trim().toLowerCase();
    if (!value || seen.has(value)) continue;
    seen.add(value);
    normalized.push(value);
  }

  return normalized;
}

export function isValidDateString(value: unknown): value is string {
  if (typeof value !== "string") return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function shiftDate(dateStr: string, days: number): string {
  const date = new Date(`${dateStr}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function isWorkday(dateStr: string): boolean {
  const day = new Date(`${dateStr}T00:00:00.000Z`).getUTCDay();
  return day !== 0 && day !== 6;
}

function shiftToWorkday(dateStr: string, direction: -1 | 1): string {
  let cursor = shiftDate(dateStr, direction);
  while (!isWorkday(cursor)) {
    cursor = shiftDate(cursor, direction);
  }
  return cursor;
}

export function computeStreak(
  loggedDates: string[],
  today: string,
): WorkLogStreak {
  const unique = [...new Set(loggedDates.map((d) => d.slice(0, 10)))].filter(isWorkday).sort(
    (a, b) => (a < b ? 1 : a > b ? -1 : 0),
  );

  const lastLoggedOn = unique[0] ?? null;
  const loggedToday = unique.includes(today);
  const mostRecentWorkday = isWorkday(today) ? today : shiftToWorkday(today, -1);
  const previousWorkday = shiftToWorkday(mostRecentWorkday, -1);

  let current = 0;
  if (unique.includes(mostRecentWorkday)) {
    let cursor = mostRecentWorkday;
    while (unique.includes(cursor)) {
      current += 1;
      cursor = shiftToWorkday(cursor, -1);
    }
  } else if (unique.includes(previousWorkday)) {
    let cursor = previousWorkday;
    while (unique.includes(cursor)) {
      current += 1;
      cursor = shiftToWorkday(cursor, -1);
    }
  }

  let longest = 0;
  let run = 0;
  let prev: string | null = null;

  for (const date of [...unique].sort()) {
    if (prev && date === shiftToWorkday(prev, 1)) {
      run += 1;
    } else {
      run = 1;
    }
    longest = Math.max(longest, run);
    prev = date;
  }

  return {
    current,
    longest,
    loggedToday,
    lastLoggedOn,
  };
}

let schemaReady: Promise<void> | null = null;

export async function ensureWorkLogSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = (async () => {
      const db = sql();

      // to_tsvector is STABLE, so it can't be used in a GENERATED column.
      // Maintain search_vector on insert/update instead.
      await db`
        CREATE TABLE IF NOT EXISTS work_log_entries (
          id serial PRIMARY KEY,
          occurred_on date NOT NULL DEFAULT CURRENT_DATE,
          title text NOT NULL DEFAULT '',
          body text NOT NULL DEFAULT '',
          tags text[] NOT NULL DEFAULT '{}',
          search_vector tsvector NOT NULL DEFAULT '',
          created_at timestamptz NOT NULL DEFAULT now(),
          updated_at timestamptz NOT NULL DEFAULT now()
        )
      `;

      await db`
        CREATE INDEX IF NOT EXISTS work_log_entries_search_idx
        ON work_log_entries USING GIN (search_vector)
      `;

      await db`
        CREATE INDEX IF NOT EXISTS work_log_entries_tags_idx
        ON work_log_entries USING GIN (tags)
      `;

      await db`
        CREATE INDEX IF NOT EXISTS work_log_entries_occurred_on_idx
        ON work_log_entries (occurred_on DESC)
      `;
    })().catch((error) => {
      schemaReady = null;
      throw error;
    });
  }

  await schemaReady;
}

export const WORK_LOG_PAGE_SIZE = 7;

export type WorkLogListResult = {
  entries: WorkLogEntry[];
  total: number;
  page: number;
  pageSize: number;
};

export async function listWorkLogEntries(options?: {
  query?: string;
  tag?: string;
  limit?: number;
  page?: number;
}): Promise<WorkLogListResult> {
  await ensureWorkLogSchema();
  const db = sql();
  const pageSize = Math.max(1, options?.limit ?? WORK_LOG_PAGE_SIZE);
  const page = Math.max(1, options?.page ?? 1);
  const offset = (page - 1) * pageSize;
  const query = options?.query?.trim() ?? "";
  const tag = options?.tag?.trim().toLowerCase() ?? "";

  let total = 0;
  let rows: WorkLogRow[];

  if (query && tag) {
    const countRows = (await db`
      SELECT count(*)::int AS count
      FROM work_log_entries
      WHERE search_vector @@ websearch_to_tsquery('english', ${query})
        AND tags @> ARRAY[${tag}]::text[]
    `) as unknown as { count: number }[];
    total = countRows[0]?.count ?? 0;

    rows = (await db`
      SELECT id, occurred_on, title, body, tags, created_at, updated_at
      FROM work_log_entries
      WHERE search_vector @@ websearch_to_tsquery('english', ${query})
        AND tags @> ARRAY[${tag}]::text[]
      ORDER BY ts_rank(search_vector, websearch_to_tsquery('english', ${query})) DESC,
        occurred_on DESC, id DESC
      LIMIT ${pageSize} OFFSET ${offset}
    `) as unknown as WorkLogRow[];
  } else if (query) {
    const countRows = (await db`
      SELECT count(*)::int AS count
      FROM work_log_entries
      WHERE search_vector @@ websearch_to_tsquery('english', ${query})
    `) as unknown as { count: number }[];
    total = countRows[0]?.count ?? 0;

    rows = (await db`
      SELECT id, occurred_on, title, body, tags, created_at, updated_at
      FROM work_log_entries
      WHERE search_vector @@ websearch_to_tsquery('english', ${query})
      ORDER BY ts_rank(search_vector, websearch_to_tsquery('english', ${query})) DESC,
        occurred_on DESC, id DESC
      LIMIT ${pageSize} OFFSET ${offset}
    `) as unknown as WorkLogRow[];
  } else if (tag) {
    const countRows = (await db`
      SELECT count(*)::int AS count
      FROM work_log_entries
      WHERE tags @> ARRAY[${tag}]::text[]
    `) as unknown as { count: number }[];
    total = countRows[0]?.count ?? 0;

    rows = (await db`
      SELECT id, occurred_on, title, body, tags, created_at, updated_at
      FROM work_log_entries
      WHERE tags @> ARRAY[${tag}]::text[]
      ORDER BY occurred_on DESC, id DESC
      LIMIT ${pageSize} OFFSET ${offset}
    `) as unknown as WorkLogRow[];
  } else {
    const countRows = (await db`
      SELECT count(*)::int AS count
      FROM work_log_entries
    `) as unknown as { count: number }[];
    total = countRows[0]?.count ?? 0;

    rows = (await db`
      SELECT id, occurred_on, title, body, tags, created_at, updated_at
      FROM work_log_entries
      ORDER BY occurred_on DESC, id DESC
      LIMIT ${pageSize} OFFSET ${offset}
    `) as unknown as WorkLogRow[];
  }

  return {
    entries: rows.map(mapRow),
    total,
    page,
    pageSize,
  };
}

export async function getWorkLogStreak(today: string): Promise<WorkLogStreak> {
  await ensureWorkLogSchema();
  const db = sql();
  const rows = (await db`
    SELECT DISTINCT occurred_on::text AS occurred_on
    FROM work_log_entries
    ORDER BY occurred_on DESC
  `) as unknown as { occurred_on: string }[];

  return computeStreak(
    rows.map((row) => String(row.occurred_on).slice(0, 10)),
    today,
  );
}

export async function createWorkLogEntry(input: {
  title: string;
  body: string;
  tags?: string[];
  occurredOn?: string;
}): Promise<WorkLogEntry> {
  await ensureWorkLogSchema();
  const db = sql();
  const tags = normalizeTags(input.tags ?? []);
  const occurredOn = input.occurredOn ?? new Date().toISOString().slice(0, 10);

  const rows = (await db`
    INSERT INTO work_log_entries (occurred_on, title, body, tags, search_vector)
    VALUES (
      ${occurredOn}::date,
      ${input.title},
      ${input.body},
      ${tags},
      setweight(to_tsvector('english', coalesce(${input.title}, '')), 'A') ||
      setweight(to_tsvector('english', coalesce(${input.body}, '')), 'B') ||
      setweight(to_tsvector('english', coalesce(array_to_string(${tags}::text[], ' '), '')), 'C')
    )
    RETURNING id, occurred_on, title, body, tags, created_at, updated_at
  `) as unknown as WorkLogRow[];

  return mapRow(rows[0]);
}

export async function updateWorkLogEntry(
  id: number,
  input: Partial<{
    title: string;
    body: string;
    tags: string[];
    occurredOn: string;
  }>,
): Promise<WorkLogEntry | null> {
  await ensureWorkLogSchema();
  const db = sql();
  const title = input.title ?? null;
  const body = input.body ?? null;
  const occurredOn = input.occurredOn ?? null;

  let rows: WorkLogRow[];

  if (input.tags !== undefined) {
    const tags = normalizeTags(input.tags);
    rows = (await db`
      UPDATE work_log_entries SET
        title = COALESCE(${title}, title),
        body = COALESCE(${body}, body),
        tags = ${tags},
        occurred_on = COALESCE(${occurredOn}::date, occurred_on),
        search_vector =
          setweight(to_tsvector('english', coalesce(COALESCE(${title}, title), '')), 'A') ||
          setweight(to_tsvector('english', coalesce(COALESCE(${body}, body), '')), 'B') ||
          setweight(to_tsvector('english', coalesce(array_to_string(${tags}::text[], ' '), '')), 'C'),
        updated_at = now()
      WHERE id = ${id}
      RETURNING id, occurred_on, title, body, tags, created_at, updated_at
    `) as unknown as WorkLogRow[];
  } else {
    rows = (await db`
      UPDATE work_log_entries SET
        title = COALESCE(${title}, title),
        body = COALESCE(${body}, body),
        occurred_on = COALESCE(${occurredOn}::date, occurred_on),
        search_vector =
          setweight(to_tsvector('english', coalesce(COALESCE(${title}, title), '')), 'A') ||
          setweight(to_tsvector('english', coalesce(COALESCE(${body}, body), '')), 'B') ||
          setweight(to_tsvector('english', coalesce(array_to_string(tags, ' '), '')), 'C'),
        updated_at = now()
      WHERE id = ${id}
      RETURNING id, occurred_on, title, body, tags, created_at, updated_at
    `) as unknown as WorkLogRow[];
  }

  return rows[0] ? mapRow(rows[0]) : null;
}

export async function deleteWorkLogEntry(id: number): Promise<void> {
  await ensureWorkLogSchema();
  const db = sql();
  await db`DELETE FROM work_log_entries WHERE id = ${id}`;
}
