# Ticket 01 — Harden the `/api/revalidate` Webhook

**Priority:** High
**File:** `src/app/api/revalidate/route.ts`

---

## Problem

The revalidation webhook endpoint has three security weaknesses:

1. **Secret exposed in query string.** The secret is read from `request.nextUrl.searchParams.get("secret")`, which means it shows up in server logs, proxy logs, and browser history. It should be in a request header instead.

2. **No HMAC signature verification.** Sanity can sign webhook payloads using HMAC-SHA256. The current code only does a plain string equality check, which is easier to brute-force and doesn't verify the payload actually came from Sanity.

3. **Timing attack vulnerability.** Plain `!==` string comparison leaks information via response time differences. Node's `crypto.timingSafeEqual` should be used instead.

**Current code (lines 10–14):**
```ts
const secret = request.nextUrl.searchParams.get("secret");

if (secret !== process.env.REVALIDATION_SECRET) {
  return NextResponse.json({ message: "Invalid secret" }, { status: 401 });
}
```

---

## What to Do

### Step 1 — Move the secret to a header

Read it from the `Authorization` header instead of the query string:
```ts
const authHeader = request.headers.get("authorization");
const token = authHeader?.replace("Bearer ", "") ?? "";
```

Update the Sanity webhook configuration (in the Sanity dashboard) to send the secret as `Authorization: Bearer <secret>` instead of a query param.

### Step 2 — Use timing-safe comparison

```ts
import { timingSafeEqual, createHmac } from "crypto";

const expected = Buffer.from(process.env.REVALIDATION_SECRET ?? "");
const received = Buffer.from(token);

if (expected.length !== received.length || !timingSafeEqual(expected, received)) {
  return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
}
```

### Step 3 — (Optional but recommended) Verify Sanity's HMAC signature

If you enable webhook signatures in Sanity, they send a `sanity-webhook-signature` header. Verify it like this:
```ts
const signature = request.headers.get("sanity-webhook-signature") ?? "";
const rawBody = await request.text();
const hmac = createHmac("sha256", process.env.REVALIDATION_SECRET ?? "")
  .update(rawBody)
  .digest("hex");

if (!timingSafeEqual(Buffer.from(hmac), Buffer.from(signature))) {
  return NextResponse.json({ message: "Invalid signature" }, { status: 401 });
}

const body: SanityWebhookPayload = JSON.parse(rawBody);
```

---

## Acceptance Criteria

- [ ] Secret is no longer read from the query string
- [ ] Secret comparison uses `crypto.timingSafeEqual`
- [ ] Sanity dashboard webhook config is updated to send the header
- [ ] Endpoint still correctly revalidates `/blog` and `/blog/[slug]` after the changes
- [ ] A request with a wrong secret returns 401
