/**
 * One-off: import last month of GitHub commits into work_log_entries.
 * Groups by date + repo into resume-friendly daily entries.
 *
 * Usage: bun scripts/import-github-work-log.mjs
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { neon } from "@neondatabase/serverless";

function loadEnvLocal() {
  const path = resolve(process.cwd(), ".env.local");
  const text = readFileSync(path, "utf8");
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

function ghCommits() {
  const result = spawnSync(
    "gh",
    [
      "api",
      "--paginate",
      "search/commits?q=author:danielgraviet+committer-date:>=2026-07-07&sort=committer-date&order=desc&per_page=100",
      "--jq",
      ".items[] | {date: .commit.author.date[0:10], repo: .repository.name, message: (.commit.message | split(\"\\n\")[0])}",
    ],
    { encoding: "utf8", maxBuffer: 20 * 1024 * 1024 },
  );

  if (result.status !== 0) {
    throw new Error(result.stderr || "gh api failed");
  }

  // paginate can emit multiple JSON objects / arrays; normalize line-delimited objects
  const raw = result.stdout.trim();
  if (!raw) return [];

  // gh --paginate with --jq emitting objects prints one JSON value per item, but
  // sometimes concatenates. Parse robustly by matching {...} lines or NDJSON.
  const items = [];
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) items.push(...parsed);
      else items.push(parsed);
    } catch {
      // ignore non-json lines
    }
  }
  return items;
}

function isNoise(message) {
  const m = message.trim().toLowerCase();
  if (!m) return true;
  if (m.startsWith("merge pull request")) return true;
  if (m.startsWith("merge branch")) return true;
  if (m === "changes" || m === "testing" || m === "init commit") return true;
  if (m === "update readme.md" || m === "updated md files") return true;
  if (m === "deleted test file") return true;
  return false;
}

function normalizeTags(tags) {
  const seen = new Set();
  const out = [];
  for (const tag of tags) {
    const value = tag.trim().toLowerCase();
    if (!value || seen.has(value)) continue;
    seen.add(value);
    out.push(value);
  }
  return out;
}

function tagsForRepo(repo) {
  const base = ["github", repo];
  const extras = {
    "go-explore": ["agents", "daytona", "research"],
    "graviet.io": ["nextjs", "personal-site"],
    gunterinjurylaw: ["client-work", "nextjs"],
    "arm64-benchmark-1": ["benchmarks", "arm64", "python"],
    patterns_in_modern_python: ["python", "learning"],
    "modal-cerebrium": ["infra", "modal"],
    darrenasay: ["client-work", "nextjs", "photography"],
    danielgraviet: ["github-profile"],
  };
  return normalizeTags([...(extras[repo] ?? []), ...base]);
}

function titleFor(repo, messages) {
  if (messages.length === 1) {
    return `${repo}: ${messages[0]}`.slice(0, 120);
  }
  return `${repo}: ${messages.length} commits`;
}

async function ensureSchema(sql) {
  await sql`
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
  await sql`CREATE INDEX IF NOT EXISTS work_log_entries_search_idx ON work_log_entries USING GIN (search_vector)`;
  await sql`CREATE INDEX IF NOT EXISTS work_log_entries_tags_idx ON work_log_entries USING GIN (tags)`;
  await sql`CREATE INDEX IF NOT EXISTS work_log_entries_occurred_on_idx ON work_log_entries (occurred_on DESC)`;
}

async function main() {
  loadEnvLocal();
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL missing from .env.local");
  }

  const commits = ghCommits();
  console.log(`Fetched ${commits.length} commits`);

  /** @type {Map<string, { date: string, repo: string, messages: string[] }>} */
  const groups = new Map();

  for (const commit of commits) {
    if (!commit?.date || !commit?.repo || !commit?.message) continue;
    if (isNoise(commit.message)) continue;
    const key = `${commit.date}::${commit.repo}`;
    const existing = groups.get(key);
    if (existing) {
      if (!existing.messages.includes(commit.message)) {
        existing.messages.push(commit.message);
      }
    } else {
      groups.set(key, {
        date: commit.date,
        repo: commit.repo,
        messages: [commit.message],
      });
    }
  }

  const entries = [...groups.values()].sort((a, b) =>
    a.date === b.date
      ? a.repo.localeCompare(b.repo)
      : a.date < b.date
        ? -1
        : 1,
  );

  console.log(`Prepared ${entries.length} work-log entries (grouped by day+repo)`);

  const sql = neon(process.env.DATABASE_URL);
  await ensureSchema(sql);

  // Avoid duplicate imports: skip if an entry already exists for same day+title
  const existing = await sql`
    SELECT occurred_on::text AS occurred_on, title
    FROM work_log_entries
    WHERE tags @> ARRAY['github']::text[]
  `;
  const existingKeys = new Set(
    existing.map((row) => `${String(row.occurred_on).slice(0, 10)}::${row.title}`),
  );

  let inserted = 0;
  let skipped = 0;

  for (const entry of entries) {
    const title = titleFor(entry.repo, entry.messages);
    const key = `${entry.date}::${title}`;
    if (existingKeys.has(key)) {
      skipped += 1;
      continue;
    }

    const body = [
      `Imported from GitHub activity in ${entry.repo}.`,
      "",
      ...entry.messages.map((m) => `- ${m}`),
    ].join("\n");
    const tags = tagsForRepo(entry.repo);

    await sql`
      INSERT INTO work_log_entries (occurred_on, title, body, tags, search_vector)
      VALUES (
        ${entry.date}::date,
        ${title},
        ${body},
        ${tags},
        setweight(to_tsvector('english', coalesce(${title}, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(${body}, '')), 'B') ||
        setweight(to_tsvector('english', coalesce(array_to_string(${tags}::text[], ' '), '')), 'C')
      )
    `;
    inserted += 1;
    console.log(`+ ${entry.date}  ${title}`);
  }

  console.log(`Done. inserted=${inserted} skipped=${skipped}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
