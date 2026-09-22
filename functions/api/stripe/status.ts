type Context = { env: { STRIPE_SECRET_KEY?: string } };

export function onRequestGet({ env }: Context): Response {
  return new Response(JSON.stringify({ ready: env.STRIPE_SECRET_KEY?.startsWith('sk_live_') === true }), {
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });
}
