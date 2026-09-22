import React, { useState } from 'react';
import { 
  ShoppingBag, 
  Search, 
  Truck, 
  Globe, 
  Menu, 
  X, 
  ShieldCheck, 
  Check, 
  ArrowRight,
  Heart,
  Phone,
  Info,
  RotateCcw,
  Share2,
  Mail,
  Sparkles,
  Layers,
  Lock,
  Radio
} from 'lucide-react';
import { CurrencyCode } from '../types';
import { CURRENCY_CONFIGS, formatLocalAmount } from '../utils/currency';
import { PolicyTab } from './InfoPolicyModal';

interface NavbarProps {
  currentCurrency: CurrencyCode;
  onSelectCurrency: (code: CurrencyCode) => void;
  cartCount: number;
  onOpenCart: () => void;
  onOpenTracking: () => void;
  onSelectCategory: (category: string) => void;
  selectedCategory: string;
  cartSubtotalUSD: number;
  onSearch: (query: string) => void;
  onOpenPolicy?: (tab: PolicyTab) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentCurrency,
  onSelectCurrency,
  cartCount,
  onOpenCart,
  onOpenTracking,
  onSelectCategory,
  selectedCategory,
  cartSubtotalUSD,
  onSearch,
  onOpenPolicy,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currencyDropdownOpen, setCurrencyDropdownOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const currencyConfig = CURRENCY_CONFIGS[currentCurrency];
  const thresholdLocal = currencyConfig.freeShippingThreshold;
  const currentSubtotalLocal = cartSubtotalUSD * currencyConfig.rate;
  const amountToFreeShipping = Math.max(0, thresholdLocal - currentSubtotalLocal);

