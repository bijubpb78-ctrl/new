import { lookupTracking } from '../../server/trackingCore';
import { CloudflareEnv } from '../../server/cloudflareStore';

type Context = { request: Request; env: CloudflareEnv };

export function onRequestPost({ request, env }: Context): Promise<Response> {
  return lookupTracking(request, env.STRIPE_SECRET_KEY, env.DB);
}
