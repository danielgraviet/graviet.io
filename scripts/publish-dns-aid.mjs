/**
 * Publish DNS-AID discovery records for graviet.io on Cloudflare.
 *
 * Requires:
 *   CLOUDFLARE_API_TOKEN  — Zone.DNS Edit (+ Zone.DNSSEC Edit to enable signing)
 *
 * Optional:
 *   CLOUDFLARE_ZONE_ID    — skip zone lookup
 *
 * Usage:
 *   CLOUDFLARE_API_TOKEN=... bun scripts/publish-dns-aid.mjs
 *
 * Records created (ServiceMode HTTPS per RFC 9460 / DNS-AID):
 *   _index._agents.graviet.io  → www.graviet.io  alpn=h2,h3 port=443
 *   _a2a._agents.graviet.io    → www.graviet.io  alpn=h2,h3 port=443
 *
 * Also attempts to enable DNSSEC. You must still add the DS record
 * at your domain registrar if Cloudflare reports one.
 */
const ZONE_NAME = "graviet.io";
const TARGET = "www.graviet.io";
const TTL = 3600;

/**
 * ServiceMode HTTPS params (RFC 9460).
 * Experimental DNS-AID keys use keyNNNNN form until IANA registration.
 * key65400 ≈ well-known path segment under /.well-known/
 */
const INDEX_PARAMS =
  'alpn="h2,h3" port=443 mandatory=alpn,port key65400="agent-index.json"';
const A2A_PARAMS =
  'alpn="h2,h3" port=443 mandatory=alpn,port key65400="api-catalog"';

const RECORDS = [
  {
    type: "HTTPS",
    name: `_index._agents.${ZONE_NAME}`,
    comment: "DNS-AID organization agent index (draft-mozleywilliams-dnsop-dnsaid)",
    data: {
      priority: 1,
      target: TARGET,
      value: INDEX_PARAMS,
    },
  },
  {
    type: "HTTPS",
    name: `_a2a._agents.${ZONE_NAME}`,
    comment: "DNS-AID A2A discovery entrypoint",
    data: {
      priority: 1,
      target: TARGET,
      value: A2A_PARAMS,
    },
  },
  {
    type: "TXT",
    name: `_index._agents.${ZONE_NAME}`,
    comment: "DNS-AID TXT fallback index",
    content:
      "site:https agents=site,ttfb-tool index=https://www.graviet.io/.well-known/agent-index.json",
  },
];

async function cf(path, { method = "GET", body } = {}) {
  const token = process.env.CLOUDFLARE_API_TOKEN;
  if (!token) {
    throw new Error(
      "CLOUDFLARE_API_TOKEN is not set. Create a token with Zone.DNS Edit (and Zone.DNSSEC Edit) at https://dash.cloudflare.com/profile/api-tokens",
    );
  }

  const response = await fetch(`https://api.cloudflare.com/client/v4${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const payload = await response.json();
  if (!payload.success) {
    throw new Error(
      `${method} ${path} failed: ${JSON.stringify(payload.errors ?? payload)}`,
    );
  }
  return payload.result;
}

async function getZoneId() {
  if (process.env.CLOUDFLARE_ZONE_ID) return process.env.CLOUDFLARE_ZONE_ID;
  const zones = await cf(`/zones?name=${encodeURIComponent(ZONE_NAME)}`);
  const zone = zones[0];
  if (!zone) throw new Error(`Zone not found: ${ZONE_NAME}`);
  return zone.id;
}

async function upsertRecord(zoneId, record) {
  const existing = await cf(
    `/zones/${zoneId}/dns_records?type=${record.type}&name=${encodeURIComponent(record.name)}`,
  );

  const match = existing.find((item) => item.type === record.type);
  const body = {
    type: record.type,
    name: record.name,
    ttl: TTL,
    comment: record.comment,
    ...(record.content ? { content: record.content } : {}),
    ...(record.data ? { data: record.data } : {}),
  };

  if (match) {
    console.log(`~ updating ${record.type} ${record.name}`);
    return cf(`/zones/${zoneId}/dns_records/${match.id}`, {
      method: "PUT",
      body,
    });
  }

  console.log(`+ creating ${record.type} ${record.name}`);
  return cf(`/zones/${zoneId}/dns_records`, {
    method: "POST",
    body,
  });
}

async function enableDnssec(zoneId) {
  try {
    const status = await cf(`/zones/${zoneId}/dnssec`);
    if (status?.status === "active" || status?.status === "pending") {
      console.log(`DNSSEC already ${status.status}`);
      if (status.ds) console.log(`DS record for registrar:\n${status.ds}`);
      return status;
    }
  } catch {
    // continue to enable
  }

  console.log("Enabling DNSSEC…");
  const result = await cf(`/zones/${zoneId}/dnssec`, {
    method: "PATCH",
    body: { status: "active" },
  });
  if (result?.ds) {
    console.log(
      "Add this DS record at your domain registrar so validating resolvers trust the zone:",
    );
    console.log(result.ds);
  } else {
    console.log(
      "DNSSEC enable requested. Check Cloudflare DNS → DNSSEC for the DS record to add at your registrar.",
    );
  }
  return result;
}

async function main() {
  const zoneId = await getZoneId();
  console.log(`Zone ${ZONE_NAME} → ${zoneId}`);

  for (const record of RECORDS) {
    await upsertRecord(zoneId, record);
  }

  await enableDnssec(zoneId);

  console.log("\nVerify:");
  console.log(`  dig HTTPS _index._agents.${ZONE_NAME} +short`);
  console.log(`  dig HTTPS _a2a._agents.${ZONE_NAME} +short`);
  console.log(`  dig TXT _index._agents.${ZONE_NAME} +short`);
  console.log(
    `  curl -s "https://cloudflare-dns.com/dns-query?name=_index._agents.${ZONE_NAME}&type=HTTPS" -H "accept: application/dns-json"`,
  );
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
