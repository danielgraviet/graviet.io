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
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/projects", label: "Projects" },
  { href: "/blog", label: "Blog" },
  { href: "/resume.pdf", label: "Resume" },
  { href: "/library", label: "Library" },
  { href: "/tools", label: "Tools" },
  { href: "/lifestyle", label: "Lifestyle" },
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

async function aboutMarkdown(): Promise<string> {
  return (
    frontmatter({
      title: "About | graviet.io",
      description: "About Daniel Graviet",
    }) +
    `# About\n\n` +
    `Thanks for visiting my website. I'm a CS student at BYU interested in the systems side of machine learning. Specifically how frontier models are built, served, and made faster in production.\n\n` +
    `I got here by trying a lot of things first. Early on I built with PHP, did some SEO, learned frontend, picked up GraphQL, and messed around with Arduino projects. That breadth eventually pointed me toward what really interests me: understanding what's happening underneath the abstraction.\n\n` +
    `Right now I'm focused on ML infrastructure. Things like CPU/GPU optimization, inference efficiency, and the systems that make models work at scale.\n\n` +
    `## Timeline\n\n` +
    `- **2026–Present** — Working on a second paper evaluating Kubernetes, Amazon EC2, AWS Fargate, and sandbox environments.\n` +
    `- **SoCC 2026** — Submitting a paper on reinforcement-learning evaluations.\n` +
    `- **Summer 2026** — Research intern in San Francisco.\n` +
    `- **Winter 2025–Present** — Research assistant in Dr. David Wingate's PCCL lab.\n` +
    `- **Fall 2025** — ML internship at Martian in San Francisco.\n` +
    `- **Summer 2025** — Interned at BLERP (Twitch-associated); GraphQL and data pipelines.\n` +
    `- **Sept. 2024** — Lead web developer for Howard Lewis & Peterson / Gunter Injury Law / Provo Criminal Defense.\n` +
    `- **Fall 2024** — Back at BYU; learning React, HTML/CSS, and backend.\n` +
    `- **2022–2024** — Served a two-year mission in Vietnam.\n` +
    `- **2021** — Arrived at BYU studying Computer Science; first CS class with Dr. Nancy Fulda.\n` +
    `- **~2019** — Built a mini Arduino project with Josh Greaves — first taste of programming.\n`
  );
}

async function contactMarkdown(): Promise<string> {
  return (
    frontmatter({
      title: "Contact | graviet.io",
      description: "Get in touch",
    }) +
    `# Get in Touch\n\nI'd love to hear from you.\n\n` +
    `- [GitHub](https://github.com/danielgraviet) — Open source work and projects\n` +
    `- [LinkedIn](https://www.linkedin.com/in/danielthigraviet/) — Connect professionally\n` +
    `- [X](https://x.com/lilgrav) — Follow along and say hi\n` +
    `- [Email](mailto:danny@graviet.io) — Drop me a line anytime\n`
  );
}

