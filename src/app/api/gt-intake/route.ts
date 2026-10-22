import { NextResponse } from "next/server";
import { isToolsAuthenticated } from "@/lib/tools-auth";
import {
  allowGTIntakeRequest,
  createGTIntakeLead,
  listGTIntakeLeads,
} from "@/lib/gt-intake/store";
import type { IntakeAnswers } from "@/lib/gt-intake/flow";
import type { IntakeMessage } from "@/components/gt-intake/use-intake-conversation";

const answerKeys = new Set([
  "businessType",
  "goal",
  "firstName",
  "lastName",
  "phone",
  "email",
]);
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function isStringRecord(value: unknown): value is Record<string, string> {
  return Boolean(
    value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    Object.values(value).every((entry) => typeof entry === "string"),
  );
}

function isValidAnswers(value: unknown): value is IntakeAnswers {
  if (!isStringRecord(value)) return false;
  if (Object.keys(value).some((key) => !answerKeys.has(key))) return false;
  if (Object.keys(value).length !== answerKeys.size) return false;
  if (!emailPattern.test(value.email.trim())) return false;
  return Object.values(value).every(
    (entry) => entry.trim().length > 0 && entry.length <= 1200,
  );
}

function isValidTranscript(value: unknown): value is IntakeMessage[] {
  return (
    Array.isArray(value) &&
    value.length >= 2 &&
    value.length <= 100 &&
    value.every(
      (message) =>
        message &&
        typeof message === "object" &&
        (message.role === "bot" || message.role === "user") &&
        typeof message.text === "string" &&
        message.text.length <= 4000,
    )
  );
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const payload = body as Record<string, unknown>;

  // Silent success for automated form fills; these records never reach GT.
  if (
    typeof payload.websiteCheck === "string" &&
    payload.websiteCheck.length > 0
  ) {
    return NextResponse.json({ ok: true });
  }
  if (
    !isValidAnswers(payload.answers) ||
    !isValidTranscript(payload.transcript)
  ) {
    return NextResponse.json(
      { error: "Please complete the conversation." },
      { status: 400 },
    );
  }

  const forwardedFor = request.headers.get("x-forwarded-for");
  const ip = forwardedFor?.split(",")[0]?.trim() || null;
  try {
    if (!(await allowGTIntakeRequest(ip))) {
      return NextResponse.json(
        { error: "Please try again later." },
        { status: 429 },
      );
    }
    await createGTIntakeLead({
      answers: payload.answers,
      transcript: payload.transcript,
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Unable to save your request right now." },
      { status: 503 },
    );
  }
}

export async function GET(request: Request) {
  if (!isToolsAuthenticated(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    return NextResponse.json({ leads: await listGTIntakeLeads() });
  } catch {
    return NextResponse.json(
      { error: "Unable to load GT inquiries." },
      { status: 503 },
    );
  }
}
