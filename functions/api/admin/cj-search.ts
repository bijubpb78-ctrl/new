import { CloudflareEnv, isAdminRequest, json } from '../../../server/cloudflareStore';

type Context = { request: Request; env: CloudflareEnv };

export async function onRequestGet({ request, env }: Context) {
  if (!(await isAdminRequest(request, env))) return json({ success: false, error: 'Admin sign-in required.' }, 401);
  if (!env.CJ_API_KEY) return json({ success: false, error: 'CJ API key is not configured.' }, 503);
  const query = (new URL(request.url).searchParams.get('q') || 'pilates').trim();
  try {
    const tokenResponse = await fetch('https://developers.cjdropshipping.com/api2.0/v1/authentication/getAccessToken', {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ apiKey: env.CJ_API_KEY }),
    });
    const tokenData = await tokenResponse.json() as any;
    const token = tokenData?.data?.accessToken;
    if (!token) return json({ success: false, error: 'CJ authentication failed.' }, 502);
    const response = await fetch(`https://developers.cjdropshipping.com/api2.0/v1/product/listV2?page=1&size=20&keyWord=${encodeURIComponent(query)}&features=enable_description&features=enable_category`, {
      headers: { 'CJ-Access-Token': token },
    });
    const data = await response.json() as any;
    const rows = data?.data?.content || data?.data?.list || [];
    return json({ success: true, products: rows.map((item: any) => ({
      id: item.pid || item.id,
      sku: item.productSku || item.sku,
      name: item.productNameEn || item.nameEn || item.productName || 'CJ product',
      image: item.bigImage || item.bigImg || item.productImage,
      price: item.sellPrice || item.nowPrice || item.productPrice,
      category: item.categoryName || item.categoryNameEn || '',
    })).filter((item: any) => item.sku) });
  } catch {
    return json({ success: false, error: 'CJ catalog search failed.' }, 502);
  }
}
