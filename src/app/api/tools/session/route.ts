import { NextResponse } from "next/server";
import {
  BUDGET_AUTH_COOKIE,
  TOOLS_AUTH_COOKIE,
  createBudgetAuthToken,
  createToolsAuthToken,
  toolsAuthCookieOptions,
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

  const options = toolsAuthCookieOptions();
  const response = NextResponse.json({ ok: true });
  response.cookies.set(TOOLS_AUTH_COOKIE, createToolsAuthToken(), options);
  response.cookies.set(BUDGET_AUTH_COOKIE, createBudgetAuthToken(), options);
  return response;
}
