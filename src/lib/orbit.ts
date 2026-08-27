import { neon } from "@neondatabase/serverless";

export const ORBIT_STATUSES = ["green", "orange", "red"] as const;
export type OrbitStatus = (typeof ORBIT_STATUSES)[number];

export type OrbitPerson = {
  id: number;
  name: string;
  status: OrbitStatus;
  lastContactedOn: string | null;
  latestContactNote: string;
  contactCount: number;
  createdAt: string;
  updatedAt: string;
};

export type OrbitContact = {
  id: number;
  personId: number;
  contactedOn: string;
  note: string;
  createdAt: string;
  updatedAt: string;
};

type PersonRow = {
  id: number;
  name: string;
  status: OrbitStatus;
  last_contacted_on: string | null;
  latest_contact_note: string | null;
  contact_count: number;
  created_at: string;
  updated_at: string;
};

type ContactRow = {
  id: number;
  person_id: number;
  contacted_on: string;
  note: string;
  created_at: string;
  updated_at: string;
};

function sql() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not configured.");
  return neon(url);
}

export function isOrbitStatus(value: unknown): value is OrbitStatus {
  return typeof value === "string" && ORBIT_STATUSES.includes(value as OrbitStatus);
}

export function normalizeOrbitName(name: string): string {
  return name.trim().replace(/\s+/g, " ").toLocaleLowerCase("en-US");
}

export function isOrbitDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

const statusRank: Record<OrbitStatus, number> = { red: 0, orange: 1, green: 2 };

export function compareOrbitPeople(a: OrbitPerson, b: OrbitPerson): number {
  const statusDifference = statusRank[a.status] - statusRank[b.status];
  if (statusDifference) return statusDifference;
  if (a.lastContactedOn === null && b.lastContactedOn !== null) return -1;
  if (a.lastContactedOn !== null && b.lastContactedOn === null) return 1;
  const dateDifference = (a.lastContactedOn ?? "").localeCompare(b.lastContactedOn ?? "");
  return dateDifference || a.name.localeCompare(b.name);
}

