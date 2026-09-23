import { CloudflareEnv, ensureSchema, isAdminRequest, json } from '../../../server/cloudflareStore';

type Context = { request: Request; env: CloudflareEnv };

export async function onRequestPost({ request, env }: Context) {
  if (!(await isAdminRequest(request, env))) return json({ success: false, error: 'Admin sign-in required.' }, 401);
  if (!env.DB || !env.CJ_API_KEY) return json({ success: false, error: 'Add CJ_API_KEY as a Cloudflare secret first.' }, 503);
  try {
    const tokenResponse = await fetch('https://developers.cjdropshipping.com/api2.0/v1/authentication/getAccessToken', {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ apiKey: env.CJ_API_KEY }),
    });
    const tokenData = await tokenResponse.json() as any;
    const token = tokenData?.data?.accessToken;
    const openId = String(tokenData?.data?.openId || '');
    if (!token || !openId) return json({ success: false, error: tokenData?.message || 'CJ authentication failed.' }, 502);
    // CJ validates the callback during registration, so the signing secret must
    // already be available to the callback before /webhook/set is called.
    await ensureSchema(env.DB);
    await env.DB.prepare(`INSERT INTO app_settings (key, value, updated_at) VALUES ('cj_open_id', ?, ?)
      ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at`)
      .bind(openId, new Date().toISOString()).run();
    const callback = 'https://www.fetecart.com/api/webhook/cj';
    const setting = { type: 'ENABLE', callbackUrls: [callback] };
    const webhookResponse = await fetch('https://developers.cjdropshipping.com/api2.0/v1/webhook/set', {
      method: 'POST', headers: { 'content-type': 'application/json', 'CJ-Access-Token': token },
      body: JSON.stringify({ order: setting, logistics: setting }),
    });
    const webhookData = await webhookResponse.json() as any;
    if (!webhookResponse.ok || webhookData?.result === false) return json({ success: false, error: webhookData?.message || 'CJ webhook registration failed.' }, 502);
    return json({ success: true, message: 'CJ order and logistics webhooks are connected.', callback });
  } catch {
    return json({ success: false, error: 'Unable to connect CJ right now.' }, 502);
  }
}