  const categories = [
    { label: 'All Apparatus', value: 'all' },
    { label: 'Reformers & Boxes', value: 'Reformers & Towers' },
    { label: 'Studio Chairs', value: 'Studio Chairs' },
    { label: 'Props & Resistance', value: 'Props & Resistance' },
    { label: 'Barrels & Arcs', value: 'Barrels & Arcs' },
    { label: 'Cardio & Apparatus', value: 'Cardio & Apparatus' },
    { label: 'Mats & Platforms', value: 'Mats & Platforms' },
    { label: 'Grip & Studio Wear', value: 'Grip & Studio Wear' },
  ];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchQuery);
    setSearchOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#0c0c0b]/95 backdrop-blur-md border-b border-[#211f1c] text-stone-100 transition-all">
      {/* Top Notification / Global Dispatch Bar */}
      <div className="bg-[#080807] text-stone-300 text-xs py-2 px-4 border-b border-[#1c1b18]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          {/* Free Shipping Alert */}
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
              Direct Atelier Logistics
            </span>
            <span className="text-stone-300">
              {amountToFreeShipping === 0 ? (
                <span className="text-emerald-400 font-medium flex items-center gap-1">
                  <Check className="w-3.5 h-3.5 inline" /> You unlocked Free Worldwide Tracked Shipping!
                </span>
              ) : (
                <span>
                  Free Shipping on orders over <strong className="text-amber-300">{currencyConfig.symbol}{thresholdLocal}</strong> (Add {formatLocalAmount(amountToFreeShipping, currentCurrency)} more)
                </span>
              )}
            </span>
          </div>

          {/* Utility Navigation: Policies, Contact, Tracking & Currency */}
          <div className="flex items-center gap-3 sm:gap-4 flex-wrap text-[11px]">
            {onOpenPolicy && (
              <div className="hidden md:flex items-center gap-3 text-stone-400">
                <button
                  onClick={() => onOpenPolicy('about')}
                  className="hover:text-amber-300 transition-colors cursor-pointer"
                >
                  About Us
                </button>
                <span className="text-stone-700">·</span>
                <button
                  onClick={() => onOpenPolicy('contact')}
                  className="hover:text-amber-300 transition-colors cursor-pointer flex items-center gap-1 text-stone-300"
                >
                  <Phone className="w-3 h-3 text-amber-400" />
                  <span>Contact Us</span>
                </button>
                <span className="text-stone-700">·</span>
                <button
                  onClick={() => onOpenPolicy('shipping')}
                  className="hover:text-amber-300 transition-colors cursor-pointer"
                >
                  Shipping
                </button>
                <span className="text-stone-700">·</span>
                <button
                  onClick={() => onOpenPolicy('returns')}
                  className="hover:text-amber-300 transition-colors cursor-pointer"
                >
                  Returns
                </button>
                <span className="text-stone-700">·</span>
                <button
                  onClick={() => onOpenPolicy('share')}
                  className="hover:text-amber-300 transition-colors cursor-pointer flex items-center gap-1 text-amber-400 font-medium"
                >
                  <Share2 className="w-3 h-3" />
                  <span>Share</span>
                </button>
                <span className="text-stone-700">|</span>
              </div>
            )}

            {/* Order Tracking Link */}
            <button
              onClick={onOpenTracking}
              className="text-stone-300 hover:text-amber-300 transition-colors flex items-center gap-1.5 cursor-pointer text-[11px]"
              title="Track your shipment in real time"
            >
              <Truck className="w-3.5 h-3.5 text-amber-400" />
              <span>Track Order</span>
            </button>

            <span className="text-stone-700">|</span>

            {/* Currency Selector Dropdown */}
            <div className="relative">
              <button
                onClick={() => setCurrencyDropdownOpen(!currencyDropdownOpen)}
                className="flex items-center gap-1.5 text-stone-300 hover:text-white transition-colors cursor-pointer text-[11px] font-medium py-1 px-2 rounded-lg bg-[#181816] border border-stone-800 hover:border-amber-500/40"
              >
                <Globe className="w-3.5 h-3.5 text-amber-400" />
                <span>{currencyConfig.flag} {currencyConfig.code} ({currencyConfig.symbol})</span>
              </button>

              {currencyDropdownOpen && (
                <div 
                  className="absolute right-0 mt-1 w-52 bg-[#141413] border border-stone-700 rounded-xl shadow-2xl py-1 z-50 text-stone-300 text-xs"
                  onMouseLeave={() => setCurrencyDropdownOpen(false)}
                >
                  <div className="px-3 py-1.5 text-[10px] uppercase font-semibold text-amber-400 tracking-wider border-b border-stone-800">
                    Select Region & Currency
                  </div>
                  {(Object.keys(CURRENCY_CONFIGS) as CurrencyCode[]).map((code) => {
                    const c = CURRENCY_CONFIGS[code];
                    const isSelected = code === currentCurrency;
                    return (
                      <button
                        key={code}
                        onClick={() => {
                          onSelectCurrency(code);
                          setCurrencyDropdownOpen(false);
                        }}
                        className={`w-full px-3 py-2 text-left flex items-center justify-between hover:bg-stone-800/80 cursor-pointer transition-colors ${
                          isSelected ? 'text-amber-400 font-semibold bg-amber-500/10' : 'text-stone-300'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <span>{c.flag}</span>
                          <span>{c.name}</span>
                        </span>
                        <span className="text-stone-400 font-mono text-[11px]">{c.code}</span>
                      </button>
                    );
                  })}
                  <div className="px-3 py-2 text-[10px] text-stone-400 border-t border-stone-800 bg-stone-950/60">
                    Direct Atelier Fulfillment · DDP Customs Guaranteed
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Mobile menu button */}
          <div className="flex items-center lg:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-stone-300 hover:text-white bg-[#181816] border border-stone-800 hover:border-amber-500/40 cursor-pointer"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

          {/* Logo & Brand Identity (styled with Amber Icon Badge like screenshot) */}
          <div className="flex items-center gap-3">
            <a href="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center font-bold shadow-md shadow-amber-500/20 shrink-0">
                <Sparkles className="w-5 h-5 text-stone-950" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-white group-hover:text-amber-300 transition-colors">
                    fetecart<span className="text-amber-500 font-sans">.com</span>
                  </span>
                  <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                    Studio Atelier
                  </span>
                </div>
                <span className="text-[11px] text-stone-400 hidden sm:block truncate max-w-[240px]">
                  Apparatus & Props · Sheridan, WY
                </span>
              </div>
            </a>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-1">
            {categories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => onSelectCategory(cat.value)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                  selectedCategory === cat.value
                    ? 'text-stone-950 font-semibold bg-amber-500 shadow-xs'
                    : 'text-stone-300 hover:text-white hover:bg-stone-800/60'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </nav>

          {/* Right Action Icons: Search, Track, Cart */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Search Button */}
            <div className="relative">
              {searchOpen ? (
                <form onSubmit={handleSearchSubmit} className="flex items-center">
                  <input
                    type="text"
                    placeholder="Search reformers, barrels, props..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    autoFocus
                    className="w-48 sm:w-64 pl-3 pr-8 py-1.5 text-sm bg-[#181816] text-white border border-stone-700 rounded-full focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 placeholder-stone-400"
                  />
                  <button
                    type="button"
                    onClick={() => setSearchOpen(false)}
                    className="absolute right-2 text-stone-400 hover:text-white cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </form>
              ) : (
                <button
                  onClick={() => setSearchOpen(true)}
                  className="p-2.5 text-stone-300 hover:text-white rounded-xl bg-[#181816] border border-stone-800 hover:border-amber-500/40 transition-colors cursor-pointer"
                  title="Search products"
                >
                  <Search className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Order Tracking Button (Desktop) */}
            <button
              onClick={onOpenTracking}
              className="hidden md:flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-stone-200 bg-[#181816] hover:bg-[#20201d] rounded-xl border border-stone-800 hover:border-amber-500/40 transition-colors cursor-pointer"
            >
              <Truck className="w-3.5 h-3.5 text-amber-400" />
              <span>Track Order</span>
            </button>

            {/* Shopping Cart Drawer Trigger */}
            <button
              onClick={onOpenCart}
              id="cart-drawer-toggle-btn"
              className="relative p-2.5 text-stone-950 bg-amber-500 hover:bg-amber-400 rounded-xl transition-all cursor-pointer shadow-md shadow-amber-500/20 active:scale-95 flex items-center justify-center font-semibold"
              aria-label="View shopping bag"
            >
              <ShoppingBag className="w-5 h-5 text-stone-950" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[20px] h-5 px-1 text-[11px] font-bold text-white bg-red-600 rounded-full border-2 border-[#0c0c0b] shadow-xs animate-in zoom-in-75">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-stone-800 bg-[#121211] px-4 pt-3 pb-6 space-y-4">
          <div className="text-xs font-semibold text-amber-400 uppercase tracking-wider px-2">
            Apparatus Categories
          </div>
          <div className="grid grid-cols-1 gap-1">
            {categories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => {
                  onSelectCategory(cat.value);
                  setMobileMenuOpen(false);
                }}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium ${
                  selectedCategory === cat.value
                    ? 'bg-amber-500 text-stone-950 font-semibold'
                    : 'text-stone-300 hover:bg-stone-800/80'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Mobile Policies & Corporate Links */}
          {onOpenPolicy && (
            <div className="pt-3 border-t border-stone-800 space-y-1">
              <div className="text-xs font-semibold text-amber-400 uppercase tracking-wider px-2 mb-2">
                Company & Policies
              </div>
              <button
                onClick={() => {
                  onOpenPolicy('about');
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-stone-300 hover:bg-stone-800/80 flex items-center justify-between"
              >
                <span>About Us & Atelier</span>
                <ArrowRight className="w-3.5 h-3.5 text-stone-500" />
              </button>
              <button
                onClick={() => {
                  onOpenPolicy('contact');
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-stone-300 hover:bg-stone-800/80 flex items-center justify-between"
              >
                <span>Contact Us</span>
                <ArrowRight className="w-3.5 h-3.5 text-stone-500" />
              </button>
              <button
                onClick={() => {
                  onOpenPolicy('shipping');
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-stone-300 hover:bg-stone-800/80 flex items-center justify-between"
              >
                <span>Shipping Policy (US, UK, EU, AUS)</span>
                <ArrowRight className="w-3.5 h-3.5 text-stone-500" />
              </button>
              <button
                onClick={() => {
                  onOpenPolicy('returns');
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-stone-300 hover:bg-stone-800/80 flex items-center justify-between"
              >
                <span>30-Day In-Studio Return Policy</span>
                <ArrowRight className="w-3.5 h-3.5 text-stone-500" />
              </button>
              <button
                onClick={() => {
                  onOpenPolicy('privacy');
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-stone-300 hover:bg-stone-800/80 flex items-center justify-between"
              >
                <span>Privacy Policy (GDPR & CCPA)</span>
                <ArrowRight className="w-3.5 h-3.5 text-stone-500" />
              </button>
              <button
                onClick={() => {
                  onOpenPolicy('share');
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-amber-400 hover:bg-amber-500/10 flex items-center justify-between"
              >
                <span>Share Store with Studio Network</span>
                <Share2 className="w-3.5 h-3.5 text-amber-400" />
              </button>
            </div>
          )}

          <div className="pt-3 border-t border-stone-800 flex flex-col gap-2">
            <button
              onClick={() => {
                onOpenTracking();
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-between px-3 py-2.5 bg-[#181816] rounded-xl text-stone-200 text-sm font-medium border border-stone-800"
            >
              <span className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-amber-400" />
                <span>Track Order & Shipment</span>
              </span>
              <ArrowRight className="w-4 h-4 text-stone-500" />
            </button>
            
            <div className="p-3 bg-[#181816] rounded-xl text-xs text-stone-400 border border-stone-800 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-white block">Fetecart store LLC</span>
                <span>30N, STR E, Gould street, Sheridan, WY · Global Atelier</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
