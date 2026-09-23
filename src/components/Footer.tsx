import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Truck, 
  CreditCard, 
  Globe2, 
  ExternalLink,
  ArrowRight,
  Heart,
  MapPin,
  Phone,
  Mail,
  RotateCcw,
  Share2,
  Copy,
  Check,
  Building
} from 'lucide-react';
import { CurrencyCode } from '../types';
import { CURRENCY_CONFIGS } from '../utils/currency';
import { PolicyTab } from './InfoPolicyModal';

interface FooterProps {
  currentCurrency: CurrencyCode;
  onSelectCurrency: (code: CurrencyCode) => void;
  onOpenTracking: () => void;
  onSelectCategory: (category: string) => void;
  onOpenPolicy: (tab: PolicyTab) => void;
}

export const Footer: React.FC<FooterProps> = ({
  currentCurrency,
  onSelectCurrency,
  onOpenTracking,
  onSelectCategory,
  onOpenPolicy,
}) => {
  const [copiedPhone, setCopiedPhone] = useState(false);

  const handleCopyPhone = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText('+16263133939');
      setCopiedPhone(true);
      setTimeout(() => setCopiedPhone(false), 2000);
    }
  };

  const currentUrl = typeof window !== 'undefined' ? window.location.href : 'https://fetecart.com';
  const shareTitle = 'Fetecart - Studio Grade Pilates Equipment Atelier';

  return (
    <footer className="bg-[#080807] text-stone-300 pt-14 pb-12 border-t border-[#1f1e1b]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Quick Access Policies & Customer Guarantees Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-5 bg-[#121211] rounded-2xl border border-stone-800/90 shadow-xl">
          {/* 1. About Us */}
          <button
            onClick={() => onOpenPolicy('about')}
            className="p-3.5 rounded-xl bg-[#181816]/70 hover:bg-[#1f1f1d] border border-stone-800/80 hover:border-amber-500/50 transition-all text-left flex items-start gap-3 group cursor-pointer"
          >
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 group-hover:bg-amber-500 group-hover:text-stone-950 transition-colors shrink-0">
              <Building className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white group-hover:text-amber-400 transition-colors flex items-center gap-1">
                <span>About Us</span>
                <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-[11px] text-stone-400 leading-snug mt-0.5">
                Direct-from-maker Pilates atelier in Sheridan, Wyoming.
              </p>
            </div>
          </button>

          {/* 2. Shipping Policy */}
          <button
            onClick={() => onOpenPolicy('shipping')}
            className="p-3.5 rounded-xl bg-[#181816]/70 hover:bg-[#1f1f1d] border border-stone-800/80 hover:border-amber-500/50 transition-all text-left flex items-start gap-3 group cursor-pointer"
          >
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 group-hover:bg-amber-500 group-hover:text-stone-950 transition-colors shrink-0">
              <Truck className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white group-hover:text-amber-400 transition-colors flex items-center gap-1">
                <span>Shipping Policy</span>
                <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-[11px] text-stone-400 leading-snug mt-0.5">
                Duty-paid (DDP) tracked global delivery to US, UK, EU & AUS.
              </p>
            </div>
          </button>

          {/* 3. Return Policy */}
          <button
            onClick={() => onOpenPolicy('returns')}
            className="p-3.5 rounded-xl bg-[#181816]/70 hover:bg-[#1f1f1d] border border-stone-800/80 hover:border-amber-500/50 transition-all text-left flex items-start gap-3 group cursor-pointer"
          >
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500 group-hover:text-stone-950 transition-colors shrink-0">
              <RotateCcw className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white group-hover:text-amber-400 transition-colors flex items-center gap-1">
                <span>Return Policy</span>
                <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-[11px] text-stone-400 leading-snug mt-0.5">
                30-day in-studio trial with 100% money-back guarantee.
              </p>
            </div>
          </button>

          {/* 4. Privacy Policy */}
          <button
            onClick={() => onOpenPolicy('privacy')}
            className="p-3.5 rounded-xl bg-[#181816]/70 hover:bg-[#1f1f1d] border border-stone-800/80 hover:border-amber-500/50 transition-all text-left flex items-start gap-3 group cursor-pointer"
          >
            <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400 group-hover:bg-sky-500 group-hover:text-stone-950 transition-colors shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white group-hover:text-amber-400 transition-colors flex items-center gap-1">
                <span>Privacy Policy</span>
                <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-[11px] text-stone-400 leading-snug mt-0.5">
                256-bit SSL, GDPR & CCPA compliant. Zero data selling.
              </p>
            </div>
          </button>
        </div>

        {/* Top Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          
          {/* Col 1 & 2: Brand Story & Headquarters Address */}
          <div className="lg:col-span-2 space-y-4">
            <a href="/" className="inline-block">
              <span className="font-serif text-2xl font-bold tracking-tight text-white">
                fetecart<span className="text-amber-500 font-sans text-xl">.com</span>
              </span>
            </a>
            
            <p className="text-xs text-stone-400 leading-relaxed max-w-sm">
              Fetecart is an artisan Pilates equipment atelier. We engineer and supply studio-grade reformers, stability chairs, barrels, and precision resistance apparatus directly to practitioners and studio owners across the US, UK, European Union, and Australia.
            </p>

            {/* Corporate Address & Contact Information Box */}
            <div className="p-4 bg-[#141413] rounded-2xl border border-stone-800 space-y-2.5 text-xs text-stone-300 shadow-lg">
              <div className="flex items-center gap-2 text-amber-400 font-bold uppercase tracking-wider text-[11px]">
                <Building className="w-3.5 h-3.5 text-amber-400" />
                <span>Corporate Headquarters</span>
              </div>

              <div className="space-y-1 text-stone-300">
                <div className="font-semibold text-white">Fetecart store LLC</div>
                <div className="flex items-start gap-1.5 text-stone-400">
                  <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <span>30N, STR E, Gould street, Sheridan, Wyoming, USA</span>
                </div>
              </div>

              <div className="pt-2 border-t border-stone-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <a 
                    href="tel:+16263133939" 
                    className="text-white hover:text-amber-400 font-mono font-medium transition-colors"
                  >
                    +1 (626) 313-3939
                  </a>
                </div>

                <button
                  onClick={handleCopyPhone}
                  className="inline-flex items-center gap-1 text-[11px] text-stone-400 hover:text-white transition-colors cursor-pointer"
                >
                  {copiedPhone ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedPhone ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              <div className="flex items-center gap-1.5 text-stone-400 text-[11px]">
                <Mail className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <a href="mailto:contact@fetecart.com" className="hover:text-amber-400 transition-colors">
                  contact@fetecart.com
                </a>
              </div>
            </div>

            {/* Social Sharing & Community Buttons */}
            <div className="space-y-2 pt-1">
              <div className="text-[11px] font-bold text-stone-400 uppercase tracking-wider flex items-center gap-1.5">
                <Share2 className="w-3.5 h-3.5 text-amber-400" />
                <span>Share & Connect:</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {/* Pinterest */}
                <a
                  href={`https://pinterest.com/pin/create/button/?url=${encodeURIComponent(currentUrl)}&description=${encodeURIComponent(shareTitle)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-lg bg-red-600/90 hover:bg-red-600 text-white flex items-center justify-center transition-transform hover:scale-105"
                  title="Share on Pinterest"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345-.09.375-.291 1.199-.334 1.357-.057.235-.19.285-.438.171-1.637-.762-2.66-3.155-2.66-5.078 0-4.135 3.004-7.935 8.668-7.935 4.55 0 8.087 3.243 8.087 7.576 0 4.521-2.85 8.16-6.807 8.16-1.329 0-2.579-.691-3.006-1.506l-.818 3.118c-.296 1.139-1.096 2.568-1.632 3.44C9.539 23.82 10.745 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"/>
                  </svg>
                </a>

                {/* Facebook */}
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-lg bg-[#1877F2]/90 hover:bg-[#1877F2] text-white flex items-center justify-center transition-transform hover:scale-105"
                  title="Share on Facebook"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>

                {/* X / Twitter */}
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareTitle)}&url=${encodeURIComponent(currentUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-lg bg-[#141413] hover:bg-black text-white border border-stone-800 flex items-center justify-center transition-transform hover:scale-105"
                  title="Share on X"
                >
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </a>

                {/* WhatsApp */}
                <a
                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent(shareTitle + ' ' + currentUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-lg bg-[#25D366]/90 hover:bg-[#25D366] text-white flex items-center justify-center transition-transform hover:scale-105"
                  title="Share on WhatsApp"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                  </svg>
                </a>

                {/* Open Share Dialog */}
                <button
                  onClick={() => onOpenPolicy('share')}
                  className="px-2.5 py-1.5 rounded-lg bg-[#141413] hover:bg-stone-800 text-amber-400 text-xs font-medium border border-stone-800 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Share2 className="w-3 h-3" />
                  <span>More Sharing Options</span>
                </button>
              </div>
            </div>
          </div>

          {/* Col 3: Studio Apparatus Catalog */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Studio Apparatus
            </h4>
            <ul className="space-y-2 text-xs text-stone-400">
              <li>
                <button 
                  onClick={() => onSelectCategory('Reformers & Towers')}
                  className="hover:text-amber-400 transition-colors cursor-pointer"
                >
                  Foldable Studio Reformers
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onSelectCategory('Studio Chairs')}
                  className="hover:text-amber-400 transition-colors cursor-pointer"
                >
                  Studio Wunda Combo Chairs
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onSelectCategory('Reformers & Towers')}
                  className="hover:text-amber-400 transition-colors cursor-pointer"
                >
                  Reformer Sitting Boxes
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onSelectCategory('Barrels & Arcs')}
                  className="hover:text-amber-400 transition-colors cursor-pointer"
                >
                  Modular Spine Correctors & Arcs
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onSelectCategory('Cardio & Apparatus')}
                  className="hover:text-amber-400 transition-colors cursor-pointer"
                >
                  Hydraulic Steppers & Speed Ropes
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onSelectCategory('Mats & Platforms')}
                  className="hover:text-amber-400 transition-colors cursor-pointer"
                >
                  15mm Studio Mats & Carriage Towels
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onSelectCategory('Props & Resistance')}
                  className="hover:text-amber-400 transition-colors cursor-pointer"
                >
                  Balance Domes, Rings & Bands
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onSelectCategory('Grip & Studio Wear')}
                  className="hover:text-amber-400 transition-colors cursor-pointer"
                >
                  Silicon Grip Barre & Studio Socks
                </button>
              </li>
            </ul>
          </div>

          {/* Col 4: Corporate, Shipping & Returns Policies */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Policies & Support
            </h4>
            <ul className="space-y-2 text-xs text-stone-400">
              <li>
                <button 
                  onClick={() => onOpenPolicy('about')}
                  className="hover:text-amber-400 transition-colors flex items-center gap-1.5 cursor-pointer text-stone-300"
                >
                  <Building className="w-3.5 h-3.5 text-amber-400" />
                  <span>About Us & Atelier Story</span>
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onOpenPolicy('shipping')}
                  className="hover:text-amber-400 transition-colors flex items-center gap-1.5 cursor-pointer text-white font-medium"
                >
                  <Truck className="w-3.5 h-3.5 text-amber-400" />
                  <span>Shipping Policy (US, UK, EU, AUS)</span>
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onOpenPolicy('returns')}
                  className="hover:text-amber-400 transition-colors flex items-center gap-1.5 cursor-pointer text-white font-medium"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />
                  <span>30-Day In-Studio Return Policy</span>
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onOpenPolicy('privacy')}
                  className="hover:text-amber-400 transition-colors flex items-center gap-1.5 cursor-pointer text-white font-medium"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
                  <span>Privacy Policy (GDPR & CCPA)</span>
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onOpenPolicy('contact')}
                  className="hover:text-amber-400 transition-colors flex items-center gap-1.5 cursor-pointer text-stone-300"
                >
                  <Mail className="w-3.5 h-3.5 text-amber-400" />
                  <span>Contact Us & Studio Concierge</span>
                </button>
              </li>
              <li>
                <button 
                  onClick={onOpenTracking}
                  className="hover:text-amber-400 transition-colors flex items-center gap-1.5 cursor-pointer text-stone-300"
                >
                  <span>Live Package Tracking</span>
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onOpenPolicy('share')}
                  className="hover:text-amber-400 transition-colors flex items-center gap-1.5 cursor-pointer text-stone-300"
                >
                  <Share2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>Share Store & Social Links</span>
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onOpenPolicy('returns')}
                  className="hover:text-stone-300 cursor-pointer"
                >
                  <span>2-Year Mechanical Warranty</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Col 5: Global Markets & Payments */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Regional Currency
            </h4>
            
            <div className="grid grid-cols-2 gap-1.5 text-xs">
              {(Object.keys(CURRENCY_CONFIGS) as CurrencyCode[]).map((code) => {
                const cfg = CURRENCY_CONFIGS[code];
                const isSelected = code === currentCurrency;
                return (
                  <button
                    key={code}
                    onClick={() => onSelectCurrency(code)}
                    className={`p-2 rounded-lg text-left border transition-colors cursor-pointer ${
                      isSelected
                        ? 'border-amber-500 bg-amber-500/15 text-amber-300 font-semibold'
                        : 'border-stone-800 bg-[#141413] text-stone-400 hover:text-white hover:border-stone-700'
                    }`}
                  >
                    <span>{cfg.flag} {cfg.code}</span>
                  </button>
                );
              })}
            </div>

            <div className="pt-2 text-[11px] text-stone-400 space-y-1">
              <div className="font-semibold text-stone-300">Accepted Gateways:</div>
              <div className="flex flex-wrap gap-1 text-[10px] text-stone-400">
                <span className="px-1.5 py-0.5 bg-[#141413] rounded border border-stone-800">Stripe</span>
                <span className="px-1.5 py-0.5 bg-[#141413] rounded border border-stone-800">PayPal</span>
                <span className="px-1.5 py-0.5 bg-[#141413] rounded border border-stone-800">Apple Pay</span>
                <span className="px-1.5 py-0.5 bg-[#141413] rounded border border-stone-800">Google Pay</span>
                <span className="px-1.5 py-0.5 bg-[#141413] rounded border border-stone-800">Klarna</span>
              </div>
            </div>

            {/* Quick Contact Badge */}
            <div className="pt-1 text-[11px] text-stone-400">
              <span className="text-stone-300 font-semibold block">Need Equipment Advice?</span>
              <a href="tel:+16263133939" className="text-amber-400 hover:underline font-mono">
                Call +1 (626) 313-3939
              </a>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-stone-800/80 flex flex-col sm:flex-row items-center justify-between text-xs text-stone-500 gap-4">
          <div className="space-y-0.5">
            <div>
              © {new Date().getFullYear()} Fetecart store LLC · All rights reserved.
            </div>
            <div className="text-[11px] text-stone-500">
              30N, STR E, Gould street, Sheridan, Wyoming · Direct Line: +1 (626) 313-3939
            </div>
          </div>

          <div className="flex items-center gap-3 text-[11px] flex-wrap">
            <button onClick={() => onOpenPolicy('about')} className="text-stone-300 hover:text-amber-400 font-medium cursor-pointer">
              About Us
            </button>
            <span>•</span>
            <button onClick={() => onOpenPolicy('shipping')} className="text-stone-300 hover:text-amber-400 font-medium cursor-pointer">
              Shipping Policy
            </button>
            <span>•</span>
            <button onClick={() => onOpenPolicy('returns')} className="text-stone-300 hover:text-amber-400 font-medium cursor-pointer">
              Return Policy
            </button>
            <span>•</span>
            <button onClick={() => onOpenPolicy('privacy')} className="text-stone-300 hover:text-amber-400 font-medium cursor-pointer">
              Privacy Policy
            </button>
            <span>•</span>
            <button onClick={() => onOpenPolicy('contact')} className="hover:text-amber-400 cursor-pointer">
              Contact Us
            </button>
            <span>•</span>
            <button onClick={() => onOpenPolicy('share')} className="hover:text-amber-400 cursor-pointer">
              Social Sharing
            </button>
          </div>
        </div>

      </div>
    </footer>
  );
};
