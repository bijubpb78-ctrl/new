import { CloudflareEnv, createAdminSession, json } from '../../../server/cloudflareStore';

type Context = { request: Request; env: CloudflareEnv };

export async function onRequestPost({ request, env }: Context) {
  if (!env.ADMIN_PASSWORD || !env.ADMIN_SESSION_SECRET) {
    return json({ success: false, error: 'Admin access has not been configured.' }, 503);
  }
  let password = '';
  try { password = String(((await request.json()) as { password?: unknown }).password || ''); } catch {}
  if (password.length !== env.ADMIN_PASSWORD.length) return json({ success: false, error: 'Invalid password.' }, 401);
  let diff = 0;
  for (let i = 0; i < password.length; i += 1) diff |= password.charCodeAt(i) ^ env.ADMIN_PASSWORD.charCodeAt(i);
  if (diff !== 0) return json({ success: false, error: 'Invalid password.' }, 401);
  const token = await createAdminSession(env.ADMIN_SESSION_SECRET);
  return json({ success: true }, 200, {
    'set-cookie': `fetecart_admin_session=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=28800`,
  });
}
