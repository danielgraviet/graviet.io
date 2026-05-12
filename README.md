# graviet.io

Personal portfolio and blog site.

## Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org) (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **CMS**: [Sanity v5](https://www.sanity.io) with embedded Studio at `/studio`
- **Icons**: Lucide React

## Project Structure

```
content/
└── posts/             # File-based markdown blog posts
src/
├── app/
│   ├── about/
│   ├── blog/
│   │   └── [slug]/    # Individual blog post pages
│   ├── contact/
│   ├── projects/
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── Navbar.tsx
│   ├── Footer.tsx
│   ├── BlogCard.tsx
│   ├── ProjectCard.tsx
│   ├── MarkdownRenderer.tsx
│   └── ...
├── lib/
│   ├── posts.ts       # Markdown post loader
│   └── types.ts
└── sanity/            # Sanity schemas and client config
```

## Getting Started

```bash
bun install
bun dev
```

Open [http://localhost:3000](http://localhost:3000) to view the site, or [http://localhost:3000/studio](http://localhost:3000/studio) for the Sanity Studio.

## Scripts

| Command       | Description              |
|---------------|--------------------------|
| `bun dev`     | Start development server |
| `bun build`   | Build for production     |
| `bun start`   | Start production server  |
| `bun lint`    | Run ESLint               |

## Adding Blog Posts From Raw Markdown

This repo already supports file-based markdown posts. Any `.md` file placed in `content/posts/` is automatically picked up by [`src/lib/posts.ts`](/Users/danielgraviet/Desktop/projects/graviet.io/src/lib/posts.ts), shown on [`/blog`](/Users/danielgraviet/Desktop/projects/graviet.io/src/app/blog/page.tsx), and rendered at `/blog/[slug]` via [`src/app/blog/[slug]/page.tsx`](/Users/danielgraviet/Desktop/projects/graviet.io/src/app/blog/[slug]/page.tsx).

For a coding agent, the workflow should be:

1. Take the raw markdown source and create a new file in `content/posts/` named after the intended slug, for example `my-new-post.md`.
2. Normalize the markdown so it reads cleanly on the site:
   - Add a single H1-equivalent title in frontmatter, not again in the body.
   - Use `##` and `###` headings for sections.
   - Convert loose notes into standard markdown paragraphs and bullet lists.
   - Clean up spacing, code fences, and links.
   - Remove unsupported or messy constructs unless the renderer is explicitly extended to support them.
3. Add YAML frontmatter at the top of the file using this exact shape:

```md
---
title: My New Post
slug: my-new-post
excerpt: A short 1-2 sentence summary for the blog index and metadata.
publishedAt: 2026-05-12
tags: [AI, Writing]
---
```

4. Keep these fields valid because the current loader expects them:
   - `title`: required
   - `slug`: recommended and should match the URL segment
   - `excerpt`: recommended and used on blog cards and metadata
   - `publishedAt`: required in ISO-like date form `YYYY-MM-DD`
   - `tags`: array of short strings
5. Preserve body content as plain markdown. The site converts markdown to HTML with `remark` and renders it through [`src/components/MarkdownRenderer.tsx`](/Users/danielgraviet/Desktop/projects/graviet.io/src/components/MarkdownRenderer.tsx).
6. Do not add any manual route registration for normal posts. In the current architecture, discovery is automatic from the files in `content/posts/`.
7. Verify the result:
   - Run `bun lint`
   - Run `bun dev`
   - Check the post appears on `/blog`
   - Check the post page loads at `/blog/<slug>`
   - Confirm the title, excerpt, date, tags, and section formatting render correctly

### Example

Use [`content/posts/hello-world.md`](/Users/danielgraviet/Desktop/projects/graviet.io/content/posts/hello-world.md) as the canonical example for structure and tone of frontmatter.

### Notes For Agents

- The filename should generally match the slug: `my-new-post.md` -> `slug: my-new-post`.
- If `slug` is omitted, the loader falls back to the filename, but agents should still set it explicitly.
- Posts are sorted by `publishedAt` descending.
- Only `.md` files are loaded right now; `.mdx` is not part of this pipeline.
- If raw content needs custom embeds or richer rendering, update the markdown pipeline in `src/lib/posts.ts` and the renderer before relying on that syntax.
