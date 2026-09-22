import { PILATES_PRODUCTS } from '../../../src/data/products';
import { CURRENCY_CONFIGS } from '../../../src/utils/currency';

type Env = { STRIPE_SECRET_KEY?: string };
type Context = { request: Request; env: Env };

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });

export async function onRequestPost({ request, env }: Context): Promise<Response> {
  if (!env.STRIPE_SECRET_KEY) return json({ success: false, error: 'Checkout is not available yet.' }, 503);

  let body: { items?: { sku?: string; quantity?: number }[]; currency?: string };
  try {
    body = await request.json();
  } catch {
    return json({ success: false, error: 'Invalid cart.' }, 400);
  }

  if (!Array.isArray(body.items) || body.items.length === 0 || body.items.length > 30) {
    return json({ success: false, error: 'Invalid cart.' }, 400);
  }
  const currency = (body.currency || 'usd').toUpperCase();
  if (!(currency in CURRENCY_CONFIGS)) return json({ success: false, error: 'Unsupported currency.' }, 400);
  const rate = CURRENCY_CONFIGS[currency as keyof typeof CURRENCY_CONFIGS].rate;
  const fields = new URLSearchParams();
  const orderId = `FTC-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;

  for (const [index, item] of body.items.entries()) {
    const product = item && PILATES_PRODUCTS.find((p) => p.sku === item.sku);
    const quantity = Number(item?.quantity);
    if (!product || !Number.isInteger(quantity) || quantity < 1 || quantity > 20) {
      return json({ success: false, error: 'Cart contains an invalid product or quantity.' }, 400);
    }
    // Only server-side catalog prices are used. Browser-supplied prices are ignored.
    const amount = Math.round(product.basePriceUSD * rate * 100);
    fields.set(`line_items[${index}][price_data][currency]`, currency.toLowerCase());
    fields.set(`line_items[${index}][price_data][unit_amount]`, String(amount));
    fields.set(`line_items[${index}][price_data][product_data][name]`, product.name);
    fields.set(`line_items[${index}][price_data][product_data][metadata][sku]`, product.sku);
    fields.set(`line_items[${index}][quantity]`, String(quantity));
  }

  const origin = new URL(request.url).origin;
  fields.set('mode', 'payment');
  fields.set('client_reference_id', orderId);
  fields.set('metadata[orderId]', orderId);
  fields.set('success_url', `${origin}/?stripe_session_id={CHECKOUT_SESSION_ID}`);
  fields.set('cancel_url', `${origin}/?stripe_cancel=true`);
  fields.set('billing_address_collection', 'auto');
  fields.set('shipping_address_collection[allowed_countries][0]', 'US');
  fields.set('shipping_address_collection[allowed_countries][1]', 'CA');
  fields.set('shipping_address_collection[allowed_countries][2]', 'GB');
  fields.set('shipping_address_collection[allowed_countries][3]', 'AU');
  fields.set('shipping_address_collection[allowed_countries][4]', 'DE');
  fields.set('shipping_address_collection[allowed_countries][5]', 'FR');
  fields.set('shipping_address_collection[allowed_countries][6]', 'ES');
  fields.set('shipping_address_collection[allowed_countries][7]', 'IT');
  fields.set('shipping_address_collection[allowed_countries][8]', 'NL');
  fields.set('shipping_address_collection[allowed_countries][9]', 'IE');
  fields.set('shipping_address_collection[allowed_countries][10]', 'NZ');
  fields.set('shipping_address_collection[allowed_countries][11]', 'SG');
  fields.set('shipping_address_collection[allowed_countries][12]', 'CH');
  fields.set('shipping_address_collection[allowed_countries][13]', 'SE');
  fields.set('shipping_address_collection[allowed_countries][14]', 'NO');
  fields.set('shipping_address_collection[allowed_countries][15]', 'DK');
  fields.set('shipping_address_collection[allowed_countries][16]', 'AT');
  fields.set('shipping_address_collection[allowed_countries][17]', 'BE');
  fields.set('shipping_address_collection[allowed_countries][18]', 'PL');
  fields.set('shipping_address_collection[allowed_countries][19]', 'PT');

  try {
    const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`, 'content-type': 'application/x-www-form-urlencoded' },
      body: fields,
    });
    const session = await response.json() as { id?: string; url?: string };
    if (!response.ok || !session.url) {
      console.error('Stripe checkout session creation failed', response.status);
      return json({ success: false, error: 'Unable to start checkout. Please try again.' }, 502);
    }
    return json({ success: true, sessionId: session.id, url: session.url, orderId });
  } catch {
    return json({ success: false, error: 'Unable to start checkout. Please try again.' }, 502);
  }
}
