import { onRequestGet } from '../../functions/api/stripe/status';

export function GET(): Response {
  return onRequestGet({ env: { STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY } });
}
