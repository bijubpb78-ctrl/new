import { createCheckoutSession } from '../../../server/checkoutCore';
import { CloudflareEnv } from '../../../server/cloudflareStore';

type Context = { request: Request; env: CloudflareEnv };

export function onRequestPost({ request, env }: Context): Promise<Response> {
  return createCheckoutSession(request, env.STRIPE_SECRET_KEY, env.DB);
}
