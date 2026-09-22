/**
 * Stripe Payment Gateway Client & Configuration
 * Manages the Stripe Publishable Key, client-side session tokens, and live/test status.
 */

export const DEFAULT_STRIPE_PUBLISHABLE_KEY = 'pk_live_51UGga1DH2aCzSlUFgVbSyLWYp4Wv5U2H1NzXP0F0eWX27dgfGE9txxuq5WzNzS4RtHgm85z5ecQWOT9N3E2Huh5D002rxhgqTA';
export const DEFAULT_STRIPE_SECRET_KEY = '';

const STORAGE_KEY = 'fetecart_stripe_publishable_key';
const SECRET_STORAGE_KEY = 'fetecart_stripe_secret_key';

/**
 * Retrieves the currently active Stripe Publishable Key
 */
export function getStripePublishableKey(): string {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && saved.trim()) return saved.trim();
  }
  
  const meta = import.meta as unknown as { env?: Record<string, string> };
  if (meta.env?.VITE_STRIPE_PUBLISHABLE_KEY) {
    return meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
  }
  
  return DEFAULT_STRIPE_PUBLISHABLE_KEY;
}

/**
 * Updates and persists the active Stripe Publishable Key in browser storage
 */
export function setStripePublishableKey(newKey: string): void {
  if (typeof window === 'undefined') return;
  const clean = newKey.trim();
  if (!clean || clean === DEFAULT_STRIPE_PUBLISHABLE_KEY) {
    localStorage.removeItem(STORAGE_KEY);
  } else {
    localStorage.setItem(STORAGE_KEY, clean);
  }
}

/**
 * Retrieves the currently configured Stripe Secret Key for fetecart.com
 */
export function getStripeSecretKey(): string {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(SECRET_STORAGE_KEY);
    if (saved && saved.trim()) return saved.trim();
  }
  return DEFAULT_STRIPE_SECRET_KEY;
}

/**
 * Updates and persists the Stripe Secret Key
 */
export function setStripeSecretKey(newKey: string): void {
  if (typeof window === 'undefined') return;
  const clean = newKey.trim();
  if (!clean || clean === DEFAULT_STRIPE_SECRET_KEY) {
    localStorage.removeItem(SECRET_STORAGE_KEY);
  } else {
    localStorage.setItem(SECRET_STORAGE_KEY, clean);
  }
}

/**
 * Checks if the configured key is a production live key (pk_live_...)
 */
export function isStripeLiveMode(key: string = getStripePublishableKey()): boolean {
  return key.startsWith('pk_live_');
}

/**
 * Checks if a provided key is a Secret Key (sk_live_... or sk_test_...)
 */
export function isStripeSecretKey(key: string): boolean {
  return key.startsWith('sk_live_') || key.startsWith('sk_test_') || key.startsWith('rk_live_') || key.startsWith('rk_test_');
}

/**
 * Formats a key for safe display (e.g. pk_live_51UG...gqTA)
 */
export function maskStripeKey(key: string): string {
  if (!key || key.length < 16) return key;
  return `${key.slice(0, 12)}••••••••••••••••${key.slice(-6)}`;
}

/**
 * Formats a secret key for secure display (e.g. sk_live_51UG••••••••••••••••oU7t)
 */
export function maskStripeSecretKey(key: string): string {
  if (!key || key.length < 16) return key;
  return `${key.slice(0, 12)}••••••••••••••••${key.slice(-6)}`;
}

/**
 * Extracts account prefix identifier (e.g. 51UGga1DH2aCzSlUF)
 */
export function extractStripeAccountId(key: string = getStripeSecretKey()): string {
  const match = key.match(/(?:sk_live_|pk_live_|sk_test_|pk_test_)([a-zA-Z0-9]{16,})/);
  return match ? match[1].slice(0, 17) : '51UGga1DH2aCzSlUF';
}
