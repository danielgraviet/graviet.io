import { neon } from "@neondatabase/serverless";
import {
  INBOX_SUBJECT,
  INBOX_SUBJECT_SLUG,
  RUNTIME_CURRICULUM,
  RUNTIME_SUBJECT,
  RUNTIME_SUBJECT_SLUG,
  progressKey,
} from "@/lib/learn/curriculum";
import { applySm2, newCardSchedule, type LearnRating, type Sm2State } from "@/lib/learn/sm2";
import { getLearningRoadmapProgress } from "@/lib/learning-roadmap-progress";
import { listConcepts } from "@/lib/roadmap";

export type TopicKind = "topic" | "project" | "custom";
export type TopicStatus = "todo" | "learning" | "known";
export type MasteryLevel = "learning" | "practiced" | "proficient" | "mastered";
export type CardSource = "manual" | "parsed" | "tutor";

export type LearnSubject = {
  id: number;
  slug: string;
  title: string;
  description: string;
  dueCount: number;
  topicCount: number;
};

export type LearnDomain = {
  id: number;
  slug: string;
  title: string;
  goal: string;
  resources: string;
  sortOrder: number;
  topics: LearnTopic[];
};

export type LearnTopic = {
  id: number;
  subjectId: number;
  domainId: number | null;
  title: string;
  kind: TopicKind;
  sortOrder: number;
  status: TopicStatus;
  mastery: MasteryLevel;
  notes: string;
  resources: string;
  noteLink: string;
  dueCount: number;
  cardCount: number;
  createdAt: string;
  updatedAt: string;
};

export type LearnCard = {
  id: number;
  topicId: number | null;
  subjectId: number;
  front: string;
  back: string;
  source: CardSource;
  ease: number;
  intervalDays: number;
  repetitions: number;
  lapses: number;
  dueAt: string;
  lastReviewedAt: string | null;
  createdAt: string;
};

export type LearnStreak = {
  current: number;
  longest: number;
  reviewedToday: boolean;
  lastReviewedOn: string | null;
};

export type LearnStats = {
  due: number;
  streak: LearnStreak;
};

function sql() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not configured.");
  return neon(url);
}

let schemaReady: Promise<void> | null = null;

export async function ensureLearnSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = (async () => {
      const db = sql();

      await db`
        CREATE TABLE IF NOT EXISTS learn_subjects (
          id serial PRIMARY KEY,
          slug text NOT NULL UNIQUE,
          title text NOT NULL,
          description text NOT NULL DEFAULT '',
          created_at timestamptz NOT NULL DEFAULT now()
        )
      `;

      await db`
        CREATE TABLE IF NOT EXISTS learn_domains (
          id serial PRIMARY KEY,
          subject_id integer NOT NULL REFERENCES learn_subjects(id) ON DELETE CASCADE,
          slug text NOT NULL,
          title text NOT NULL,
          goal text NOT NULL DEFAULT '',
          resources text NOT NULL DEFAULT '',
          sort_order integer NOT NULL DEFAULT 0,
          UNIQUE (subject_id, slug)
        )
      `;

      await db`
        CREATE TABLE IF NOT EXISTS learn_topics (
          id serial PRIMARY KEY,
          subject_id integer NOT NULL REFERENCES learn_subjects(id) ON DELETE CASCADE,
          domain_id integer REFERENCES learn_domains(id) ON DELETE SET NULL,
          title text NOT NULL,
          kind text NOT NULL DEFAULT 'custom',
          sort_order integer NOT NULL DEFAULT 0,
          status text NOT NULL DEFAULT 'todo',
          mastery text NOT NULL DEFAULT 'learning',
          notes text NOT NULL DEFAULT '',
          resources text NOT NULL DEFAULT '',
          note_link text NOT NULL DEFAULT '',
          created_at timestamptz NOT NULL DEFAULT now(),
          updated_at timestamptz NOT NULL DEFAULT now()
        )
      `;

      await db`
        CREATE TABLE IF NOT EXISTS learn_cards (
          id serial PRIMARY KEY,
          topic_id integer REFERENCES learn_topics(id) ON DELETE CASCADE,
          subject_id integer NOT NULL REFERENCES learn_subjects(id) ON DELETE CASCADE,
          front text NOT NULL,
          back text NOT NULL,
          source text NOT NULL DEFAULT 'manual',
          ease double precision NOT NULL DEFAULT 2.5,
          interval_days double precision NOT NULL DEFAULT 0,
          repetitions integer NOT NULL DEFAULT 0,
          lapses integer NOT NULL DEFAULT 0,
          due_at timestamptz NOT NULL DEFAULT now(),
          last_reviewed_at timestamptz,
          created_at timestamptz NOT NULL DEFAULT now()
        )
      `;

      await db`
        CREATE TABLE IF NOT EXISTS learn_reviews (
          id serial PRIMARY KEY,
          card_id integer NOT NULL REFERENCES learn_cards(id) ON DELETE CASCADE,
          rating text NOT NULL,
          reviewed_at timestamptz NOT NULL DEFAULT now()
        )
      `;

      await db`
        CREATE TABLE IF NOT EXISTS learn_review_days (
          reviewed_on date PRIMARY KEY
        )
      `;

      await db`CREATE INDEX IF NOT EXISTS learn_cards_due_idx ON learn_cards (due_at)`;
      await db`CREATE INDEX IF NOT EXISTS learn_topics_subject_idx ON learn_topics (subject_id, domain_id)`;

      await db`
        CREATE TABLE IF NOT EXISTS learn_meta (
          key text PRIMARY KEY,
          value text NOT NULL
        )
      `;

      await seedCurriculum();
      await migrateLegacyProgress();
      await migrateLegacyConcepts();
    })().catch((error) => {
      schemaReady = null;
      throw error;
    });
  }

  await schemaReady;
}

