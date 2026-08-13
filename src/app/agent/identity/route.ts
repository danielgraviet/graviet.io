import { registrationUnsupportedResponse } from "@/lib/agent-auth";

export const runtime = "nodejs";

export function POST() {
  return registrationUnsupportedResponse();
}
