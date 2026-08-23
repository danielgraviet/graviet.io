import { neon } from "@neondatabase/serverless";

export type NetworkPerson = {
  id: number;
  name: string;
  aliases: string[];
  description: string;
  occupation: string;
  notable: boolean;
  profileUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

export type NetworkRelationship = {
  id: number;
  sourceId: number;
  targetId: number;
  sourceName: string;
  targetName: string;
  type: string;
  notes: string;
  occurredOn: string | null;
  status: "confirmed" | "draft";
  edgeKind: "personal" | "public" | "potential";
  confidence: number;
  evidence: { note: string; url: string | null }[];
};

export type NetworkGraph = {
  rootId: number;
  people: NetworkPerson[];
  relationships: NetworkRelationship[];
};

type PersonRow = {
  id: number;
  name: string;
  aliases: string[] | null;
  description: string;
  occupation: string;
  notable: boolean;
  profile_url: string | null;
  created_at: string;
  updated_at: string;
};

type RelationshipRow = {
  id: number;
  source_id: number;
  target_id: number;
  source_name: string;
  target_name: string;
  relationship_type: string;
  notes: string;
  occurred_on: string | null;
  status: "confirmed" | "draft";
  edge_kind: "personal" | "public" | "potential";
  confidence: number;
  evidence_note: string | null;
  evidence_url: string | null;
};

function sql() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not configured.");
  return neon(url);
}

