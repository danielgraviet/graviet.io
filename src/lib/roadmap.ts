import { neon } from "@neondatabase/serverless";

export type ConceptStatus = "todo" | "learning" | "known";

export type Concept = {
  id: number;
  title: string;
  slug: string;
  status: ConceptStatus;
  parentId: number | null;
  notes: string;
  resources: string;
  createdAt: string;
  updatedAt: string;
};

const STATUSES: ConceptStatus[] = ["todo", "learning", "known"];

export function isConceptStatus(value: unknown): value is ConceptStatus {
  return typeof value === "string" && STATUSES.includes(value as ConceptStatus);
}

function sql() {
  const url = process.env.DATABASE_URL;

  if (!url) {
    throw new Error("DATABASE_URL is not configured.");
  }

  return neon(url);
}

type ConceptRow = {
  id: number;
  title: string;
  slug: string;
  status: string;
  parent_id: number | null;
  notes: string | null;
  resources: string | null;
  created_at: string;
  updated_at: string;
};

function mapRow(row: ConceptRow): Concept {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    status: row.status as ConceptStatus,
    parentId: row.parent_id,
    notes: row.notes ?? "",
    resources: row.resources ?? "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function slugify(title: string) {
  const base = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return base || "concept";
}

export async function listConcepts(): Promise<Concept[]> {
  const db = sql();
  const rows = (await db`
    SELECT id, title, slug, status, parent_id, notes, resources, created_at, updated_at
    FROM concepts
    ORDER BY created_at ASC
  `) as unknown as ConceptRow[];

  return rows.map(mapRow);
}

export async function createConcept(input: {
  title: string;
  parentId: number | null;
  notes?: string;
  resources?: string;
}): Promise<Concept> {
  const db = sql();
  const baseSlug = slugify(input.title);

  let slug = baseSlug;
  let attempt = 1;

  for (;;) {
    const existing = (await db`
      SELECT id FROM concepts WHERE slug = ${slug} LIMIT 1
    `) as unknown as { id: number }[];

    if (existing.length === 0) {
      break;
    }

    attempt += 1;
    slug = `${baseSlug}-${attempt}`;
  }

  const rows = (await db`
    INSERT INTO concepts (title, slug, parent_id, notes, resources)
    VALUES (${input.title}, ${slug}, ${input.parentId}, ${input.notes ?? ""}, ${input.resources ?? ""})
    RETURNING id, title, slug, status, parent_id, notes, resources, created_at, updated_at
  `) as unknown as ConceptRow[];

  return mapRow(rows[0]);
}

export async function updateConcept(
  id: number,
  input: Partial<{
    title: string;
    status: ConceptStatus;
    parentId: number | null;
    notes: string;
    resources: string;
  }>,
): Promise<Concept | null> {
  const db = sql();
  const rows = (await db`
    UPDATE concepts SET
      title = COALESCE(${input.title ?? null}, title),
      status = COALESCE(${input.status ?? null}, status),
      parent_id = CASE WHEN ${input.parentId !== undefined} THEN ${input.parentId ?? null} ELSE parent_id END,
      notes = COALESCE(${input.notes ?? null}, notes),
      resources = COALESCE(${input.resources ?? null}, resources),
      updated_at = now()
    WHERE id = ${id}
    RETURNING id, title, slug, status, parent_id, notes, resources, created_at, updated_at
  `) as unknown as ConceptRow[];

  return rows[0] ? mapRow(rows[0]) : null;
}

export async function deleteConcept(id: number): Promise<void> {
  const db = sql();
  await db`DELETE FROM concepts WHERE id = ${id}`;
}
