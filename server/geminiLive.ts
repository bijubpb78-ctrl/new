import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { WebSocketServer, WebSocket } from 'ws';
import type { Server } from 'http';
import { PILATES_PRODUCTS } from '../src/data/products';

function getProductCatalogContext(): string {
  const summary = PILATES_PRODUCTS.slice(0, 15).map(p => 
    `- "${p.name}" (SKU: ${p.sku}, Category: ${p.category}, Price: $${p.basePriceUSD} USD). Key highlights: ${p.subtitle}. Dimensions: ${p.dimensions}. Materials: ${p.material}.`
  ).join('\n');

  return `
FETECART STORE OVERVIEW:
Fetecart (fetecart.com) is an elite studio-grade Pilates equipment atelier based in Sheridan, Wyoming, USA.
We ship factory-direct studio equipment worldwide to the United States, United Kingdom, European Union, and Australia with tracked express delivery and DDP (Delivered Duty Paid - no surprise customs).

CATALOG HIGHLIGHTS:
${summary}

SHIPPING & LOGISTICS:
- Free Worldwide Tracked Shipping on orders over threshold or included on selected apparatus.
- Express air dispatch in 24-48 hours with real-time tracking code lookup.
- 30-Day Studio Return Policy & 3-Year Frame Warranty.
- Payments accepted: Stripe (Credit/Debit, Apple Pay, Google Pay) and PayPal.
`;
}

export function setupGeminiLiveWebSocket(server: Server) {
  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (request, socket, head) => {
    const { pathname } = new URL(request.url || '', `http://${request.headers.host}`);
    if (pathname === '/api/live' || pathname === '/live') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    }
  });

  wss.on('connection', async (clientWs: WebSocket) => {
    console.log('[Gemini Live] Client connected to live voice session');

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('[Gemini Live] Missing GEMINI_API_KEY environment variable');
      clientWs.send(JSON.stringify({
        error: 'Gemini API key is not configured. Please set GEMINI_API_KEY in your settings.',
      }));
      clientWs.close(1011, 'Missing GEMINI_API_KEY');
      return;
    }

    let session: any = null;
    let isSessionOpen = false;

    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const catalogContext = getProductCatalogContext();

      const systemInstruction = `You are "Aria", the friendly, knowledgeable, and elegant Senior Pilates Equipment Specialist and Atelier Concierge at Fetecart (fetecart.com).
Your goal is to interact with customers naturally in real-time through voice.

Personality & Tone:
- Warm, professional, encouraging, articulate, and poised like a top-tier Pilates studio director.
- Keep your answers concise, conversational, and voice-friendly (typically 1 to 3 short spoken sentences at a time, avoiding long monologues).
- Never read out raw markdown tables or bullet points; speak naturally.

Expertise:
- Deep knowledge of Pilates apparatus: Foldable Reformers, Wunda Combo Chairs, Sitting Boxes, Modular Spine Correctors, Mini Steppers, 15mm Studio Mats, Grip Socks, and Resistance gear.
- Provide expert guidance on studio vs. home setups, spring resistance tension, dimensions, footprint, weight capacity, and assembly.
- Guide shoppers on shipping times (24-48h dispatch, tracked air delivery to US, UK, EU, AU), DDP tax handling, warranty, and return policies.
- If a customer asks about a specific product or recommendation, recommend matching products from Fetecart's catalog.

Store Knowledge:
${catalogContext}
`;

      session = await ai.live.connect({
        model: 'gemini-3.8-live',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: 'Zephyr', // Elegant, articulate voice suitable for atelier concierge
              },
            },
          },
          systemInstruction,
        },
        callbacks: {
          onmessage: (message: LiveServerMessage) => {
            if (clientWs.readyState !== WebSocket.OPEN) return;

            // Model audio response chunk (24kHz PCM)
            const parts = message.serverContent?.modelTurn?.parts;
            if (parts && parts.length > 0) {
              for (const part of parts) {
                if (part.inlineData?.data) {
                  clientWs.send(JSON.stringify({
                    type: 'audio',
                    audio: part.inlineData.data,
                    mimeType: part.inlineData.mimeType || 'audio/pcm;rate=24000',
                  }));
                }
                if (part.text) {
                  clientWs.send(JSON.stringify({
                    type: 'text',
                    text: part.text,
                  }));
                }
              }
            }

            // User speech interrupted model
            if (message.serverContent?.interrupted) {
              clientWs.send(JSON.stringify({
                type: 'interrupted',
                interrupted: true,
              }));
            }

            // End of model turn
            if (message.serverContent?.turnComplete) {
              clientWs.send(JSON.stringify({
                type: 'turnComplete',
              }));
            }
          },
          onclose: (event) => {
            console.log('[Gemini Live] Gemini session closed', event);
            isSessionOpen = false;
            if (clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(JSON.stringify({ type: 'sessionClosed' }));
            }
          },
          onerror: (error) => {
            console.error('[Gemini Live] Gemini session error:', error);
            if (clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(JSON.stringify({
                type: 'error',
                error: (error as any)?.message || 'Voice session error',
              }));
            }
          },
        },
      });

      isSessionOpen = true;
      clientWs.send(JSON.stringify({ type: 'ready', status: 'connected' }));
      console.log('[Gemini Live] Gemini 3.8 Live session established');

      clientWs.on('message', (rawData) => {
        try {
          const payload = JSON.parse(rawData.toString());

          // Real-time user microphone audio chunk (16kHz PCM base64)
          if (payload.audio && isSessionOpen && session) {
            session.sendRealtimeInput({
              audio: {
                data: payload.audio,
                mimeType: payload.mimeType || 'audio/pcm;rate=16000',
              },
            });
          } else if (payload.text && isSessionOpen && session) {
            // Optional text message
            session.sendRealtimeInput({
              text: payload.text,
            });
          }
        } catch (err) {
          console.error('[Gemini Live] Error parsing incoming client message:', err);
        }
      });

      clientWs.on('close', () => {
        console.log('[Gemini Live] Client disconnected');
        isSessionOpen = false;
        try {
          if (session && typeof session.close === 'function') {
            session.close();
          }
        } catch (e) {
          // ignore cleanup errors
        }
      });

      clientWs.on('error', (err) => {
        console.error('[Gemini Live] Client WebSocket error:', err);
      });

    } catch (err: any) {
      console.error('[Gemini Live] Failed to connect to gemini-3.8-live:', err);
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(JSON.stringify({
          type: 'error',
          error: err?.message || 'Failed to initialize live voice session',
        }));
      }
      clientWs.close(1011, 'Failed to connect');
    }
  });

  return wss;
}
