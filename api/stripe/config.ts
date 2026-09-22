export default function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const pubKey = process.env.VITE_STRIPE_PUBLISHABLE_KEY || process.env.STRIPE_PUBLISHABLE_KEY || null;

  return res.status(200).json({
    success: true,
    publishableKey: pubKey,
    isLiveMode: process.env.STRIPE_SECRET_KEY?.startsWith('sk_live_') === true,
    store: 'Fetecart Pilates Atelier',
  });
}
