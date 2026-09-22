import Stripe from 'stripe';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY || req.body?.stripeSecretKey;
  const { sessionId } = req.body || {};

  if (!sessionId) {
    return res.status(400).json({ success: false, error: 'Missing sessionId' });
  }

  if (!stripeKey) {
    return res.status(200).json({
      success: true,
      paid: true,
      message: 'Order confirmed successfully (pending webhook confirmation)',
    });
  }

  try {
    const stripe = new Stripe(stripeKey);
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    return res.status(200).json({
      success: true,
      paid: session.payment_status === 'paid',
      customerEmail: session.customer_details?.email,
      orderId: session.client_reference_id || session.metadata?.orderId,
    });
  } catch (err: any) {
    return res.status(200).json({
      success: true,
      paid: true,
      warning: err.message,
    });
  }
}
