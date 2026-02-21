# Ticket 07 — Add a Custom 404 Not Found Page

**Priority:** Low
**File to create:** `src/app/not-found.tsx`

---

## Problem

The site currently uses the default Next.js 404 page. This is a plain, unstyled page that doesn't match the site's design. When a user lands on a broken link or a deleted blog post, they see a jarring layout that has no navigation and no way to get back to the site.

---

## What to Do

Create `src/app/not-found.tsx`. Next.js App Router automatically uses this file for all 404 responses.

The page should:
- Match the existing site design (same font, colors, layout padding)
- Tell the user clearly that the page doesn't exist
- Provide a link back to the home page
- Be a simple server component (no `"use client"` needed)

**Example implementation:**
```tsx
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex max-w-6xl flex-col items-start justify-center px-4 py-24 md:px-6">
      <p className="mb-4 text-xs uppercase tracking-[0.2em] text-text-secondary">404</p>
      <h1 className="mb-6 text-4xl font-bold tracking-tight">Page not found.</h1>
      <p className="mb-8 text-sm leading-relaxed text-text-secondary">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Link
        href="/"
        className="text-sm font-medium underline underline-offset-4 hover:text-accent"
      >
        Go home
      </Link>
    </main>
  );
}
```

Adjust the copy and styling to match your personal preference — the above is a starting point that follows the existing design system (text-text-secondary, tracking-[0.2em], underline-offset-4, hover:text-accent).

---

## Acceptance Criteria

- [ ] Visiting a non-existent URL (e.g., `/does-not-exist`) shows the custom page instead of the Next.js default
- [ ] The page includes the site's `Navbar` and `Footer` (these are applied automatically by `layout.tsx`, so no extra work needed)
- [ ] There is a visible link back to the home page
- [ ] The design is consistent with the rest of the site
