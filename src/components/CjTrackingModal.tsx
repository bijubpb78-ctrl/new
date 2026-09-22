import React, { useState } from 'react';
import { 
  X, 
  Truck, 
  Search, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Package, 
  ShieldCheck, 
  Plane, 
  Building2,
  Headphones
} from 'lucide-react';
import { getMockTrackingEvents } from '../utils/cjShipping';
import { TrackingStep } from '../types';

interface CjTrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTracking?: string;
}

export const CjTrackingModal: React.FC<CjTrackingModalProps> = ({
  isOpen,
  onClose,
  initialTracking = 'FTC89421034US',
}) => {
  const [trackingNumber, setTrackingNumber] = useState(initialTracking);
  const [activeTracking, setActiveTracking] = useState(initialTracking);
  const [isSearching, setIsSearching] = useState(false);

  if (!isOpen) return null;

  const trackingData = getMockTrackingEvents(activeTracking);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingNumber.trim()) return;
    setIsSearching(true);
    setTimeout(() => {
      setActiveTracking(trackingNumber.trim().toUpperCase());
      setIsSearching(false);
    }, 400);
  };

  const sampleTrackings = [
    { label: '🇺🇸 US Order (California)', code: 'FTC89421034US' },
    { label: '🇬🇧 UK Order (London)', code: 'FTC77129032GB' },
    { label: '🇪🇺 EU Order (Frankfurt)', code: 'FTC66289104DE' },
    { label: '🇦🇺 AU Order (Sydney)', code: 'FTC55198201AU' },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in">
      <div 
        className="bg-[#121211] w-full max-w-2xl rounded-2xl shadow-2xl border border-stone-800 overflow-hidden flex flex-col text-stone-200"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-800 bg-[#0c0c0b] text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-[#181816] border border-stone-700 text-amber-400">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-white flex items-center gap-2">
                <span>Fetecart Order & Delivery Tracking</span>
                <span className="text-[10px] font-sans font-semibold uppercase bg-emerald-950/60 text-emerald-400 border border-emerald-800/60 px-2 py-0.5 rounded">
                  Live Status
                </span>
              </h3>
              <p className="text-xs text-stone-400">
                End-to-end tracked delivery with regional courier handoff
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-stone-400 hover:text-white transition-colors p-1.5 rounded-full hover:bg-stone-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[80vh]">
          
          {/* Tracking Search Input */}
          <form onSubmit={handleSearch} className="space-y-2">
            <label className="block text-xs font-semibold text-stone-300">
              Enter Tracking Number or Order ID:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="e.g. FTC89421034US"
                className="flex-1 px-4 py-2.5 text-xs sm:text-sm font-mono uppercase bg-[#181816] border border-stone-700 text-white rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
              <button
                type="submit"
                disabled={isSearching}
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Track</span>
              </button>
            </div>

            {/* Quick Sample Presets */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px] text-stone-400">
              <span>Try sample:</span>
              {sampleTrackings.map((sample) => (
                <button
                  key={sample.code}
                  type="button"
                  onClick={() => {
                    setTrackingNumber(sample.code);
                    setActiveTracking(sample.code);
                  }}
                  className="px-2 py-0.5 rounded bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700 font-mono text-[10px] cursor-pointer transition-colors"
                >
                  {sample.label}
                </button>
              ))}
            </div>
          </form>

          {/* Tracking Status Card */}
          <div className="p-4 bg-[#181816] rounded-xl border border-stone-800 space-y-3 shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-800 pb-3">
              <div>
                <div className="text-[11px] text-stone-400 font-semibold uppercase">Tracking Number</div>
                <div className="text-sm font-mono font-bold text-amber-400">{activeTracking}</div>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-800/60 flex items-center gap-1">
                  <Plane className="w-3.5 h-3.5" />
                  <span>{trackingData.status}</span>
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-stone-400 text-[10px] uppercase font-semibold">Origin Hub</span>
                <div className="font-medium text-stone-200 mt-0.5 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-amber-500" />
                  <span>{trackingData.origin}</span>
                </div>
              </div>
              <div>
                <span className="text-stone-400 text-[10px] uppercase font-semibold">Destination Regional Terminal</span>
                <div className="font-medium text-stone-200 mt-0.5 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{trackingData.destination}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Timeline Milestones */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Logistics Milestones
            </h4>

            <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-stone-800">
              {trackingData.steps.map((step, idx) => (
                <div key={idx} className="relative space-y-1">
                  {/* Circle Marker */}
                  <div 
                    className={`absolute -left-6 top-1 w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      step.completed
                        ? 'bg-emerald-600 border-emerald-500 text-white'
                        : step.current
                        ? 'bg-amber-500 border-amber-400 text-stone-950 ring-4 ring-amber-500/20'
                        : 'bg-[#181816] border-stone-700'
                    }`}
                  >
                    {step.completed && <CheckCircle2 className="w-3 h-3" />}
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs">
                    <span className={`font-semibold ${step.current ? 'text-amber-400' : 'text-stone-200'}`}>
                      {step.title}
                    </span>
                    <span className="text-[11px] text-stone-500">{step.timestamp}</span>
                  </div>

                  <p className="text-xs text-stone-400">{step.description}</p>
                  <div className="text-[10px] font-medium text-stone-500 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    <span>{step.location}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Guarantee Footer */}
          <div className="p-3 bg-[#141413] rounded-xl border border-stone-800 text-xs text-stone-300 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>DDP Air Express: All import duties and local postal delivery prepaid</span>
            </span>
            <span className="text-[11px] text-stone-400 flex items-center gap-1">
              <Headphones className="w-3.5 h-3.5 text-stone-500" />
              <span>Concierge Support Active</span>
            </span>
          </div>

        </div>

      </div>
    </div>
  );
};
