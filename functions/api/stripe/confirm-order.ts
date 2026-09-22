import { confirmCheckoutOrder } from '../../../server/confirmCore';

type Context = { request: Request; env: { STRIPE_SECRET_KEY?: string } };

export function onRequestPost({ request, env }: Context): Promise<Response> {
  return confirmCheckoutOrder(request, env.STRIPE_SECRET_KEY);
}
