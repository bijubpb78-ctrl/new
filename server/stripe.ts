import { Request, Response } from 'express';
import Stripe from 'stripe';
import { saveOrder, getOrderById, StoredOrder } from './orderStore';

// Active Stripe credentials for fetecart.com
// Note: STRIPE_SECRET_KEY must be supplied via Environment Variables (e.g. Vercel dashboard or .env)
const DEFAULT_STRIPE_PUBLISHABLE_KEY =
  process.env.VITE_STRIPE_PUBLISHABLE_KEY ||
  process.env.STRIPE_PUBLISHABLE_KEY ||
  'pk_live_51UGga1DH2aCzSlUFgVbSyLWYp4Wv5U2H1NzXP0F0eWX27dgfGE9txxuq5WzNzS4RtHgm85z5ecQWOT9N3E2Huh5D002rxhgqTA';

let stripeClient: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripeClient) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error('STRIPE_SECRET_KEY environment variable is not configured. Please add STRIPE_SECRET_KEY in Vercel project settings or .env file.');
    }
    stripeClient = new Stripe(key);
  }
  return stripeClient;
}

export function getPublishableKey(): string {
  // If VITE_STRIPE_PUBLISHABLE_KEY is present and matches the account prefix
  if (
    process.env.VITE_STRIPE_PUBLISHABLE_KEY &&
    process.env.VITE_STRIPE_PUBLISHABLE_KEY.startsWith('pk_live_51UGga')
  ) {
    return process.env.VITE_STRIPE_PUBLISHABLE_KEY;
  }
  if (
    process.env.STRIPE_PUBLISHABLE_KEY &&
    process.env.STRIPE_PUBLISHABLE_KEY.startsWith('pk_live_51UGga')
  ) {
    return process.env.STRIPE_PUBLISHABLE_KEY;
  }
  return DEFAULT_STRIPE_PUBLISHABLE_KEY;
}

/**
 * GET /api/stripe/config
 * Exposes the active Stripe publishable key to frontend clients
 */
export function getStripeConfig(req: Request, res: Response) {
  try {
    const pubKey = getPublishableKey();
    res.json({
      success: true,
      publishableKey: pubKey,
      isLiveMode: pubKey.startsWith('pk_live_'),
      store: 'Fetecart Pilates Atelier',
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * POST /api/stripe/create-payment-intent
 * Creates a real Stripe PaymentIntent for in-modal direct card / Apple Pay / Google Pay processing
 */
export async function createPaymentIntent(req: Request, res: Response) {
  try {
    const stripe = getStripe();
    const {
      amount,
      currency = 'usd',
      orderId,
      customer,
      customerEmail,
      customerName,
      shippingAddress,
      items,
    } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, error: 'Invalid or missing amount' });
    }

    const currentOrderId = orderId || `FTC-${Math.floor(10000 + Math.random() * 90000)}`;
    const email = customerEmail || customer?.email || '';
    const name = customerName || customer?.name || (shippingAddress?.fullName) || '';

    // Stripe requires integer amounts in lowest currency denomination (e.g. cents)
    const amountInCents = Math.round(Number(amount) * 100);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: String(currency).toLowerCase(),
      automatic_payment_methods: {
        enabled: true,
      },
      description: `Fetecart Pilates Order ${currentOrderId}`,
      receipt_email: email || undefined,
      metadata: {
        orderId: currentOrderId,
        customerName: name,
        customerEmail: email,
        itemCount: items ? String(items.length) : '1',
      },
    });

    // Link and pre-record order in orderStore so that any immediate Stripe webhook is matched
    const preOrder: StoredOrder = {
      orderId: currentOrderId,
      clientOrderId: currentOrderId,
      trackingNumber: `FTC${Math.floor(10000000 + Math.random() * 90000000)}US`,
      carrierName: 'USPS Priority / CJ Logistics',
      items: items || [],
      subtotal: Number(amount),
      shippingCost: 0,
      total: Number(amount),
      currency: String(currency).toUpperCase(),
      shippingAddress: shippingAddress || {
        fullName: name || 'Valued Customer',
        email,
        addressLine1: '',
        city: '',
        stateOrProvince: '',
        postalCode: '',
        country: String(currency).toUpperCase(),
        phone: '',
      },
      paymentMethod: 'Stripe (Direct Card / Express)',
      stripePaymentId: paymentIntent.id,
      status: 'Processing',
      createdAt: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
      estimatedDelivery: '3-5 Business Days',
      webhookUpdates: [
        {
          timestamp: new Date().toISOString(),
          topic: 'ORDER_INITIATED',
          message: `Order checkout initialized. Stripe PaymentIntent created (${paymentIntent.id}).`,
        },
      ],
    };
    saveOrder(preOrder);

    res.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      orderId: currentOrderId,
      amount: amount,
      currency: String(currency).toUpperCase(),
    });
  } catch (err: any) {
    console.error('[Stripe] createPaymentIntent error:', err);
    res.status(500).json({
      success: false,
      error: err.message || 'Failed to create PaymentIntent with Stripe',
    });
  }
}

