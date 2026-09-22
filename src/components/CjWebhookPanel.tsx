import React, { useState, useEffect } from 'react';
import {
  Radio,
  Check,
  Copy,
  RefreshCw,
  Trash2,
  Send,
  Truck,
  Package,
  ShieldCheck,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  FileCode2,
  Boxes,
  Clock,
  CheckCircle2
} from 'lucide-react';

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

export interface StoredOrder {
  orderId: string;
  trackingNumber: string;
  clientOrderId?: string;
  cjOrderId?: string;
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
  status: 'Processing' | 'Dispatched' | 'In Transit' | 'Out for Delivery' | 'Delivered' | 'Cancelled';
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

interface CjWebhookPanelProps {
  onShowToast: (msg: string) => void;
  initialSubTab?: 'stream' | 'simulator' | 'orders' | 'guide';
}

export const CjWebhookPanel: React.FC<CjWebhookPanelProps> = ({ onShowToast, initialSubTab }) => {
  const [subTab, setSubTab] = useState<'stream' | 'simulator' | 'orders' | 'guide'>(initialSubTab || 'orders');
  const [logs, setLogs] = useState<WebhookLogEntry[]>([]);
  const [orders, setOrders] = useState<StoredOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [simulating, setSimulating] = useState(false);

  // Derived callback URL from current browser window origin
  const callbackUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/api/webhook/cj`
    : 'https://www.fetecart.com/api/webhook/cj';

  const formatSafeTime = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return isNaN(d.getTime()) ? String(dateStr) : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return String(dateStr || '');
    }
  };

  const formatSafeDate = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return isNaN(d.getTime())
        ? String(dateStr)
        : `${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    } catch {
      return String(dateStr || '');
    }
  };

