import { CloudflareEnv, ensureSchema, json } from '../../server/cloudflareStore';

type Context = { request: Request; env: CloudflareEnv };

export async function onRequestPost({ request, env }: Context) {
  if (!env.DB) return json({ success: false, error: 'Enquiry storage is not configured.' }, 503);
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return json({ success: false, error: 'Invalid request.' }, 400); }
  const name = String(body.name || '').trim().slice(0, 100);
  const email = String(body.email || '').trim().toLowerCase().slice(0, 200);
  const phone = String(body.phone || '').trim().slice(0, 50);
  const subject = String(body.subject || 'Product enquiry').trim().slice(0, 150);
  const message = String(body.message || '').trim().slice(0, 5000);
  if (!name || !/^\S+@\S+\.\S+$/.test(email) || !message) {
    return json({ success: false, error: 'Name, valid email and message are required.' }, 400);
  }
  await ensureSchema(env.DB);
  const id = `FTC-TCK-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
  const now = new Date().toISOString();
  await env.DB.prepare(`INSERT INTO inquiries
    (id, name, email, phone, subject, message, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, 'new', ?, ?)`)
    .bind(id, name, email, phone || null, subject, message, now, now).run();
  return json({ success: true, ticketId: id, recipient: 'contact@fetecart.com' }, 201);
}