function mapPerson(row: PersonRow): OrbitPerson {
  return {
    id: row.id,
    name: row.name,
    status: row.status,
    lastContactedOn: row.last_contacted_on ? String(row.last_contacted_on).slice(0, 10) : null,
    latestContactNote: row.latest_contact_note ?? "",
    contactCount: Number(row.contact_count),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapContact(row: ContactRow): OrbitContact {
  return {
    id: row.id,
    personId: row.person_id,
    contactedOn: String(row.contacted_on).slice(0, 10),
    note: row.note,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

let schemaReady: Promise<void> | null = null;

export async function ensureOrbitSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = (async () => {
      const db = sql();
      await db`
        CREATE TABLE IF NOT EXISTS orbit_people (
          id serial PRIMARY KEY,
          name text NOT NULL,
          canonical_name text NOT NULL UNIQUE,
          status text NOT NULL DEFAULT 'orange' CHECK (status IN ('green', 'orange', 'red')),
          created_at timestamptz NOT NULL DEFAULT now(),
          updated_at timestamptz NOT NULL DEFAULT now()
        )
      `;
      await db`
        CREATE TABLE IF NOT EXISTS orbit_contacts (
          id serial PRIMARY KEY,
          person_id integer NOT NULL REFERENCES orbit_people(id) ON DELETE CASCADE,
          contacted_on date NOT NULL,
          note text NOT NULL DEFAULT '',
          created_at timestamptz NOT NULL DEFAULT now(),
          updated_at timestamptz NOT NULL DEFAULT now()
        )
      `;
      await db`
        CREATE TABLE IF NOT EXISTS orbit_meta (
          key text PRIMARY KEY,
          value text NOT NULL,
          created_at timestamptz NOT NULL DEFAULT now()
        )
      `;
      await db`CREATE INDEX IF NOT EXISTS orbit_contacts_person_date_idx ON orbit_contacts (person_id, contacted_on DESC, id DESC)`;
      await db`
        WITH claimed AS (
          INSERT INTO orbit_meta (key, value) VALUES ('initial-people', 'v1')
          ON CONFLICT (key) DO NOTHING
          RETURNING key
        ), seeds(name, canonical_name, status) AS (
          VALUES
            ('Will Myers', 'will myers', 'orange'),
            ('Justin Hill', 'justin hill', 'orange'),
            ('Justin Olcott', 'justin olcott', 'green'),
            ('Jeff Olmo', 'jeff olmo', 'orange'),
            ('Dr. Wingate', 'dr. wingate', 'red'),
            ('Taylor Killian', 'taylor killian', 'green'),
            ('Alex Shaw', 'alex shaw', 'green'),
            ('Max Forsey', 'max forsey', 'green'),
            ('Ben Gubler', 'ben gubler', 'green'),
            ('Ethan Taotafa', 'ethan taotafa', 'red'),
            ('Thad Sandidge', 'thad sandidge', 'red'),
            ('Sam Bridge', 'sam bridge', 'orange'),
            ('Sam Chamberlin', 'sam chamberlin', 'orange'),
            ('Ethan McQuahe', 'ethan mcquahe', 'green'),
            ('Vin Howe', 'vin howe', 'orange'),
            ('Xander Gordhammer', 'xander gordhammer', 'orange')
        )
        INSERT INTO orbit_people (name, canonical_name, status)
        SELECT seeds.name, seeds.canonical_name, seeds.status
        FROM seeds CROSS JOIN claimed
        ON CONFLICT (canonical_name) DO NOTHING
      `;
    })().catch((error) => {
      schemaReady = null;
      throw error;
    });
  }
  await schemaReady;
}

export async function listOrbitPeople(): Promise<OrbitPerson[]> {
  await ensureOrbitSchema();
  const db = sql();
  const rows = (await db`
    SELECT p.id, p.name, p.status, p.created_at, p.updated_at,
      latest.contacted_on AS last_contacted_on,
      latest.note AS latest_contact_note,
      (SELECT count(*)::int FROM orbit_contacts c WHERE c.person_id = p.id) AS contact_count
    FROM orbit_people p
    LEFT JOIN LATERAL (
      SELECT contacted_on, note FROM orbit_contacts
      WHERE person_id = p.id ORDER BY contacted_on DESC, id DESC LIMIT 1
    ) latest ON true
  `) as unknown as PersonRow[];
  return rows.map(mapPerson).sort(compareOrbitPeople);
}

export async function createOrbitPerson(name: string, status: OrbitStatus = "orange"): Promise<OrbitPerson> {
  await ensureOrbitSchema();
  const db = sql();
  const cleanName = name.trim().replace(/\s+/g, " ");
  const rows = (await db`
    INSERT INTO orbit_people (name, canonical_name, status)
    VALUES (${cleanName}, ${normalizeOrbitName(cleanName)}, ${status})
    RETURNING id, name, status, null::date AS last_contacted_on, null::text AS latest_contact_note,
      0::int AS contact_count, created_at, updated_at
  `) as unknown as PersonRow[];
  return mapPerson(rows[0]);
}

export async function updateOrbitPerson(id: number, name: string, status: OrbitStatus): Promise<OrbitPerson | null> {
  await ensureOrbitSchema();
  const db = sql();
  const cleanName = name.trim().replace(/\s+/g, " ");
  const rows = (await db`
    UPDATE orbit_people SET name = ${cleanName}, canonical_name = ${normalizeOrbitName(cleanName)},
      status = ${status}, updated_at = now()
    WHERE id = ${id}
    RETURNING id, name, status, null::date AS last_contacted_on, null::text AS latest_contact_note,
      0::int AS contact_count, created_at, updated_at
  `) as unknown as PersonRow[];
  return rows[0] ? mapPerson(rows[0]) : null;
}

export async function deleteOrbitPerson(id: number): Promise<boolean> {
  await ensureOrbitSchema();
  const db = sql();
  const rows = await db`DELETE FROM orbit_people WHERE id = ${id} RETURNING id`;
  return rows.length > 0;
}

export async function listOrbitContacts(personId: number): Promise<OrbitContact[]> {
  await ensureOrbitSchema();
  const db = sql();
  const rows = (await db`
    SELECT id, person_id, contacted_on, note, created_at, updated_at FROM orbit_contacts
    WHERE person_id = ${personId} ORDER BY contacted_on DESC, id DESC
  `) as unknown as ContactRow[];
  return rows.map(mapContact);
}

export async function createOrbitContact(personId: number, contactedOn: string, note: string): Promise<OrbitContact | null> {
  await ensureOrbitSchema();
  const db = sql();
  const rows = (await db`
    WITH updated AS (
      UPDATE orbit_people SET status = 'green', updated_at = now() WHERE id = ${personId} RETURNING id
    )
    INSERT INTO orbit_contacts (person_id, contacted_on, note)
    SELECT id, ${contactedOn}::date, ${note.trim()} FROM updated
    RETURNING id, person_id, contacted_on, note, created_at, updated_at
  `) as unknown as ContactRow[];
  return rows[0] ? mapContact(rows[0]) : null;
}

export async function updateOrbitContact(id: number, contactedOn: string, note: string): Promise<OrbitContact | null> {
  await ensureOrbitSchema();
  const db = sql();
  const rows = (await db`
    UPDATE orbit_contacts SET contacted_on = ${contactedOn}::date, note = ${note.trim()}, updated_at = now()
    WHERE id = ${id}
    RETURNING id, person_id, contacted_on, note, created_at, updated_at
  `) as unknown as ContactRow[];
  return rows[0] ? mapContact(rows[0]) : null;
}

export async function deleteOrbitContact(id: number): Promise<boolean> {
  await ensureOrbitSchema();
  const db = sql();
  const rows = await db`DELETE FROM orbit_contacts WHERE id = ${id} RETURNING id`;
  return rows.length > 0;
}