/**
 * POST /api/stripe/create-checkout-session
 * Creates an official Stripe Hosted Checkout Session
 * Handles 3D Secure bank challenges, Apple Pay, Google Pay, and real money deduction natively
 */
export async function createCheckoutSession(req: Request, res: Response) {
  try {
    const stripe = getStripe();
    const {
      items = [],
      currency = 'usd',
      orderId,
      customerEmail,
      customerName,
      shippingAddress,
      successUrl,
      cancelUrl,
    } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, error: 'Cart is empty' });
    }

    const currentOrderId = orderId || `FTC-${Math.floor(10000 + Math.random() * 90000)}`;

    // Determine host URLs safely
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

    // Build Stripe Line Items
    const line_items = items.map((item: any) => {
      const unitPrice = item.price || item.product?.basePriceUSD || 100;
      const unitAmountInCents = Math.round(Number(unitPrice) * 100);
      const productName = item.productName || item.product?.name || 'Studio Pilates Apparatus';
      
      // Stripe strictly validates image URLs - they MUST be live, publicly reachable absolute HTTP/HTTPS URLs.
      // Relative paths ('/images/...') or unresolvable domains cause Stripe to reject with "Not a valid URL".
      let validImages: string[] | undefined = undefined;
      const candidateImages: string[] = [];
      if (Array.isArray(item.product?.images)) candidateImages.push(...item.product.images);
      if (Array.isArray(item.images)) candidateImages.push(...item.images);
      if (typeof item.product?.image === 'string') candidateImages.push(item.product.image);
      if (typeof item.image === 'string') candidateImages.push(item.image);

      for (const img of candidateImages) {
        if (typeof img === 'string') {
          const trimmed = img.trim();
          if (
            (trimmed.startsWith('https://') || trimmed.startsWith('http://')) &&
            !trimmed.includes('localhost') &&
            !trimmed.includes('fetecart.com') &&
            !trimmed.includes('127.0.0.1') &&
            !trimmed.includes('.run.app')
          ) {
            validImages = [trimmed];
            break;
          }
        }
      }

      return {
        price_data: {
          currency: String(currency).toLowerCase(),
          product_data: {
            name: productName,
            ...(validImages ? { images: validImages } : {}),
            metadata: {
              sku: item.sku || item.product?.sku || '',
            },
          },
          unit_amount: unitAmountInCents,
        },
        quantity: Math.max(1, item.quantity || 1),
      };
    });

    const redirectSuccess =
      (successUrl && (successUrl.startsWith('http://') || successUrl.startsWith('https://')))
        ? successUrl
        : `${origin}/?stripe_session_id={CHECKOUT_SESSION_ID}&order_id=${currentOrderId}&payment_status=success`;
    const redirectCancel =
      (cancelUrl && (cancelUrl.startsWith('http://') || cancelUrl.startsWith('https://')))
        ? cancelUrl
        : `${origin}/?stripe_cancel=true`;

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      line_items,
      mode: 'payment',
      customer_email: customerEmail || undefined,
      client_reference_id: currentOrderId,
      billing_address_collection: 'auto',
      shipping_address_collection: {
        allowed_countries: [
          'US', 'CA', 'GB', 'AU', 'DE', 'FR', 'ES', 'IT', 'NL', 'IE', 'NZ', 'SG', 'CH', 'SE', 'NO', 'DK', 'AT', 'BE', 'PL', 'PT'
        ],
      },
      phone_number_collection: {
        enabled: true,
      },
      metadata: {
        orderId: currentOrderId,
        customerName: customerName || '',
        customerEmail: customerEmail || '',
        shippingAddress: shippingAddress ? JSON.stringify(shippingAddress) : '',
      },
      success_url: redirectSuccess,
      cancel_url: redirectCancel,
    };

    const session = await stripe.checkout.sessions.create(sessionParams);

    // Pre-record session order state in orderStore
    const sessionOrder: StoredOrder = {
      orderId: currentOrderId,
      clientOrderId: currentOrderId,
      trackingNumber: `FTC${Math.floor(10000000 + Math.random() * 90000000)}US`,
      carrierName: 'USPS Priority / CJ Logistics',
      items,
      subtotal: items.reduce((sum: number, it: any) => sum + (it.price || it.product?.basePriceUSD || 0) * (it.quantity || 1), 0),
      shippingCost: 0,
      total: items.reduce((sum: number, it: any) => sum + (it.price || it.product?.basePriceUSD || 0) * (it.quantity || 1), 0),
      currency: String(currency).toUpperCase(),
      shippingAddress: shippingAddress || {
        fullName: customerName || 'Valued Customer',
        email: customerEmail || '',
        addressLine1: '',
        city: '',
        stateOrProvince: '',
        postalCode: '',
        country: String(currency).toUpperCase(),
        phone: '',
      },
      paymentMethod: 'Stripe Hosted Checkout',
      stripeSessionId: session.id,
      status: 'Processing',
      createdAt: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
      estimatedDelivery: '3-5 Business Days',
      webhookUpdates: [
        {
          timestamp: new Date().toISOString(),
          topic: 'ORDER_INITIATED',
          message: `Stripe Hosted Checkout session created (${session.id}). Awaiting customer payment.`,
        },
      ],
    };
    saveOrder(sessionOrder);

    res.json({
      success: true,
      sessionId: session.id,
      url: session.url,
      orderId: currentOrderId,
    });
  } catch (err: any) {
    console.error('[Stripe] createCheckoutSession error:', err);
    res.status(500).json({
      success: false,
      error: err.message || 'Failed to create Stripe Checkout session',
    });
  }
}

