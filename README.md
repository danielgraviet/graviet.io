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
├── ideas/             # Essay ideas, outlines, and partial drafts
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

## Essay Idea Pipeline

Use `content/ideas/` to track essay titles you have not started, partially started, or are actively drafting. The goal is to keep idea capture lightweight while making it easy for a coding agent to turn an idea file into a publishable post later.

The workflow is:

1. Create one markdown file per essay idea in `content/ideas/`.
2. Use frontmatter to track the idea title, slug, status, dates, tags, and a short summary.
3. Use the body for rough notes, outline bullets, fragments, quotes, or partial draft text.
4. Update the `status` field as the idea matures:
   - `idea`
   - `outline`
   - `drafting`
   - `ready`
   - `published`
5. When a piece is ready to become a blog post, have the agent promote it into `content/posts/`, preserve your content, improve markdown formatting, and generate complete publish metadata.

The default shape for an idea file is:

```md
---
title: Why Verification Is the Real Bottleneck for Long-Horizon AI
slug: verification-bottleneck-long-horizon-ai
status: idea
createdAt: 2026-05-12
updatedAt: 2026-05-12
tags: [AI, RL, Verification]
summary: Notes toward an essay on why progress stalls when substeps are hard to verify.
---

## Thesis

The real bottleneck is not horizon length by itself. It is horizon length without cheap verification.

## Notes

- RLVR works in math and code because truth is mechanically checkable
- Long-horizon autonomy fails when evaluation is expensive
- This may explain uneven progress across domains
```

Agents should treat idea files as working material rather than published posts. They should not overwrite your ideas with polished prose unless asked. Their job is to help you preserve, structure, extend, and eventually promote those drafts into `content/posts/`.

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
3. Always add YAML frontmatter at the top of the file. Do not leave metadata blank or omit it. The agent should generate relevant metadata from the essay itself using this exact shape:

```md
---
title: My New Post
slug: my-new-post
excerpt: A short 1-2 sentence summary for the blog index and metadata.
publishedAt: 2026-05-12
tags: [AI, Writing]
---
```

4. Generate these fields intentionally because the current loader and blog UI expect them:
   - `title`: required; create a clear, publication-ready title that reflects the actual argument of the post
   - `slug`: required in practice; use a lowercase, hyphenated URL slug that matches the filename
   - `excerpt`: required in practice; write a concise 1-2 sentence summary that will appear on the blog card and in metadata
   - `publishedAt`: required; set the publish date in `YYYY-MM-DD` form
   - `tags`: required in practice; add a short array of relevant tags based on the post topic
5. When generating metadata, the agent should:
   - infer a strong title from the essay rather than copying a weak placeholder
   - choose a slug that is stable, descriptive, and URL-safe
   - write an excerpt that summarizes the actual thesis or topic of the piece
   - set `publishedAt` to the intended publish date
   - choose tags that are specific to the subject matter, not generic filler
6. Preserve body content as plain markdown. The site converts markdown to HTML with `remark` and renders it through [`src/components/MarkdownRenderer.tsx`](/Users/danielgraviet/Desktop/projects/graviet.io/src/components/MarkdownRenderer.tsx).
7. Do not add any manual route registration for normal posts. In the current architecture, discovery is automatic from the files in `content/posts/`.
8. Before finishing, confirm the post has both:
   - well-structured markdown body formatting
   - complete frontmatter with `title`, `slug`, `excerpt`, `publishedAt`, and `tags`
9. Verify the result:
   - Run `bun lint`
   - Run `bun dev`
   - Check the post appears on `/blog`
   - Check the post page loads at `/blog/<slug>`
   - Confirm the title, excerpt, date, tags, and section formatting render correctly

### Example

Use [`content/posts/hello-world.md`](/Users/danielgraviet/Desktop/projects/graviet.io/content/posts/hello-world.md) as the canonical example for structure and tone of frontmatter.

### Notes For Agents

- The filename should generally match the slug: `my-new-post.md` -> `slug: my-new-post`.
- Even though the loader can fall back to the filename, agents should still always set `slug` explicitly.
- Agents should always provide `title`, `slug`, `excerpt`, `publishedAt`, and `tags` for every post they add or format.
- Posts are sorted by `publishedAt` descending.
- Only `.md` files are loaded right now; `.mdx` is not part of this pipeline.
- If raw content needs custom embeds or richer rendering, update the markdown pipeline in `src/lib/posts.ts` and the renderer before relying on that syntax.
- Idea files belong in `content/ideas/`; published posts belong in `content/posts/`.
