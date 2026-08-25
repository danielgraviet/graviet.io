import { afterEach, describe, expect, it, vi } from "vitest";

import { suggestTags, suggestTagsByKeyword } from "./work-log-tags";

const originalApiKey = process.env.GROQ_API_KEY;

afterEach(() => {
  vi.unstubAllGlobals();
  if (originalApiKey === undefined) {
    delete process.env.GROQ_API_KEY;
  } else {
    process.env.GROQ_API_KEY = originalApiKey;
  }
});

describe("work-log tag suggestions", () => {
  it("falls back to vocabulary overlap when Groq is not configured", async () => {
    delete process.env.GROQ_API_KEY;

    await expect(
      suggestTags("Shipped the budget dashboard", ["budget", "design", "api"]),
    ).resolves.toEqual(["budget"]);
  });

  it("accepts only allowed tags returned by Groq", async () => {
    process.env.GROQ_API_KEY = "test-key";
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({
      choices: [{ message: { content: JSON.stringify({ tags: ["api", "invented", "api"] }) } }],
    }), { status: 200 })));

    await expect(
      suggestTags("Built an endpoint", ["api", "frontend"]),
    ).resolves.toEqual(["api"]);
  });

  it("scores exact keyword matches locally", () => {
    expect(
      suggestTagsByKeyword("Improved the Next.js API route", ["api", "next.js", "design"]),
    ).toEqual(["api", "next.js"]);
  });
});
