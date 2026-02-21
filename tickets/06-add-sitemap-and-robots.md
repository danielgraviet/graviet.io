# Ticket 06 — Add `sitemap.xml` and `robots.txt`

**Priority:** Low
**Files to create:** `src/app/sitemap.ts`, `src/app/robots.ts`

---

## Problem

The site has no `sitemap.xml` or `robots.txt`. Without a sitemap, search engines have to discover pages by crawling links, which means new blog posts and project pages may not be indexed quickly. Without `robots.txt`, there are no instructions for crawlers about what to index or exclude (like the `/studio` admin route).

---

## What to Do

Next.js App Router supports generating both files from TypeScript modules. No packages need to be installed.

### Step 1 — Create `src/app/sitemap.ts`

```ts
import { MetadataRoute } from "next";
import { getAllPosts, getAllProjects } from "@/lib/sanity.queries";

const BASE_URL = "https://graviet.io";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [posts, projects] = await Promise.allSettled([
    getAllPosts(),
    getAllProjects(),
  ]);

  const postEntries: MetadataRoute.Sitemap =
    posts.status === "fulfilled"
      ? posts.value.map((post) => ({
          url: `${BASE_URL}/blog/${post.slug}`,
          lastModified: post.publishedAt,
          changeFrequency: "monthly" as const,
          priority: 0.7,
        }))
      : [];

  return [
    {
      url: BASE_URL,
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/blog`,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/projects`,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/about`,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/contact`,
      changeFrequency: "yearly",
      priority: 0.5,
    },
    ...postEntries,
  ];
}
```

### Step 2 — Create `src/app/robots.ts`

```ts
import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: "/studio/",   // keep the CMS interface out of search results
      },
    ],
    sitemap: "https://graviet.io/sitemap.xml",
  };
}
```

---

## Acceptance Criteria

- [ ] `https://graviet.io/sitemap.xml` returns a valid XML sitemap listing all static pages and all blog post URLs
- [ ] `https://graviet.io/robots.txt` returns a valid robots file that allows all crawlers except on `/studio/`
- [ ] The sitemap is generated at build time (or on-demand via ISR) — it does not require a separate build step
- [ ] If Sanity is unavailable, the sitemap still returns the static page entries (no crash)
