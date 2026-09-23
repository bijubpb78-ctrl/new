import React, { useEffect, useState } from 'react';
import { CheckCircle2, Headphones, Package, Search, ShieldCheck, X } from 'lucide-react';

interface CjTrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTracking?: string;
}

type VerifiedOrder = {
  orderId: string;
  status: string;
  confirmedAt: string;
  message: string;
  trackingNumber?: string | null;
  carrier?: string | null;
  trackingUrl?: string | null;
  updatedAt?: string | null;
  events?: Array<{ statusDesc?: string; activity?: string; location?: string; eventTime?: string }>;
};

export const CjTrackingModal: React.FC<CjTrackingModalProps> = ({ isOpen, onClose, initialTracking = '' }) => {
  const [identifier, setIdentifier] = useState(initialTracking);
  const [order, setOrder] = useState<VerifiedOrder | null>(null);
  const [error, setError] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (isOpen) setIdentifier(initialTracking);
  }, [initialTracking, isOpen]);

  if (!isOpen) return null;

  const handleSearch = async (event: React.FormEvent) => {
    event.preventDefault();
    const cleanIdentifier = identifier.trim().toUpperCase();
    if (!cleanIdentifier) return;

    setIsSearching(true);
    setOrder(null);
    setError('');
    try {
      const response = await fetch('/api/tracking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: cleanIdentifier }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'Order not found.');
      setOrder(data.order);
      setIdentifier(cleanIdentifier);
    } catch (lookupError) {
      setError(lookupError instanceof Error ? lookupError.message : 'Unable to verify this order.');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in">
      <div className="bg-[#121211] w-full max-w-2xl rounded-2xl shadow-2xl border border-stone-800 overflow-hidden flex flex-col text-stone-200">
        <div className="px-6 py-4 border-b border-stone-800 bg-[#0c0c0b] text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-[#181816] border border-stone-700 text-amber-400"><Package className="w-5 h-5" /></div>
            <div>
              <h3 className="font-serif text-lg font-bold text-white">Fetecart Order Tracking</h3>
              <p className="text-xs text-stone-400">Verified paid orders only</p>
            </div>
          </div>
          <button onClick={onClose} aria-label="Close tracking" className="text-stone-400 hover:text-white p-1.5 rounded-full hover:bg-stone-800 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <form onSubmit={handleSearch} className="space-y-2">
            <label className="block text-xs font-semibold text-stone-300">Enter the order ID from your Stripe payment confirmation:</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={identifier}
                onChange={(event) => setIdentifier(event.target.value)}
                placeholder="FTC-1A2B3C4D"
                autoComplete="off"
                className="flex-1 px-4 py-2.5 text-xs sm:text-sm font-mono uppercase bg-[#181816] border border-stone-700 text-white rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
              <button type="submit" disabled={isSearching || !identifier.trim()} className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-stone-950 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer">
                <Search className="w-3.5 h-3.5" />
                <span>{isSearching ? 'Checking…' : 'Track'}</span>
              </button>
            </div>
          </form>

          {error && <div role="alert" className="p-4 bg-red-950/30 border border-red-800/60 rounded-xl text-sm text-red-200">{error}</div>}

          {order && (
            <div className="p-5 bg-[#181816] rounded-xl border border-emerald-800/60 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[11px] text-stone-400 font-semibold uppercase">Order ID</div>
                  <div className="text-sm font-mono font-bold text-amber-400">{order.orderId}</div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-800/60 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> {order.status}
                </span>
              </div>
              <div className="border-t border-stone-800 pt-4 text-sm text-stone-300 space-y-1">
                <p>{order.message}</p>
                <p className="text-xs text-stone-500">Payment confirmed: {order.confirmedAt}</p>
                {order.trackingNumber && (
                  <div className="pt-3 grid sm:grid-cols-2 gap-3">
                    <div><div className="text-[10px] uppercase text-stone-500">Carrier</div><div className="font-semibold">{order.carrier || 'Shipping partner'}</div></div>
                    <div><div className="text-[10px] uppercase text-stone-500">Tracking number</div><div className="font-mono text-amber-400">{order.trackingNumber}</div></div>
                  </div>
                )}
                {order.trackingUrl && <a href={order.trackingUrl} target="_blank" rel="noreferrer" className="inline-block pt-2 text-amber-400 hover:underline">Open carrier tracking</a>}
                {order.events && order.events.length > 0 && (
                  <div className="pt-3 space-y-2">
                    {order.events.slice(0, 8).map((event, index) => (
                      <div key={`${event.eventTime || index}`} className="border-l-2 border-amber-500/50 pl-3 py-1">
                        <div className="font-semibold text-xs">{event.statusDesc || event.activity || 'Shipment update'}</div>
                        <div className="text-[11px] text-stone-500">{[event.location, event.eventTime].filter(Boolean).join(' · ')}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {!order && !error && (
            <div className="p-4 bg-[#181816] rounded-xl border border-stone-800 text-sm text-stone-400">
              Tracking results appear only after the order ID is matched to a completed Stripe payment.
            </div>
          )}

          <div className="p-3 bg-[#141413] rounded-xl border border-stone-800 text-xs text-stone-300 flex items-center justify-between gap-3">
            <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-emerald-400" /> Secure server verification</span>
            <span className="text-stone-400 flex items-center gap-1"><Headphones className="w-3.5 h-3.5" /> Concierge support</span>
          </div>
        </div>
      </div>
    </div>
  );
};
