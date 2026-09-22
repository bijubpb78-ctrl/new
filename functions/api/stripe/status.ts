import { checkoutStatus } from '../../../server/statusCore';

type Context = { env: { STRIPE_SECRET_KEY?: string } };

export function onRequestGet({ env }: Context): Response {
  return checkoutStatus(env.STRIPE_SECRET_KEY);
}
