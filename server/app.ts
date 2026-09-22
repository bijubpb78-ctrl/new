import express, { Express } from 'express';
import {
  handleCjWebhook,
  getCjWebhookStatus,
  getCjWebhookLogs,
  simulateCjWebhook,
  clearCjWebhookLogs,
} from './cjWebhook';
import {
  getAllOrders,
  getOrderById,
  saveOrder,
  StoredOrder
} from './orderStore';
import {
  getStripeConfig,
  createPaymentIntent,
  createCheckoutSession,
  confirmStripeOrder,
  getSessionStatus,
  handleStripeWebhook,
  getStripeWebhookStatus,
} from './stripe';
import {
  handleContactFormSubmit,
  getInquiriesList,
  getEmailServiceStatus,
} from './email';

export function createExpressApp(): Express {
  const app = express();

  // Raw body parser for Stripe webhooks must run BEFORE express.json()
  app.use('/api/webhook/stripe', express.raw({ type: 'application/json' }));
  app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }));

  // Parse JSON and URL-encoded bodies for standard routes
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // CORS headers
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, CJ-Access-Token, CJ-Sign, Authorization');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // 1. Health check route
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      store: 'Fetecart Pilates Atelier',
      timestamp: new Date().toISOString(),
      cjWebhookActive: true
    });
  });

  // 2. CJ Dropshipping Webhook routes
  app.post('/api/webhook/cj', handleCjWebhook);
  app.get('/api/webhook/cj', getCjWebhookStatus);
  app.get('/api/webhook/cj/logs', getCjWebhookLogs);
  app.post('/api/webhook/cj/test', simulateCjWebhook);
  app.delete('/api/webhook/cj/logs', clearCjWebhookLogs);

  // 3. Orders API routes
  app.get('/api/orders', (req, res) => {
    const orders = getAllOrders();
    res.json({ success: true, count: orders.length, orders });
  });

  app.get('/api/orders/:orderId', (req, res) => {
    const order = getOrderById(req.params.orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    res.json({ success: true, order });
  });

  app.post('/api/orders', (req, res) => {
    const newOrder = req.body as StoredOrder;
    if (!newOrder || !newOrder.orderId) {
      return res.status(400).json({ success: false, message: 'Invalid order data' });
    }
    const saved = saveOrder(newOrder);
    res.status(201).json({ success: true, order: saved });
  });

  // 4. Stripe Payment Gateway routes
  app.get('/api/stripe/config', getStripeConfig);
  app.post('/api/stripe/create-payment-intent', createPaymentIntent);
  app.post('/api/stripe/create-checkout-session', createCheckoutSession);
  app.post('/api/stripe/confirm-order', confirmStripeOrder);
  app.get('/api/stripe/session/:sessionId', getSessionStatus);
  app.post('/api/webhook/stripe', handleStripeWebhook);
  app.post('/api/stripe/webhook', handleStripeWebhook);
  app.get('/api/webhook/stripe', getStripeWebhookStatus);
  app.get('/api/stripe/webhook', getStripeWebhookStatus);

  // 5. Automated Server-Side Email & Customer Inquiries
  app.post('/api/contact', handleContactFormSubmit);
  app.get('/api/contact/messages', getInquiriesList);
  app.get('/api/contact/status', getEmailServiceStatus);

  // 6. Gemini Live Voice API status endpoint
  app.get('/api/live/status', (req, res) => {
    const hasApiKey = Boolean(process.env.GEMINI_API_KEY);
    res.json({
      status: 'ok',
      model: 'gemini-3.8-live',
      voiceName: 'Zephyr',
      hasApiKey,
      endpoint: '/api/live',
    });
  });

  return app;
}
