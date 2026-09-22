import { createHash, randomBytes, randomUUID } from "node:crypto";
import { neon } from "@neondatabase/serverless";

export type MeetingDaypart = "morning" | "afternoon" | "evening";
export type MeetingSlot =
  | { date: string; period: MeetingDaypart }
  | { startsAt: string };
export type MeetingResponse = {
  participantId: string;
  name: string;
  availability: boolean[];
};
export type MeetingPoll = {
  id: string;
  title: string;
  timeZone: string;
  slots: MeetingSlot[];
  closed: boolean;
  responses: MeetingResponse[];
};

function db() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not configured.");
  return neon(process.env.DATABASE_URL);
}

async function ensureTables() {
  const sql = db();
  await sql`CREATE TABLE IF NOT EXISTS meeting_polls (
    id text PRIMARY KEY, title text NOT NULL, time_zone text NOT NULL,
    slots jsonb NOT NULL, organizer_key_hash text NOT NULL,
    closed boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now()
  )`;
  await sql`CREATE TABLE IF NOT EXISTS meeting_responses (
    poll_id text NOT NULL REFERENCES meeting_polls(id) ON DELETE CASCADE,
    participant_id text NOT NULL, name text NOT NULL, availability jsonb NOT NULL,
    updated_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY (poll_id, participant_id)
  )`;
}

const hash = (key: string) => createHash("sha256").update(key).digest("hex");

type PollRow = { id: string; title: string; time_zone: string; slots: MeetingSlot[]; closed: boolean };
type ResponseRow = { participant_id: string; name: string; availability: boolean[] };

export async function createPoll(input: { title: string; timeZone: string; slots: MeetingSlot[] }) {
  await ensureTables();
  const id = randomUUID().replaceAll("-", "").slice(0, 20);
  const organizerKey = randomBytes(32).toString("base64url");
  await db()`INSERT INTO meeting_polls (id, title, time_zone, slots, organizer_key_hash)
    VALUES (${id}, ${input.title}, ${input.timeZone}, ${JSON.stringify(input.slots)}::jsonb, ${hash(organizerKey)})`;
  return { id, organizerKey };
}

export async function getPoll(id: string): Promise<MeetingPoll | null> {
  await ensureTables();
  const sql = db();
  const rows = (await sql`SELECT id, title, time_zone, slots, closed FROM meeting_polls WHERE id = ${id} LIMIT 1`) as unknown as PollRow[];
  if (!rows[0]) return null;
  const responses = (await sql`SELECT participant_id, name, availability FROM meeting_responses WHERE poll_id = ${id} ORDER BY updated_at ASC`) as unknown as ResponseRow[];
  return {
    id: rows[0].id, title: rows[0].title, timeZone: rows[0].time_zone,
    slots: rows[0].slots, closed: rows[0].closed,
    responses: responses.map((r) => ({ participantId: r.participant_id, name: r.name, availability: r.availability })),
  };
}

export async function saveResponse(pollId: string, response: MeetingResponse) {
  await ensureTables();
  const sql = db();
  const polls = (await sql`SELECT slots, closed FROM meeting_polls WHERE id = ${pollId} LIMIT 1`) as unknown as { slots: MeetingSlot[]; closed: boolean }[];
  if (!polls[0]) return "missing" as const;
  if (polls[0].closed) return "closed" as const;
  if (!Array.isArray(response.availability) || response.availability.length !== polls[0].slots.length || response.availability.some((v) => typeof v !== "boolean")) return "invalid" as const;
  await sql`INSERT INTO meeting_responses (poll_id, participant_id, name, availability)
    VALUES (${pollId}, ${response.participantId}, ${response.name}, ${JSON.stringify(response.availability)}::jsonb)
    ON CONFLICT (poll_id, participant_id) DO UPDATE SET name = EXCLUDED.name, availability = EXCLUDED.availability, updated_at = now()`;
  return "ok" as const;
}

export async function closePoll(id: string, organizerKey: string) {
  await ensureTables();
  const result = await db()`UPDATE meeting_polls SET closed = true WHERE id = ${id} AND organizer_key_hash = ${hash(organizerKey)} RETURNING id`;
  return result.length > 0;
}
