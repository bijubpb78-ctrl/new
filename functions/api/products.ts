import { CloudflareEnv, ensureSchema, json } from '../../server/cloudflareStore';

type Context = { env: CloudflareEnv };

export async function onRequestGet({ env }: Context) {
  if (!env.DB) return json({ success: true, overrides: [] });
  await ensureSchema(env.DB);
  const rows = await env.DB.prepare('SELECT id, data, deleted, updated_at FROM product_overrides ORDER BY updated_at DESC').all();
  return json({ success: true, overrides: rows.results || [] });
}
