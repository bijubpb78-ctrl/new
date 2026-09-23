export type D1Result<T = Record<string, unknown>> = { results?: T[]; success?: boolean };

export interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  all<T = Record<string, unknown>>(): Promise<D1Result<T>>;
  run(): Promise<unknown>;
}

export interface D1Database {
  prepare(query: string): D1PreparedStatement;
  batch(statements: D1PreparedStatement[]): Promise<unknown>;
}

export type CloudflareEnv = {
  DB?: D1Database;
  ADMIN_PASSWORD?: string;
  ADMIN_SESSION_SECRET?: string;
  CJ_API_KEY?: string;
  CJ_OPEN_ID?: string;
  STRIPE_SECRET_KEY?: string;
};

export async function ensureSchema(db: D1Database) {
  await db.batch([
    db.prepare(`CREATE TABLE IF NOT EXISTS inquiries (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL, phone TEXT,
      subject TEXT NOT NULL, message TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'new',
      created_at TEXT NOT NULL, updated_at TEXT NOT NULL
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS product_overrides (
      id TEXT PRIMARY KEY, data TEXT, deleted INTEGER NOT NULL DEFAULT 0, updated_at TEXT NOT NULL
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS shipments (
      order_id TEXT PRIMARY KEY, cj_order_id TEXT, tracking_number TEXT, carrier TEXT,
      tracking_url TEXT, status TEXT NOT NULL DEFAULT 'Processing', events TEXT NOT NULL DEFAULT '[]',
      source TEXT NOT NULL DEFAULT 'manual', updated_at TEXT NOT NULL
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS webhook_events (
      id TEXT PRIMARY KEY, topic TEXT NOT NULL, order_id TEXT, payload TEXT NOT NULL,
      received_at TEXT NOT NULL
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at TEXT NOT NULL
    )`),
  ]);
}

const encoder = new TextEncoder();

function bytesToBase64Url(bytes: Uint8Array) {
  let binary = '';
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

async function sign(value: string, secret: string) {
  const key = await crypto.subtle.importKey(
    'raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  return bytesToBase64Url(new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(value))));
}

export async function createAdminSession(secret: string) {
  const payload = bytesToBase64Url(encoder.encode(JSON.stringify({ exp: Date.now() + 8 * 60 * 60 * 1000 })));
  return `${payload}.${await sign(payload, secret)}`;
}

function safeEqual(left: string, right: string) {
  if (left.length !== right.length) return false;
  let diff = 0;
  for (let i = 0; i < left.length; i += 1) diff |= left.charCodeAt(i) ^ right.charCodeAt(i);
  return diff === 0;
}

export async function isAdminRequest(request: Request, env: CloudflareEnv) {
  if (!env.ADMIN_SESSION_SECRET) return false;
  const cookie = request.headers.get('cookie') || '';
  const match = cookie.match(/(?:^|;\s*)fetecart_admin_session=([^;]+)/);
  if (!match) return false;
  const [payload, signature] = match[1].split('.');
  if (!payload || !signature || !safeEqual(signature, await sign(payload, env.ADMIN_SESSION_SECRET))) return false;
  try {
    const decoded = JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(payload.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0))));
    return typeof decoded.exp === 'number' && decoded.exp > Date.now();
  } catch {
    return false;
  }
}

export const json = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers },
  });

export async function requireAdmin(request: Request, env: CloudflareEnv) {
  return isAdminRequest(request, env) ? null : json({ success: false, error: 'Admin sign-in required.' }, 401);
}
