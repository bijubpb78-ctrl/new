import express from 'express';
import path from 'path';
import http from 'http';
import { createServer as createViteServer } from 'vite';
import { setupGeminiLiveWebSocket } from './server/geminiLive';
import {
  handleCjWebhook,
  getCjWebhookStatus,
  getCjWebhookLogs,
  simulateCjWebhook,
  clearCjWebhookLogs,
} from './server/cjWebhook';
import {
  getAllOrders,
  getOrderById,
  saveOrder,
  StoredOrder
} from './server/orderStore';
import {
  getStripeConfig,
  createPaymentIntent,
  createCheckoutSession,
  confirmStripeOrder,
  getSessionStatus,
  handleStripeWebhook,
  getStripeWebhookStatus,
} from './server/stripe';
import {
  handleContactFormSubmit,
  getInquiriesList,
  getEmailServiceStatus,
} from './server/email';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Raw body parser for Stripe webhooks must run BEFORE express.json()
  app.use('/api/webhook/stripe', express.raw({ type: 'application/json' }));
  app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }));

  // Parse JSON and URL-encoded bodies for standard routes
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Basic CORS headers to allow test tools & external webhook pingers
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
  // POST: CJ Dropshipping pushes order, logistics, or stock events here
  app.post('/api/webhook/cj', handleCjWebhook);
  
  // GET: Health check & configuration guide for developers
  app.get('/api/webhook/cj', getCjWebhookStatus);

  // GET: Retrieve webhook logs for the Admin Portal
  app.get('/api/webhook/cj/logs', getCjWebhookLogs);

  // POST: Admin portal test trigger (simulate a CJ webhook event)
  app.post('/api/webhook/cj/test', simulateCjWebhook);

  // DELETE: Clear test webhook logs
  app.delete('/api/webhook/cj/logs', clearCjWebhookLogs);

  // 3. Orders API routes (synced with storefront checkout & CJ Dropshipping)
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
  // Stripe Webhook endpoints (listening for payment_intent.succeeded, checkout.session.completed, etc.)
  app.post('/api/webhook/stripe', handleStripeWebhook);
  app.post('/api/stripe/webhook', handleStripeWebhook);
  app.get('/api/webhook/stripe', getStripeWebhookStatus);
  app.get('/api/stripe/webhook', getStripeWebhookStatus);

  // 5. Automated Server-Side Email & Customer Inquiries
  app.post('/api/contact', handleContactFormSubmit);
  app.get('/api/contact/messages', getInquiriesList);
  app.get('/api/contact/status', getEmailServiceStatus);

  // 6. SEO Routes: robots.txt and sitemap.xml with explicit content types
  app.get('/robots.txt', (req, res) => {
    const robotsPath = path.join(process.cwd(), 'public', 'robots.txt');
    res.type('text/plain').sendFile(robotsPath);
  });
  app.get('/sitemap.xml', (req, res) => {
    const sitemapPath = path.join(process.cwd(), 'public', 'sitemap.xml');
    res.type('application/xml').sendFile(sitemapPath);
  });

  // 7. Vite middleware for development / Static files in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    // Static assets in /assets have hash fingerprints so they can be cached, but index.html must never be cached
    app.use(
      express.static(distPath, {
        setHeaders: (res, filePath) => {
          if (filePath.endsWith('.html')) {
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '0');
          }
        },
      })
    );
    app.get('*all', (req, res) => {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // 7. Gemini Live Voice API status endpoint
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

  const server = http.createServer(app);
  setupGeminiLiveWebSocket(server);

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[Fetecart Server] Running on http://localhost:${PORT}`);
    console.log(`[Gemini Live API] Voice WebSocket listening on /api/live (gemini-3.8-live)`);
    console.log(`[CJ Webhook] Listening at POST /api/webhook/cj`);
    console.log(`[Stripe Webhook] Listening at POST /api/webhook/stripe`);
  });
}

startServer();
