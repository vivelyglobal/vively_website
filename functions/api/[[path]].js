// Cloudflare Pages Function — proxies /api/* to the Render-hosted backend.
//
// The browser only ever talks to this Pages domain, so no CORS setup is
// needed on either side; this function does the server-to-server call.
//
// Set RENDER_API_ORIGIN in the Cloudflare Pages project's environment
// variables (Settings -> Environment variables), e.g.
// https://vively-website.onrender.com — no trailing slash.
export async function onRequest(context) {
  const { request, env } = context;
  const origin = env.RENDER_API_ORIGIN;

  if (!origin) {
    return new Response(
      JSON.stringify({ error: "RENDER_API_ORIGIN is not configured" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  const incoming = new URL(request.url);
  const target = new URL(incoming.pathname + incoming.search, origin);

  const proxied = new Request(target, request);
  return fetch(proxied);
}
