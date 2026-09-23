import { lookupTracking } from '../../server/trackingCore';

type Context = { request: Request; env: { STRIPE_SECRET_KEY?: string } };

export function onRequestPost({ request, env }: Context): Promise<Response> {
  return lookupTracking(request, env.STRIPE_SECRET_KEY);
}
