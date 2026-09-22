import path from 'path';
import http from 'http';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import { setupGeminiLiveWebSocket } from './server/geminiLive';
import { createExpressApp } from './server/app';

async function startServer() {
  const app = createExpressApp();
  const PORT = 3000;

  // SEO Routes: robots.txt and sitemap.xml with explicit content types
  app.get('/robots.txt', (req, res) => {
    const robotsPath = path.join(process.cwd(), 'public', 'robots.txt');
    res.type('text/plain').sendFile(robotsPath);
  });
  app.get('/sitemap.xml', (req, res) => {
    const sitemapPath = path.join(process.cwd(), 'public', 'sitemap.xml');
    res.type('application/xml').sendFile(sitemapPath);
  });

  // Vite middleware for development / Static files in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
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