/**
 * POST /api/stripe/confirm-order
 * Verifies real payment deduction with Stripe API and finalizes the order in store & CJ pipeline
 */
export async function confirmStripeOrder(req: Request, res: Response) {
  try {
    const stripe = getStripe();
    const { paymentIntentId, sessionId, orderDetails } = req.body;

    let isPaid = false;
    let chargeDetails: any = null;
    let stripeId = paymentIntentId || sessionId;
    let finalAmount = 0;
    let finalCurrency = 'USD';

    // 1. Verify via PaymentIntent
    if (paymentIntentId) {
      const pi = await stripe.paymentIntents.retrieve(paymentIntentId);
      if (pi.status === 'succeeded') {
        isPaid = true;
        chargeDetails = pi;
        stripeId = pi.id;
        finalAmount = pi.amount_received / 100;
        finalCurrency = pi.currency.toUpperCase();
      } else {
        return res.status(400).json({
          success: false,
          error: `Payment is not completed. Stripe status is: ${pi.status}`,
        });
      }
    }
    // 2. Verify via Checkout Session
    else if (sessionId) {
      const session = await stripe.checkout.sessions.retrieve(sessionId, {
        expand: ['payment_intent'],
      });
      if (session.payment_status === 'paid') {
        isPaid = true;
        chargeDetails = session;
        stripeId = session.id;
        finalAmount = (session.amount_total || 0) / 100;
        finalCurrency = (session.currency || 'usd').toUpperCase();
      } else {
        return res.status(400).json({
          success: false,
          error: `Payment is not completed. Stripe session status is: ${session.payment_status}`,
        });
      }
    }

    if (!isPaid) {
      return res.status(400).json({
        success: false,
        error: 'Payment could not be verified with Stripe',
      });
    }

    // Build or retrieve the completed order
    const orderId =
      orderDetails?.orderId ||
      chargeDetails?.metadata?.orderId ||
      chargeDetails?.client_reference_id ||
      `FTC-${Math.floor(10000 + Math.random() * 90000)}`;

    const existingOrder = getOrderById(orderId);

    const trackingNumber =
      existingOrder?.trackingNumber ||
      orderDetails?.trackingNumber ||
      `FTC${Math.floor(10000000 + Math.random() * 90000000)}US`;

    const storedOrder: StoredOrder = {
      orderId,
      clientOrderId: orderId,
      trackingNumber,
      carrierName: 'USPS Priority / CJ Logistics',
      items: orderDetails?.items || existingOrder?.items || [],
      subtotal: orderDetails?.subtotal || finalAmount,
      shippingCost: 0,
      total: finalAmount || orderDetails?.total || 0,
      currency: finalCurrency,
      stripePaymentId: paymentIntentId || (chargeDetails?.payment_intent as string) || (chargeDetails?.id?.startsWith('pi_') ? chargeDetails.id : undefined),
      stripeSessionId: sessionId || (chargeDetails?.id?.startsWith('cs_') ? chargeDetails.id : undefined),
      shippingAddress:
        orderDetails?.shippingAddress ||
        (chargeDetails?.metadata?.shippingAddress
          ? JSON.parse(chargeDetails.metadata.shippingAddress)
          : {
              fullName: chargeDetails?.customer_details?.name || 'Valued Customer',
              email: chargeDetails?.customer_details?.email || '',
              addressLine1: '',
              city: '',
              stateOrProvince: '',
              postalCode: '',
              country: '',
              phone: '',
            }),
      paymentMethod: 'Stripe (Card / Apple Pay / Google Pay)',
      status: 'Processing',
      createdAt: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
      estimatedDelivery: orderDetails?.estimatedDelivery || '3-5 Business Days',
      webhookUpdates: [
        ...(existingOrder?.webhookUpdates || []),
        {
          timestamp: new Date().toISOString(),
          topic: 'ORDER_PAYMENT',
          message: `Payment authorized and confirmed via Stripe (${stripeId}). Funds deducted.`,
        },
      ],
    };

    const saved = saveOrder(storedOrder);

    res.json({
      success: true,
      isPaid: true,
      stripeId,
      order: saved,
      message: 'Payment verified and order saved successfully.',
    });
  } catch (err: any) {
    console.error('[Stripe] confirmStripeOrder error:', err);
    res.status(500).json({
      success: false,
      error: err.message || 'Failed to verify payment with Stripe',
    });
  }
}

