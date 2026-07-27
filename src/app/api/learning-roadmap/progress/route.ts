import {
  getLearningRoadmapProgress,
  normalizeLearningRoadmapState,
  saveLearningRoadmapProgress,
} from "@/lib/learning-roadmap-progress";
import { verifyToolsAuthCookie, verifyToolsPassword } from "@/lib/tools-auth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const password =
    request.headers.get("x-tools-password") ??
    new URL(request.url).searchParams.get("password");

  if (
    !verifyToolsPassword(password) &&
    !verifyToolsAuthCookie(request.headers.get("cookie"))
  ) {
    return Response.json({ error: "Invalid tools password." }, { status: 401 });
  }

  const progress = await getLearningRoadmapProgress();

  return Response.json(progress);
}

export async function PUT(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Send a JSON request body." }, { status: 400 });
  }

  const payload = body && typeof body === "object" ? body : {};
  const { password, state } = payload as {
    password?: unknown;
    state?: unknown;
  };

  if (
    !verifyToolsPassword(password) &&
    !verifyToolsAuthCookie(request.headers.get("cookie"))
  ) {
    return Response.json({ error: "Invalid tools password." }, { status: 401 });
  }

  if (!state || typeof state !== "object") {
    return Response.json({ error: "State is required." }, { status: 400 });
  }

  const progress = await saveLearningRoadmapProgress(
    normalizeLearningRoadmapState(state),
  );

  return Response.json(progress);
}
