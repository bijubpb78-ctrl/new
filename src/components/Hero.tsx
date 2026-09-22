import React from 'react';
import { 
  ArrowRight, 
  ShieldCheck, 
  Truck, 
  Sparkles, 
  Star, 
  CheckCircle2, 
  Layers, 
  Award,
  Clock,
  MapPin
} from 'lucide-react';
import { CurrencyCode, Product } from '../types';
import { CURRENCY_CONFIGS, formatLocalAmount } from '../utils/currency';

interface HeroProps {
  currentCurrency: CurrencyCode;
  featuredProduct?: Product;
  onExploreCatalog: () => void;
  onOpenShippingCalculator: () => void;
  onOpenTracking: () => void;
}

export const Hero: React.FC<HeroProps> = ({
  currentCurrency,
  featuredProduct,
  onExploreCatalog,
  onOpenShippingCalculator,
  onOpenTracking,
}) => {
  const currencyConfig = CURRENCY_CONFIGS[currentCurrency];
  const prod = featuredProduct;

  return (
    <section className="relative overflow-hidden bg-[#0c0c0b] text-stone-100 border-b border-[#211f1c]">
      {/* Subtle ambient amber / warm gold atmospheric glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[450px] bg-[radial-gradient(ellipse_at_top,rgba(245,158,11,0.09),transparent_70%)] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-16 lg:pt-16 lg:pb-24 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          
          {/* Left Column: Core Value Proposition & CTAs */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Location & Sourcing Pill (inspired directly by screenshot style) */}
            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-[#181816] border border-amber-500/30 text-xs font-semibold text-amber-300 shadow-md">
              <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Fetecart Atelier · Direct Studio Sourcing to US, UK, EU & AUS</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0 ml-0.5" />
            </div>

            {/* Headline */}
            <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-normal tracking-tight text-white leading-[1.12]">
              Studio-Grade Pilates Equipment. <br />
              <span className="italic font-serif font-light text-amber-400">Precision Atelier Craftsmanship.</span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-stone-300 max-w-2xl font-light leading-relaxed">
              Experience commercial-grade reformers, spine barrels, and classical props straight from our specialized atelier workshop. Engineered with German piano-wire springs, aerospace aluminum, and automated express worldwide delivery.
            </p>

            {/* Sourcing & Guarantee Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
              <div className="flex items-center gap-2 p-3 bg-[#161615] rounded-xl border border-stone-800 hover:border-amber-500/30 transition-colors text-xs">
                <Truck className="w-4 h-4 text-amber-400 shrink-0" />
                <div>
                  <div className="font-semibold text-white">Free Global Air Express</div>
                  <div className="text-[10px] text-stone-400">Over {currencyConfig.symbol}{currencyConfig.freeShippingThreshold}</div>
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 bg-[#161615] rounded-xl border border-stone-800 hover:border-amber-500/30 transition-colors text-xs">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <div>
                  <div className="font-semibold text-white">DDP Duty Paid</div>
                  <div className="text-[10px] text-stone-400">Zero surprise import fees</div>
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 bg-[#161615] rounded-xl border border-stone-800 hover:border-amber-500/30 transition-colors text-xs col-span-2 sm:col-span-1">
                <Award className="w-4 h-4 text-amber-400 shrink-0" />
                <div>
                  <div className="font-semibold text-white">30-Day In-Studio Trial</div>
                  <div className="text-[10px] text-stone-400">2-Year Solid Warranty</div>
                </div>
              </div>
            </div>

            {/* Custom CTA Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-4">
              <button
                onClick={onExploreCatalog}
                id="hero-shop-apparatus-cta"
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold transition-all shadow-lg shadow-amber-500/20 text-sm cursor-pointer group"
              >
                <span>Shop Studio Apparatus</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </button>

              <button
                onClick={onOpenShippingCalculator}
                id="hero-calculate-shipping-cta"
                className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-[#181816] text-stone-200 border border-stone-700 hover:border-amber-500/40 hover:bg-[#20201d] transition-colors font-medium text-sm cursor-pointer shadow-xs"
              >
                <Truck className="w-4 h-4 text-amber-400" />
                <span>Calculate Express Delivery Rates</span>
              </button>
            </div>

            {/* Provenance note */}
            <div className="flex items-center gap-2 text-xs text-stone-400 pt-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Real-time warehouse inventory active in California, Frankfurt, Sydney, & regional depots</span>
            </div>

          </div>

          {/* Right Column: Visual Apparatus Showcase Card */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-2xl overflow-hidden bg-[#141413] p-3 shadow-2xl border border-stone-800 hover:border-amber-500/30 transition-all">
              
              {/* Product Hero Image */}
              <div className="relative aspect-4/3 rounded-xl overflow-hidden bg-stone-900">
                <img
                  src={prod?.images[0] || "https://cf.cjdropshipping.com/fc7f0310-aee1-4abf-94db-89d20dd7e350.png"}
                  alt={prod?.name || "The Foldable Studio Home Pilates Reformer"}
                  className="w-full h-full object-cover object-center transform hover:scale-102 transition-transform duration-700 brightness-95 contrast-105"
                />
                
                {/* Floating Atelier Sourcing Badge */}
                <div className="absolute top-3 left-3 bg-[#0c0c0b]/90 text-amber-400 border border-amber-500/30 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 shadow-md">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>Fetecart Atelier Series</span>
                </div>

                <div className="absolute bottom-3 right-3 bg-amber-500 text-stone-950 backdrop-blur-sm px-3 py-1.5 rounded-lg text-xs font-bold shadow-md flex items-center gap-2">
                  <span>Fast Air Dispatch</span>
                  <span className="bg-stone-950 text-amber-400 px-1.5 py-0.5 rounded text-[10px] font-mono">24h Ready</span>
                </div>
              </div>

              {/* Card Meta Content */}
              <div className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 block mb-0.5">
                      Flagship Apparatus
                    </span>
                    <h3 className="font-serif text-lg font-bold text-white">
                      {prod?.name || 'The Foldable Studio Home Pilates Reformer'}
                    </h3>
                    <p className="text-xs text-stone-400 line-clamp-1">
                      {prod?.subtitle || 'Dual Resistance Alloy Springs & Cords · Space-Saving Quick Fold'}
                    </p>
                  </div>
                  <div className="text-right shrink-0 pl-2">
                    {prod?.compareAtPriceUSD && (
                      <div className="text-xs text-stone-500 line-through">
                        {formatLocalAmount(prod.compareAtPriceUSD, currentCurrency)}
                      </div>
                    )}
                    <div className="text-xl font-bold text-white">
                      {formatLocalAmount(prod?.basePriceUSD || 263.99, currentCurrency)}
                    </div>
                  </div>
                </div>

                {/* Sourcing Breakdown */}
                <div className="p-2.5 bg-[#181816] rounded-xl border border-stone-800 text-[11px] text-stone-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Master Calibrated · SKU: {prod?.sku || 'CJJT233027402BY'}</span>
                  </span>
                  <span className="font-semibold text-emerald-400">Free Shipping</span>
                </div>

                {/* Micro Action */}
                <button
                  onClick={onExploreCatalog}
                  className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer shadow-sm"
                >
                  <span>View Product Details & Reviews</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
