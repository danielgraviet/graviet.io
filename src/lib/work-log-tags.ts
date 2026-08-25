import { neon } from "@neondatabase/serverless";
import { ensureWorkLogSchema } from "./work-log";

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

export function suggestTagsByKeyword(
  text: string,
  vocabulary: string[],
): string[] {
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

type GroqChatCompletion = {
  choices?: { message?: { content?: string | null } }[];
  error?: { message?: string };
};

async function suggestTagsWithGroq(
  text: string,
  vocabulary: string[],
): Promise<string[]> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY is not configured.");
  }

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.GROQ_TAGGING_MODEL || "openai/gpt-oss-20b",
      messages: [
        {
          role: "system",
          content: [
            "Classify the work-log entry using only the allowed tag vocabulary.",
            "Return zero to five relevant tags.",
            "Prefer fewer precise tags and never invent a tag.",
          ].join(" "),
        },
        {
          role: "user",
          content: JSON.stringify({
            allowedTags: vocabulary,
            entry: text.slice(0, 8_000),
          }),
        },
      ],
      reasoning_effort: "low",
      max_completion_tokens: 200,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "work_log_tags",
          strict: true,
          schema: {
            type: "object",
            properties: {
              tags: {
                type: "array",
                items: { type: "string", enum: vocabulary },
                maxItems: 5,
              },
            },
            required: ["tags"],
            additionalProperties: false,
          },
        },
      },
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(8_000),
  });

  const payload = (await response.json()) as GroqChatCompletion;
  if (!response.ok) {
    throw new Error(payload.error?.message || `Groq request failed with status ${response.status}.`);
  }

  const content = payload.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("Groq returned no tag suggestions.");
  }

  const parsed = JSON.parse(content) as { tags?: unknown };
  if (!Array.isArray(parsed.tags)) {
    throw new Error("Groq returned an invalid tag list.");
  }

  const allowed = new Set(vocabulary);
  return [...new Set(parsed.tags)]
    .filter((tag): tag is string => typeof tag === "string" && allowed.has(tag))
    .slice(0, 5);
}

/**
 * Suggest tags with Groq, falling back to local vocabulary matching whenever
 * Groq is unconfigured, unavailable, or returns an invalid result.
 */
export async function suggestTags(
  text: string,
  knownTags?: string[],
): Promise<string[]> {
  const vocabulary = knownTags ?? (await listKnownTags());
  if (!text.trim() || vocabulary.length === 0) {
    return [];
  }

  if (!process.env.GROQ_API_KEY) {
    return suggestTagsByKeyword(text, vocabulary);
  }

  try {
    return await suggestTagsWithGroq(text, vocabulary);
  } catch (error) {
    console.error("Groq work-log tagging failed; using keyword fallback.", error);
    return suggestTagsByKeyword(text, vocabulary);
  }
}
