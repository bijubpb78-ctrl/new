import React, { useState } from 'react';
import { 
  Star, 
  ShoppingBag, 
  Eye, 
  Check, 
  Truck, 
  PackageCheck,
  Building2,
  Share2
} from 'lucide-react';
import { CurrencyCode, Product } from '../types';
import { CURRENCY_CONFIGS, formatLocalAmount } from '../utils/currency';

interface ProductCardProps {
  product: Product;
  currentCurrency: CurrencyCode;
  onQuickView: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  onShare?: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  currentCurrency,
  onQuickView,
  onAddToCart,
  onShare,
}) => {
  const [addedAnim, setAddedAnim] = useState(false);
  const currencyConfig = CURRENCY_CONFIGS[currentCurrency];

  // Calculate total regional stock or localized warehouse stock
  const primaryWarehouse = product.warehouses.find(w => {
    if (currentCurrency === 'USD') return w.warehouse.includes('US');
    if (currentCurrency === 'EUR' || currentCurrency === 'GBP') return w.warehouse.includes('EU') || w.warehouse.includes('Central');
    if (currentCurrency === 'AUD') return w.warehouse.includes('AU') || w.warehouse.includes('Central');
    return true;
  }) || product.warehouses[0];

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddToCart(product);
    setAddedAnim(true);
    setTimeout(() => setAddedAnim(false), 1500);
  };

  return (
    <div 
      className="group relative bg-[#141413] rounded-2xl border border-stone-800/90 hover:border-amber-500/50 hover:shadow-xl hover:shadow-amber-500/5 transition-all duration-300 flex flex-col cursor-pointer overflow-hidden"
      onClick={() => onQuickView(product)}
    >
      {/* Image Container */}
      <div className="relative aspect-4/3 overflow-hidden bg-stone-900">
        <img
          src={product.images[0]}
          alt={product.name}
          loading="lazy"
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 brightness-95 contrast-105"
        />

        {/* Top Badges */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none">
          {product.badge ? (
            <span className="px-2.5 py-1 text-[11px] font-bold tracking-tight text-stone-950 bg-amber-500 rounded-lg shadow-sm">
              {product.badge}
            </span>
          ) : (
            <span className="px-2 py-0.5 text-[10px] font-medium text-amber-300 bg-[#0c0c0b]/85 border border-amber-500/30 rounded-full">
              Studio Calibrated
            </span>
          )}

          {/* Sourcing SKU tag */}
          <span className="px-2 py-0.5 text-[10px] font-mono text-stone-300 bg-[#0c0c0b]/90 border border-stone-700 rounded-md">
            {product.sku}
          </span>
        </div>

        {/* Quick View Button overlay */}
        <div className="absolute inset-0 bg-stone-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-4">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onQuickView(product);
            }}
            className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold rounded-xl shadow-lg flex items-center gap-1.5 transition-transform transform translate-y-2 group-hover:translate-y-0 cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Quick View</span>
          </button>

          {onShare && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onShare(product);
              }}
              className="p-2 bg-stone-900/90 hover:bg-black text-amber-400 border border-stone-700/80 rounded-xl shadow-lg flex items-center justify-center transition-transform transform translate-y-2 group-hover:translate-y-0 cursor-pointer hover:border-amber-500/50"
              title="Share product link"
              aria-label={`Share ${product.name}`}
            >
              <Share2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Product Content Details */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        
        <div className="space-y-1.5">
          {/* Category & Ratings */}
          <div className="flex items-center justify-between text-xs text-stone-400">
            <span className="uppercase tracking-wider text-[10px] font-semibold text-amber-400">
              {product.category}
            </span>
            <div className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span className="font-semibold text-stone-200 text-[11px]">{product.rating}</span>
              <span className="text-stone-400 text-[10px]">({product.reviewCount})</span>
            </div>
          </div>

          {/* Product Name */}
          <h3 className="font-serif text-base font-bold text-white group-hover:text-amber-400 transition-colors line-clamp-1">
            {product.name}
          </h3>

          {/* Subtitle */}
          <p className="text-xs text-stone-400 line-clamp-1">
            {product.subtitle}
          </p>
        </div>

        {/* Live Warehouse Stock & Dispatch Status */}
        <div className="pt-1">
          <div className="flex items-center gap-1.5 text-[11px] text-stone-300 bg-[#1c1c1a] px-2.5 py-1.5 rounded-xl border border-stone-800">
            <Building2 className="w-3 h-3 text-amber-400 shrink-0" />
            <span className="truncate">
              {primaryWarehouse.stock <= 10 ? (
                <span className="text-amber-400 font-medium">
                  Only {primaryWarehouse.stock} units left in {primaryWarehouse.warehouse}
                </span>
              ) : (
                <span>
                  In Stock ({primaryWarehouse.warehouse}) · Ships in {primaryWarehouse.dispatchHours}h
                </span>
              )}
            </span>
          </div>
        </div>

        {/* Price & Action Section */}
        <div className="pt-2 border-t border-stone-800 flex items-center justify-between">
          <div>
            {product.compareAtPriceUSD && (
              <div className="text-[11px] text-stone-500 line-through">
                {formatLocalAmount(product.compareAtPriceUSD, currentCurrency)}
              </div>
            )}
            <div className="text-base sm:text-lg font-bold text-white">
              {formatLocalAmount(product.basePriceUSD, currentCurrency)}
            </div>
          </div>

          {/* Actions: Share & Add to Bag */}
          <div className="flex items-center gap-1.5">
            {onShare && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onShare(product);
                }}
                id={`share-btn-${product.id}`}
                className="p-2 rounded-xl bg-stone-800/80 hover:bg-stone-700 text-stone-300 hover:text-amber-400 border border-stone-700/60 transition-all cursor-pointer shadow-xs active:scale-95"
                title="Share link to social media"
                aria-label={`Share ${product.name}`}
              >
                <Share2 className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Add to Bag Button */}
            <button
              onClick={handleAdd}
              id={`add-to-cart-${product.id}`}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs ${
                addedAnim
                  ? 'bg-emerald-500 text-stone-950'
                  : 'bg-amber-500 hover:bg-amber-400 text-stone-950 active:scale-95'
              }`}
            >
              {addedAnim ? (
                <>
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Added</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Add</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
