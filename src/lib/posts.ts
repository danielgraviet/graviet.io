import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkMath from "remark-math";
import remarkRehype from "remark-rehype";
import rehypeKatex from "rehype-katex";
import rehypePrettyCode from "rehype-pretty-code";
import rehypeStringify from "rehype-stringify";
import type { Post } from "./types";

const postsDir = path.join(process.cwd(), "content/posts");

function getPostFiles(): string[] {
  if (!fs.existsSync(postsDir)) return [];
  return fs.readdirSync(postsDir).filter((f) => f.endsWith(".md"));
}

function normalizeDate(value: unknown): string {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return value ? String(value) : "";
}

function parsePost(filename: string, includeBody = false): Post {
  const raw = fs.readFileSync(path.join(postsDir, filename), "utf8");
  const { data, content } = matter(raw);
  return {
    _id: filename.replace(/\.md$/, ""),
    title: data.title,
    slug: data.slug ?? filename.replace(/\.md$/, ""),
    excerpt: data.excerpt ?? "",
    publishedAt: normalizeDate(data.publishedAt),
    tags: Array.isArray(data.tags) ? data.tags : [],
    body: includeBody ? content : undefined,
  };
}

function getPublishedTime(post: Post): number {
  const time = Date.parse(post.publishedAt);
  return Number.isNaN(time) ? 0 : time;
}

export async function getAllPosts(): Promise<Post[]> {
  return getPostFiles()
    .map((f) => parsePost(f))
    .sort((a, b) => getPublishedTime(b) - getPublishedTime(a));
}

export async function getLatestPosts(count = 3): Promise<Post[]> {
  return (await getAllPosts()).slice(0, count);
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  const file = getPostFiles().find((f) => {
    const { data } = matter(fs.readFileSync(path.join(postsDir, f), "utf8"));
    return (data.slug ?? f.replace(/\.md$/, "")) === slug;
  });
  if (!file) return null;
  const post = parsePost(file, true);
  const processed = await unified()
    .use(remarkParse)
    .use(remarkMath)
    .use(remarkRehype)
    .use(rehypeKatex)
    .use(rehypePrettyCode, { theme: "github-light" })
    .use(rehypeStringify)
    .process(post.body as string);
  return { ...post, body: processed.toString() };
}

export async function getAllSlugs(): Promise<string[]> {
  return (await getAllPosts()).map((p) => p.slug);
}
