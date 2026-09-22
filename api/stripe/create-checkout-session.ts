import type { IncomingMessage, ServerResponse } from 'http';
import Stripe from 'stripe';

export default async function handler(req: any, res: any) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY || req.body?.stripeSecretKey;
  if (!stripeKey) {
    return res.status(400).json({
      success: false,
      error: 'STRIPE_SECRET_KEY is not configured. Please add STRIPE_SECRET_KEY in Vercel Project Settings -> Environment Variables, or enter it in the checkout modal.',
    });
  }

  try {
    const stripe = new Stripe(stripeKey);
    const {
      items = [],
      currency = 'usd',
      orderId,
      customerEmail,
      customerName,
      shippingAddress,
      successUrl,
      cancelUrl,
    } = req.body || {};

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, error: 'Cart is empty' });
    }

    const currentOrderId = orderId || `FTC-${Math.floor(10000 + Math.random() * 90000)}`;

    let origin = (req.headers.origin && req.headers.origin !== 'null') ? req.headers.origin : '';
    if (!origin && req.headers.referer && req.headers.referer !== 'null') {
      try {
        const refUrl = new URL(req.headers.referer);
        origin = `${refUrl.protocol}//${refUrl.host}`;
      } catch {
        origin = '';
      }
    }
    if (!origin || origin === 'null' || !origin.startsWith('http')) {
      origin = 'https://www.fetecart.com';
    }

    const line_items = items.map((item: any) => {
      const unitPrice = item.price || item.product?.basePriceUSD || 100;
      const unitAmountInCents = Math.round(Number(unitPrice) * 100);
      const productName = item.productName || item.product?.name || 'Studio Pilates Apparatus';

      return {
        price_data: {
          currency: String(currency).toLowerCase(),
          product_data: {
            name: productName,
            metadata: {
              sku: item.sku || item.product?.sku || '',
            },
          },
          unit_amount: unitAmountInCents,
        },
        quantity: Math.max(1, Number(item.quantity) || 1),
      };
    });

    const defaultSuccessUrl = `${origin}/?stripe_session_id={CHECKOUT_SESSION_ID}&order_id=${currentOrderId}&payment_status=success`;
    const defaultCancelUrl = `${origin}/?stripe_cancel=true`;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items,
      mode: 'payment',
      success_url: successUrl || defaultSuccessUrl,
      cancel_url: cancelUrl || defaultCancelUrl,
      customer_email: customerEmail || undefined,
      client_reference_id: currentOrderId,
      metadata: {
        orderId: currentOrderId,
        customerName: customerName || (shippingAddress?.fullName) || '',
        customerEmail: customerEmail || '',
        currency: String(currency).toUpperCase(),
      },
      shipping_address_collection: {
        allowed_countries: [
          'US', 'CA', 'GB', 'AU', 'NZ', 'DE', 'FR', 'IT', 'ES', 'NL',
          'BE', 'AT', 'CH', 'SE', 'NO', 'DK', 'FI', 'IE', 'PT', 'SG',
          'AE', 'SA', 'JP', 'KR', 'HK', 'IN', 'ZA', 'BR', 'MX'
        ],
      },
    });

    return res.status(200).json({
      success: true,
      url: session.url,
      sessionId: session.id,
      orderId: currentOrderId,
    });
  } catch (err: any) {
    console.error('[Vercel Serverless Stripe Error]:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Failed to create checkout session',
    });
  }
}
