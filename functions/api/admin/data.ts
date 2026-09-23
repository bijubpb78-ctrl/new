import { CloudflareEnv, ensureSchema, json, requireAdmin } from '../../../server/cloudflareStore';

type Context = { request: Request; env: CloudflareEnv };

export async function onRequestGet({ request, env }: Context) {
  const denied = await requireAdmin(request, env); if (denied) return denied;
  if (!env.DB) return json({ success: false, error: 'Database is not configured.' }, 503);
  await ensureSchema(env.DB);
  const [inquiries, products, shipments] = await Promise.all([
    env.DB.prepare('SELECT * FROM inquiries ORDER BY created_at DESC LIMIT 200').all(),
    env.DB.prepare('SELECT id, data, deleted, updated_at FROM product_overrides ORDER BY updated_at DESC').all(),
    env.DB.prepare('SELECT * FROM shipments ORDER BY updated_at DESC LIMIT 200').all(),
  ]);
  return json({ success: true, inquiries: inquiries.results || [], products: products.results || [], shipments: shipments.results || [] });
}
