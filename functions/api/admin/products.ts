import { CloudflareEnv, ensureSchema, json, requireAdmin } from '../../../server/cloudflareStore';

type Context = { request: Request; env: CloudflareEnv };
export async function onRequestPut({ request, env }: Context) {
  const denied = await requireAdmin(request, env); if (denied) return denied;
  if (!env.DB) return json({ success: false, error: 'Database is not configured.' }, 503);
  const product = await request.json() as Record<string, unknown>;
  const id = String(product.id || '').trim();
  if (!id || !String(product.name || '').trim() || !String(product.sku || '').trim()) return json({ success: false, error: 'Product ID, name and SKU are required.' }, 400);
  await ensureSchema(env.DB);
  await env.DB.prepare(`INSERT INTO product_overrides (id, data, deleted, updated_at) VALUES (?, ?, 0, ?)
    ON CONFLICT(id) DO UPDATE SET data = excluded.data, deleted = 0, updated_at = excluded.updated_at`)
    .bind(id, JSON.stringify(product), new Date().toISOString()).run();
  return json({ success: true, product });
}
export async function onRequestDelete({ request, env }: Context) {
  const denied = await requireAdmin(request, env); if (denied) return denied;
  if (!env.DB) return json({ success: false, error: 'Database is not configured.' }, 503);
  const id = new URL(request.url).searchParams.get('id') || '';
  if (!id) return json({ success: false, error: 'Product ID is required.' }, 400);
  await ensureSchema(env.DB);
  await env.DB.prepare(`INSERT INTO product_overrides (id, data, deleted, updated_at) VALUES (?, NULL, 1, ?)
    ON CONFLICT(id) DO UPDATE SET data = NULL, deleted = 1, updated_at = excluded.updated_at`)
    .bind(id, new Date().toISOString()).run();
  return json({ success: true });
}
