type Context = { env: { STRIPE_SECRET_KEY?: string } };

export function onRequestGet({ env }: Context): Response {
  const mode = env.STRIPE_SECRET_KEY?.startsWith('sk_live_') ? 'live' : env.STRIPE_SECRET_KEY?.startsWith('sk_test_') ? 'test' : 'unavailable';
  return new Response(JSON.stringify({ ready: mode !== 'unavailable', mode }), {
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });
}
