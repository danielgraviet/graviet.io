import { describe, expect, it } from "vitest";
import { parseQaPairs } from "./parse-qa";

describe("parseQaPairs", () => {
  it("parses Q:/A: pairs", () => {
    expect(
      parseQaPairs("Q: What is cache coherence?\nA: Caches agree on shared data."),
    ).toEqual([
      {
        front: "What is cache coherence?",
        back: "Caches agree on shared data.",
      },
    ]);
  });

  it("accepts Q. / A. and multiline answers", () => {
    expect(
      parseQaPairs("Q. What is NUMA?\nA. Memory closer to some CPUs\nis faster."),
    ).toEqual([
      {
        front: "What is NUMA?",
        back: "Memory closer to some CPUs\nis faster.",
      },
    ]);
  });

  it("parses multiple pairs and skips a question with no answer", () => {
    const cards = parseQaPairs(
      "Q: First?\nA: One\n\nQ: Incomplete\n\nQ: Third?\nA: Three",
    );
    expect(cards).toEqual([
      { front: "First?", back: "One" },
      { front: "Third?", back: "Three" },
    ]);
  });
});
