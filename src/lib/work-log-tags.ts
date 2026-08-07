import { neon } from "@neondatabase/serverless";
import { ensureWorkLogSchema } from "@/lib/work-log";

function sql() {
  const url = process.env.DATABASE_URL;

  if (!url) {
    throw new Error("DATABASE_URL is not configured.");
  }

  return neon(url);
}

/**
 * Returns tags already used in the work log, sorted by frequency then name.
 */
export async function listKnownTags(): Promise<string[]> {
  await ensureWorkLogSchema();
  const db = sql();
  const rows = (await db`
    SELECT tag, count(*)::int AS uses
    FROM work_log_entries, unnest(tags) AS tag
    GROUP BY tag
    ORDER BY uses DESC, tag ASC
  `) as unknown as { tag: string; uses: number }[];

  return rows.map((row) => row.tag);
}

function tokenize(text: string): Set<string> {
  const tokens = text
    .toLowerCase()
    .split(/[^a-z0-9+#./-]+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 2);

  return new Set(tokens);
}

/**
 * Suggest tags for an entry.
 *
 * v1: vocabulary overlap against known tags (and multi-word tag phrases).
 * Swap this implementation later for an LLM call — callers stay the same.
 */
export async function suggestTags(
  text: string,
  knownTags?: string[],
): Promise<string[]> {
  const vocabulary = knownTags ?? (await listKnownTags());
  if (!text.trim() || vocabulary.length === 0) {
    return [];
  }

  const haystack = text.toLowerCase();
  const tokens = tokenize(text);
  const scored: { tag: string; score: number }[] = [];

  for (const tag of vocabulary) {
    const normalized = tag.trim().toLowerCase();
    if (!normalized) continue;

    let score = 0;
    if (haystack.includes(normalized)) {
      score += 3;
    }

    const tagTokens = tokenize(normalized);
    let overlap = 0;
    for (const token of tagTokens) {
      if (tokens.has(token)) overlap += 1;
    }
    if (tagTokens.size > 0 && overlap === tagTokens.size) {
      score += 2;
    } else if (overlap > 0) {
      score += overlap;
    }

    if (score > 0) {
      scored.push({ tag: normalized, score });
    }
  }

  scored.sort((a, b) => b.score - a.score || a.tag.localeCompare(b.tag));
  return scored.slice(0, 8).map((item) => item.tag);
}