type SubjectRow = { id: number; slug: string; title: string; description: string };

async function getSubjectBySlug(slug: string): Promise<SubjectRow | null> {
  const db = sql();
  const rows = (await db`
    SELECT id, slug, title, description FROM learn_subjects WHERE slug = ${slug} LIMIT 1
  `) as unknown as SubjectRow[];
  return rows[0] ?? null;
}

async function seedCurriculum() {
  const db = sql();

  let runtime = await getSubjectBySlug(RUNTIME_SUBJECT_SLUG);
  if (!runtime) {
    const created = (await db`
      INSERT INTO learn_subjects (slug, title, description)
      VALUES (${RUNTIME_SUBJECT.slug}, ${RUNTIME_SUBJECT.title}, ${RUNTIME_SUBJECT.description})
      RETURNING id, slug, title, description
    `) as unknown as SubjectRow[];
    runtime = created[0];
  }

  let inbox = await getSubjectBySlug(INBOX_SUBJECT_SLUG);
  if (!inbox) {
    await db`
      INSERT INTO learn_subjects (slug, title, description)
      VALUES (${INBOX_SUBJECT.slug}, ${INBOX_SUBJECT.title}, ${INBOX_SUBJECT.description})
    `;
  }

  for (const [index, domain] of RUNTIME_CURRICULUM.entries()) {
    const existing = (await db`
      SELECT id FROM learn_domains
      WHERE subject_id = ${runtime.id} AND slug = ${domain.id}
      LIMIT 1
    `) as unknown as { id: number }[];

    let domainId = existing[0]?.id;
    const resources = domain.resources.join("\n");

    if (!domainId) {
      const inserted = (await db`
        INSERT INTO learn_domains (subject_id, slug, title, goal, resources, sort_order)
        VALUES (${runtime.id}, ${domain.id}, ${domain.title}, ${domain.goal}, ${resources}, ${index})
        RETURNING id
      `) as unknown as { id: number }[];
      domainId = inserted[0].id;
    }

    const topicCount = (await db`
      SELECT count(*)::int AS count FROM learn_topics WHERE domain_id = ${domainId}
    `) as unknown as { count: number }[];

    const expected = domain.items.length + domain.projects.length;
    if ((topicCount[0]?.count ?? 0) >= expected) continue;

    for (const [itemIndex, title] of domain.items.entries()) {
      await db`
        INSERT INTO learn_topics (subject_id, domain_id, title, kind, sort_order)
        SELECT ${runtime.id}, ${domainId}, ${title}, 'topic', ${itemIndex}
        WHERE NOT EXISTS (
          SELECT 1 FROM learn_topics
          WHERE domain_id = ${domainId} AND kind = 'topic' AND sort_order = ${itemIndex}
        )
      `;
    }

    for (const [itemIndex, title] of domain.projects.entries()) {
      await db`
        INSERT INTO learn_topics (subject_id, domain_id, title, kind, sort_order)
        SELECT ${runtime.id}, ${domainId}, ${title}, 'project', ${itemIndex}
        WHERE NOT EXISTS (
          SELECT 1 FROM learn_topics
          WHERE domain_id = ${domainId} AND kind = 'project' AND sort_order = ${itemIndex}
        )
      `;
    }
  }
}

