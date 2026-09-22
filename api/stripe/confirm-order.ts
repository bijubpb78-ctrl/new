import { confirmCheckoutOrder } from '../../server/confirmCore';

export function POST(request: Request): Promise<Response> {
  return confirmCheckoutOrder(request, process.env.STRIPE_SECRET_KEY);
}