async function projectsMarkdown(): Promise<string> {
  const projects = [
    {
      title: "Silicon Sampling",
      description:
        "TruckMind is a fully autonomous AI agent that launches and operates a pop-up food truck business from zero. Given a concept, it researches the market, builds a menu, sets prices, serves customers, and adapts in real time—with no human in the loop.",
      tags: ["Winner", "AI Agents", "Automation", "Hackathon", "Food Tech"],
      url: "https://lnkd.in/p/gtRvksTM",
    },
    {
      title: "Go-Explore Applied to Coding Agents",
      description:
        "Current research applying Go-Explore to coding agents by treating sandboxes as a search space. Uses snapshotting to preserve and branch from promising states, supporting more effective RL search under fixed token budgets.",
      tags: ["Research", "Go-Explore", "Coding Agents", "Reinforcement Learning", "Sandboxes", "Snapshotting"],
      url: "https://arxiv.org/abs/1901.10995",
    },
    {
      title: "RL Rollout Infrastructure Evaluation",
      description:
        "Research project evaluating coding-agent RL rollouts across Amazon EC2, AWS Fargate, Docker, and sandbox environments. Characterized latency tradeoffs and scaling laws at scale, then identified optimizations such as warm pools and pre-cached images to reduce rollout overhead.",
      tags: ["Research", "Reinforcement Learning", "Coding Agents", "EC2", "Fargate", "Docker", "Sandboxes"],
      url: "https://www.daytona.io/dotfiles/the-hidden-infrastructure-tax-in-coding-agent-rl",
    },
    {
      title: "Annex",
      description:
        "Validation landing page for a curated network of industrial and commercial workspaces.",
      tags: ["Proof of Concept", "Next.js", "TypeScript", "Tailwind CSS"],
    },
    {
      title: "TopPrompt",
      description:
        "Platform for developers to discover, rank, and share battle-tested AI prompts.",
      tags: ["Proof of Concept", "Next.js", "TypeScript", "PostgreSQL", "Plasmo"],
    },
    {
      title: "OhSheet",
      description:
        "Student tool used by 15 people that syncs upcoming Canvas assignments into a collaborative Google Sheet.",
      tags: ["Student Tool", "Python", "FastAPI", "React", "Redis"],
      url: "https://github.com/danielgraviet/ohsheet",
    },
    {
      title: "Thread Pool Management System",
      description: "Custom C++20 thread pool built as a systems programming project.",
      tags: ["Learning Project", "C++20", "CMake", "Concurrency"],
    },
    {
      title: "Helix",
      description:
        "Self-extending AI agent that writes, containerizes, and deploys its own microservices.",
      tags: ["Winner"],
    },
    {
      title: "Code Quintet",
      description:
        "LLM ensemble that generates and benchmarks code variants in Daytona sandboxes.",
      tags: ["Winner"],
      url: "https://devpost.com/software/code-quintet",
    },
    {
      title: "PolySandbox",
      description:
        "Backend-agnostic API to run code across Daytona, E2B, and Docker.",
      tags: ["Winner"],
      url: "https://devpost.com/software/polysandbox",
    },
    {
      title: "infertrace",
      description:
        "High-throughput monitoring layer for ML models inspired by distributed tracing.",
      tags: ["Learning Project", "Go", "gRPC", "Python"],
    },
  ];

  const body = projects
    .map(
      (project) =>
        `### ${project.url ? `[${project.title}](${project.url})` : project.title}\n\n${project.description}\n\nTags: ${project.tags.join(", ")}\n`,
    )
    .join("\n");

  return (
    frontmatter({
      title: "Projects | graviet.io",
      description: "Things I've built",
    }) + `# Projects\n\nThings I've built.\n\n${body}`
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
    `## Site Tools\n\n` +
    `- [TTFB Tool](${absolute("/tools/ttfb")}) — Measure time to first byte from an ephemeral Daytona sandbox.\n` +
    `- [Learn](${absolute("/tools/learn")}) — Curriculum and spaced-repetition quizzes (password-gated).\n` +
    `- [Work Log](${absolute("/tools/work-log")}) — Daily work notes with tags and search (password-gated).\n` +
    `- [Household Budget](${absolute("/tools/budget")}) — Private shared spending dashboard (password-gated).\n` +
    `- [Interview Timer](${absolute("/interview-tool")}) — Timed interview practice.\n\n` +
    `## Development\n\n` +
    `- **Cursor** — VS Code-based editor of choice.\n` +
    `- **Terminal** — The default macOS terminal.\n` +
    `- **Codex / Claude Code** — I switch between them for AI-assisted coding.\n\n` +
    `## Stack\n\n` +
    `- **Python** — My primary programming language.\n` +
    `- **Next.js** — Go-to framework for web apps and this site.\n` +
    `- **Daytona** — Sandboxes and developer tooling.\n\n` +
    `## Apps & Services\n\n` +
    `- **Notion** — Notes, projects, and long-form thinking.\n` +
    `- **Google Docs** — Simple documents and collaboration.\n` +
    `- **Brave Browser** — Browser of choice for CPU efficiency.\n`
  );
}

async function libraryMarkdown(): Promise<string> {
  return (
    frontmatter({
      title: "Library | graviet.io",
      description: "Books worth reading",
    }) +
    `# Library\n\n` +
    `## Currently Reading\n\n` +
    `- **Crossing the Chasm** — Geoffrey A. Moore\n\n` +
    `## Favorites\n\n` +
    `- **Unreasonable Hospitality** — Will Guidara\n` +
    `- **Deep Work** — Cal Newport\n` +
    `- **Essentialism** — Greg McKeown\n` +
    `- **Atomic Habits** — James Clear\n\n` +
    `## Want to Read\n\n` +
    `- **Effortless** — Greg McKeown\n` +
    `- **Outliers** — Malcolm Gladwell\n` +
    `- **Fahrenheit 451** — Ray Bradbury\n` +
    `- **1984** — George Orwell\n`
  );
}

async function lifestyleMarkdown(): Promise<string> {
  return (
    frontmatter({
      title: "Lifestyle | graviet.io",
      description: "How I spend my time outside of work",
    }) +
    `# Lifestyle\n\nHow I spend my time outside of work.\n\n` +
    `- **Fitness** — Fan of the gym; helps with focus and mood.\n` +
    `- **Reading** — Technology, philosophy, and business.\n` +
    `- **Music** — Rain sounds for focus.\n` +
    `- **Morning Routine** — Start the day strong.\n`
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
  if (normalized === "/about") return aboutMarkdown();
  if (normalized === "/contact") return contactMarkdown();
  if (normalized === "/projects") return projectsMarkdown();
  if (normalized === "/blog") return blogIndexMarkdown();
  if (normalized === "/tools") return toolsMarkdown();
  if (normalized === "/library") return libraryMarkdown();
  if (normalized === "/lifestyle") return lifestyleMarkdown();

  const blogMatch = normalized.match(/^\/blog\/([^/]+)$/);
  if (blogMatch) {
    return blogPostMarkdown(blogMatch[1]);
  }

  return htmlFallbackMarkdown(normalized);
}
