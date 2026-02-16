import type { Post, Project } from "./types";

export const placeholderPosts: Post[] = [
  {
    _id: "placeholder-1",
    title: "Getting Started with Next.js 16",
    slug: "getting-started-nextjs-16",
    excerpt:
      "Exploring the latest features in Next.js 16, from async params to improved server components.",
    publishedAt: "2026-02-10",
    tags: ["Next.js", "React", "Web Dev"],
    body: [
      {
        _type: "block",
        style: "normal",
        children: [
          {
            _type: "span",
            text: "Next.js 16 brings a wave of improvements that make building modern web applications even more enjoyable. In this post, we'll walk through the highlights and see how they change the way we build.",
          },
        ],
      },
      {
        _type: "block",
        style: "h2",
        children: [{ _type: "span", text: "Async Params" }],
      },
      {
        _type: "block",
        style: "normal",
        children: [
          {
            _type: "span",
            text: "One of the most notable changes is that dynamic route params are now a Promise that must be awaited. This aligns with the streaming-first architecture and gives the framework more control over when data is resolved.",
          },
        ],
      },
      {
        _type: "block",
        style: "h2",
        children: [{ _type: "span", text: "What's Next" }],
      },
      {
        _type: "block",
        style: "normal",
        children: [
          {
            _type: "span",
            text: "With these foundations in place, we can build faster, more resilient applications. Stay tuned for more posts exploring advanced patterns.",
          },
        ],
      },
    ],
  },
  {
    _id: "placeholder-2",
    title: "Why I Love Tailwind CSS v4",
    slug: "why-i-love-tailwind-v4",
    excerpt:
      "Tailwind v4 simplifies configuration with CSS-first theming. Here's why it's a game-changer.",
    publishedAt: "2026-02-05",
    tags: ["CSS", "Tailwind", "Design"],
    body: [
      {
        _type: "block",
        style: "normal",
        children: [
          {
            _type: "span",
            text: "Tailwind CSS v4 moves configuration into your CSS file with @theme, eliminating the need for a separate config file. It feels like a natural evolution.",
          },
        ],
      },
    ],
  },
  {
    _id: "placeholder-3",
    title: "Building a CMS-Powered Blog with Sanity",
    slug: "cms-powered-blog-sanity",
    excerpt:
      "A practical guide to integrating Sanity CMS with a Next.js project for a fully managed blog.",
    publishedAt: "2026-01-28",
    tags: ["Sanity", "CMS", "Tutorial"],
    body: [
      {
        _type: "block",
        style: "normal",
        children: [
          {
            _type: "span",
            text: "Sanity is a powerful headless CMS that pairs beautifully with Next.js. In this guide, we'll set up a schema, query content with GROQ, and render it with portable text.",
          },
        ],
      },
    ],
  },
];

export const placeholderProjects: Project[] = [
  {
    _id: "project-1",
    title: "graviet.io",
    description:
      "My personal website built with Next.js 16, Tailwind CSS v4, and Sanity CMS. You're looking at it right now!",
    tags: ["Next.js", "Tailwind", "Sanity"],
    url: "https://graviet.io",
    featured: true,
  },
  {
    _id: "project-2",
    title: "Task Flow",
    description:
      "A drag-and-drop project management app with real-time collaboration powered by WebSockets.",
    tags: ["React", "Node.js", "WebSockets"],
    featured: true,
  },
  {
    _id: "project-3",
    title: "CLI Weather",
    description:
      "A minimal command-line weather tool that fetches forecasts from the Open-Meteo API.",
    tags: ["Go", "CLI", "API"],
    featured: false,
  },
  {
    _id: "project-4",
    title: "Markdown Note Garden",
    description:
      "A local-first note-taking app with bi-directional linking and full-text search.",
    tags: ["TypeScript", "SQLite", "Electron"],
    featured: true,
  },
];
