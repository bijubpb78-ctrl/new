import { CloudflareEnv, isAdminRequest, json } from '../../../server/cloudflareStore';

type Context = { request: Request; env: CloudflareEnv };
export async function onRequestGet({ request, env }: Context) {
  if (!(await isAdminRequest(request, env))) return json({ success: false, error: 'Admin sign-in required.' }, 401);
  if (!env.CJ_API_KEY) return json({ success: false, error: 'CJ API key is not configured.' }, 503);
  const sku = (new URL(request.url).searchParams.get('sku') || '').trim();
  if (!sku) return json({ success: false, error: 'SKU is required.' }, 400);
  try {
    const tokenResponse = await fetch('https://developers.cjdropshipping.com/api2.0/v1/authentication/getAccessToken', {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ apiKey: env.CJ_API_KEY }),
    });
    const tokenData = await tokenResponse.json() as any;
    const token = tokenData?.data?.accessToken;
    if (!token) return json({ success: false, error: 'CJ authentication failed. Rotate and update the CJ API key.' }, 502);
    const response = await fetch(`https://developers.cjdropshipping.com/api2.0/v1/product/list?productSku=${encodeURIComponent(sku)}&pageNum=1&pageSize=10`, {
      headers: { 'CJ-Access-Token': token },
    });
    const data = await response.json() as any;
    const items = data?.data?.list || data?.data?.content || data?.data || [];
    const product = Array.isArray(items) ? items[0] : null;
    if (!product) return json({ success: false, error: 'No CJ product was found for that SKU.' }, 404);
    return json({ success: true, product });
  } catch {
    return json({ success: false, error: 'CJ product lookup failed.' }, 502);
  }
}
