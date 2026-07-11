import { CodeLanguage, Daytona } from "@daytona/sdk";
import type { TtfbProbeInput, TtfbProbeResult } from "@/lib/ttfb";
import { buildDaytonaTtfbSandboxParams } from "@/lib/ttfb";

const PROBE_TIMEOUT_SECONDS = 10;
const PROBE_MAX_REDIRECTS = 3;
const SANDBOX_CREATE_TIMEOUT_SECONDS = 30;
const SANDBOX_DELETE_TIMEOUT_SECONDS = 15;
const SANDBOX_COMMAND_TIMEOUT_SECONDS = 20;

export class TtfbProbeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TtfbProbeError";
  }
}

const ttfbProbeCode = String.raw`
import http.client
import json
import sys
import time
from urllib.parse import urljoin, urlsplit, urlunsplit

requested_url = sys.argv[1]
timeout = float(sys.argv[2])
max_redirects = int(sys.argv[3])
region = sys.argv[4]

headers = {
    "Accept": "*/*",
    "Connection": "close",
    "Range": "bytes=0-0",
    "User-Agent": "graviet-ttfb-tool/1.0",
}

current_url = requested_url
hops = []
started_at = time.perf_counter()

for hop_index in range(max_redirects + 1):
    parsed = urlsplit(current_url)

    if parsed.scheme not in ("http", "https"):
        raise ValueError("Unsupported redirect protocol")

    host = parsed.hostname

    if not host:
        raise ValueError("Missing hostname")

    path = urlunsplit(("", "", parsed.path or "/", parsed.query, ""))
    connection_class = http.client.HTTPSConnection if parsed.scheme == "https" else http.client.HTTPConnection
    connection = connection_class(host, port=parsed.port, timeout=timeout)

    try:
        request_started_at = time.perf_counter()
        connection.request("GET", path, headers={**headers, "Host": parsed.netloc})
        response = connection.getresponse()
        ttfb_ms = (time.perf_counter() - request_started_at) * 1000
        location = response.getheader("Location")

        hops.append({
            "url": current_url,
            "status": response.status,
            "statusText": response.reason,
            "ttfbMs": round(ttfb_ms, 1),
            **({"location": location} if location else {}),
        })
    finally:
        connection.close()

    if response.status in (301, 302, 303, 307, 308) and location and hop_index < max_redirects:
        current_url = urljoin(current_url, location)
        continue

    break

final_hop = hops[-1]

print(json.dumps({
    "requestedUrl": requested_url,
    "finalUrl": final_hop["url"],
    "hostname": urlsplit(requested_url).hostname,
    "region": "daytona:" + region,
    "finalStatus": final_hop["status"],
    "finalTtfbMs": final_hop["ttfbMs"],
    "totalMs": round((time.perf_counter() - started_at) * 1000, 1),
    "redirectCount": max(0, len(hops) - 1),
    "hops": hops,
}))
`;

type DaytonaExecuteResponse = {
  exitCode: number;
  result: string;
};

function parseProbeResult(response: DaytonaExecuteResponse): TtfbProbeResult {
  if (response.exitCode !== 0) {
    throw new TtfbProbeError(buildProbeErrorMessage(response.result));
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(response.result.trim());
  } catch {
    throw new Error("The TTFB probe returned invalid JSON.");
  }

  if (!isTtfbProbeResult(parsed)) {
    throw new Error("The TTFB probe returned an unexpected payload.");
  }

  return parsed;
}

function buildProbeErrorMessage(output: string) {
  if (output.includes("Temporary failure in name resolution")) {
    return "The Daytona sandbox could not resolve that hostname. This can happen with transient DNS issues or strict network allowlists.";
  }

  if (output.includes("timed out") || output.includes("TimeoutError")) {
    return "The target server did not send a response before the probe timed out.";
  }

  return "The TTFB probe failed inside the Daytona sandbox.";
}

function isTtfbProbeResult(value: unknown): value is TtfbProbeResult {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<TtfbProbeResult>;

  return (
    typeof candidate.requestedUrl === "string" &&
    typeof candidate.finalUrl === "string" &&
    typeof candidate.hostname === "string" &&
    typeof candidate.region === "string" &&
    typeof candidate.finalStatus === "number" &&
    typeof candidate.finalTtfbMs === "number" &&
    typeof candidate.totalMs === "number" &&
    typeof candidate.redirectCount === "number" &&
    Array.isArray(candidate.hops)
  );
}

export async function runDaytonaTtfbProbe(
  input: TtfbProbeInput,
): Promise<TtfbProbeResult> {
  const apiKey = process.env.DAYTONA_API_KEY;

  if (!apiKey) {
    throw new Error("DAYTONA_API_KEY is not configured.");
  }

  const target = process.env.DAYTONA_TARGET || "us";
  const restrictNetwork = process.env.DAYTONA_TTFB_DOMAIN_ALLOWLIST === "true";
  const daytona = new Daytona({ apiKey, target });
  const sandbox = await daytona.create(
    {
      ...buildDaytonaTtfbSandboxParams(input, { restrictNetwork }),
      language: CodeLanguage.PYTHON,
    },
    { timeout: SANDBOX_CREATE_TIMEOUT_SECONDS },
  );

  try {
    const result = await sandbox.process.codeRun(
      ttfbProbeCode,
      {
        argv: [
          input.normalizedUrl,
          String(PROBE_TIMEOUT_SECONDS),
          String(PROBE_MAX_REDIRECTS),
          target,
        ],
      },
      SANDBOX_COMMAND_TIMEOUT_SECONDS,
    );

    return parseProbeResult(result);
  } finally {
    await sandbox.delete(SANDBOX_DELETE_TIMEOUT_SECONDS);
  }
}
