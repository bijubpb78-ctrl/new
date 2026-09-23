import { CloudflareEnv, ensureSchema, isAdminRequest, json } from '../../../server/cloudflareStore';

type Context = { request: Request; env: CloudflareEnv };
export async function onRequestPut({ request, env }: Context) {
  if (!(await isAdminRequest(request, env))) return json({ success: false, error: 'Admin sign-in required.' }, 401);
  if (!env.DB) return json({ success: false, error: 'Database is not configured.' }, 503);
  const body = await request.json() as Record<string, unknown>;
  const orderId = String(body.orderId || '').trim().toUpperCase();
  if (!/^FTC-[A-F0-9]{8}$/.test(orderId)) return json({ success: false, error: 'A valid Fetecart order ID is required.' }, 400);
  await ensureSchema(env.DB);
  const now = new Date().toISOString();
  await env.DB.prepare(`INSERT INTO shipments
    (order_id, cj_order_id, tracking_number, carrier, tracking_url, status, events, source, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'manual', ?)
    ON CONFLICT(order_id) DO UPDATE SET cj_order_id=excluded.cj_order_id,
      tracking_number=excluded.tracking_number, carrier=excluded.carrier,
      tracking_url=excluded.tracking_url, status=excluded.status, events=excluded.events,
      source='manual', updated_at=excluded.updated_at`)
    .bind(orderId, body.cjOrderId || null, body.trackingNumber || null, body.carrier || null,
      body.trackingUrl || null, body.status || 'Processing', JSON.stringify(body.events || []), now).run();
  return json({ success: true });
}
