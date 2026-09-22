export function GET(): Response {
  const key = process.env.STRIPE_SECRET_KEY;
  const mode = key?.startsWith('sk_live_') ? 'live' : key?.startsWith('sk_test_') ? 'test' : 'unavailable';
  return new Response(JSON.stringify({ ready: mode !== 'unavailable', mode }), {
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });
}
