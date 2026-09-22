import { CurrencyCode, CurrencyConfig } from '../types';

export const CURRENCY_CONFIGS: Record<CurrencyCode, CurrencyConfig> = {
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
    flag: '🇺🇸',
    rate: 1.0,
    freeShippingThreshold: 0,
    taxLabel: 'Taxes calculated at checkout',
  },
  GBP: {
    code: 'GBP',
    symbol: '£',
    name: 'British Pound',
    flag: '🇬🇧',
    rate: 0.79,
    freeShippingThreshold: 0,
    taxLabel: '20% VAT included (DDP Guaranteed)',
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    name: 'Euro',
    flag: '🇪🇺',
    rate: 0.92,
    freeShippingThreshold: 0,
    taxLabel: 'EU VAT included (DDP Delivered Duty Paid)',
  },
  AUD: {
    code: 'AUD',
    symbol: 'A$',
    name: 'Australian Dollar',
    flag: '🇦🇺',
    rate: 1.54,
    freeShippingThreshold: 0,
    taxLabel: '10% GST included',
  },
};

export function convertPrice(basePriceUSD: number, targetCurrency: CurrencyCode): number {
  const config = CURRENCY_CONFIGS[targetCurrency] || CURRENCY_CONFIGS.USD;
  return Math.round(basePriceUSD * config.rate);
}

export function formatPrice(basePriceUSD: number, currency: CurrencyCode): string {
  const config = CURRENCY_CONFIGS[currency] || CURRENCY_CONFIGS.USD;
  const converted = basePriceUSD * config.rate;
  
  // Format with standard zero decimals for clean numbers or two decimals if fractional
  const formattedNumber = converted >= 100 
    ? Math.round(converted).toLocaleString() 
    : converted.toFixed(2);
    
  return `${config.symbol}${formattedNumber}`;
}

export function formatLocalAmount(amount: number, currency: CurrencyCode): string {
  const config = CURRENCY_CONFIGS[currency] || CURRENCY_CONFIGS.USD;
  const formattedNumber = amount >= 100 
    ? Math.round(amount).toLocaleString() 
    : amount.toFixed(2);
  return `${config.symbol}${formattedNumber}`;
}

export function detectDefaultCurrency(): CurrencyCode {
  if (typeof window === 'undefined') return 'USD';
  
  const saved = localStorage.getItem('fetecart_currency') as CurrencyCode;
  if (saved && CURRENCY_CONFIGS[saved]) {
    return saved;
  }

  const locale = navigator.language || navigator.languages?.[0] || '';
  if (locale.includes('en-GB') || locale.includes('UK')) return 'GBP';
  if (locale.includes('de') || locale.includes('fr') || locale.includes('es') || locale.includes('it') || locale.includes('nl') || locale.includes('eu')) return 'EUR';
  if (locale.includes('en-AU') || locale.includes('AU')) return 'AUD';
  
  return 'USD';
}
