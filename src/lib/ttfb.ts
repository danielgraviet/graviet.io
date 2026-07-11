export type TtfbProbeInput = {
  normalizedUrl: string;
  hostname: string;
};

export type TtfbHop = {
  url: string;
  status: number;
  statusText: string;
  ttfbMs: number;
  location?: string;
};

export type TtfbProbeResult = {
  requestedUrl: string;
  finalUrl: string;
  hostname: string;
  region: string;
  finalStatus: number;
  finalTtfbMs: number;
  totalMs: number;
  redirectCount: number;
  hops: TtfbHop[];
};

export class TtfbInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TtfbInputError";
  }
}

type DaytonaTtfbSandboxOptions = {
  restrictNetwork?: boolean;
};

export function buildTtfbProbeInput(rawUrl: unknown): TtfbProbeInput {
  if (typeof rawUrl !== "string") {
    throw new TtfbInputError("Enter a URL.");
  }

  const trimmedUrl = rawUrl.trim();

  if (!trimmedUrl) {
    throw new TtfbInputError("Enter a URL.");
  }

  const candidate = /^[a-z][a-z0-9+.-]*:/i.test(trimmedUrl)
    ? trimmedUrl
    : `https://${trimmedUrl}`;

  let url: URL;

  try {
    url = new URL(candidate);
  } catch {
    throw new TtfbInputError("Enter a valid URL.");
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new TtfbInputError("Only HTTP and HTTPS URLs are supported.");
  }

  if (url.username || url.password) {
    throw new TtfbInputError("URLs with embedded credentials are not supported.");
  }

  if (!url.hostname) {
    throw new TtfbInputError("Enter a valid hostname.");
  }

  url.hash = "";

  return {
    normalizedUrl: url.toString(),
    hostname: url.hostname,
  };
}

export function buildDaytonaTtfbSandboxParams(
  input: TtfbProbeInput,
  options: DaytonaTtfbSandboxOptions = {},
) {
  const params = {
    language: "python",
    ephemeral: true,
    labels: {
      app: "graviet-seo-tools",
      tool: "ttfb",
    },
  };

  if (!options.restrictNetwork) {
    return params;
  }

  return {
    ...params,
    domainAllowList: buildDomainAllowList(input.hostname),
  };
}

function buildDomainAllowList(hostname: string) {
  const domains = new Set([hostname, `*.${hostname}`]);

  if (hostname.startsWith("www.")) {
    const apex = hostname.slice(4);

    domains.add(apex);
    domains.add(`*.${apex}`);
  }

  return Array.from(domains).join(",");
}
