import { createHmac, timingSafeEqual } from "node:crypto";

export const TOOLS_AUTH_COOKIE = "tools_auth";
export const BUDGET_AUTH_COOKIE = "budget_auth";

export function verifyToolsPassword(
  submittedPassword: unknown,
  configuredPassword = process.env.SEO_TOOLS_PASSWORD,
) {
  if (typeof submittedPassword !== "string" || !configuredPassword) {
    return false;
  }

  const submitted = Buffer.from(submittedPassword);
  const configured = Buffer.from(configuredPassword);

  return (
    submitted.length === configured.length &&
    timingSafeEqual(submitted, configured)
  );
}

export function createToolsAuthToken(
  configuredPassword = process.env.SEO_TOOLS_PASSWORD,
) {
  if (!configuredPassword) {
    return "";
  }

  return createHmac("sha256", configuredPassword)
    .update("graviet-tools-auth")
    .digest("hex");
}

export function verifyToolsAuthToken(
  submittedToken: unknown,
  configuredPassword = process.env.SEO_TOOLS_PASSWORD,
) {
  if (typeof submittedToken !== "string") {
    return false;
  }

  const configuredToken = createToolsAuthToken(configuredPassword);

  if (!configuredToken) {
    return false;
  }

  const submitted = Buffer.from(submittedToken);
  const configured = Buffer.from(configuredToken);

  return (
    submitted.length === configured.length &&
    timingSafeEqual(submitted, configured)
  );
}

export function getCookieValue(cookieHeader: string | null, name: string) {
  if (!cookieHeader) {
    return null;
  }

  const cookies = cookieHeader.split(";").map((cookie) => cookie.trim());
  const prefix = `${name}=`;
  const match = cookies.find((cookie) => cookie.startsWith(prefix));

  return match ? decodeURIComponent(match.slice(prefix.length)) : null;
}

export function verifyToolsAuthCookie(cookieHeader: string | null) {
  return verifyToolsAuthToken(getCookieValue(cookieHeader, TOOLS_AUTH_COOKIE));
}

export function isToolsAuthenticated(request: Request, password?: unknown) {
  return (
    verifyToolsAuthCookie(request.headers.get("cookie")) ||
    verifyToolsPassword(password)
  );
}

export function toolsAuthCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  };
}

export function createBudgetAuthToken(
  configuredPassword = process.env.SEO_TOOLS_PASSWORD,
) {
  if (!configuredPassword) return "";
  return createHmac("sha256", configuredPassword)
    .update("graviet-budget-auth")
    .digest("hex");
}

export function verifyBudgetAuthCookie(cookieHeader: string | null) {
  const submittedToken = getCookieValue(cookieHeader, BUDGET_AUTH_COOKIE);
  const configuredToken = createBudgetAuthToken();
  if (!submittedToken || !configuredToken) return false;
  const submitted = Buffer.from(submittedToken);
  const configured = Buffer.from(configuredToken);
  return submitted.length === configured.length && timingSafeEqual(submitted, configured);
}
