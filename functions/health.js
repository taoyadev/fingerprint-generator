// Simple health check endpoint to test if Functions are working

export async function onRequestGet(context) {
  return new Response(JSON.stringify({
    status: 'ok',
    message: 'Cloudflare Pages Functions are working!',
    timestamp: Date.now(),
    env: typeof context.env,
    request: typeof context.request
  }, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}
