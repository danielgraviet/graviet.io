# Ticket 03 — Add Error Logging to Sanity Query Functions

**Priority:** Medium
**File:** `src/lib/sanity.queries.ts`

---

## Problem

Every query function in `sanity.queries.ts` swallows errors silently. When a Sanity API call fails in production, the catch block returns placeholder data with no logging whatsoever. This makes it impossible to know whether Sanity is consistently failing, intermittently failing, or if there's a misconfiguration.

**Current pattern (repeated in all 5 functions):**
```ts
} catch {
  return placeholderPosts;
}
```

---

## What to Do

Add a `console.error` call inside each catch block that logs:
- Which function failed
- The error itself

Do **not** throw the error — the fallback to placeholder data should remain so the site stays up. Just make the failure visible in logs.

**Updated pattern for each function:**
```ts
} catch (error) {
  console.error("[sanity.queries] getAllPosts failed:", error);
  return placeholderPosts;
}
```

Apply this to all five functions with the appropriate function name in the log message:
- `getAllPosts` → `"[sanity.queries] getAllPosts failed:"`
- `getLatestPosts` → `"[sanity.queries] getLatestPosts failed:"`
- `getPostBySlug` → `"[sanity.queries] getPostBySlug failed:"`
- `getAllSlugs` → `"[sanity.queries] getAllSlugs failed:"`
- `getAllProjects` → `"[sanity.queries] getAllProjects failed:"`

For `getPostBySlug` and `getAllSlugs`, also log the input value so you know which slug triggered the failure:
```ts
} catch (error) {
  console.error(`[sanity.queries] getPostBySlug failed for slug "${slug}":`, error);
  return placeholderPosts.find((p) => p.slug === slug) ?? null;
}
```

---

## Acceptance Criteria

- [ ] All 5 query functions log a descriptive error message when the Sanity fetch fails
- [ ] `getPostBySlug` and `getAllSlugs` include the relevant slug in the log message
- [ ] Fallback behavior (returning placeholder data) is unchanged
- [ ] No errors are silently swallowed — every catch block now has a `console.error` call
