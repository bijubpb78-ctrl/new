import React from 'react';
import { 
  Sparkles, 
  Check, 
  ArrowRight, 
  Package, 
  ShieldCheck,
  ShoppingBag
} from 'lucide-react';
import { CurrencyCode, Product } from '../types';
import { STUDIO_BUNDLES } from '../data/products';
import { CURRENCY_CONFIGS, formatLocalAmount } from '../utils/currency';

interface StudioBundlesProps {
  currentCurrency: CurrencyCode;
  onAddBundle: (bundleId: string) => void;
  onExploreProduct: (slug: string) => void;
}

export const StudioBundles: React.FC<StudioBundlesProps> = ({
  currentCurrency,
  onAddBundle,
  onExploreProduct,
}) => {
  if (!STUDIO_BUNDLES || STUDIO_BUNDLES.length === 0) {
    return null;
  }

  const currencyConfig = CURRENCY_CONFIGS[currentCurrency];

  return (
    <section className="py-16 bg-[#0c0c0b] border-b border-[#211f1c]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Complete Studio Suites</span>
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl font-normal text-white">
            Curated Studio Bundles
          </h2>
          <p className="text-sm sm:text-base text-stone-400">
            Equip your home sanctuary or commercial studio with our coordinated apparatus packages. Consolidated priority air freight included.
          </p>
        </div>

        {/* Bundles Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {STUDIO_BUNDLES.map((bundle) => {
            const savingsLocal = Math.round(
              (bundle.originalPriceUSD - bundle.bundlePriceUSD) * currencyConfig.rate
            );

            return (
              <div
                key={bundle.id}
                className="bg-[#141413] rounded-2xl border border-stone-800 shadow-xl overflow-hidden flex flex-col justify-between hover:border-amber-500/40 transition-all"
              >
                <div>
                  {/* Top Image Banner */}
                  <div className="relative h-56 sm:h-64 overflow-hidden bg-stone-900">
                    <img
                      src={bundle.image}
                      alt={bundle.title}
                      className="w-full h-full object-cover object-center brightness-95 contrast-105"
                    />
                    <div className="absolute top-3 left-3 bg-amber-500 text-stone-950 px-3 py-1 rounded-full text-xs font-bold shadow-md">
                      {bundle.badge}
                    </div>
                    <div className="absolute bottom-3 right-3 bg-[#0c0c0b]/90 text-amber-300 border border-amber-500/30 backdrop-blur-xs px-3 py-1 rounded-lg text-xs font-medium">
                      Consolidated Air Express
                    </div>
                  </div>

                  {/* Bundle Content */}
                  <div className="p-6 space-y-4">
                    <div>
                      <h3 className="font-serif text-xl sm:text-2xl font-bold text-white">
                        {bundle.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-stone-400 mt-1">
                        {bundle.subtitle}
                      </p>
                    </div>

                    {/* Items Included */}
                    <div className="space-y-2">
                      <div className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
                        Apparatus & Props in this Suite:
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-stone-300">
                        {bundle.productsIncluded.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-2 p-2 bg-[#1a1a18] rounded-xl border border-stone-800">
                            <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span className="truncate">{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Benefits */}
                    <div className="p-3.5 bg-amber-500/10 rounded-xl border border-amber-500/20 text-xs space-y-1 text-amber-300">
                      {bundle.benefits.map((b, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                          <span>{b}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Bottom Pricing & CTA */}
                <div className="p-6 bg-[#181816] border-t border-stone-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl sm:text-3xl font-extrabold text-white">
                        {formatLocalAmount(bundle.bundlePriceUSD, currentCurrency)}
                      </span>
                      <span className="text-sm text-stone-500 line-through">
                        {formatLocalAmount(bundle.originalPriceUSD, currentCurrency)}
                      </span>
                    </div>
                    <div className="text-xs text-emerald-400 font-semibold">
                      You save {currencyConfig.symbol}{savingsLocal} with direct studio suite pricing
                    </div>
                  </div>

                  <button
                    onClick={() => onAddBundle(bundle.id)}
                    className="py-3 px-6 bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md active:scale-98 cursor-pointer"
                  >
                    <ShoppingBag className="w-4 h-4 text-stone-950" />
                    <span>Claim Studio Suite</span>
                  </button>
                </div>

              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
