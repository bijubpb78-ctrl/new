import { CloudflareEnv, ensureSchema, json } from '../../../server/cloudflareStore';

type Context = { request: Request; env: CloudflareEnv };

async function verifySignature(raw: string, supplied: string, openId: string) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(openId), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const bytes = new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(raw)));
  let binary = ''; bytes.forEach(byte => { binary += String.fromCharCode(byte); });
  const expected = btoa(binary);
  if (expected.length !== supplied.length) return false;
  let diff = 0; for (let i = 0; i < expected.length; i += 1) diff |= expected.charCodeAt(i) ^ supplied.charCodeAt(i);
  return diff === 0;
}

export async function onRequestPost({ request, env }: Context) {
  if (!env.DB) return json({ success: false, error: 'CJ webhook is not configured.' }, 503);
  await ensureSchema(env.DB);
  const stored = await env.DB.prepare("SELECT value FROM app_settings WHERE key = 'cj_open_id'").first<{ value?: string }>();
  const openId = env.CJ_OPEN_ID || stored?.value;
  if (!openId) return json({ success: false, error: 'CJ webhook is not configured.' }, 503);
  const raw = await request.text();
  const signature = request.headers.get('sign') || '';
  if (!signature || !(await verifySignature(raw, signature, openId))) return json({ success: false, error: 'Invalid CJ signature.' }, 401);
  let body: any; try { body = JSON.parse(raw); } catch { return json({ success: false, error: 'Invalid JSON.' }, 400); }
  const params = body.params || {};
  const orderIds = Array.isArray(params.storeOrderNumbers) ? params.storeOrderNumbers : [params.orderNumber || params.orderNum];
  const orderId = String(orderIds.find((value: unknown) => /^FTC-[A-F0-9]{8}$/i.test(String(value || ''))) || '').toUpperCase();
  const topic = String(body.type || 'UNKNOWN').toUpperCase();
  const eventId = String(body.messageId || crypto.randomUUID());
  await env.DB.prepare('INSERT OR IGNORE INTO webhook_events (id, topic, order_id, payload, received_at) VALUES (?, ?, ?, ?, ?)')
    .bind(eventId, topic, orderId || null, raw, new Date().toISOString()).run();
  if (orderId && (topic === 'LOGISTIC' || topic === 'ORDER')) {
    const events = typeof params.logisticsTrackEvents === 'string' ? params.logisticsTrackEvents : JSON.stringify(params.logisticsTrackEvents || []);
    const statusCode = Number(params.trackingStatus);
    const status = statusCode === 12 ? 'Delivered' : statusCode === 10 ? 'Out for Delivery' : statusCode >= 1 ? 'In Transit' : String(params.orderStatus || 'Processing');
    await env.DB.prepare(`INSERT INTO shipments
      (order_id, cj_order_id, tracking_number, carrier, tracking_url, status, events, source, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'cj', ?)
      ON CONFLICT(order_id) DO UPDATE SET cj_order_id=excluded.cj_order_id,
        tracking_number=COALESCE(excluded.tracking_number, shipments.tracking_number),
        carrier=COALESCE(excluded.carrier, shipments.carrier), tracking_url=COALESCE(excluded.tracking_url, shipments.tracking_url),
        status=excluded.status, events=excluded.events, source='cj', updated_at=excluded.updated_at`)
      .bind(orderId, params.orderId || params.cjOrderId || null, params.trackingNumber || params.trackNumber || null,
        params.trackingProvider || params.logisticName || null, params.trackingUrl || null, status, events, new Date().toISOString()).run();
  }
  return json({ code: 200, result: true, message: 'success' });
}