function mapMastery(level: string): MasteryLevel {
  const value = level.trim().toLowerCase();
  if (value === "practiced") return "practiced";
  if (value === "proficient") return "proficient";
  if (value === "mastered") return "mastered";
  return "learning";
}

async function markMeta(key: string) {
  const db = sql();
  await db`
    INSERT INTO learn_meta (key, value) VALUES (${key}, '1')
    ON CONFLICT (key) DO NOTHING
  `;
}

async function hasMeta(key: string): Promise<boolean> {
  const db = sql();
  const rows = (await db`
    SELECT value FROM learn_meta WHERE key = ${key} LIMIT 1
  `) as unknown as { value: string }[];
  return Boolean(rows[0]);
}

async function migrateLegacyProgress() {
  if (await hasMeta("progress_imported")) return;

  const db = sql();
  const marker = await getSubjectBySlug(RUNTIME_SUBJECT_SLUG);
  if (!marker) return;

  let progress;
  try {
    progress = await getLearningRoadmapProgress();
  } catch {
    return;
  }

  const domainRows = (await db`
    SELECT id, slug FROM learn_domains WHERE subject_id = ${marker.id}
  `) as unknown as { id: number; slug: string }[];
  const domainBySlug = new Map(domainRows.map((row) => [row.slug, row.id]));

  for (const domain of RUNTIME_CURRICULUM) {
    const domainId = domainBySlug.get(domain.id);
    if (!domainId) continue;

    const kinds: Array<{ kind: "topic" | "project"; titles: string[] }> = [
      { kind: "topic", titles: domain.items },
      { kind: "project", titles: domain.projects },
    ];

    for (const { kind, titles } of kinds) {
      for (const [index, title] of titles.entries()) {
        const key = progressKey(domain.id, kind, index);
        const item = progress.state.items[key];
        const noteLink = progress.state.noteLinks[key] ?? "";
        if (!item && !noteLink) continue;

        const status: TopicStatus = item?.done ? "known" : "todo";
        const mastery = item ? mapMastery(item.level) : "learning";

        await db`
          UPDATE learn_topics SET
            status = ${status},
            mastery = ${mastery},
            note_link = ${noteLink},
            updated_at = now()
          WHERE domain_id = ${domainId} AND kind = ${kind} AND sort_order = ${index} AND title = ${title}
        `;
      }
    }
  }

  await markMeta("progress_imported");
}

async function migrateLegacyConcepts() {
  if (await hasMeta("concepts_imported")) return;

  const inbox = await getSubjectBySlug(INBOX_SUBJECT_SLUG);
  if (!inbox) return;

  const db = sql();

  let concepts;
  try {
    concepts = await listConcepts();
  } catch {
    return;
  }

  for (const concept of concepts) {
    const status: TopicStatus =
      concept.status === "known"
        ? "known"
        : concept.status === "learning"
          ? "learning"
          : "todo";

    await db`
      INSERT INTO learn_topics (subject_id, title, kind, status, notes, resources)
      SELECT ${inbox.id}, ${concept.title}, 'custom', ${status}, ${concept.notes}, ${concept.resources}
      WHERE NOT EXISTS (
        SELECT 1 FROM learn_topics
        WHERE subject_id = ${inbox.id} AND title = ${concept.title} AND kind = 'custom'
      )
    `;
  }

  await markMeta("concepts_imported");
}

type TopicRow = {
  id: number;
  subject_id: number;
  domain_id: number | null;
  title: string;
  kind: string;
  sort_order: number;
  status: string;
  mastery: string;
  notes: string;
  resources: string;
  note_link: string;
  created_at: string;
  updated_at: string;
  due_count?: number;
  card_count?: number;
};

