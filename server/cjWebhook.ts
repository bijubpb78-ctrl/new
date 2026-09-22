import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { updateOrderFromWebhook, getAllOrders, StoredOrder } from './orderStore';

export interface WebhookLogEntry {
  id: string;
  receivedAt: string;
  topic: string;
  clientOrderId?: string;
  cjOrderId?: string;
  trackingNumber?: string;
  carrier?: string;
  statusText?: string;
  matchedOrder?: string;
  headers: Record<string, any>;
  payload: any;
  responseStatus: number;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const LOGS_FILE = path.join(DATA_DIR, 'cj-webhook-logs.json');

let memoryLogs: WebhookLogEntry[] = [
  {
    id: 'cj-log-init-01',
    receivedAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    topic: 'LOGISTICS_TRACKING',
    clientOrderId: 'FTC-89421',
    cjOrderId: 'CJ20260918001928',
    trackingNumber: 'FTC89421034US',
    carrier: 'USPS Ground Advantage',
    statusText: 'Dispatched from US West Atelier Hub',
    matchedOrder: 'FTC-89421',
    headers: {
      'content-type': 'application/json',
      'user-agent': 'CJ-OpenPlatform-Webhook/2.0',
      'cj-sign': 'sha256_mock_verified'
    },
    payload: {
      messageType: 'LOGISTICS_TRACKING',
      topic: 'logistics',
      params: {
        orderId: 'CJ20260918001928',
        clientOrderId: 'FTC-89421',
        trackingNumber: 'FTC89421034US',
        logisticName: 'USPS Ground Advantage',
        trackStatus: 'DELIVERING',
        deliveryTime: new Date().toISOString()
      }
    },
    responseStatus: 200
  }
];

// Load persisted logs
function loadLogs(): WebhookLogEntry[] {
  try {
    if (fs.existsSync(LOGS_FILE)) {
      const raw = fs.readFileSync(LOGS_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        memoryLogs = parsed;
        return memoryLogs;
      }
    }
  } catch (err) {
    console.warn('[CjWebhook] Notice: Using in-memory log cache', err);
  }
  return memoryLogs;
}

// Persist logs
function saveLogs(logs: WebhookLogEntry[]): void {
  memoryLogs = logs.slice(0, 100); // keep last 100 entries
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(LOGS_FILE, JSON.stringify(memoryLogs, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[CjWebhook] Could not persist logs to disk', err);
  }
}

// Initialize on load
loadLogs();

/**
 * Main CJ Dropshipping Webhook Receiver
 * Handles POST /api/webhook/cj
 */
export function handleCjWebhook(req: Request, res: Response) {
  const timestamp = new Date().toISOString();
  const logId = `cj-hook-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  
  const headers = {
    'content-type': req.headers['content-type'],
    'user-agent': req.headers['user-agent'],
    'cj-sign': req.headers['cj-sign'] || req.headers['cjson-sign'] || req.headers['signature'],
    'cj-access-token': req.headers['cj-access-token'] ? '***[PROVIDED]***' : undefined,
  };

  const body = req.body || {};

  // CJ Dropshipping sends payloads formatted in a few common ways:
  // 1) { messageType: "UPDATE"|"LOGISTICS", topic: "order"|"logistics"|"stock", params: { ... } }
  // 2) { type: "ORDER_STATUS"|"LOGISTICS", data: { ... } }
  // 3) Direct fields: { clientOrderId, orderId, trackingNumber, ... }
  const params = body.params || body.data || body;
  const rawTopic = (body.topic || body.messageType || body.type || body.event || 'unknown').toString().toUpperCase();

  // Extract core identifiers
  const clientOrderId = params.clientOrderId || params.orderIdClient || params.orderNum || params.orderId || body.clientOrderId;
  const cjOrderId = params.orderId || params.cjOrderId || body.orderId;
  const trackingNumber = params.trackingNumber || params.trackNumber || params.trackingNum || params.trackId;
  const carrier = params.logisticName || params.logisticCompany || params.carrierName || params.carrier;
  const trackStatus = params.trackStatus || params.orderStatus || params.status;

  let topic = 'GENERAL';
  if (rawTopic.includes('LOGISTIC') || trackingNumber || carrier) {
    topic = 'LOGISTICS_TRACKING';
  } else if (rawTopic.includes('ORDER') || params.orderStatus) {
    topic = 'ORDER_STATUS';
  } else if (rawTopic.includes('STOCK') || params.productSku || params.inventory) {
    topic = 'PRODUCT_STOCK';
  } else if (rawTopic.includes('PRODUCT')) {
    topic = 'PRODUCT_CATALOG';
  }

  let matchedOrderSummary: string | undefined = undefined;

  // Try updating orders if an order ID or tracking number was provided
  const targetId = clientOrderId || cjOrderId || trackingNumber;
  if (targetId) {
    let newStatus: StoredOrder['status'] | undefined;
    
    if (topic === 'LOGISTICS_TRACKING') {
      newStatus = 'In Transit';
      if (trackStatus && trackStatus.toString().toUpperCase().includes('DELIVERED')) {
        newStatus = 'Delivered';
      }
    } else if (topic === 'ORDER_STATUS') {
      const statusUpper = (trackStatus || '').toString().toUpperCase();
      if (statusUpper.includes('DISPATCH') || statusUpper.includes('SHIPPED')) {
        newStatus = 'Dispatched';
      } else if (statusUpper.includes('DELIVERED') || statusUpper.includes('COMPLETE')) {
        newStatus = 'Delivered';
      } else if (statusUpper.includes('CANCEL')) {
        newStatus = 'Cancelled';
      } else if (statusUpper.includes('PROCESS') || statusUpper.includes('PAY')) {
        newStatus = 'Processing';
      }
    }

    const updated = updateOrderFromWebhook(targetId, {
      status: newStatus,
      trackingNumber: trackingNumber || undefined,
      carrierName: carrier || undefined,
      cjOrderId: cjOrderId || undefined,
      webhookLog: {
        topic,
        message: `CJ Webhook: ${trackStatus || 'Event update'} for ${targetId}`
      }
    });

    if (updated) {
      matchedOrderSummary = `${updated.orderId} (${updated.status})`;
    }
  }

  const logEntry: WebhookLogEntry = {
    id: logId,
    receivedAt: timestamp,
    topic,
    clientOrderId: clientOrderId ? String(clientOrderId) : undefined,
    cjOrderId: cjOrderId ? String(cjOrderId) : undefined,
    trackingNumber: trackingNumber ? String(trackingNumber) : undefined,
    carrier: carrier ? String(carrier) : undefined,
    statusText: trackStatus ? String(trackStatus) : 'Webhook payload received',
    matchedOrder: matchedOrderSummary,
    headers,
    payload: body,
    responseStatus: 200
  };

  const logs = loadLogs();
  logs.unshift(logEntry);
  saveLogs(logs);

  console.log(`[CJ Webhook] Received ${topic} | matched: ${matchedOrderSummary || 'none'} | ID: ${logId}`);

  // CJ Dropshipping API requires 200 status returned in < 3 seconds
  // Standard CJ response contract:
  return res.status(200).json({
    code: 200,
    result: true,
    message: 'success',
    data: {
      logId,
      receivedAt: timestamp,
      topic,
      matchedOrder: matchedOrderSummary || null
    }
  });
}

/**
 * Health & Configuration Status
 * Handles GET /api/webhook/cj
 */
export function getCjWebhookStatus(req: Request, res: Response) {
  const protocol = req.headers['x-forwarded-proto'] || req.protocol;
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const callbackUrl = `${protocol}://${host}/api/webhook/cj`;

  return res.status(200).json({
    code: 200,
    status: 'online',
    message: 'CJ Dropshipping Webhook Service is active and ready to receive events.',
    callbackUrl,
    timestamp: new Date().toISOString(),
    supportedTopics: [
      { topic: 'LOGISTICS_TRACKING', description: 'Carrier tracking numbers and delivery scan pings' },
      { topic: 'ORDER_STATUS', description: 'Order creation, payment, and warehouse dispatch updates' },
      { topic: 'PRODUCT_STOCK', description: 'Inventory level and warehouse replenishment alerts' },
      { topic: 'PRODUCT_CATALOG', description: 'Product price and description modifications' }
    ],
    configurationGuide: {
      step1: 'Login to CJ Dropshipping Developer Center (developers.cjdropshipping.com)',
      step2: 'Navigate to Authorization > API Webhook (or Webhook Settings)',
      step3: `Enter Callback URL: ${callbackUrl}`,
      step4: 'Enable topics: Order Status, Logistics Tracking, Product Stock',
      step5: 'Click Save or Send Test to verify'
    }
  });
}

/**
 * Retrieve Webhook Event Logs for Admin Portal
 * Handles GET /api/webhook/cj/logs
 */
export function getCjWebhookLogs(req: Request, res: Response) {
  const logs = loadLogs();
  return res.status(200).json({
    code: 200,
    success: true,
    totalCount: logs.length,
    logs: logs.slice(0, 50)
  });
}

/**
 * Simulate / Test a Webhook Event from the Admin Portal
 * Handles POST /api/webhook/cj/test
 */
export function simulateCjWebhook(req: Request, res: Response) {
  const { scenario, orderId, customTracking } = req.body || {};
  const orders = getAllOrders();
  const targetOrder: any = (orderId ? orders.find(o => o.orderId === orderId) : orders[0]) || {
    orderId: 'FTC-89421',
    trackingNumber: 'FTC89421034US',
    clientOrderId: 'FTC-89421'
  };

  let mockPayload: any = {};
  const mockTracking = customTracking || `USPS${Date.now().toString().slice(-8)}`;

  switch (scenario) {
    case 'logistics_shipped':
      mockPayload = {
        messageType: 'LOGISTICS_TRACKING',
        topic: 'logistics',
        params: {
          orderId: targetOrder.cjOrderId || 'CJ20260918001928',
          clientOrderId: targetOrder.orderId,
          trackingNumber: mockTracking,
          logisticName: 'USPS Ground Advantage (DDP)',
          trackStatus: 'DELIVERING',
          eventTime: new Date().toISOString(),
          location: 'Los Angeles Logistics Hub, CA, USA',
          details: 'Package arrived at regional sorting facility. In transit to destination.'
        }
      };
      break;

    case 'logistics_delivered':
      mockPayload = {
        messageType: 'LOGISTICS_TRACKING',
        topic: 'logistics',
        params: {
          orderId: targetOrder.cjOrderId || 'CJ20260918001928',
          clientOrderId: targetOrder.orderId,
          trackingNumber: targetOrder.trackingNumber || mockTracking,
          logisticName: 'USPS Priority Mail',
          trackStatus: 'DELIVERED',
          eventTime: new Date().toISOString(),
          location: targetOrder.shippingAddress?.city || 'Springfield, OR',
          details: 'Package delivered at customer front door / mail locker.'
        }
      };
      break;

    case 'order_dispatched':
      mockPayload = {
        messageType: 'ORDER_STATUS',
        topic: 'order',
        params: {
          orderId: targetOrder.cjOrderId || 'CJ20260918001928',
          clientOrderId: targetOrder.orderId,
          orderStatus: 'DISPATCHED',
          warehouse: 'US West (California)',
          eventTime: new Date().toISOString()
        }
      };
      break;

    case 'stock_alert':
    default:
      mockPayload = {
        messageType: 'PRODUCT_STOCK',
        topic: 'stock',
        params: {
          productSku: 'FTC-PLT-REF-01',
          warehouseName: 'US West (California)',
          inventory: 18,
          timestamp: new Date().toISOString()
        }
      };
      break;
  }

  // Create a synthetic request to trigger standard webhook handler
  const syntheticReq = {
    headers: {
      'content-type': 'application/json',
      'user-agent': 'Fetecart-Admin-Simulator/1.0',
      'cj-sign': 'simulated_test_signature'
    },
    body: mockPayload
  } as unknown as Request;

  let capturedResponse: any = null;
  const syntheticRes = {
    status: (code: number) => ({
      json: (data: any) => {
        capturedResponse = { code, ...data };
        return capturedResponse;
      }
    })
  } as unknown as Response;

  handleCjWebhook(syntheticReq, syntheticRes);

  return res.status(200).json({
    code: 200,
    success: true,
    message: `Simulated webhook scenario '${scenario || 'logistics_shipped'}' dispatched successfully`,
    testPayload: mockPayload,
    handlerResult: capturedResponse
  });
}

/**
 * Clear Webhook Logs
 * Handles DELETE /api/webhook/cj/logs
 */
export function clearCjWebhookLogs(req: Request, res: Response) {
  saveLogs([]);
  return res.status(200).json({
    code: 200,
    success: true,
    message: 'Webhook event logs cleared successfully'
  });
}
