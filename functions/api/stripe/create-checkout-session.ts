import { createCheckoutSession } from '../../../server/checkoutCore';

type Context = { request: Request; env: { STRIPE_SECRET_KEY?: string } };

export function onRequestPost({ request, env }: Context): Promise<Response> {
  return createCheckoutSession(request, env.STRIPE_SECRET_KEY);
}
