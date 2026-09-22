export default function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const pubKey =
    process.env.VITE_STRIPE_PUBLISHABLE_KEY ||
    process.env.STRIPE_PUBLISHABLE_KEY ||
    'pk_live_51UGga1DH2aCzSlUFgVbSyLWYp4Wv5U2H1NzXP0F0eWX27dgfGE9txxuq5WzNzS4RtHgm85z5ecQWOT9N3E2Huh5D002rxhgqTA';

  return res.status(200).json({
    success: true,
    publishableKey: pubKey,
    isLiveMode: pubKey.startsWith('pk_live_'),
    store: 'Fetecart Pilates Atelier',
  });
}
