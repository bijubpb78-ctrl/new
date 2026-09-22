import { createCheckoutSession } from '../../server/checkoutCore';

export function POST(request: Request): Promise<Response> {
  return createCheckoutSession(request, process.env.STRIPE_SECRET_KEY);
}
