# Ticket 05 — Fix Unguarded `Promise.all` on Home Page

**Priority:** Medium
**File:** `src/app/page.tsx` (lines 8–11)

---

## Problem

The home page fetches posts and projects in parallel using `Promise.all`:

```ts
const [posts, projects] = await Promise.all([
  getLatestPosts(3),
  getAllProjects(),
]);
```

`Promise.all` rejects as soon as **any** promise in the array rejects. Even though each query function has its own internal try-catch, if something unexpected throws outside the fetch (e.g., a type error during data processing), the entire home page will crash with an unhandled error.

The individual query functions already have fallbacks, so a failed query should never cause a page-level crash. But right now, if a query function itself throws instead of returning, the page fails.

---

## What to Do

Wrap the `Promise.all` call so that each promise settles independently. Use `Promise.allSettled` and extract the values, falling back to empty arrays on failure:

```ts
const [postsResult, projectsResult] = await Promise.allSettled([
  getLatestPosts(3),
  getAllProjects(),
]);

const posts = postsResult.status === "fulfilled" ? postsResult.value : [];
const projects = projectsResult.status === "fulfilled" ? projectsResult.value : [];

if (postsResult.status === "rejected") {
  console.error("[home] getLatestPosts failed:", postsResult.reason);
}
if (projectsResult.status === "rejected") {
  console.error("[home] getAllProjects failed:", projectsResult.reason);
}
```

This ensures:
- If one query fails, the other still renders.
- Failures are logged so they're visible in server logs.
- The page never crashes due to a single failed data fetch.

---

## Acceptance Criteria

- [ ] `Promise.all` is replaced with `Promise.allSettled` on the home page
- [ ] If `getLatestPosts` fails, projects still render (and vice versa)
- [ ] Failures are logged with `console.error`
- [ ] Home page renders correctly when both queries succeed
- [ ] TypeScript types are satisfied — `posts` and `projects` are the correct types, not `PromiseSettledResult`