function mapPerson(row: PersonRow): NetworkPerson {
  return {
    id: row.id,
    name: row.name,
    aliases: Array.isArray(row.aliases) ? row.aliases : [],
    description: row.description,
    occupation: row.occupation,
    notable: row.notable,
    profileUrl: row.profile_url,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function ensureNetworkSchema() {
  const db = sql();
  await db`
    CREATE TABLE IF NOT EXISTS network_people (
      id serial PRIMARY KEY,
      name text NOT NULL,
      canonical_name text NOT NULL UNIQUE,
      aliases text[] NOT NULL DEFAULT '{}',
      description text NOT NULL DEFAULT '',
      occupation text NOT NULL DEFAULT '',
      notable boolean NOT NULL DEFAULT false,
      profile_url text,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `;
  await db`
    CREATE TABLE IF NOT EXISTS network_relationships (
      id serial PRIMARY KEY,
      source_id integer NOT NULL REFERENCES network_people(id) ON DELETE CASCADE,
      target_id integer NOT NULL REFERENCES network_people(id) ON DELETE CASCADE,
      relationship_type text NOT NULL DEFAULT 'other',
      notes text NOT NULL DEFAULT '',
      occurred_on date,
      status text NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'draft')),
      edge_kind text NOT NULL DEFAULT 'personal' CHECK (edge_kind IN ('personal', 'public', 'potential')),
      confidence integer NOT NULL DEFAULT 100 CHECK (confidence BETWEEN 0 AND 100),
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      CHECK (source_id <> target_id),
      UNIQUE (source_id, target_id, relationship_type)
    )
  `;
  await db`ALTER TABLE network_relationships ADD COLUMN IF NOT EXISTS edge_kind text NOT NULL DEFAULT 'personal'`;
  await db`ALTER TABLE network_relationships ADD COLUMN IF NOT EXISTS confidence integer NOT NULL DEFAULT 100`;
  await db`
    CREATE TABLE IF NOT EXISTS network_evidence (
      id serial PRIMARY KEY,
      relationship_id integer NOT NULL REFERENCES network_relationships(id) ON DELETE CASCADE,
      note text NOT NULL,
      url text,
      created_at timestamptz NOT NULL DEFAULT now()
    )
  `;
  for (const person of [
    ["Sam Altman", "sam altman", "Co-founder and CEO of OpenAI", "OpenAI", true],
    ["Dario Amodei", "dario amodei", "Co-founder and CEO of Anthropic", "Anthropic", true],
    ["Demis Hassabis", "demis hassabis", "Co-founder and CEO of Google DeepMind", "Google DeepMind", true],
    ["Donald Trump", "donald trump", "President of the United States; historical profile.", "Public official", true],
    ["Mark Zuckerberg", "mark zuckerberg", "Founder and CEO of Meta.", "Meta", true],
    ["Ilya Sutskever", "ilya sutskever", "Co-founder of Safe Superintelligence and former OpenAI chief scientist.", "AI researcher", true],
    ["Satya Nadella", "satya nadella", "Chairman and CEO of Microsoft.", "Microsoft", true],
    ["Samuel Gershman", "samuel gershman", "Professor and computational cognitive scientist.", "Harvard University", true],
    ["Elizabeth Spelke", "elizabeth spelke", "Professor of psychology and cognitive scientist.", "Harvard University", true],
    ["Shimon Ullman", "shimon ullman", "Computer vision and cognitive science researcher.", "Weizmann Institute of Science", true],
  ] as const) {
    await db`
      INSERT INTO network_people (name, canonical_name, description, occupation, notable)
      VALUES (${person[0]}, ${person[1]}, ${person[2]}, ${person[3]}, ${person[4]})
      ON CONFLICT (canonical_name) DO NOTHING
    `;
  }
  await db`CREATE INDEX IF NOT EXISTS network_relationships_source_idx ON network_relationships(source_id)`;
  await db`CREATE INDEX IF NOT EXISTS network_relationships_target_idx ON network_relationships(target_id)`;

  await db`
    INSERT INTO network_people (name, canonical_name, description, occupation, notable)
    VALUES ('Daniel Graviet', 'daniel graviet', 'Root node for this personal network.', 'Student and researcher', false)
    ON CONFLICT (canonical_name) DO NOTHING
  `;
  await db`DELETE FROM network_people WHERE canonical_name = 'thomas s monson'`;
  for (const person of [
    ["Jensen Huang", "jensen huang", "Met in person.", "CEO of NVIDIA", true],
    ["Dwarkesh Patel", "dwarkesh patel", "Met in person.", "Interviewer and writer", true],
    ["David Wingate", "david wingate", "Met in person.", "Professor and researcher", true],
    ["Joshua Tenenbaum", "joshua tenenbaum", "Known bridge target from David Wingate's academic history.", "Professor and researcher", true],
  ] as const) {
    await db`
      INSERT INTO network_people (name, canonical_name, description, occupation, notable)
      VALUES (${person[0]}, ${person[1]}, ${person[2]}, ${person[3]}, ${person[4]})
      ON CONFLICT (canonical_name) DO NOTHING
    `;
  }
  await db`
    INSERT INTO network_relationships (source_id, target_id, relationship_type, notes, status, edge_kind, confidence)
    SELECT me.id, person.id, 'met', 'Personal meeting.', 'confirmed', 'personal', 100
    FROM network_people me, network_people person
    WHERE me.canonical_name = 'daniel graviet'
      AND person.canonical_name IN ('jensen huang', 'dwarkesh patel', 'david wingate')
    ON CONFLICT (source_id, target_id, relationship_type) DO NOTHING
  `;
  await db`
    INSERT INTO network_relationships (source_id, target_id, relationship_type, notes, status, edge_kind, confidence)
    SELECT david.id, joshua.id, 'studied_under', 'David Wingate did a postdoc under Joshua Tenenbaum.', 'confirmed', 'personal', 100
    FROM network_people david, network_people joshua
    WHERE david.canonical_name = 'david wingate' AND joshua.canonical_name = 'joshua tenenbaum'
    ON CONFLICT (source_id, target_id, relationship_type) DO NOTHING
  `;
  const publicEdges = [
    { from: "jensen huang", to: "sam altman", type: "public_partnership", note: "NVIDIA and OpenAI publicly announced a strategic partnership; Jensen Huang and Sam Altman were quoted together.", url: "https://openai.com/index/openai-nvidia-systems-partnership/", confidence: 95 },
    { from: "jensen huang", to: "donald trump", type: "public_meeting", note: "The Associated Press reported that Jensen Huang met with President Trump at the White House.", url: "https://apnews.com/article/deepseek-nvidia-trump-ai-6554b843e94f2e86c2ea7ba7c180f8bf", confidence: 90 },
    { from: "sam altman", to: "dario amodei", type: "public_association", note: "Public reporting identifies Altman and Amodei as connected members of the frontier AI leadership network; this is not evidence of a personal introduction.", url: "https://www.axios.com/2026/07/16/ai-regulations-openai-anthropic-google", confidence: 70 },
    { from: "sam altman", to: "demis hassabis", type: "public_association", note: "Public reporting identifies Altman and Hassabis as connected members of the frontier AI leadership network; this is not evidence of a personal introduction.", url: "https://www.axios.com/2026/07/16/ai-regulations-openai-anthropic-google", confidence: 70 },
    { from: "dario amodei", to: "demis hassabis", type: "public_association", note: "Public reporting places Amodei and Hassabis in the same frontier AI leadership network.", url: "https://www.axios.com/2026/07/16/ai-regulations-openai-anthropic-google", confidence: 65 },
    { from: "dwarkesh patel", to: "dario amodei", type: "interviewed", note: "Dwarkesh Patel interviewed Dario Amodei for the Dwarkesh Podcast.", url: "https://www.dwarkesh.com/p/dario-amodei", confidence: 98 },
    { from: "dwarkesh patel", to: "demis hassabis", type: "interviewed", note: "Dwarkesh Patel interviewed Demis Hassabis for the Dwarkesh Podcast.", url: "https://www.dwarkesh.com/p/demis-hassabis", confidence: 98 },
    { from: "dwarkesh patel", to: "ilya sutskever", type: "interviewed", note: "Dwarkesh Patel interviewed Ilya Sutskever for the Dwarkesh Podcast.", url: "https://www.dwarkesh.com/p/ilya-sutskever", confidence: 98 },
    { from: "dwarkesh patel", to: "mark zuckerberg", type: "interviewed", note: "Dwarkesh Patel interviewed Mark Zuckerberg for the Dwarkesh Podcast.", url: "https://www.dwarkesh.com/p/mark-zuckerberg", confidence: 98 },
    { from: "dwarkesh patel", to: "satya nadella", type: "interviewed", note: "Dwarkesh Patel interviewed Satya Nadella for the Dwarkesh Podcast.", url: "https://www.dwarkesh.com/p/satya-nadella", confidence: 98 },
    { from: "jensen huang", to: "satya nadella", type: "public_partnership", note: "NVIDIA and Microsoft publicly describe a longstanding partnership, including joint appearances by Jensen Huang and Satya Nadella.", url: "https://blogs.nvidia.com/blog/microsoft-build-windows-local-cloud-devices/", confidence: 95 },
    { from: "jensen huang", to: "mark zuckerberg", type: "public_partnership", note: "NVIDIA publicly describes its infrastructure collaboration with Meta and quotes both Jensen Huang and Mark Zuckerberg.", url: "https://nvidianews.nvidia.com/_gallery/download_pdf/6994daa23d6332a1951c593d/", confidence: 90 },
    { from: "joshua tenenbaum", to: "samuel gershman", type: "academic_collaboration", note: "The MIT Center for Brains, Minds, and Machines lists Joshua Tenenbaum and Samuel Gershman among its people.", url: "https://cbmm.mit.edu/about/people/tenenbaum", confidence: 85 },
    { from: "joshua tenenbaum", to: "elizabeth spelke", type: "academic_collaboration", note: "The MIT Center for Brains, Minds, and Machines lists Joshua Tenenbaum and Elizabeth Spelke among its people.", url: "https://cbmm.mit.edu/about/people/tenenbaum", confidence: 85 },
    { from: "joshua tenenbaum", to: "shimon ullman", type: "academic_collaboration", note: "The MIT Center for Brains, Minds, and Machines lists Joshua Tenenbaum and Shimon Ullman among its people.", url: "https://cbmm.mit.edu/about/people/tenenbaum", confidence: 85 },
  ] as const;
  for (const edge of publicEdges) {
    await db`
      INSERT INTO network_relationships (source_id, target_id, relationship_type, notes, status, edge_kind, confidence)
      SELECT source.id, target.id, ${edge.type}, ${edge.note}, 'confirmed', 'public', ${edge.confidence}
      FROM network_people source, network_people target
      WHERE source.canonical_name = ${edge.from} AND target.canonical_name = ${edge.to}
      ON CONFLICT (source_id, target_id, relationship_type) DO NOTHING
    `;
    await db`
      INSERT INTO network_evidence (relationship_id, note, url)
      SELECT relationship.id, ${edge.note}, ${edge.url}
      FROM network_relationships relationship
      JOIN network_people source ON source.id = relationship.source_id
      JOIN network_people target ON target.id = relationship.target_id
      WHERE source.canonical_name = ${edge.from} AND target.canonical_name = ${edge.to}
        AND relationship.relationship_type = ${edge.type}
        AND NOT EXISTS (SELECT 1 FROM network_evidence WHERE relationship_id = relationship.id)
    `;
  }
}

export async function getNetworkGraph(): Promise<NetworkGraph> {
  await ensureNetworkSchema();
  const db = sql();
  const people = (await db`SELECT * FROM network_people ORDER BY notable DESC, name`) as unknown as PersonRow[];
  const relationships = (await db`
    SELECT r.id, r.source_id, r.target_id, source.name AS source_name, target.name AS target_name,
      r.relationship_type, r.notes, r.occurred_on, r.status, r.edge_kind, r.confidence,
      e.note AS evidence_note, e.url AS evidence_url
    FROM network_relationships r
    JOIN network_people source ON source.id = r.source_id
    JOIN network_people target ON target.id = r.target_id
    LEFT JOIN LATERAL (
      SELECT note, url FROM network_evidence WHERE relationship_id = r.id ORDER BY id LIMIT 1
    ) e ON true
    ORDER BY r.id
  `) as unknown as RelationshipRow[];
  const root = people.find((person) => person.name === "Daniel Graviet");
  if (!root) throw new Error("Network root person is missing.");
  return {
    rootId: root.id,
    people: people.map(mapPerson),
    relationships: relationships.map((row) => ({
      id: row.id,
      sourceId: row.source_id,
      targetId: row.target_id,
      sourceName: row.source_name,
      targetName: row.target_name,
      type: row.relationship_type,
      notes: row.notes,
      occurredOn: row.occurred_on,
      status: row.status,
      edgeKind: row.edge_kind,
      confidence: row.confidence,
      evidence: row.evidence_note ? [{ note: row.evidence_note, url: row.evidence_url }] : [],
    })),
  };
}

export function shortestPath(graph: NetworkGraph, targetId: number) {
  if (targetId === graph.rootId) return [graph.rootId];
  const adjacency = new Map<number, number[]>();
  for (const person of graph.people) adjacency.set(person.id, []);
  for (const edge of graph.relationships) {
    if (edge.status !== "confirmed") continue;
    adjacency.get(edge.sourceId)?.push(edge.targetId);
    adjacency.get(edge.targetId)?.push(edge.sourceId);
  }
  const queue = [graph.rootId];
  const previous = new Map<number, number | null>([[graph.rootId, null]]);
  while (queue.length) {
    const current = queue.shift()!;
    for (const next of adjacency.get(current) ?? []) {
      if (previous.has(next)) continue;
      previous.set(next, current);
      queue.push(next);
    }
  }
  if (!previous.has(targetId)) return null;
  const path: number[] = [];
  let cursor: number | null = targetId;
  while (cursor !== null) {
    path.unshift(cursor);
    cursor = previous.get(cursor) ?? null;
  }
  return path;
}

export async function createPerson(input: {
  name: string;
  description?: string;
  occupation?: string;
  notable?: boolean;
  profileUrl?: string | null;
}) {
  await ensureNetworkSchema();
  const db = sql();
  const canonical = input.name.trim().toLowerCase().replace(/\s+/g, " ");
  const rows = (await db`
    INSERT INTO network_people (name, canonical_name, description, occupation, notable, profile_url)
    VALUES (${input.name.trim()}, ${canonical}, ${input.description?.trim() ?? ""}, ${input.occupation?.trim() ?? ""}, ${input.notable ?? false}, ${input.profileUrl ?? null})
    RETURNING *
  `) as unknown as PersonRow[];
  return mapPerson(rows[0]);
}

export async function createRelationship(input: {
  sourceId: number;
  targetId: number;
  type: string;
  notes?: string;
  occurredOn?: string | null;
  status?: "confirmed" | "draft";
  edgeKind?: "personal" | "public" | "potential";
  confidence?: number;
  evidenceNote?: string;
  evidenceUrl?: string | null;
}) {
  await ensureNetworkSchema();
  const db = sql();
  const rows = (await db`
    INSERT INTO network_relationships (source_id, target_id, relationship_type, notes, occurred_on, status, edge_kind, confidence)
    VALUES (${input.sourceId}, ${input.targetId}, ${input.type.trim()}, ${input.notes?.trim() ?? ""}, ${input.occurredOn ?? null}, ${input.status ?? "confirmed"}, ${input.edgeKind ?? "potential"}, ${input.confidence ?? 60})
    RETURNING id
  `) as unknown as { id: number }[];
  if (input.evidenceNote?.trim()) {
    await db`
      INSERT INTO network_evidence (relationship_id, note, url)
      VALUES (${rows[0].id}, ${input.evidenceNote.trim()}, ${input.evidenceUrl ?? null})
    `;
  }
  return rows[0].id;
}
