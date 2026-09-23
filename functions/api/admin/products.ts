import { CloudflareEnv, ensureSchema, isAdminRequest, json } from '../../../server/cloudflareStore';
import { PILATES_PRODUCTS } from '../../../src/data/products';

type Context = { request: Request; env: CloudflareEnv };
export async function onRequestPut({ request, env }: Context) {
  if (!(await isAdminRequest(request, env))) return json({ success: false, error: 'Admin sign-in required.' }, 401);
  if (!env.DB) return json({ success: false, error: 'Database is not configured.' }, 503);
  const product = await request.json() as Record<string, unknown>;
  const id = String(product.id || '').trim();
  const sku = String(product.sku || '').trim();
  if (!id || !String(product.name || '').trim() || !sku) return json({ success: false, error: 'Product ID, name and SKU are required.' }, 400);
  await ensureSchema(env.DB);
  const currentOverride = await env.DB.prepare('SELECT id FROM product_overrides WHERE id = ? AND deleted = 0').bind(id).first();
  const staticDuplicate = !currentOverride && PILATES_PRODUCTS.some(item => item.id !== id && item.sku.trim().toLowerCase() === sku.toLowerCase());
  if (staticDuplicate) return json({ success: false, error: `SKU ${sku} already exists in the store catalog.` }, 409);
  const existingRows = await env.DB.prepare('SELECT id, data FROM product_overrides WHERE deleted = 0 AND id <> ?').bind(id).all<{ id: string; data?: string }>();
  const duplicate = (existingRows.results || []).some(row => {
    if (!row.data) return false;
    try { return String(JSON.parse(row.data).sku || '').trim().toLowerCase() === sku.toLowerCase(); }
    catch { return false; }
  });
  if (duplicate) return json({ success: false, error: `SKU ${sku} is already assigned to another product.` }, 409);
  await env.DB.prepare(`INSERT INTO product_overrides (id, data, deleted, updated_at) VALUES (?, ?, 0, ?)
    ON CONFLICT(id) DO UPDATE SET data = excluded.data, deleted = 0, updated_at = excluded.updated_at`)
    .bind(id, JSON.stringify(product), new Date().toISOString()).run();
  return json({ success: true, product });
}
export async function onRequestDelete({ request, env }: Context) {
  if (!(await isAdminRequest(request, env))) return json({ success: false, error: 'Admin sign-in required.' }, 401);
  if (!env.DB) return json({ success: false, error: 'Database is not configured.' }, 503);
  const id = new URL(request.url).searchParams.get('id') || '';
  if (!id) return json({ success: false, error: 'Product ID is required.' }, 400);
  await ensureSchema(env.DB);
  await env.DB.prepare(`INSERT INTO product_overrides (id, data, deleted, updated_at) VALUES (?, NULL, 1, ?)
    ON CONFLICT(id) DO UPDATE SET data = NULL, deleted = 1, updated_at = excluded.updated_at`)
    .bind(id, new Date().toISOString()).run();
  return json({ success: true });
}