function mapTopic(row: TopicRow): LearnTopic {
  return {
    id: row.id,
    subjectId: row.subject_id,
    domainId: row.domain_id,
    title: row.title,
    kind: row.kind as TopicKind,
    sortOrder: row.sort_order,
    status: row.status as TopicStatus,
    mastery: row.mastery as MasteryLevel,
    notes: row.notes,
    resources: row.resources,
    noteLink: row.note_link,
    dueCount: row.due_count ?? 0,
    cardCount: row.card_count ?? 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

type CardRow = {
  id: number;
  topic_id: number | null;
  subject_id: number;
  front: string;
  back: string;
  source: string;
  ease: number;
  interval_days: number;
  repetitions: number;
  lapses: number;
  due_at: string;
  last_reviewed_at: string | null;
  created_at: string;
};

function mapCard(row: CardRow): LearnCard {
  return {
    id: row.id,
    topicId: row.topic_id,
    subjectId: row.subject_id,
    front: row.front,
    back: row.back,
    source: row.source as CardSource,
    ease: Number(row.ease),
    intervalDays: Number(row.interval_days),
    repetitions: row.repetitions,
    lapses: row.lapses,
    dueAt: row.due_at,
    lastReviewedAt: row.last_reviewed_at,
    createdAt: row.created_at,
  };
}

function shiftDate(dateStr: string, days: number): string {
  const date = new Date(`${dateStr}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function computeReviewStreak(dates: string[], today: string): LearnStreak {
  const unique = [...new Set(dates.map((d) => d.slice(0, 10)))].sort(
    (a, b) => (a < b ? 1 : a > b ? -1 : 0),
  );
  const lastReviewedOn = unique[0] ?? null;
  const reviewedToday = unique.includes(today);
  const yesterday = shiftDate(today, -1);

  let current = 0;
  if (reviewedToday || unique.includes(yesterday)) {
    let cursor = reviewedToday ? today : yesterday;
    while (unique.includes(cursor)) {
      current += 1;
      cursor = shiftDate(cursor, -1);
    }
  }

  let longest = 0;
  let run = 0;
  let prev: string | null = null;
  for (const date of [...unique].sort()) {
    if (prev && date === shiftDate(prev, 1)) run += 1;
    else run = 1;
    longest = Math.max(longest, run);
    prev = date;
  }

  return { current, longest, reviewedToday, lastReviewedOn };
}

export async function listSubjects(): Promise<LearnSubject[]> {
  await ensureLearnSchema();
  const db = sql();
  const rows = (await db`
    SELECT
      s.id, s.slug, s.title, s.description,
      (SELECT count(*)::int FROM learn_topics t WHERE t.subject_id = s.id) AS topic_count,
      (
        SELECT count(*)::int FROM learn_cards c
        WHERE c.subject_id = s.id AND c.due_at <= now()
      ) AS due_count
    FROM learn_subjects s
    ORDER BY CASE s.slug
      WHEN ${RUNTIME_SUBJECT_SLUG} THEN 0
      WHEN ${INBOX_SUBJECT_SLUG} THEN 2
      ELSE 1
    END, s.title
  `) as unknown as Array<SubjectRow & { topic_count: number; due_count: number }>;

  return rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    topicCount: row.topic_count,
    dueCount: row.due_count,
  }));
}

export async function createSubject(input: {
  title: string;
  description?: string;
}): Promise<LearnSubject> {
  await ensureLearnSchema();
  const db = sql();
  const base =
    input.title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "subject";

  let slug = base;
  let attempt = 1;
  for (;;) {
    const existing = (await db`
      SELECT id FROM learn_subjects WHERE slug = ${slug} LIMIT 1
    `) as unknown as { id: number }[];
    if (existing.length === 0) break;
    attempt += 1;
    slug = `${base}-${attempt}`;
  }

  const rows = (await db`
    INSERT INTO learn_subjects (slug, title, description)
    VALUES (${slug}, ${input.title.trim()}, ${input.description?.trim() ?? ""})
    RETURNING id, slug, title, description
  `) as unknown as SubjectRow[];

  return { ...rows[0], dueCount: 0, topicCount: 0 };
}

export async function getSubjectDetail(slug: string): Promise<{
  subject: LearnSubject;
  domains: LearnDomain[];
  inboxTopics: LearnTopic[];
} | null> {
  await ensureLearnSchema();
  const db = sql();
  const subjects = await listSubjects();
  const subject = subjects.find((item) => item.slug === slug);
  if (!subject) return null;

  const domainRows = (await db`
    SELECT id, slug, title, goal, resources, sort_order
    FROM learn_domains
    WHERE subject_id = ${subject.id}
    ORDER BY sort_order, id
  `) as unknown as Array<{
    id: number;
    slug: string;
    title: string;
    goal: string;
    resources: string;
    sort_order: number;
  }>;

  const topicRows = (await db`
    SELECT
      t.*,
      (
        SELECT count(*)::int FROM learn_cards c
        WHERE c.topic_id = t.id AND c.due_at <= now()
      ) AS due_count,
      (
        SELECT count(*)::int FROM learn_cards c WHERE c.topic_id = t.id
      ) AS card_count
    FROM learn_topics t
    WHERE t.subject_id = ${subject.id}
    ORDER BY t.sort_order, t.id
  `) as unknown as TopicRow[];

  const topics = topicRows.map(mapTopic);
  const byDomain = new Map<number, LearnTopic[]>();
  const inboxTopics: LearnTopic[] = [];

  for (const topic of topics) {
    if (topic.domainId === null) inboxTopics.push(topic);
    else {
      const list = byDomain.get(topic.domainId) ?? [];
      list.push(topic);
      byDomain.set(topic.domainId, list);
    }
  }

  const domains: LearnDomain[] = domainRows.map((row) => ({
    id: row.id,
    slug: row.slug,
    title: row.title,
    goal: row.goal,
    resources: row.resources,
    sortOrder: row.sort_order,
    topics: byDomain.get(row.id) ?? [],
  }));

  return { subject, domains, inboxTopics };
}

export async function createTopic(input: {
  subjectId: number;
  domainId?: number | null;
  title: string;
  kind?: TopicKind;
}): Promise<LearnTopic> {
  await ensureLearnSchema();
  const db = sql();
  const rows = (await db`
    INSERT INTO learn_topics (subject_id, domain_id, title, kind)
    VALUES (
      ${input.subjectId},
      ${input.domainId ?? null},
      ${input.title.trim()},
      ${input.kind ?? "custom"}
    )
    RETURNING *
  `) as unknown as TopicRow[];
  return mapTopic(rows[0]);
}

export async function getTopic(id: number): Promise<LearnTopic | null> {
  await ensureLearnSchema();
  const db = sql();
  const rows = (await db`
    SELECT
      t.*,
      (
        SELECT count(*)::int FROM learn_cards c
        WHERE c.topic_id = t.id AND c.due_at <= now()
      ) AS due_count,
      (
        SELECT count(*)::int FROM learn_cards c WHERE c.topic_id = t.id
      ) AS card_count
    FROM learn_topics t
    WHERE t.id = ${id}
    LIMIT 1
  `) as unknown as TopicRow[];
  return rows[0] ? mapTopic(rows[0]) : null;
}

export async function updateTopic(
  id: number,
  input: Partial<{
    title: string;
    status: TopicStatus;
    mastery: MasteryLevel;
    notes: string;
    resources: string;
    noteLink: string;
  }>,
): Promise<LearnTopic | null> {
  await ensureLearnSchema();
  const db = sql();
  const rows = (await db`
    UPDATE learn_topics SET
      title = COALESCE(${input.title ?? null}, title),
      status = COALESCE(${input.status ?? null}, status),
      mastery = COALESCE(${input.mastery ?? null}, mastery),
      notes = COALESCE(${input.notes ?? null}, notes),
      resources = COALESCE(${input.resources ?? null}, resources),
      note_link = COALESCE(${input.noteLink ?? null}, note_link),
      updated_at = now()
    WHERE id = ${id}
    RETURNING *
  `) as unknown as TopicRow[];
  return rows[0] ? mapTopic(rows[0]) : null;
}

export async function listCards(topicId: number): Promise<LearnCard[]> {
  await ensureLearnSchema();
  const db = sql();
  const rows = (await db`
    SELECT * FROM learn_cards WHERE topic_id = ${topicId} ORDER BY id
  `) as unknown as CardRow[];
  return rows.map(mapCard);
}

export async function createCard(input: {
  topicId: number;
  subjectId: number;
  front: string;
  back: string;
  source?: CardSource;
}): Promise<LearnCard> {
  await ensureLearnSchema();
  const db = sql();
  const schedule = newCardSchedule();
  const rows = (await db`
    INSERT INTO learn_cards (
      topic_id, subject_id, front, back, source,
      ease, interval_days, repetitions, lapses, due_at
    )
    VALUES (
      ${input.topicId},
      ${input.subjectId},
      ${input.front.trim()},
      ${input.back.trim()},
      ${input.source ?? "manual"},
      ${schedule.ease},
      ${schedule.intervalDays},
      ${schedule.repetitions},
      ${schedule.lapses},
      ${schedule.dueAt}::timestamptz
    )
    RETURNING *
  `) as unknown as CardRow[];
  return mapCard(rows[0]);
}

export async function updateCard(
  id: number,
  input: Partial<{ front: string; back: string }>,
): Promise<LearnCard | null> {
  await ensureLearnSchema();
  const db = sql();
  const rows = (await db`
    UPDATE learn_cards SET
      front = COALESCE(${input.front ?? null}, front),
      back = COALESCE(${input.back ?? null}, back)
    WHERE id = ${id}
    RETURNING *
  `) as unknown as CardRow[];
  return rows[0] ? mapCard(rows[0]) : null;
}

export async function deleteCard(id: number): Promise<void> {
  await ensureLearnSchema();
  const db = sql();
  await db`DELETE FROM learn_cards WHERE id = ${id}`;
}

export async function getReviewQueue(limit = 20): Promise<LearnCard[]> {
  await ensureLearnSchema();
  const db = sql();
  const rows = (await db`
    SELECT * FROM learn_cards
    WHERE due_at <= now()
    ORDER BY due_at ASC, id ASC
    LIMIT ${limit}
  `) as unknown as CardRow[];
  return rows.map(mapCard);
}

export async function answerCard(
  cardId: number,
  rating: LearnRating,
  today: string,
): Promise<LearnCard | null> {
  await ensureLearnSchema();
  const db = sql();
  const rows = (await db`
    SELECT * FROM learn_cards WHERE id = ${cardId} LIMIT 1
  `) as unknown as CardRow[];
  if (!rows[0]) return null;

  const current = mapCard(rows[0]);
  const next: Sm2State = applySm2(
    {
      ease: current.ease,
      intervalDays: current.intervalDays,
      repetitions: current.repetitions,
      lapses: current.lapses,
      dueAt: current.dueAt,
      lastReviewedAt: current.lastReviewedAt,
    },
    rating,
  );

  const updated = (await db`
    UPDATE learn_cards SET
      ease = ${next.ease},
      interval_days = ${next.intervalDays},
      repetitions = ${next.repetitions},
      lapses = ${next.lapses},
      due_at = ${next.dueAt}::timestamptz,
      last_reviewed_at = ${next.lastReviewedAt}::timestamptz
    WHERE id = ${cardId}
    RETURNING *
  `) as unknown as CardRow[];

  await db`
    INSERT INTO learn_reviews (card_id, rating) VALUES (${cardId}, ${rating})
  `;
  await db`
    INSERT INTO learn_review_days (reviewed_on)
    VALUES (${today}::date)
    ON CONFLICT (reviewed_on) DO NOTHING
  `;

  return updated[0] ? mapCard(updated[0]) : null;
}

export async function getLearnStats(today: string): Promise<LearnStats> {
  await ensureLearnSchema();
  const db = sql();
  const dueRows = (await db`
    SELECT count(*)::int AS count FROM learn_cards WHERE due_at <= now()
  `) as unknown as { count: number }[];
  const dayRows = (await db`
    SELECT reviewed_on::text AS reviewed_on
    FROM learn_review_days
    ORDER BY reviewed_on DESC
  `) as unknown as { reviewed_on: string }[];

  return {
    due: dueRows[0]?.count ?? 0,
    streak: computeReviewStreak(
      dayRows.map((row) => String(row.reviewed_on).slice(0, 10)),
      today,
    ),
  };
}
