import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkRehype from "remark-rehype";
import rehypeKatex from "rehype-katex";
import rehypePrettyCode from "rehype-pretty-code";
import rehypeStringify from "rehype-stringify";

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkMath)
  // Raw HTML is intentionally omitted: arbitrary card text must not become HTML.
  .use(remarkRehype)
  .use(rehypeKatex)
  .use(rehypePrettyCode, { theme: "github-light" })
  .use(rehypeStringify);

export async function renderLearnMarkdown(markdown: string): Promise<string> {
  return String(await processor.process(markdown));
}

export async function renderLearnCard<T extends { front: string; back: string }>(
  card: T,
): Promise<T & { frontHtml: string; backHtml: string }> {
  const [frontHtml, backHtml] = await Promise.all([
    renderLearnMarkdown(card.front),
    renderLearnMarkdown(card.back),
  ]);
  return { ...card, frontHtml, backHtml };
}
