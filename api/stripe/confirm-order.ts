import { onRequestPost } from '../../functions/api/stripe/confirm-order';

export function POST(request: Request): Promise<Response> {
  return onRequestPost({ request, env: { STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY } });
}
