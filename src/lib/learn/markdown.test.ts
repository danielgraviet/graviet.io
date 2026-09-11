import { describe, expect, it } from "vitest";
import { renderLearnMarkdown } from "./markdown";

describe("renderLearnMarkdown", () => {
  it("renders GFM, math, and fenced code", async () => {
    const html = await renderLearnMarkdown(
      "- **Q-learning**\n\n$Q(s,a)$\n\n```python\nreturn action\n```",
    );
    expect(html).toContain("<strong>Q-learning</strong>");
    expect(html).toContain("katex");
    expect(html).toContain("return");
    expect(html).toContain("action");
  });

  it("does not pass raw HTML through", async () => {
    const html = await renderLearnMarkdown("<script>alert(1)</script>");
    expect(html).not.toContain("<script>");
    expect(html).not.toContain("alert(1)");
  });
});
