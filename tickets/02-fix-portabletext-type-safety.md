# Ticket 02 — Fix `as any` in PortableTextRenderer

**Priority:** High
**File:** `src/components/PortableTextRenderer.tsx` (line 38), `src/lib/types.ts` (line 8)

---

## Problem

The `Post.body` field is typed as `unknown[]` in `types.ts`, and `PortableTextRenderer` accepts `unknown[]` as its prop. To pass that value to `<PortableText>`, the code casts it with `as any`, which completely disables TypeScript checking on the rich text content. A malformed body value could cause a runtime crash that TypeScript would otherwise catch.

**Current code in `PortableTextRenderer.tsx`:**
```ts
export default function PortableTextRenderer({ value }: { value: unknown[] }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return <PortableText value={value as any} components={components} />;
}
```

**Current type in `types.ts`:**
```ts
body?: unknown[];
```

---

## What to Do

### Step 1 — Install the Sanity block content types (if not already present)

`@portabletext/react` exports the correct type for block content. Check if `PortableTextBlock` is already available:
```ts
import type { PortableTextBlock } from "@portabletext/react";
```

If that doesn't export it, try:
```ts
import type { PortableTextBlock } from "@portabletext/types";
```

`@portabletext/types` is a dependency of `@portabletext/react` so it should already be installed.

### Step 2 — Update the `Post` type in `src/lib/types.ts`

```ts
import type { PortableTextBlock } from "@portabletext/types";

export interface Post {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  publishedAt: string;
  tags: string[];
  body?: PortableTextBlock[];
}
```

### Step 3 — Update `PortableTextRenderer.tsx`

Remove the `as any` cast and the eslint-disable comment:
```ts
import { PortableText, type PortableTextComponents } from "@portabletext/react";
import type { PortableTextBlock } from "@portabletext/types";

// ... components definition stays the same ...

export default function PortableTextRenderer({ value }: { value: PortableTextBlock[] }) {
  return <PortableText value={value} components={components} />;
}
```

---

## Acceptance Criteria

- [ ] `Post.body` is typed as `PortableTextBlock[]` instead of `unknown[]`
- [ ] `PortableTextRenderer` accepts `PortableTextBlock[]` with no `as any` cast
- [ ] The eslint-disable comment is removed
- [ ] `tsc --noEmit` passes with no new errors
- [ ] Blog post pages still render correctly
