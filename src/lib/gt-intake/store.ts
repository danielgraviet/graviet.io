import "server-only";
import { createHash, randomUUID } from "node:crypto";
import { neon } from "@neondatabase/serverless";
import type { IntakeAnswers } from "./flow";
import type { IntakeMessage } from "@/components/gt-intake/use-intake-conversation";

export type GTIntakeLead = {
  id: string;
  submitted_at: string;
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  business_name: string;
  business_type: string;
  goal: string;
  situation: string;
  transcript: IntakeMessage[];
};

function db() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not configured.");
  return neon(url);
}

async function ensureTables() {
  const sql = db();
  await sql`CREATE TABLE IF NOT EXISTS gt_intake_leads (
    id text PRIMARY KEY,
    submitted_at timestamptz NOT NULL DEFAULT now(),
    first_name text NOT NULL,
    last_name text NOT NULL,
    phone text NOT NULL DEFAULT '',
    email text NOT NULL,
    business_name text NOT NULL,
    business_type text NOT NULL,
    goal text NOT NULL,
    situation text NOT NULL,
    transcript jsonb NOT NULL,
    consented_at timestamptz,
    status text NOT NULL DEFAULT 'new'
  )`;
  await sql`ALTER TABLE gt_intake_leads ADD COLUMN IF NOT EXISTS phone text NOT NULL DEFAULT ''`;
  await sql`ALTER TABLE gt_intake_leads ALTER COLUMN consented_at DROP NOT NULL`;
  await sql`CREATE INDEX IF NOT EXISTS gt_intake_leads_submitted_at_idx ON gt_intake_leads (submitted_at DESC)`;
  await sql`CREATE TABLE IF NOT EXISTS gt_intake_rate_limits (
    ip_hash text PRIMARY KEY,
    window_started_at timestamptz NOT NULL DEFAULT now(),
    request_count integer NOT NULL DEFAULT 0
  )`;
}

export async function allowGTIntakeRequest(ip: string | null) {
  await ensureTables();
  const ipHash = createHash("sha256")
    .update(ip ?? "unknown")
    .digest("hex");
  const rows =
    (await db()`INSERT INTO gt_intake_rate_limits (ip_hash, window_started_at, request_count)
    VALUES (${ipHash}, now(), 1)
    ON CONFLICT (ip_hash) DO UPDATE SET
      window_started_at = CASE
        WHEN gt_intake_rate_limits.window_started_at < now() - interval '1 hour' THEN now()
        ELSE gt_intake_rate_limits.window_started_at
      END,
      request_count = CASE
        WHEN gt_intake_rate_limits.window_started_at < now() - interval '1 hour' THEN 1
        ELSE gt_intake_rate_limits.request_count + 1
      END
    RETURNING request_count`) as unknown as { request_count: number }[];
  return Number(rows[0]?.request_count ?? 0) <= 5;
}

export async function createGTIntakeLead(input: {
  answers: IntakeAnswers;
  transcript: IntakeMessage[];
}) {
  await ensureTables();
  const id = randomUUID();
  const sql = db();
  await sql`INSERT INTO gt_intake_leads (
      id, first_name, last_name, phone, email, business_name, business_type, goal, situation, transcript, consented_at
    ) VALUES (
      ${id}, ${input.answers.firstName}, ${input.answers.lastName}, ${input.answers.phone}, ${input.answers.email},
      '', ${input.answers.businessType}, ${input.answers.goal},
      '', ${JSON.stringify(input.transcript)}::jsonb, NULL
    )`;
  return id;
}

export async function listGTIntakeLeads() {
  await ensureTables();
  return (await db()`SELECT id, submitted_at, first_name, last_name, phone, email,
    business_name, business_type, goal, situation, transcript
    FROM gt_intake_leads ORDER BY submitted_at DESC LIMIT 100`) as unknown as GTIntakeLead[];
}
