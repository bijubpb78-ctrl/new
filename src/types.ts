export type CurrencyCode = 'USD' | 'GBP' | 'EUR' | 'AUD';

export interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  name: string;
  flag: string;
  rate: number; // relative to USD (1.0)
  freeShippingThreshold: number; // in local currency
  taxLabel: string;
}

export interface WarehouseStock {
  warehouse: 'US West (California)' | 'US East (New Jersey)' | 'EU Central (Frankfurt)' | 'AU Pacific (Sydney)' | 'Central Atelier Hub';
  stock: number;
  dispatchHours: number;
}

export interface ShippingMethod {
  id: string;
  name: string;
  carrier: string;
  minDays: number;
  maxDays: number;
  baseCostUSD: number;
  isFreeEligible: boolean;
  trackingSupport: boolean;
  description: string;
}

export interface Review {
  id: string;
  author: string;
  location: string;
  countryCode: 'US' | 'UK' | 'EU' | 'AU';
  rating: number;
  date: string;
  title: string;
  comment: string;
  verifiedBuyer: boolean;
  userType: 'Studio Owner' | 'Pilates Instructor' | 'Home Practitioner' | 'Physical Therapist';
  helpfulCount: number;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  subtitle: string;
  category: 'Reformers & Towers' | 'Studio Chairs' | 'Barrels & Arcs' | 'Props & Resistance' | 'Grip & Studio Wear' | 'Cardio & Apparatus' | 'Mats & Platforms';
  basePriceUSD: number;
  compareAtPriceUSD?: number;
  sku: string;
  weightKg: number;
  dimensions: string;
  material: string;
  springConfiguration?: string;
  images: string[];
  description: string;
  features: string[];
  includedItems: string[];
  warehouses: WarehouseStock[];
  reviews: Review[];
  rating: number;
  reviewCount: number;
  badge?: string;
  tags?: string[];
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedColor?: string;
}

export interface ShippingCalculation {
  method: ShippingMethod;
  costLocal: number;
  estimatedDeliveryDate: string;
  isFree: boolean;
  customsDDP: boolean;
}

export interface OrderDetails {
  orderId: string;
  trackingNumber: string;
  items: CartItem[];
  subtotal: number;
  shippingCost: number;
  total: number;
  currency: CurrencyCode;
  shippingAddress: {
    fullName: string;
    email: string;
    addressLine1: string;
    city: string;
    stateOrProvince: string;
    postalCode: string;
    country: string;
    phone: string;
  };
  paymentMethod: 'card' | 'stripe' | 'paypal' | 'apple_pay' | 'klarna';
  stripePaymentId?: string;
  stripeReceiptUrl?: string;
  status: 'Processing' | 'Dispatched' | 'In Transit' | 'Out for Delivery' | 'Delivered';
  createdAt: string;
  estimatedDelivery: string;
}

export interface TrackingStep {
  title: string;
  description: string;
  location: string;
  timestamp: string;
  completed: boolean;
  current: boolean;
}
