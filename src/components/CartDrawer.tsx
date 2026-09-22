import React from 'react';
import { 
  X, 
  ShoppingBag, 
  Trash2, 
  ArrowRight, 
  Truck, 
  ShieldCheck, 
  Check, 
  Sparkles 
} from 'lucide-react';
import { CartItem, CurrencyCode } from '../types';
import { CURRENCY_CONFIGS, formatLocalAmount } from '../utils/currency';
import { PaymentBadges } from './PaymentBadges';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  currentCurrency: CurrencyCode;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onProceedToCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  currentCurrency,
  onUpdateQuantity,
  onRemoveItem,
  onProceedToCheckout,
}) => {
  if (!isOpen) return null;

  const currencyConfig = CURRENCY_CONFIGS[currentCurrency];
  const subtotalUSD = items.reduce((acc, item) => acc + item.product.basePriceUSD * item.quantity, 0);
  const subtotalLocal = Math.round(subtotalUSD * currencyConfig.rate);
  const thresholdLocal = currencyConfig.freeShippingThreshold;
  
  const isFreeShipping = subtotalLocal >= thresholdLocal;
  const progressPercent = Math.min(100, (subtotalLocal / thresholdLocal) * 100);
  const remainingForFreeShipping = Math.max(0, thresholdLocal - subtotalLocal);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/80 backdrop-blur-sm flex justify-end animate-in fade-in">
      
      {/* Slide-over panel */}
      <div 
        className="w-full max-w-md bg-[#141413] h-full shadow-2xl flex flex-col justify-between overflow-hidden relative border-l border-stone-800 text-stone-200"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-stone-800 flex items-center justify-between bg-[#181816]">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-amber-400" />
            <h3 className="font-serif text-lg font-bold text-white">
              Your Studio Cart ({items.reduce((sum, i) => sum + i.quantity, 0)})
            </h3>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-white hover:bg-stone-800 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Free Worldwide Shipping Banner */}
        <div className="p-3 bg-emerald-950/40 border-b border-emerald-800/40 text-xs">
          <div className="flex items-center justify-between text-emerald-400">
            <span className="font-semibold flex items-center gap-1.5">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>100% Free Worldwide Tracked Shipping Unlocked</span>
            </span>
            <span className="text-[10px] font-mono bg-emerald-900/60 px-1.5 py-0.5 rounded border border-emerald-700/50">
              FREE
            </span>
          </div>
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {items.length === 0 ? (
            <div className="py-16 text-center space-y-4">
              <div className="w-16 h-16 bg-[#181816] rounded-full flex items-center justify-center mx-auto text-stone-600 border border-stone-800">
                <ShoppingBag className="w-8 h-8 text-amber-500/50" />
              </div>
              <div className="space-y-1">
                <p className="font-serif text-lg text-white">Your shopping bag is empty</p>
                <p className="text-xs text-stone-400">
                  Discover our studio-grade reformers, barrels, and resistance props.
                </p>
              </div>
              <button
                onClick={onClose}
                className="px-5 py-2.5 bg-amber-500 text-stone-950 text-xs font-bold rounded-xl hover:bg-amber-400 transition-colors"
              >
                Browse Catalog
              </button>
            </div>
          ) : (
            items.map((item) => (
              <div 
                key={item.product.id}
                className="flex gap-3.5 p-3 rounded-xl bg-[#181816] border border-stone-800"
              >
                {/* Thumb */}
                <img
                  src={item.product.images[0]}
                  alt={item.product.name}
                  className="w-20 h-20 object-cover rounded-lg bg-stone-900 shrink-0 brightness-95"
                />

                {/* Details */}
                <div className="flex-1 flex flex-col justify-between space-y-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-serif text-sm font-semibold text-white line-clamp-1">
                        {item.product.name}
                      </h4>
                      <div className="text-[10px] font-mono text-amber-400">
                        SKU: {item.product.sku}
                      </div>
                    </div>

                    <button
                      onClick={() => onRemoveItem(item.product.id)}
                      className="text-stone-500 hover:text-rose-400 transition-colors p-1 cursor-pointer"
                      title="Remove item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    {/* Quantity controls */}
                    <div className="flex items-center border border-stone-700 rounded-md bg-[#141413]">
                      <button
                        onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)}
                        className="px-2 py-0.5 text-stone-400 hover:text-white hover:bg-stone-800 text-xs font-bold cursor-pointer"
                      >
                        -
                      </button>
                      <span className="px-2 text-xs font-semibold text-white">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                        className="px-2 py-0.5 text-stone-400 hover:text-white hover:bg-stone-800 text-xs font-bold cursor-pointer"
                      >
                        +
                      </button>
                    </div>

                    {/* Price in active currency */}
                    <div className="font-bold text-white text-sm">
                      {formatLocalAmount(item.product.basePriceUSD * item.quantity, currentCurrency)}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Checkout Summary */}
        {items.length > 0 && (
          <div className="p-3.5 sm:p-4 border-t border-stone-800 bg-[#181816] space-y-2.5">
            <div className="space-y-1 text-xs text-stone-400">
              <div className="flex justify-between">
                <span>Subtotal ({currentCurrency}):</span>
                <span className="font-bold text-white text-sm">
                  {formatLocalAmount(subtotalUSD, currentCurrency)}
                </span>
              </div>
              <div className="flex justify-between text-[11px] text-stone-400">
                <span>Tracked Air Freight:</span>
                <span className="text-emerald-400 font-bold">
                  FREE ($0.00)
                </span>
              </div>
              <div className="flex justify-between text-[11px] text-stone-400">
                <span>Customs & Import Duties:</span>
                <span className="text-stone-300">DDP Duty Paid Guaranteed</span>
              </div>
            </div>

            {/* Express Payment Logos (GPay, Apple Pay, Amazon Pay, Cards) under price */}
            <PaymentBadges />

            <button
              onClick={onProceedToCheckout}
              id="cart-proceed-checkout-btn"
              className="w-full py-3 px-5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg active:scale-98 cursor-pointer"
            >
              <span>Proceed to Stripe Checkout</span>
              <ArrowRight className="w-4 h-4 text-stone-950" />
            </button>

            {/* Sourcing note */}
            <div className="text-[10px] text-stone-500 text-center flex items-center justify-center gap-1.5 pt-0.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Official Stripe Hosted Checkout · 256-Bit Encryption</span>
            </div>
          </div>
        )}

      </div>

    </div>
  );
};
