import { CurrencyCode, ShippingCalculation, ShippingMethod, TrackingStep } from '../types';
import { CURRENCY_CONFIGS } from './currency';

export const SHIPPING_METHODS: ShippingMethod[] = [
  {
    id: 'fetecart_standard_air',
    name: 'Fetecart Standard Air Express',
    carrier: 'Fetecart Global Logistics',
    minDays: 7,
    maxDays: 12,
    baseCostUSD: 0,
    isFreeEligible: true,
    trackingSupport: true,
    description: 'Tracked global air express with direct local postal final delivery. 100% Free on all orders.',
  },
  {
    id: 'fetecart_priority_air',
    name: 'Fetecart Priority Air Cargo',
    carrier: 'Fetecart Priority Air Services',
    minDays: 4,
    maxDays: 7,
    baseCostUSD: 0,
    isFreeEligible: true,
    trackingSupport: true,
    description: 'Dedicated air freight cargo with priority customs pre-clearance and tracking. 100% Free.',
  },
  {
    id: 'fetecart_regional_depot',
    name: 'Direct Regional Warehouse Dispatch',
    carrier: 'USPS / Royal Mail / DHL Paket / AusPost',
    minDays: 2,
    maxDays: 5,
    baseCostUSD: 0,
    isFreeEligible: true,
    trackingSupport: true,
    description: 'Direct dispatch from regional fulfillment centers (US, UK, EU, AU). 100% Free.',
  },
  {
    id: 'fetecart_white_glove',
    name: 'Fetecart White-Glove Heavy Freight',
    carrier: 'DHL Express Worldwide & Studio Freight',
    minDays: 2,
    maxDays: 4,
    baseCostUSD: 0,
    isFreeEligible: true,
    trackingSupport: true,
    description: 'Specialist pallet handling for heavy apparatus with scheduled delivery. 100% Free complimentary freight.',
  },
];

export function calculateShippingOptions(
  countryCode: CurrencyCode,
  subtotalUSD: number,
  totalWeightKg: number
): ShippingCalculation[] {
  return SHIPPING_METHODS.map((method) => {
    // Estimated delivery dates
    const now = new Date();
    const minDelivery = new Date(now.getTime() + method.minDays * 24 * 60 * 60 * 1000);
    const maxDelivery = new Date(now.getTime() + method.maxDays * 24 * 60 * 60 * 1000);
    
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    const dateRangeStr = `${minDelivery.toLocaleDateString(undefined, options)} - ${maxDelivery.toLocaleDateString(undefined, options)}`;

    return {
      method,
      costLocal: 0,
      estimatedDeliveryDate: dateRangeStr,
      isFree: true,
      customsDDP: true, // All shipments via Fetecart are Delivered Duty Paid
    };
  });
}

export function generateSampleTracking(orderId: string, country: CurrencyCode): string {
  const num = Math.floor(100000000 + Math.random() * 900000000);
  const suffix = country === 'GBP' ? 'GB' : country === 'EUR' ? 'DE' : country === 'AUD' ? 'AU' : 'US';
  return `FTC-${num}${suffix}`;
}

export function getMockTrackingEvents(trackingNumber: string): {
  status: string;
  carrier: string;
  origin: string;
  destination: string;
  steps: TrackingStep[];
} {
  const isUK = trackingNumber.includes('GB');
  const isEU = trackingNumber.includes('DE') || trackingNumber.includes('EU');
  const isAU = trackingNumber.includes('AU');
  
  const destCountry = isUK ? 'United Kingdom (Heathrow / Royal Mail)' : isEU ? 'Germany (Frankfurt / DHL)' : isAU ? 'Australia (Sydney / AusPost)' : 'United States (JFK New York / USPS)';
  
  return {
    status: 'In Transit',
    carrier: 'Fetecart Priority Air & Express Cargo',
    origin: 'Fetecart Atelier Global Dispatch Center',
    destination: destCountry,
    steps: [
      {
        title: 'Order Verified & Studio Quality Inspection Passed',
        description: 'Quality inspection passed. Factory calibration checked and assigned individual serial barcode.',
        location: 'Fetecart Central Fulfillment Hub',
        timestamp: 'Sep 14, 2026 - 09:20 AM',
        completed: true,
        current: false,
      },
      {
        title: 'Priority Air Cargo Manifest Generated & Customs Cleared',
        description: 'Electronic customs export declaration completed (DDP Prepaid - No VAT/duty required).',
        location: 'International Air Hub Export Facility',
        timestamp: 'Sep 15, 2026 - 02:45 PM',
        completed: true,
        current: false,
      },
      {
        title: 'International Flight In Transit',
        description: 'Flight FTC-904 departing for destination regional sorting hub.',
        location: 'International Air Transit',
        timestamp: 'Sep 16, 2026 - 06:10 AM',
        completed: true,
        current: true,
      },
      {
        title: 'Import Clearance & Destination Hub Ingestion',
        description: 'Handover to local priority carrier for sorting and final-mile distribution.',
        location: destCountry,
        timestamp: 'Estimated Sep 18, 2026',
        completed: false,
        current: false,
      },
      {
        title: 'Out for Final Delivery',
        description: 'Direct courier delivery to customer residence or studio reception.',
        location: 'Local Delivery Address',
        timestamp: 'Estimated Sep 19 - 21, 2026',
        completed: false,
        current: false,
      },
    ],
  };
}
