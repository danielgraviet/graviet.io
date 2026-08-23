/** Shared Auth.md / OAuth discovery constants for graviet.io */

export const SITE_ORIGIN = "https://www.graviet.io";

export const RESOURCE = `${SITE_ORIGIN}/`;
export const ISSUER = SITE_ORIGIN;

export const SCOPES_SUPPORTED = ["public.read", "tools.read"] as const;

export const AUTH_MD_URL = `${SITE_ORIGIN}/auth.md`;
export const REGISTER_URI = `${SITE_ORIGIN}/agent/auth`;
export const IDENTITY_ENDPOINT = `${SITE_ORIGIN}/agent/identity`;
export const CLAIM_URI = `${SITE_ORIGIN}/agent/identity/claim`;
export const TOKEN_ENDPOINT = `${SITE_ORIGIN}/oauth2/token`;
export const REVOCATION_URI = `${SITE_ORIGIN}/oauth2/revoke`;
export const EVENTS_ENDPOINT = `${SITE_ORIGIN}/agent/event/notify`;

export const REVOCATION_EVENT =
  "https://schemas.workos.com/events/agent/auth/identity/assertion/revoked";

export function protectedResourceMetadata() {
  return {
    resource: RESOURCE,
    resource_name: "graviet.io",
    authorization_servers: [ISSUER],
    scopes_supported: [...SCOPES_SUPPORTED],
    bearer_methods_supported: ["header"],
  };
}

export function authorizationServerMetadata() {
  return {
    issuer: ISSUER,
    authorization_endpoint: `${SITE_ORIGIN}/oauth2/authorize`,
    token_endpoint: TOKEN_ENDPOINT,
    revocation_endpoint: REVOCATION_URI,
    registration_endpoint: REGISTER_URI,
    grant_types_supported: [
      "urn:ietf:params:oauth:grant-type:jwt-bearer",
      "urn:workos:agent-auth:grant-type:claim",
    ],
    response_types_supported: ["token"],
    scopes_supported: [...SCOPES_SUPPORTED],
    token_endpoint_auth_methods_supported: ["none", "client_secret_post"],
    agent_auth: {
      skill: AUTH_MD_URL,
      register_uri: REGISTER_URI,
      identity_endpoint: IDENTITY_ENDPOINT,
      claim_uri: CLAIM_URI,
      claim_endpoint: CLAIM_URI,
      revocation_uri: REVOCATION_URI,
      events_endpoint: EVENTS_ENDPOINT,
      identity_types_supported: ["anonymous", "identity_assertion"],
      identity_assertion: {
        assertion_types_supported: [
          "urn:ietf:params:oauth:token-type:id-jag",
          "verified_email",
        ],
        credential_types_supported: ["access_token"],
      },
      anonymous: {
        credential_types_supported: ["access_token"],
      },
      events_supported: [REVOCATION_EVENT],
    },
  };
}

export function registrationUnsupportedResponse() {
  return Response.json(
    {
      error: "registration_unsupported",
      error_description:
        "graviet.io is a personal site and does not provision agent accounts. See https://www.graviet.io/auth.md",
    },
    {
      status: 501,
      headers: {
        "Cache-Control": "no-store",
        "Content-Type": "application/json",
      },
    },
  );
}

export const AUTH_MD = `# auth.md

You are an agent. **graviet.io** is Daniel Graviet's personal website and blog.

This document describes how agents discover auth-related metadata for the site. Multi-user agent registration is **not enabled** — \`POST\` registration endpoints return \`registration_unsupported\` (HTTP 501). Use public discovery documents and public content instead.

## Audience

- Agents indexing or summarizing public pages, the blog, and the API catalog
- Agents that need to know how private site tools are gated (password, not OAuth)

## Discovery

### Protected Resource Metadata

\`\`\`http
GET /.well-known/oauth-protected-resource
\`\`\`

- \`resource\` — \`${RESOURCE}\`
- \`authorization_servers\` — \`["${ISSUER}"]\`
- \`scopes_supported\` — \`${JSON.stringify([...SCOPES_SUPPORTED])}\`
- \`bearer_methods_supported\` — \`["header"]\`

### Authorization Server Metadata

\`\`\`http
GET /.well-known/oauth-authorization-server
\`\`\`

Includes a standard RFC 8414 document plus an \`agent_auth\` block:

- \`skill\` — ${AUTH_MD_URL}
- \`register_uri\` — ${REGISTER_URI}
- \`claim_uri\` — ${CLAIM_URI}
- \`revocation_uri\` — ${REVOCATION_URI}
- \`identity_types_supported\` — \`anonymous\`, \`identity_assertion\`
- \`identity_assertion.assertion_types_supported\` — ID-JAG + \`verified_email\`
- credential type — \`access_token\`

## Registration status

Agent registration flows (anonymous, verified email, ID-JAG) are advertised for discovery completeness but **not provisioned** on this host.

\`\`\`http
POST /agent/auth
POST /agent/identity
POST /agent/identity/claim
POST /oauth2/token
POST /oauth2/revoke
\`\`\`

Expected response:

\`\`\`json
{
  "error": "registration_unsupported",
  "error_description": "graviet.io is a personal site and does not provision agent accounts."
}
\`\`\`

## Protected tools (non-OAuth)

Password-gated site tools (\`/tools\` and related \`/api/tools/*\` routes) use the shared tools password (\`SEO_TOOLS_PASSWORD\`), not Auth.md agent credentials.

## Public alternatives

- [API catalog](${SITE_ORIGIN}/.well-known/api-catalog)
- [Agent index](${SITE_ORIGIN}/.well-known/agent-index.json)
- [Sitemap](${SITE_ORIGIN}/sitemap.xml)
- Markdown negotiation: request pages with \`Accept: text/markdown\`
`;
