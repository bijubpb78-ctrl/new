type Context = { request: Request; env: { STRIPE_SECRET_KEY?: string } };

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });

export async function onRequestPost({ request, env }: Context): Promise<Response> {
  if (!env.STRIPE_SECRET_KEY) return json({ success: false, error: 'Checkout is not configured.' }, 503);
  let sessionId: unknown;
  try {
    sessionId = (await request.json() as { sessionId?: unknown }).sessionId;
  } catch {
    return json({ success: false, error: 'Invalid request.' }, 400);
  }
  if (typeof sessionId !== 'string' || !/^cs_(test|live)_[A-Za-z0-9]+$/.test(sessionId)) {
    return json({ success: false, error: 'Invalid checkout session.' }, 400);
  }
  try {
    const response = await fetch(`https://api.stripe.com/v1/checkout/sessions/${sessionId}`, {
      headers: { Authorization: `Bearer ${env.STRIPE_SECRET_KEY}` },
    });
    if (!response.ok) return json({ success: false, error: 'Unable to verify payment.' }, 502);
    const session = await response.json() as { payment_status?: string; client_reference_id?: string };
    if (session.payment_status !== 'paid') return json({ success: false, error: 'Payment has not been completed.' }, 409);
    return json({ success: true, mode: sessionId.startsWith('cs_test_') ? 'test' : 'live', order: { orderId: session.client_reference_id } });
  } catch {
    return json({ success: false, error: 'Unable to verify payment.' }, 502);
  }
}
