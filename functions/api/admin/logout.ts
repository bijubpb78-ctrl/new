import { json } from '../../../server/cloudflareStore';

export async function onRequestPost() {
  return json({ success: true }, 200, {
    'set-cookie': 'fetecart_admin_session=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0',
  });
}
