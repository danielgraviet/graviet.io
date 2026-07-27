import { neon } from "@neondatabase/serverless";

export type RoadmapItemState = {
  done: boolean;
  level: string;
};

export type LearningRoadmapState = {
  items: Record<string, RoadmapItemState>;
  noteLinks: Record<string, string>;
};

export type LearningRoadmapProgress = {
  state: LearningRoadmapState;
  updatedAt: string | null;
};

type ProgressRow = {
  state: unknown;
  updated_at: string;
};

const USER_ID = "default";

export function defaultLearningRoadmapState(): LearningRoadmapState {
  return { items: {}, noteLinks: {} };
}

export function normalizeLearningRoadmapState(
  value: unknown,
): LearningRoadmapState {
  const input = value && typeof value === "object" ? value : {};
  const itemsInput = "items" in input ? input.items : {};
  const noteLinksInput = "noteLinks" in input ? input.noteLinks : {};
  const items: Record<string, RoadmapItemState> = {};
  const noteLinks: Record<string, string> = {};

  if (itemsInput && typeof itemsInput === "object") {
    for (const [key, item] of Object.entries(itemsInput)) {
      if (!item || typeof item !== "object") continue;

      const done = "done" in item ? item.done : false;
      const level = "level" in item ? item.level : "Learning";

      items[key] = {
        done: typeof done === "boolean" ? done : false,
        level: typeof level === "string" ? level : "Learning",
      };
    }
  }

  if (noteLinksInput && typeof noteLinksInput === "object") {
    for (const [key, url] of Object.entries(noteLinksInput)) {
      if (typeof url === "string" && url.trim()) {
        noteLinks[key] = url.trim();
      }
    }
  }

  return { items, noteLinks };
}

function sql() {
  const url = process.env.DATABASE_URL;

  if (!url) {
    throw new Error("DATABASE_URL is not configured.");
  }

  return neon(url);
}

async function ensureTable() {
  const db = sql();

  await db`
    CREATE TABLE IF NOT EXISTS learning_roadmap_progress (
      user_id text PRIMARY KEY,
      state jsonb NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `;
}

export async function getLearningRoadmapProgress(): Promise<LearningRoadmapProgress> {
  await ensureTable();
  const db = sql();
  const rows = (await db`
    SELECT state, updated_at
    FROM learning_roadmap_progress
    WHERE user_id = ${USER_ID}
    LIMIT 1
  `) as unknown as ProgressRow[];

  if (!rows[0]) {
    return { state: defaultLearningRoadmapState(), updatedAt: null };
  }

  return {
    state: normalizeLearningRoadmapState(rows[0].state),
    updatedAt: rows[0].updated_at,
  };
}

export async function saveLearningRoadmapProgress(
  state: LearningRoadmapState,
): Promise<LearningRoadmapProgress> {
  await ensureTable();
  const db = sql();
  const normalized = normalizeLearningRoadmapState(state);
  const rows = (await db`
    INSERT INTO learning_roadmap_progress (user_id, state)
    VALUES (${USER_ID}, ${JSON.stringify(normalized)}::jsonb)
    ON CONFLICT (user_id) DO UPDATE SET
      state = EXCLUDED.state,
      updated_at = now()
    RETURNING state, updated_at
  `) as unknown as ProgressRow[];

  return {
    state: normalizeLearningRoadmapState(rows[0]?.state),
    updatedAt: rows[0]?.updated_at ?? null,
  };
}