/**
 * GET /api/stripe/session/:sessionId
 * Checks session details and payment status
 */
export async function getSessionStatus(req: Request, res: Response) {
  try {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(req.params.sessionId);
    res.json({
      success: true,
      status: session.status,
      paymentStatus: session.payment_status,
      customerEmail: session.customer_details?.email,
      amountTotal: (session.amount_total || 0) / 100,
      currency: session.currency,
      metadata: session.metadata,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * POST /api/webhook/stripe or /api/stripe/webhook
 * Processes incoming Stripe webhooks (payment_intent.succeeded, checkout.session.completed, etc.)
 */
export async function handleStripeWebhook(req: Request, res: Response) {
  const stripe = getStripe();
  const sig = req.headers['stripe-signature'] as string | undefined;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event: Stripe.Event;

  try {
    if (webhookSecret && sig) {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } else {
      const rawPayload = Buffer.isBuffer(req.body) ? req.body.toString('utf-8') : req.body;
      const parsed = typeof rawPayload === 'string' ? JSON.parse(rawPayload) : rawPayload;

      if (parsed?.id && typeof parsed.id === 'string' && parsed.id.startsWith('evt_')) {
        event = await stripe.events.retrieve(parsed.id);
      } else {
        event = parsed as Stripe.Event;
      }
    }
  } catch (err: any) {
    console.error('[Stripe Webhook] Verification or parsing failed:', err.message);
    return res.status(400).json({ error: `Webhook error: ${err.message}` });
  }

  console.log(`[Stripe Webhook] Received event: ${event.type} (${event.id})`);

  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const orderId = paymentIntent.metadata?.orderId || `FTC-${paymentIntent.id.slice(-6).toUpperCase()}`;
        const amount = (paymentIntent.amount_received || paymentIntent.amount || 0) / 100;
        const currency = (paymentIntent.currency || 'usd').toUpperCase();

        const existing = getOrderById(orderId) || getOrderById(paymentIntent.id);
        const orderToSave: StoredOrder = existing
          ? {
              ...existing,
              status: 'Processing',
              stripePaymentId: paymentIntent.id,
              total: amount || existing.total,
              currency: currency || existing.currency,
              webhookUpdates: [
                ...(existing.webhookUpdates || []),
                {
                  timestamp: new Date().toISOString(),
                  topic: 'STRIPE_PAYMENT_INTENT',
                  message: `PaymentIntent succeeded (${paymentIntent.id}). Funds of ${amount.toFixed(2)} ${currency} captured.`,
                },
              ],
            }
          : {
              orderId,
              clientOrderId: orderId,
              trackingNumber: `FTC${Math.floor(10000000 + Math.random() * 90000000)}US`,
              carrierName: 'USPS Priority / CJ Logistics',
              items: [],
              subtotal: amount,
              shippingCost: 0,
              total: amount,
              currency,
              shippingAddress: {
                fullName: paymentIntent.metadata?.customerName || 'Valued Customer',
                email: paymentIntent.receipt_email || paymentIntent.metadata?.customerEmail || '',
                addressLine1: '',
                city: '',
                stateOrProvince: '',
                postalCode: '',
                country: currency,
                phone: '',
              },
              paymentMethod: 'Stripe Card / Express',
              stripePaymentId: paymentIntent.id,
              status: 'Processing',
              createdAt: new Date().toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              }),
              estimatedDelivery: '3-5 Business Days',
              webhookUpdates: [
                {
                  timestamp: new Date().toISOString(),
                  topic: 'STRIPE_PAYMENT_INTENT',
                  message: `PaymentIntent succeeded (${paymentIntent.id}). Funds of ${amount.toFixed(2)} ${currency} captured.`,
                },
              ],
            };

        saveOrder(orderToSave);
        console.log(`[Stripe Webhook] Order ${orderId} linked and updated for payment_intent.succeeded`);
        break;
      }

      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.payment_status === 'paid') {
          const orderId =
            session.metadata?.orderId ||
            session.client_reference_id ||
            `FTC-${session.id.slice(-6).toUpperCase()}`;
          const amount = (session.amount_total || 0) / 100;
          const currency = (session.currency || 'usd').toUpperCase();
          const piId = typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id;

          const existing =
            getOrderById(orderId) ||
            getOrderById(session.id) ||
            (piId ? getOrderById(piId) : undefined);

          const orderToSave: StoredOrder = existing
            ? {
                ...existing,
                status: 'Processing',
                stripeSessionId: session.id,
                stripePaymentId: piId || existing.stripePaymentId,
                total: amount || existing.total,
                currency: currency || existing.currency,
                webhookUpdates: [
                  ...(existing.webhookUpdates || []),
                  {
                    timestamp: new Date().toISOString(),
                    topic: 'STRIPE_CHECKOUT_SESSION',
                    message: `Stripe Checkout Session completed (${session.id}). Payment verified and funds deducted.`,
                  },
                ],
              }
            : {
                orderId,
                clientOrderId: orderId,
                trackingNumber: `FTC${Math.floor(10000000 + Math.random() * 90000000)}US`,
                carrierName: 'USPS Priority / CJ Logistics',
                items: [],
                subtotal: amount,
                shippingCost: 0,
                total: amount,
                currency,
                shippingAddress: {
                  fullName: session.customer_details?.name || 'Valued Customer',
                  email: session.customer_details?.email || '',
                  addressLine1: session.customer_details?.address?.line1 || '',
                  city: session.customer_details?.address?.city || '',
                  stateOrProvince: session.customer_details?.address?.state || '',
                  postalCode: session.customer_details?.address?.postal_code || '',
                  country: session.customer_details?.address?.country || 'United States',
                  phone: session.customer_details?.phone || '',
                },
                paymentMethod: 'Stripe Hosted Checkout',
                stripeSessionId: session.id,
                stripePaymentId: piId,
                status: 'Processing',
                createdAt: new Date().toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                }),
                estimatedDelivery: '3-5 Business Days',
                webhookUpdates: [
                  {
                    timestamp: new Date().toISOString(),
                    topic: 'STRIPE_CHECKOUT_SESSION',
                    message: `Stripe Checkout Session completed (${session.id}). Payment verified and funds deducted.`,
                  },
                ],
              };

          saveOrder(orderToSave);
          console.log(`[Stripe Webhook] Order ${orderId} linked and updated for checkout.session.completed`);
        }
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const orderId = paymentIntent.metadata?.orderId;
        if (orderId) {
          updateOrderFromWebhook(orderId, {
            webhookLog: {
              topic: 'STRIPE_PAYMENT_FAILED',
              message: `Payment failed for intent ${paymentIntent.id}: ${paymentIntent.last_payment_error?.message || 'Transaction declined'}`,
            },
          });
        }
        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        const piId = typeof charge.payment_intent === 'string' ? charge.payment_intent : undefined;
        const targetOrder = piId ? getOrderById(piId) : undefined;
        if (targetOrder) {
          updateOrderFromWebhook(targetOrder.orderId, {
            status: 'Refunded',
            webhookLog: {
              topic: 'STRIPE_REFUND',
              message: `Refund processed via Stripe (${charge.id}). Amount refunded: $${((charge.amount_refunded || 0) / 100).toFixed(2)}.`,
            },
          });
          console.log(`[Stripe Webhook] Order ${targetOrder.orderId} updated to Refunded`);
        }
        break;
      }

      default:
        console.log(`[Stripe Webhook] Logged event: ${event.type}`);
    }

    res.json({ received: true, type: event.type });
  } catch (err: any) {
    console.error('[Stripe Webhook] Processing error:', err);
    res.status(500).json({ error: 'Webhook processing failed', details: err.message });
  }
}

/**
 * GET /api/webhook/stripe
 * Diagnostic endpoint to check webhook status & endpoint readiness
 */
export function getStripeWebhookStatus(req: Request, res: Response) {
  const hasSecret = Boolean(process.env.STRIPE_WEBHOOK_SECRET);
  res.json({
    status: 'active',
    endpoint: '/api/webhook/stripe',
    signatureVerificationConfigured: hasSecret,
    acceptedEvents: [
      'payment_intent.succeeded',
      'payment_intent.payment_failed',
      'checkout.session.completed',
      'charge.refunded',
    ],
    note: hasSecret
      ? 'Webhook signatures are actively verified with STRIPE_WEBHOOK_SECRET.'
      : 'Webhook endpoint is active. Add STRIPE_WEBHOOK_SECRET to .env to enforce cryptographic signature checks.',
  });
}