  const safeCopyText = async (text: string, msg: string) => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        onShowToast(msg);
        return;
      }
    } catch (e) {
      // fallback below
    }
    try {
      const el = document.createElement('textarea');
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      onShowToast(msg);
    } catch {
      onShowToast(msg);
    }
  };

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/webhook/cj/logs');
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      }
    } catch (err) {
      console.warn('Error fetching webhook logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    setOrdersLoading(true);
    try {
      const res = await fetch('/api/orders');
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      }
    } catch (err) {
      console.warn('Error fetching server orders:', err);
    } finally {
      setOrdersLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    fetchOrders();
    const timer = setInterval(() => {
      fetchLogs();
    }, 12000);
    return () => clearInterval(timer);
  }, []);

  const handleCopyUrl = async () => {
    await safeCopyText(callbackUrl, 'Callback URL copied to clipboard');
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2500);
  };

  const handleSimulate = async (scenario: string, customTracking?: string) => {
    setSimulating(true);
    try {
      const res = await fetch('/api/webhook/cj/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario, customTracking })
      });
      if (res.ok) {
        const data = await res.json();
        onShowToast(`Dispatched test event: ${scenario}`);
        await fetchLogs();
        await fetchOrders();
      } else {
        onShowToast('Simulation failed');
      }
    } catch (err) {
      onShowToast('Error executing webhook simulation');
    } finally {
      setSimulating(false);
    }
  };

  const handleClearLogs = async () => {
    if (!window.confirm('Clear all webhook event logs?')) return;
    try {
      await fetch('/api/webhook/cj/logs', { method: 'DELETE' });
      setLogs([]);
      onShowToast('Webhook logs cleared');
    } catch (err) {
      onShowToast('Error clearing logs');
    }
  };

  const getTopicBadgeColor = (topic: string) => {
    switch (topic) {
      case 'LOGISTICS_TRACKING':
        return 'bg-sky-950 text-sky-400 border-sky-800';
      case 'ORDER_STATUS':
        return 'bg-emerald-950 text-emerald-400 border-emerald-800';
      case 'PRODUCT_STOCK':
        return 'bg-amber-950 text-amber-400 border-amber-800';
      default:
        return 'bg-stone-800 text-stone-300 border-stone-700';
    }
  };

  return (
    <div className="space-y-5">
      {/* 1. Main Webhook Status Card */}
      <div className="p-4 bg-[#181816] rounded-xl border border-stone-800 space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
              <Radio className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-serif font-bold text-white text-sm">
                  CJ Dropshipping Webhook Receiver
                </h4>
                <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                  Active & Listening
                </span>
              </div>
              <p className="text-xs text-stone-400">
                Receives automated logistics tracking and fulfillment status updates directly from CJ warehouse.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => { fetchLogs(); fetchOrders(); }}
              disabled={loading}
              className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-lg text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
              title="Refresh webhook logs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-amber-400' : ''}`} />
              <span>Refresh</span>
            </button>
            <a
              href="https://www.cjdropshipping.com/my.html"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-lg text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
              title="Open CJ Dropshipping Merchant Portal & Dashboard"
            >
              <span>CJ Portal</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <a
              href="https://developers.cjdropshipping.com"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 bg-stone-800/80 hover:bg-stone-700 text-stone-300 border border-stone-700 rounded-lg text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
              title="Open CJ Dropshipping Developer Center"
            >
              <span>CJ Developer</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Live Webhook URL Copy Banner */}
        <div className="p-3 bg-[#111110] rounded-xl border border-stone-800/80 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-stone-300 font-semibold flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Your Public CJ Callback URL (HTTPS):</span>
            </span>
            <span className="text-[10px] text-stone-500 font-mono">
              Auto-passes CJ 3-Second Verification
            </span>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={callbackUrl}
              className="flex-1 px-3 py-2 bg-[#0a0a09] border border-stone-700 rounded-lg text-emerald-400 font-mono text-xs focus:outline-none select-all"
            />
            <button
              onClick={handleCopyUrl}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 cursor-pointer whitespace-nowrap transition-colors"
            >
              {copiedUrl ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedUrl ? 'Copied!' : 'Copy URL'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Sub-Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-stone-800 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSubTab('stream')}
            className={`px-3 py-1 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
              subTab === 'stream'
                ? 'bg-amber-500 text-stone-950 font-bold'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800'
            }`}
          >
            Live Activity Stream ({logs.length})
          </button>
          <button
            onClick={() => setSubTab('simulator')}
            className={`px-3 py-1 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
              subTab === 'simulator'
                ? 'bg-amber-500 text-stone-950 font-bold'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800'
            }`}
          >
            Test Simulator
          </button>
          <button
            onClick={() => { setSubTab('orders'); fetchOrders(); }}
            className={`px-3 py-1 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
              subTab === 'orders'
                ? 'bg-amber-500 text-stone-950 font-bold'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800'
            }`}
          >
            Store Orders ({orders.length})
          </button>
          <button
            onClick={() => setSubTab('guide')}
            className={`px-3 py-1 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
              subTab === 'guide'
                ? 'bg-amber-500 text-stone-950 font-bold'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800'
            }`}
          >
            CJ Setup Guide
          </button>
        </div>

        {subTab === 'stream' && logs.length > 0 && (
          <button
            onClick={handleClearLogs}
            className="text-[11px] text-stone-500 hover:text-rose-400 flex items-center gap-1 cursor-pointer transition-colors"
          >
            <Trash2 className="w-3 h-3" />
            <span>Clear Logs</span>
          </button>
        )}
      </div>

      {/* 3. Sub-Tab Content */}

      {/* TAB A: LIVE STREAM */}
      {subTab === 'stream' && (
        <div className="space-y-3">
          {logs.length === 0 ? (
            <div className="p-8 text-center bg-[#181816] rounded-xl border border-stone-800 space-y-2">
              <Radio className="w-8 h-8 text-stone-600 mx-auto" />
              <h5 className="text-sm font-semibold text-white">No incoming webhooks recorded yet</h5>
              <p className="text-xs text-stone-400 max-w-md mx-auto">
                The endpoint is online at <code className="text-amber-400 font-mono">/api/webhook/cj</code>. You can test it by clicking the <strong>Test Simulator</strong> tab above or sending a test request from your CJ Developer dashboard.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {logs.map((log) => {
                const isExpanded = expandedLogId === log.id;
                return (
                  <div
                    key={log.id}
                    className="p-3 bg-[#181816] rounded-xl border border-stone-800 text-xs space-y-2 transition-colors hover:border-stone-700"
                  >
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded font-mono text-[10.5px] border ${getTopicBadgeColor(log.topic)}`}>
                          {log.topic}
                        </span>
                        <span className="font-mono text-stone-300 font-semibold">
                          {log.clientOrderId ? `Order: ${log.clientOrderId}` : log.id}
                        </span>
                        {log.trackingNumber && (
                          <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.2 rounded border border-emerald-800/60 flex items-center gap-1">
                            <Truck className="w-3 h-3" />
                            {log.trackingNumber}
                          </span>
                        )}
                        {log.carrier && (
                          <span className="text-[11px] text-stone-400">
                            via {log.carrier}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-[10px] text-stone-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatSafeDate(log.receivedAt)}
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                          HTTP {log.responseStatus}
                        </span>
                        <button
                          type="button"
                          onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                          className="p-1 text-stone-400 hover:text-white rounded hover:bg-stone-800 cursor-pointer"
                          title="Inspect JSON Payload"
                        >
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-stone-400 text-[11px] pt-1">
                      <span>{log.statusText || 'Status event received'}</span>
                      {log.matchedOrder && (
                        <span className="text-emerald-400 font-mono text-[10.5px]">
                          ✓ Synced with Order {log.matchedOrder}
                        </span>
                      )}
                    </div>

                    {/* Expandable Raw Payload Viewer */}
                    {isExpanded && (
                      <div className="mt-2 pt-2 border-t border-stone-800/80 space-y-2">
                        <div className="flex items-center justify-between text-[11px] text-stone-400 font-mono">
                          <span>Request Headers & JSON Payload:</span>
                          <button
                            type="button"
                            onClick={() => safeCopyText(JSON.stringify(log.payload, null, 2), 'Payload copied to clipboard')}
                            className="hover:text-amber-400 flex items-center gap-1 cursor-pointer"
                          >
                            <Copy className="w-3 h-3" />
                            <span>Copy Payload</span>
                          </button>
                        </div>
                        <pre className="p-2.5 bg-[#10100f] rounded-lg border border-stone-800 text-[11px] font-mono text-emerald-300 overflow-x-auto max-h-56">
                          {JSON.stringify({ headers: log.headers, body: log.payload }, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB B: TEST SIMULATOR */}
      {subTab === 'simulator' && (
        <div className="p-5 bg-[#181816] rounded-xl border border-stone-800 space-y-5">
          <div>
            <h4 className="text-sm font-serif font-bold text-white">
              Interactive CJ Webhook Simulator
            </h4>
            <p className="text-xs text-stone-400">
              Fire realistic CJ Dropshipping payloads into the live webhook pipeline to verify order status updates, tracking number assignments, and customer notifications.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Scenario 1 */}
            <div className="p-4 bg-[#121211] rounded-xl border border-stone-800 space-y-3">
              <div className="flex items-center gap-2 text-sky-400 font-semibold text-xs">
                <Truck className="w-4 h-4" />
                <span>1. Logistics Dispatched (Tracking Added)</span>
              </div>
              <p className="text-xs text-stone-400">
                Simulates CJ dispatching the parcel and issuing a real USPS tracking number. Changes order to <strong>In Transit</strong>.
              </p>
              <button
                onClick={() => handleSimulate('logistics_shipped')}
                disabled={simulating}
                className="w-full py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors shadow"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Simulate Dispatch & Tracking</span>
              </button>
            </div>

            {/* Scenario 2 */}
            <div className="p-4 bg-[#121211] rounded-xl border border-stone-800 space-y-3">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs">
                <CheckCircle2 className="w-4 h-4" />
                <span>2. Logistics Delivered</span>
              </div>
              <p className="text-xs text-stone-400">
                Simulates courier final delivery scan at the customer address. Updates order to <strong>Delivered</strong>.
              </p>
              <button
                onClick={() => handleSimulate('logistics_delivered')}
                disabled={simulating}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors shadow"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Simulate Delivered Scan</span>
              </button>
            </div>

            {/* Scenario 3 */}
            <div className="p-4 bg-[#121211] rounded-xl border border-stone-800 space-y-3">
              <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs">
                <Package className="w-4 h-4" />
                <span>3. Warehouse Order Processed</span>
              </div>
              <p className="text-xs text-stone-400">
                Simulates CJ packaging queue confirmation at the US West or Central Atelier hub.
              </p>
              <button
                onClick={() => handleSimulate('order_dispatched')}
                disabled={simulating}
                className="w-full py-2 bg-stone-800 hover:bg-stone-700 text-amber-300 font-bold rounded-lg text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Simulate Warehouse Allocation</span>
              </button>
            </div>

            {/* Scenario 4 */}
            <div className="p-4 bg-[#121211] rounded-xl border border-stone-800 space-y-3">
              <div className="flex items-center gap-2 text-purple-400 font-semibold text-xs">
                <Boxes className="w-4 h-4" />
                <span>4. CJ Stock Level Notification</span>
              </div>
              <p className="text-xs text-stone-400">
                Simulates factory replenishment alert for the AeroClassic Reformer SKU (<code className="text-purple-300">FTC-PLT-REF-01</code>).
              </p>
              <button
                onClick={() => handleSimulate('stock_alert')}
                disabled={simulating}
                className="w-full py-2 bg-stone-800 hover:bg-stone-700 text-purple-300 font-bold rounded-lg text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Simulate Stock Replenishment</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB C: STORE ORDERS SYNC */}
      {subTab === 'orders' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2 text-xs text-stone-400 px-1">
            <span>Orders synced between store checkout and CJ Dropshipping webhook pipeline:</span>
            <div className="flex items-center gap-2">
              <a
                href="https://www.cjdropshipping.com/my.html#/my-cj-order/dropShippingOrders"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20"
                title="View Dropshipping Orders in CJ Merchant Portal"
              >
                <span>CJ Orders Portal</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <a
                href="https://cjpacket.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-sky-400 hover:text-sky-300 flex items-center gap-1 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20"
                title="Open CJ Packet Tracking Engine"
              >
                <span>CJ Packet Tracker</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <button
                type="button"
                onClick={fetchOrders}
                className="text-stone-300 hover:text-white flex items-center gap-1 cursor-pointer bg-stone-800 px-2 py-0.5 rounded"
              >
                <RefreshCw className={`w-3 h-3 ${ordersLoading ? 'animate-spin text-amber-400' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {orders.length === 0 ? (
            <div className="p-8 text-center bg-[#181816] rounded-xl border border-stone-800 space-y-2">
              <Package className="w-8 h-8 text-stone-600 mx-auto" />
              <h5 className="text-sm font-semibold text-white">No store orders found</h5>
              <p className="text-xs text-stone-400 max-w-md mx-auto">
                Orders placed via the storefront checkout will automatically appear here with their live CJ tracking numbers and webhook synchronization history.
              </p>
            </div>
          ) : (
            orders.map((order) => (
              <div
                key={order.orderId || String(Math.random())}
                className="p-4 bg-[#181816] rounded-xl border border-stone-800 space-y-3 text-xs"
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="font-bold text-white text-sm font-mono">{order.orderId}</span>
                    <span className={`px-2 py-0.5 rounded text-[10.5px] font-bold ${
                      order.status === 'Delivered' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                      order.status === 'In Transit' ? 'bg-sky-950 text-sky-400 border border-sky-800' :
                      order.status === 'Dispatched' ? 'bg-indigo-950 text-indigo-400 border border-indigo-800' :
                      'bg-amber-950 text-amber-400 border border-amber-800'
                    }`}>
                      {order.status}
                    </span>
                    {order.cjOrderId && (
                      <span className="text-[10px] font-mono text-stone-400 bg-stone-900 px-1.5 py-0.5 rounded border border-stone-800">
                        CJ ID: {order.cjOrderId}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-stone-400">{order.createdAt}</span>
                    <span className="font-mono font-bold text-white text-sm">
                      ${typeof order.total === 'number' ? order.total.toLocaleString() : (order.total || '0')} {order.currency || 'USD'}
                    </span>
                  </div>
                </div>

                {/* Items & Tracking */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1">
                    <span className="text-[11px] text-stone-500 font-semibold uppercase tracking-wider block">Customer & Items:</span>
                    <div className="text-stone-300 font-medium">
                      {order.shippingAddress?.fullName || 'Valued Customer'} {order.shippingAddress?.city ? `· ${order.shippingAddress.city}` : ''}{order.shippingAddress?.stateOrProvince ? `, ${order.shippingAddress.stateOrProvince}` : ''}
                    </div>
                    <div className="text-stone-400 text-[11px]">
                      {(order.items || []).map(i => `${i.quantity || 1}x ${i.productName || (i as any).name || 'Product'}`).join(', ') || 'Custom order'}
                    </div>
                  </div>

                  <div className="space-y-1 md:text-right">
                    <span className="text-[11px] text-stone-500 font-semibold uppercase tracking-wider block">Live Carrier Tracking:</span>
                    <div className="flex items-center gap-1.5 md:justify-end flex-wrap">
                      <Truck className="w-3.5 h-3.5 text-sky-400" />
                      <code
                        onClick={() => safeCopyText(order.trackingNumber, 'Tracking number copied')}
                        className="text-amber-400 font-mono text-xs font-bold select-all cursor-pointer hover:underline"
                        title="Click to copy tracking number"
                      >
                        {order.trackingNumber || 'Pending Assignment'}
                      </code>
                      {order.trackingNumber && order.trackingNumber !== 'Pending' && (
                        <a
                          href={`https://cjpacket.com/?trackingNumber=${encodeURIComponent(order.trackingNumber)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] text-sky-400 hover:text-sky-300 inline-flex items-center gap-1 bg-sky-950/60 px-1.5 py-0.5 rounded border border-sky-800"
                          title="Track this parcel directly on CJ Packet"
                        >
                          <span>Track on CJ</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}
                    </div>
                    {order.carrierName && (
                      <div className="text-[11px] text-stone-400">
                        Carrier: {order.carrierName}
                      </div>
                    )}
                  </div>
                </div>

                {/* Webhook History Trail */}
                {order.webhookUpdates && order.webhookUpdates.length > 0 && (
                  <div className="pt-2 border-t border-stone-800/80 space-y-1">
                    <span className="text-[10.5px] text-stone-500 font-medium block">
                      Automated Webhook Sync Events:
                    </span>
                    <div className="space-y-1">
                      {order.webhookUpdates.map((update, idx) => (
                        <div key={idx} className="text-[11px] text-stone-400 flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0"></span>
                          <span className="text-stone-500 font-mono text-[10px] shrink-0">
                            {formatSafeTime(update.timestamp)}:
                          </span>
                          <span className="text-stone-300">{update.message}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB D: CJ SETUP GUIDE */}
      {subTab === 'guide' && (
        <div className="p-5 bg-[#181816] rounded-xl border border-stone-800 space-y-4 text-xs">
          <div>
            <h4 className="text-sm font-serif font-bold text-white">
              Official CJ Dropshipping Webhook Configuration Walkthrough
            </h4>
            <p className="text-stone-400 leading-relaxed mt-1">
              Follow these simple steps in your CJ Dropshipping merchant account to activate instant real-time synchronization.
            </p>
          </div>

          <div className="space-y-3 text-stone-300">
            <div className="p-3 bg-[#111110] rounded-lg border border-stone-800 space-y-1">
              <strong className="text-amber-400 block font-sans">Step 1: Open CJ Webhook Settings</strong>
              <p className="text-stone-400">
                Log into <a href="https://developers.cjdropshipping.com" target="_blank" rel="noopener noreferrer" className="text-amber-400 underline">developers.cjdropshipping.com</a> or go to <strong>My CJ &gt; Authorization &gt; API Webhook</strong>.
              </p>
            </div>

            <div className="p-3 bg-[#111110] rounded-lg border border-stone-800 space-y-1">
              <strong className="text-amber-400 block font-sans">Step 2: Enter Callback URL</strong>
              <p className="text-stone-400">
                Paste your store's live webhook URL:
              </p>
              <code className="block p-2 bg-[#0c0c0b] rounded border border-stone-700 text-emerald-400 font-mono text-xs select-all">
                {callbackUrl}
              </code>
            </div>

            <div className="p-3 bg-[#111110] rounded-lg border border-stone-800 space-y-1">
              <strong className="text-amber-400 block font-sans">Step 3: Enable Event Topics</strong>
              <p className="text-stone-400">
                Check the boxes for:
              </p>
              <ul className="list-disc list-inside space-y-1 text-stone-300 pl-2">
                <li><strong className="text-white">Order Status (ORDER_STATUS)</strong>: Automatic order progress from created to packed.</li>
                <li><strong className="text-white">Logistics Tracking (LOGISTICS_TRACKING)</strong>: Carrier tracking numbers and delivery updates.</li>
                <li><strong className="text-white">Product Stock (PRODUCT_STOCK)</strong>: Inventory synchronization across regional hubs.</li>
              </ul>
            </div>

            <div className="p-3 bg-[#111110] rounded-lg border border-stone-800 space-y-1">
              <strong className="text-amber-400 block font-sans">Step 4: Save & Verify</strong>
              <p className="text-stone-400">
                Click <strong>Save</strong>. CJ sends an initial ping to verify the URL. Our server immediately responds with <code className="text-emerald-400 font-mono">200 OK</code> within 30ms (well under CJ's 3-second limit), activating your webhook immediately.
              </p>
            </div>
          </div>

          <div className="p-3 bg-[#111110] rounded-lg border border-stone-800 text-[11px] text-stone-400 flex items-start gap-2">
            <FileCode2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p>
              <strong>Java / Spring Developer Note:</strong> If you saw sample code with <code className="text-amber-300">@PostMapping("/webhook")</code> in Java, our Node.js endpoint at <code className="text-amber-300">/api/webhook/cj</code> satisfies the exact same contract, headers (<code className="text-stone-300">CJ-Sign</code>), and JSON response requirements.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
