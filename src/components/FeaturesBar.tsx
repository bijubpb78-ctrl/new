import React from 'react';
import { 
  Truck, 
  CreditCard, 
  RotateCcw, 
  Sparkles, 
  ShieldCheck, 
  Globe2 
} from 'lucide-react';
import { CurrencyCode } from '../types';
import { CURRENCY_CONFIGS } from '../utils/currency';

interface FeaturesBarProps {
  currentCurrency: CurrencyCode;
}

export const FeaturesBar: React.FC<FeaturesBarProps> = ({ currentCurrency }) => {
  const currencyConfig = CURRENCY_CONFIGS[currentCurrency];

  const features = [
    {
      icon: <Globe2 className="w-5 h-5 text-amber-400" />,
      title: 'Global Studio Delivery',
      description: 'Serving US, UK, EU & AUS with localized native currency and zero foreign exchange surcharges.',
    },
    {
      icon: <Truck className="w-5 h-5 text-emerald-400" />,
      title: '100% Free Worldwide Shipping',
      description: 'Free priority tracked delivery on all studio apparatus and props. Zero shipping fees at checkout.',
    },
    {
      icon: <CreditCard className="w-5 h-5 text-amber-300" />,
      title: 'Secure Card & PayPal',
      description: 'Encrypted 256-bit SSL checkout with Visa, Mastercard, AMEX, PayPal, and flexible Pay in 4 options.',
    },
    {
      icon: <RotateCcw className="w-5 h-5 text-amber-400" />,
      title: '30-Day In-Studio Trial',
      description: 'Experience in your studio or home practice. 100% satisfaction guarantee + 2-year warranty.',
    },
  ];

  return (
    <div className="bg-[#0f0f0e] border-b border-[#1f1e1b] py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feat, index) => (
            <div 
              key={index}
              className="flex items-start gap-3.5 p-3.5 rounded-xl bg-[#141413] border border-stone-800/80 hover:border-amber-500/30 transition-colors"
            >
              <div className="p-2.5 rounded-xl bg-[#1c1c1a] border border-stone-700/60 shrink-0">
                {feat.icon}
              </div>
              <div className="space-y-1">
                <h4 className="text-xs sm:text-sm font-semibold text-white">
                  {feat.title}
                </h4>
                <p className="text-xs text-stone-400 leading-relaxed">
                  {feat.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
