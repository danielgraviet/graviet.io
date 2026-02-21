# Ticket 08 — Make the Hero Status Badge CMS-Driven

**Priority:** Low
**Files:** `src/app/page.tsx` (line 23), `src/sanity/schemas/` (new schema), `src/lib/sanity.queries.ts` (new query), `src/lib/types.ts` (new type)

---

## Problem

The hero section on the home page has a hardcoded status badge:

```tsx
// src/app/page.tsx, line 23
<span className="text-base font-medium text-foreground">
  Currently: EVO research project @ BYU PCCL
</span>
```

Every time the current project or focus changes, it requires a code change and a redeployment. This should be editable from the Sanity CMS.

---

## What to Do

### Step 1 — Create a `siteSettings` Sanity schema

Create `src/sanity/schemas/siteSettings.ts`:

```ts
import { defineType, defineField } from "sanity";

export default defineType({
  name: "siteSettings",
  title: "Site Settings",
  type: "document",
  fields: [
    defineField({
      name: "statusBadge",
      title: "Status Badge",
      type: "string",
      description: 'Text shown in the hero badge. E.g. "EVO research project @ BYU PCCL"',
    }),
  ],
});
```

### Step 2 — Register the schema

In `src/sanity/schemas/index.ts`, add `siteSettings` to the schema types array:

```ts
import siteSettings from "./siteSettings";
// ... existing imports ...

export const schemaTypes = [post, project, siteSettings];
```

### Step 3 — Add a type in `src/lib/types.ts`

```ts
export interface SiteSettings {
  statusBadge?: string;
}
```

### Step 4 — Add a query in `src/lib/sanity.queries.ts`

```ts
export async function getSiteSettings(): Promise<SiteSettings> {
  if (!isSanityConfigured) return {};
  try {
    return await sanityClient.fetch(
      `*[_type == "siteSettings"][0]{ statusBadge }`
    );
  } catch (error) {
    console.error("[sanity.queries] getSiteSettings failed:", error);
    return {};
  }
}
```

### Step 5 — Use it in `src/app/page.tsx`

Fetch settings alongside the other queries and use the value with a fallback:

```tsx
const [postsResult, projectsResult, settingsResult] = await Promise.allSettled([
  getLatestPosts(3),
  getAllProjects(),
  getSiteSettings(),
]);

const settings = settingsResult.status === "fulfilled" ? settingsResult.value : {};

// In the JSX:
<span className="text-base font-medium text-foreground">
  Currently: {settings.statusBadge ?? "EVO research project @ BYU PCCL"}
</span>
```

The fallback string ensures the badge is never blank even if the CMS value isn't set yet.

### Step 6 — Create the document in Sanity Studio

After deploying, go to `/studio`, open "Site Settings", and fill in the status badge text.

---

## Acceptance Criteria

- [ ] A `siteSettings` document type exists in the Sanity schema with a `statusBadge` string field
- [ ] The home page reads `statusBadge` from Sanity at render time
- [ ] If the CMS value is missing or Sanity is unavailable, a fallback string is shown
- [ ] Changing the badge text in Sanity Studio updates the home page after revalidation (no code change or redeploy needed)
