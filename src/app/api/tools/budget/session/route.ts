import { NextResponse } from "next/server";
import {
  BUDGET_AUTH_COOKIE,
  createBudgetAuthToken,
  verifyToolsPassword,
} from "@/lib/tools-auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: { password?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Send a JSON request body." }, { status: 400 });
  }
  if (!verifyToolsPassword(body.password)) {
    return Response.json({ error: "Invalid tools password." }, { status: 401 });
  }
  const response = NextResponse.json({ ok: true });
  response.cookies.set(BUDGET_AUTH_COOKIE, createBudgetAuthToken(), {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return response;
}
