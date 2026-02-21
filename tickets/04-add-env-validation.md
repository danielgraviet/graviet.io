# Ticket 04 — Add Startup Environment Variable Validation

**Priority:** Medium
**File:** `src/lib/sanity.ts`, `src/sanity/env.ts`

---

## Problem

The app currently starts without any warning when Sanity environment variables are missing or wrong. `isSanityConfigured` is a boolean flag that silently enables placeholder mode. There's no feedback during development or at build time that tells you the CMS is not connected.

**Current behavior in `src/lib/sanity.ts`:**
```ts
export const isSanityConfigured = Boolean(projectId && dataset);

export const sanityClient = createClient({
  projectId: projectId || "placeholder",  // silently falls back
  dataset: dataset || "production",
  ...
});
```

The problem is: a developer or deployment can be missing `NEXT_PUBLIC_SANITY_PROJECT_ID` and the app gives no indication — it just serves placeholder content as if everything is fine.

---

## What to Do

### Step 1 — Log a clear warning at module load time when Sanity is not configured

In `src/lib/sanity.ts`, add a warning after the `isSanityConfigured` check:

```ts
export const isSanityConfigured = Boolean(projectId && dataset);

if (!isSanityConfigured) {
  console.warn(
    "[sanity] Sanity is not configured. Missing NEXT_PUBLIC_SANITY_PROJECT_ID or NEXT_PUBLIC_SANITY_DATASET. " +
    "Falling back to placeholder data. Set these in .env.local to connect to the CMS."
  );
}
```

This fires once when the module is first imported, so it will appear in the server startup logs and make the situation obvious immediately.

### Step 2 — (Optional) Validate the secret is set for the webhook route

In `src/app/api/revalidate/route.ts`, add a guard at the top of the POST handler:

```ts
if (!process.env.REVALIDATION_SECRET) {
  console.error("[revalidate] REVALIDATION_SECRET is not set. Webhook endpoint is non-functional.");
  return NextResponse.json({ message: "Server misconfigured" }, { status: 500 });
}
```

---

## Acceptance Criteria

- [ ] A clear warning is logged to the console when `NEXT_PUBLIC_SANITY_PROJECT_ID` or `NEXT_PUBLIC_SANITY_DATASET` is missing at startup
- [ ] The warning message tells the developer exactly which env vars to set and where to set them
- [ ] The app still starts and serves placeholder data — this is a warning, not a hard crash
- [ ] If `REVALIDATION_SECRET` is missing, the webhook route returns a 500 with a logged error instead of silently failing
