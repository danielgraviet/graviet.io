import { describe, expect, it } from "vitest";
import {
  buildDaytonaTtfbSandboxParams,
  buildTtfbProbeInput,
  TtfbInputError,
} from "./ttfb";

describe("TTFB probe input", () => {
  it("normalizes a bare hostname and builds an unrestricted sandbox config", () => {
    const input = buildTtfbProbeInput("example.com/path#ignored");

    expect(input).toEqual({
      normalizedUrl: "https://example.com/path",
      hostname: "example.com",
    });
    expect(buildDaytonaTtfbSandboxParams(input)).toMatchObject({
      language: "python",
      ephemeral: true,
      labels: {
        app: "graviet-seo-tools",
        tool: "ttfb",
      },
    });
    expect(buildDaytonaTtfbSandboxParams(input)).not.toHaveProperty(
      "domainAllowList",
    );
  });

  it("can build a domain-scoped sandbox config when network restriction is enabled", () => {
    const input = buildTtfbProbeInput("www.example.com");

    expect(
      buildDaytonaTtfbSandboxParams(input, { restrictNetwork: true }),
    ).toMatchObject({
      domainAllowList: "www.example.com,*.www.example.com,example.com,*.example.com",
    });
  });

  it("rejects unsupported URL protocols", () => {
    expect(() => buildTtfbProbeInput("file:///etc/passwd")).toThrow(
      TtfbInputError,
    );
  });
});
