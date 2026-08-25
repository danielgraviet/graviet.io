import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { NodeHtmlMarkdown } from "node-html-markdown";
import { getAllPosts } from "@/lib/posts";

const SITE = "https://www.graviet.io";
const DESCRIPTION =
  "Personal website and blog — thoughts on web development, projects, and more.";

function frontmatter(fields: Record<string, string | undefined>): string {
  const lines = Object.entries(fields)
    .filter(([, value]) => typeof value === "string" && value.trim())
    .map(([key, value]) => `${key}: ${JSON.stringify(value)}`);
  if (lines.length === 0) return "";
  return `---\n${lines.join("\n")}\n---\n\n`;
}

function absolute(href: string): string {
  if (href.startsWith("http://") || href.startsWith("https://") || href.startsWith("mailto:")) {
    return href;
  }
  return `${SITE}${href.startsWith("/") ? href : `/${href}`}`;
}

const NAV = [
  { href: "/blog", label: "Writing" },
  { href: "/", label: "Home" },
  { href: "/tools", label: "Tooling" },
];

async function homeMarkdown(): Promise<string> {
  const links = NAV.map(
    (item) => `- [${item.label}](${absolute(item.href)})`,
  ).join("\n");

  return (
    frontmatter({
      title: "graviet.io",
      description: DESCRIPTION,
    }) +
    `# graviet.io\n\n${DESCRIPTION}\n\n## Pages\n\n${links}\n`
  );
}

async function blogIndexMarkdown(): Promise<string> {
  const posts = await getAllPosts();
  const list = posts
    .map(
      (post) =>
        `- [${post.title}](${absolute(`/blog/${post.slug}`)}) (${post.publishedAt})${post.excerpt ? ` — ${post.excerpt}` : ""}`,
    )
    .join("\n");

  return (
    frontmatter({
      title: "Blog | graviet.io",
      description: "All posts",
    }) + `# Blog\n\n${list}\n`
  );
}

async function blogPostMarkdown(slug: string): Promise<string | null> {
  const postsDir = path.join(process.cwd(), "content/posts");
  if (!fs.existsSync(postsDir)) return null;

  for (const filename of fs.readdirSync(postsDir).filter((f) => f.endsWith(".md"))) {
    const raw = fs.readFileSync(path.join(postsDir, filename), "utf8");
    const { data } = matter(raw);
    const postSlug = data.slug ?? filename.replace(/\.md$/, "");
    if (postSlug === slug) {
      return raw.trim() + "\n";
    }
  }

  return null;
}

async function toolsMarkdown(): Promise<string> {
  return (
    frontmatter({
      title: "Tools | graviet.io",
      description: "Site tools and stack",
    }) +
    `# Tools\n\n` +
    `- [TTFB Tool](${absolute("/tools/ttfb")}) — Measure time to first byte from an ephemeral Daytona sandbox.\n` +
    `- [Learn](${absolute("/tools/learn")}) — Curriculum and spaced-repetition quizzes.\n` +
    `- [Work Log](${absolute("/tools/work-log")}) — Daily work notes with tags and search.\n` +
    `- [Household Budget](${absolute("/tools/budget")}) — Private shared spending dashboard.\n` +
    `- [Interview Timer](${absolute("/interview-tool")}) — Timed interview practice.\n` +
    `- [Go-Explore Demo](${absolute("/daytona-search-demo")}) — How sandbox snapshots let agents branch from saved progress.\n`
  );
}

function originBase(): string {
  if (process.env.MARKDOWN_ORIGIN) return process.env.MARKDOWN_ORIGIN;
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return SITE;
}

async function htmlFallbackMarkdown(pathname: string): Promise<string | null> {
  try {
    const url = new URL(pathname, originBase());
    const response = await fetch(url, {
      headers: {
        Accept: "text/html",
        "x-markdown-skip": "1",
      },
      // Avoid hanging the agent request
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) return null;

    const html = await response.text();
    const mainMatch =
      html.match(/<main[^>]*>([\s\S]*?)<\/main>/i) ??
      html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    const chunk = mainMatch?.[1] ?? html;
    const title =
      html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1]?.trim() ?? "graviet.io";
    const description =
      html
        .match(
          /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i,
        )?.[1]
        ?.trim() ?? DESCRIPTION;

    const body = NodeHtmlMarkdown.translate(chunk, {
      ignore: ["script", "style", "nav", "footer", "svg"],
    }).trim();

    return frontmatter({ title, description }) + (body ? `${body}\n` : "");
  } catch {
    return null;
  }
}

/**
 * Build a markdown representation for a public site path.
 * Returns null when the path should stay HTML-only (APIs, private tools).
 */
export async function buildPageMarkdown(
  pathname: string,
): Promise<string | null> {
  const normalized =
    pathname.length > 1 && pathname.endsWith("/")
      ? pathname.slice(0, -1)
      : pathname || "/";

  if (
    normalized.startsWith("/api/") ||
    normalized.startsWith("/.well-known/markdown") ||
    normalized.startsWith("/tools/learn") ||
    normalized === "/tools/budget" ||
    normalized === "/tools/roadmap" ||
    normalized === "/tools/work-log" ||
    normalized === "/learning-roadmap-route"
  ) {
    return null;
  }

  if (normalized === "/") return homeMarkdown();
  if (normalized === "/blog") return blogIndexMarkdown();
  if (normalized === "/tools") return toolsMarkdown();

  const blogMatch = normalized.match(/^\/blog\/([^/]+)$/);
  if (blogMatch) {
    return blogPostMarkdown(blogMatch[1]);
  }

  return htmlFallbackMarkdown(normalized);
}
