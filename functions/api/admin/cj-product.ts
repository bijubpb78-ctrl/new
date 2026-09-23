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
    const lookup = async (field: 'productSku' | 'variantSku') => {
      const response = await fetch(`https://developers.cjdropshipping.com/api2.0/v1/product/query?${field}=${encodeURIComponent(sku)}`, {
        headers: { 'CJ-Access-Token': token },
      });
      return response.json() as Promise<any>;
    };
    let data = await lookup('productSku');
    if (!data?.data) data = await lookup('variantSku');
    const product = data?.data || null;
    if (!product) return json({ success: false, error: 'No CJ product was found for that SKU.' }, 404);
    const variants = Array.isArray(product.variants) ? product.variants : [];
    const prices = variants.map((item: any) => Number(item.variantSugSellPrice || item.variantSellPrice)).filter((value: number) => Number.isFinite(value) && value > 0);
    const cjCost = prices.length ? Math.max(...prices) : Number(String(product.sellPrice || product.nowPrice || '0').split('-').pop());
    const suggestedPrice = Number((cjCost * 1.8).toFixed(2));
    const images = [...new Set([
      product.bigImage, product.productImage,
      ...(Array.isArray(product.productImageSet) ? product.productImageSet : []),
      ...variants.map((item: any) => item.variantImage),
    ].filter(Boolean))];
    const firstVariant = variants[0] || {};
    const stripHtml = (value: unknown) => String(value || '').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
    return json({ success: true, product: {
      id: product.pid,
      sku: product.productSku || sku,
      name: product.productNameEn || product.productName || sku,
      description: stripHtml(product.productDescription || product.description),
      images,
      weightKg: Number(product.productWeight || firstVariant.variantWeight || 0) / 1000,
      dimensions: firstVariant.variantLength
        ? `${firstVariant.variantLength} × ${firstVariant.variantWidth || 0} × ${firstVariant.variantHeight || 0} mm`
        : '',
      material: product.materialNameEn || product.materialName || '',
      categoryName: product.categoryName || '',
      cjCostUSD: Number.isFinite(cjCost) ? cjCost : 0,
      suggestedPriceUSD: Number.isFinite(suggestedPrice) ? suggestedPrice : 0,
      variants: variants.map((item: any) => ({
        vid: item.vid, sku: item.variantSku, name: item.variantNameEn || item.variantKey,
        image: item.variantImage, costUSD: Number(item.variantSellPrice || 0),
        suggestedPriceUSD: Number(item.variantSugSellPrice || 0), weightKg: Number(item.variantWeight || 0) / 1000,
      })),
    }});
  } catch {
    return json({ success: false, error: 'CJ product lookup failed.' }, 502);
  }
}
