import { verifyToolsAuthCookie, verifyToolsPassword } from "@/lib/tools-auth";

export function todayLocal(value?: string | null): string {
  if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function unauthorized() {
  return Response.json({ error: "Invalid tools password." }, { status: 401 });
}

export function readPassword(
  request: Request,
  body?: Record<string, unknown>,
): string | null {
  if (typeof body?.password === "string") return body.password;
  return new URL(request.url).searchParams.get("password");
}

export function requirePassword(
  request: Request,
  body?: Record<string, unknown>,
) {
  if (verifyToolsAuthCookie(request.headers.get("cookie"))) {
    return readPassword(request, body) || "session";
  }
  const password = readPassword(request, body);
  if (!verifyToolsPassword(password)) return null;
  return password;
}

export async function readJson(
  request: Request,
): Promise<Record<string, unknown> | Response> {
  try {
    const body = await request.json();
    return body && typeof body === "object"
      ? (body as Record<string, unknown>)
      : {};
  } catch {
    return Response.json({ error: "Send a JSON request body." }, { status: 400 });
  }
}
