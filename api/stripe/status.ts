import { checkoutStatus } from '../../server/statusCore';

export function GET(): Response {
  return checkoutStatus(process.env.STRIPE_SECRET_KEY);
}
