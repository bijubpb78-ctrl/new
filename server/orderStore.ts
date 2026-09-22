import fs from 'fs';
import path from 'path';

export interface StoredOrder {
  orderId: string;
  trackingNumber: string;
  clientOrderId?: string;
  cjOrderId?: string;
  stripePaymentId?: string;
  stripeSessionId?: string;
  items: Array<{
    productId: string;
    productName: string;
    sku: string;
    quantity: number;
    price: number;
  }>;
  subtotal: number;
  shippingCost: number;
  total: number;
  currency: string;
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
  paymentMethod: string;
  status: 'Processing' | 'Paid' | 'Dispatched' | 'In Transit' | 'Out for Delivery' | 'Delivered' | 'Cancelled' | 'Refunded';
  carrierName?: string;
  createdAt: string;
  estimatedDelivery?: string;
  updatedAt?: string;
  webhookUpdates?: Array<{
    timestamp: string;
    topic: string;
    message: string;
  }>;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');

// Ensure data dir exists
try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
} catch (e) {
  // Ignore filesystem errors in restricted environments
}

// In-memory fallback
let memoryOrders: StoredOrder[] = [
  {
    orderId: 'FTC-89421',
    trackingNumber: 'FTC89421034US',
    clientOrderId: 'FTC-89421',
    cjOrderId: 'CJ20260918001928',
    carrierName: 'USPS Ground Advantage',
    items: [
      {
        productId: 'prod-allegro-reformer',
        productName: 'AeroClassic Commercial Studio Reformer',
        sku: 'FTC-PLT-REF-01',
        quantity: 1,
        price: 2450,
      }
    ],
    subtotal: 2450,
    shippingCost: 0,
    total: 2450,
    currency: 'USD',
    shippingAddress: {
      fullName: 'Sarah Jenkins',
      email: 'sarah.jenkins@pilatesstudio.com',
      addressLine1: '742 Evergreen Terrace',
      city: 'Springfield',
      stateOrProvince: 'OR',
      postalCode: '97477',
      country: 'United States',
      phone: '+1 (541) 555-0199'
    },
    paymentMethod: 'stripe',
    status: 'In Transit',
    createdAt: 'Sep 18, 2026',
    estimatedDelivery: 'Sep 24, 2026',
    webhookUpdates: [
      {
        timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
        topic: 'ORDER_STATUS',
        message: 'Order confirmed and allocated in US West Hub by CJ Dropshipping'
      },
      {
        timestamp: new Date(Date.now() - 3600000 * 12).toISOString(),
        topic: 'LOGISTICS_TRACKING',
        message: 'Dispatch scan completed by USPS. Tracking number FTC89421034US issued.'
      }
    ]
  }
];

// Load persisted orders
function loadOrders(): StoredOrder[] {
  try {
    if (fs.existsSync(ORDERS_FILE)) {
      const data = fs.readFileSync(ORDERS_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        memoryOrders = parsed;
        return memoryOrders;
      }
    }
  } catch (err) {
    console.warn('[OrderStore] Notice: Using in-memory order cache', err);
  }
  return memoryOrders;
}

// Persist orders to disk
function saveOrders(orders: StoredOrder[]): void {
  memoryOrders = orders;
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[OrderStore] Could not persist to disk, kept in-memory', err);
  }
}

// Initialize on module load
loadOrders();

export function getAllOrders(): StoredOrder[] {
  return loadOrders();
}

export function getOrderById(orderId: string): StoredOrder | undefined {
  const orders = loadOrders();
  const cleanId = orderId.trim().toLowerCase();
  return orders.find(o => 
    o.orderId.toLowerCase() === cleanId || 
    (o.clientOrderId && o.clientOrderId.toLowerCase() === cleanId) ||
    (o.cjOrderId && o.cjOrderId.toLowerCase() === cleanId) ||
    (o.trackingNumber && o.trackingNumber.toLowerCase() === cleanId) ||
    (o.stripePaymentId && o.stripePaymentId.toLowerCase() === cleanId) ||
    (o.stripeSessionId && o.stripeSessionId.toLowerCase() === cleanId)
  );
}

export function saveOrder(order: StoredOrder): StoredOrder {
  const orders = loadOrders();
  const existingIdx = orders.findIndex(o => 
    o.orderId === order.orderId ||
    (order.stripePaymentId && o.stripePaymentId === order.stripePaymentId) ||
    (order.stripeSessionId && o.stripeSessionId === order.stripeSessionId)
  );
  if (existingIdx >= 0) {
    orders[existingIdx] = {
      ...orders[existingIdx],
      ...order,
      updatedAt: new Date().toISOString()
    };
  } else {
    orders.unshift({
      ...order,
      updatedAt: new Date().toISOString()
    });
  }
  saveOrders(orders);
  return order;
}

export function updateOrderFromWebhook(
  identifier: string,
  update: {
    status?: StoredOrder['status'];
    trackingNumber?: string;
    carrierName?: string;
    cjOrderId?: string;
    stripePaymentId?: string;
    stripeSessionId?: string;
    webhookLog?: { topic: string; message: string };
  }
): StoredOrder | null {
  const orders = loadOrders();
  const cleanId = identifier.trim().toLowerCase();

  const idx = orders.findIndex(o => 
    o.orderId.toLowerCase() === cleanId || 
    (o.clientOrderId && o.clientOrderId.toLowerCase() === cleanId) ||
    (o.cjOrderId && o.cjOrderId.toLowerCase() === cleanId) ||
    (o.trackingNumber && o.trackingNumber.toLowerCase() === cleanId) ||
    (o.stripePaymentId && o.stripePaymentId.toLowerCase() === cleanId) ||
    (o.stripeSessionId && o.stripeSessionId.toLowerCase() === cleanId)
  );

  if (idx < 0) {
    // If not found by ID, match the most recent order if identifier is generic
    if (orders.length > 0 && (identifier === 'test' || identifier === 'latest')) {
      const target = orders[0];
      if (update.status) target.status = update.status;
      if (update.trackingNumber) target.trackingNumber = update.trackingNumber;
      if (update.carrierName) target.carrierName = update.carrierName;
      if (update.cjOrderId) target.cjOrderId = update.cjOrderId;
      if (update.stripePaymentId) target.stripePaymentId = update.stripePaymentId;
      if (update.stripeSessionId) target.stripeSessionId = update.stripeSessionId;
      target.updatedAt = new Date().toISOString();
      if (update.webhookLog) {
        target.webhookUpdates = target.webhookUpdates || [];
        target.webhookUpdates.push({
          timestamp: new Date().toISOString(),
          topic: update.webhookLog.topic,
          message: update.webhookLog.message
        });
      }
      saveOrders(orders);
      return target;
    }
    return null;
  }

  const target = orders[idx];
  if (update.status) target.status = update.status;
  if (update.trackingNumber) target.trackingNumber = update.trackingNumber;
  if (update.carrierName) target.carrierName = update.carrierName;
  if (update.cjOrderId) target.cjOrderId = update.cjOrderId;
  if (update.stripePaymentId) target.stripePaymentId = update.stripePaymentId;
  if (update.stripeSessionId) target.stripeSessionId = update.stripeSessionId;
  target.updatedAt = new Date().toISOString();

  if (update.webhookLog) {
    target.webhookUpdates = target.webhookUpdates || [];
    target.webhookUpdates.push({
      timestamp: new Date().toISOString(),
      topic: update.webhookLog.topic,
      message: update.webhookLog.message
    });
  }

  saveOrders(orders);
  return target;
}
