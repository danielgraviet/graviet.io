import {
  createToolsAuthToken,
  TOOLS_AUTH_COOKIE,
  verifyToolsAuthCookie,
  verifyToolsPassword,
} from "@/lib/tools-auth";

export const runtime = "nodejs";

const LEARN_PATH = "/tools/learn/ai-runtime-systems";

function authPage(error = "") {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Unlock Roadmap</title>
  <style>
    :root { color-scheme: light dark; }
    * { box-sizing: border-box; }
    body {
      margin: 0; min-height: 100vh; display: grid; place-items: center;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background: #0b1020; color: #edf2ff;
    }
    main {
      width: min(420px, calc(100% - 32px)); border: 1px solid #2c3957;
      border-radius: 14px; background: #121a2e; padding: 22px;
      box-shadow: 0 18px 45px rgba(0,0,0,.22);
    }
    h1 { margin: 0 0 8px; font-size: 1.35rem; }
    p { margin: 0 0 18px; color: #aab5d1; }
    label { display: block; margin-bottom: 7px; color: #aab5d1; font-size: .9rem; }
    input {
      width: 100%; border: 1px solid #2c3957; border-radius: 9px; padding: 10px;
      background: #18223a; color: #edf2ff; font: inherit;
    }
    button {
      width: 100%; margin-top: 12px; border: 0; border-radius: 10px; padding: 10px 12px;
      background: #7c9cff; color: white; font: inherit; cursor: pointer;
    }
    .error { margin-top: 12px; color: #ff7f91; font-size: .9rem; }
  </style>
</head>
<body>
  <main>
    <h1>Unlock roadmap</h1>
    <p>This roadmap is private.</p>
    <form method="post" action="/learning-roadmap-route">
      <label for="password">Tools password</label>
      <input id="password" name="password" type="password" autocomplete="current-password" autofocus />
      <button type="submit">Unlock</button>
      ${error ? `<div class="error">${error}</div>` : ""}
    </form>
  </main>
</body>
</html>`;
}

function redirectToLearn(request: Request, status: 302 | 303, extra?: Headers) {
  const headers = extra ?? new Headers();
  headers.set("Location", new URL(LEARN_PATH, request.url).toString());
  return new Response(null, { status, headers });
}

export async function GET(request: Request) {
  if (!verifyToolsAuthCookie(request.headers.get("cookie"))) {
    return new Response(authPage(), {
      headers: {
        "content-type": "text/html; charset=utf-8",
      },
    });
  }

  return redirectToLearn(request, 302);
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const password = formData.get("password");

  if (!verifyToolsPassword(password)) {
    return new Response(authPage("Invalid password."), {
      status: 401,
      headers: {
        "content-type": "text/html; charset=utf-8",
      },
    });
  }

  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  const headers = new Headers({
    "Set-Cookie": `${TOOLS_AUTH_COOKIE}=${encodeURIComponent(createToolsAuthToken())}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000${secure}`,
  });

  return redirectToLearn(request, 303, headers);
}
