import { CloudflareEnv, ensureSchema, json, requireAdmin } from '../../../server/cloudflareStore';

type Context = { request: Request; env: CloudflareEnv };
export async function onRequestPatch({ request, env }: Context) {
  const denied = await requireAdmin(request, env); if (denied) return denied;
  if (!env.DB) return json({ success: false, error: 'Database is not configured.' }, 503);
  const body = await request.json() as { id?: string; status?: string };
  if (!body.id || !['new', 'open', 'replied', 'closed'].includes(body.status || '')) return json({ success: false, error: 'Invalid update.' }, 400);
  await ensureSchema(env.DB);
  await env.DB.prepare('UPDATE inquiries SET status = ?, updated_at = ? WHERE id = ?')
    .bind(body.status, new Date().toISOString(), body.id).run();
  return json({ success: true });
}
