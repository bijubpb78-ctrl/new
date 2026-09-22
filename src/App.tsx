/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  CurrencyCode, 
  Product, 
  CartItem
} from './types';
import { PILATES_PRODUCTS, STUDIO_BUNDLES } from './data/products';
import { detectDefaultCurrency, CURRENCY_CONFIGS, formatLocalAmount } from './utils/currency';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { FeaturesBar } from './components/FeaturesBar';
import { ProductCard } from './components/ProductCard';
import { ProductModal } from './components/ProductModal';
import { StudioBundles } from './components/StudioBundles';
import { AiReviewsSection } from './components/AiReviewsSection';
import { CartDrawer } from './components/CartDrawer';
import { CjTrackingModal } from './components/CjTrackingModal';
import { Footer } from './components/Footer';
import { InfoPolicyModal, PolicyTab } from './components/InfoPolicyModal';
import { AdminPortalModal } from './components/AdminPortalModal';
import { ShareProductModal } from './components/ShareProductModal';
import { PaymentBadges } from './components/PaymentBadges';
import { getStoredProducts, subscribeToProductChanges } from './utils/productStore';
import { 
  Filter, 
  Search, 
  ArrowUpDown, 
  ShieldCheck, 
  Truck, 
  Building2, 
  ExternalLink,
  CheckCircle2,
  Sparkles,
  Plane,
  Lock,
  X,
  Loader2,
  AlertCircle,
  RefreshCw
} from 'lucide-react';

export default function App() {
  // Region & Currency
  const [currency, setCurrency] = useState<CurrencyCode>(detectDefaultCurrency);

  // Managed Products state (synced with admin portal & localStorage)
  const [products, setProducts] = useState<Product[]>(() => getStoredProducts());

  useEffect(() => {
    const unsubscribe = subscribeToProductChanges((updated) => {
      setProducts(updated);
    });
    return unsubscribe;
  }, []);

  // Cart state
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('fetecart_cart');
        if (saved) return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to load cart from storage', e);
      }
    }
    // Default initial cart: start clean
    return [];
  });

  // Filter & Search states
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'rating'>('featured');

  // Modal states
  const [activeProductModal, setActiveProductModal] = useState<Product | null>(null);
  const [shareModalProduct, setShareModalProduct] = useState<Product | null>(null);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [isRedirectingToStripe, setIsRedirectingToStripe] = useState(false);
  const [stripeCheckoutUrl, setStripeCheckoutUrl] = useState<string | null>(null);
  const [stripeCheckoutLoading, setStripeCheckoutLoading] = useState(false);
  const [checkoutItems, setCheckoutItems] = useState<CartItem[]>([]);
  const [trackingModalOpen, setTrackingModalOpen] = useState(false);
  const [initialTrackingCode, setInitialTrackingCode] = useState('FTC89421034US');
  const [policyModalOpen, setPolicyModalOpen] = useState(false);
  const [policyModalTab, setPolicyModalTab] = useState<PolicyTab>('about');
  const [adminPortalOpen, setAdminPortalOpen] = useState(false);
  const [stripeCheckoutError, setStripeCheckoutError] = useState<string | null>(null);
  const [checkoutMode, setCheckoutMode] = useState<'unavailable' | 'test' | 'live'>('unavailable');

  useEffect(() => {
    localStorage.removeItem('fetecart_stripe_secret_key');
    fetch('/api/stripe/status')
      .then((res) => res.ok ? res.json() : { mode: 'unavailable' })
      .then((data) => setCheckoutMode(data.mode === 'test' || data.mode === 'live' ? data.mode : 'unavailable'))
      .catch(() => setCheckoutMode('unavailable'));
  }, []);

  // Deep-link detection on initial page load and history navigation
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check for Stripe Hosted Checkout Return Redirect
    const urlParams = new URLSearchParams(window.location.search);
    const stripeSessionId = urlParams.get('stripe_session_id') || urlParams.get('session_id');

    if (stripeSessionId) {
      const orderId = urlParams.get('order_id') || '';
      const cleanUrl = window.location.pathname + window.location.hash;
      window.history.replaceState(null, '', cleanUrl);

      fetch('/api/stripe/confirm-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: stripeSessionId,
          orderDetails: {
            orderId: orderId || undefined,
          },
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.order) {
            setCartItems([]);
            localStorage.removeItem('fetecart_cart');
            setToastMessage(
              data.mode === 'test'
                ? `Test payment completed. No money was charged. Order ${data.order.orderId}.`
                : `Stripe payment verified. Order ${data.order.orderId} is confirmed.`
            );
            if (data.order.trackingNumber) {
              setInitialTrackingCode(data.order.trackingNumber);
              setTrackingModalOpen(true);
            }
          } else {
            setToastMessage(data.error || 'Unable to confirm Stripe payment status');
          }
        })
        .catch((err) => {
          console.error('[Stripe] Return verification error:', err);
        });
    } else if (urlParams.has('stripe_cancel')) {
      const cleanUrl = window.location.pathname + window.location.hash;
      window.history.replaceState(null, '', cleanUrl);
      setToastMessage('Stripe checkout was cancelled. No money was deducted.');
    }

    const parseDeepLink = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const targetParam = urlParams.get('product') || urlParams.get('p');
      const hash = window.location.hash;

      let lookupKey = targetParam;
      if (!lookupKey && hash.startsWith('#product-')) {
        lookupKey = hash.replace('#product-', '');
      } else if (!lookupKey && hash.startsWith('#') && hash.length > 1) {
        lookupKey = hash.replace('#', '');
      }

      if (lookupKey) {
        const found = products.find(p => 
          p.id === lookupKey || 
          p.slug === lookupKey || 
          p.sku?.toLowerCase() === lookupKey.toLowerCase()
        );
        if (found) {
          setActiveProductModal(found);
        }
      }
    };

    parseDeepLink();
    window.addEventListener('popstate', parseDeepLink);
    window.addEventListener('hashchange', parseDeepLink);
    return () => {
      window.removeEventListener('popstate', parseDeepLink);
      window.removeEventListener('hashchange', parseDeepLink);
    };
  }, [products]);

  // Keep browser URL, document title & SEO meta synced with active product modal
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const baseTitle = 'Fetecart - Studio Pilates Equipment & Apparatus';
    const baseDesc = 'Shop studio-grade Pilates equipment and apparatus at Fetecart: foldable reformers, sitting boxes, balance dome trainers, spine correctors, mats and resistance gear with global express shipping.';

    if (activeProductModal) {
      const currentParam = new URLSearchParams(window.location.search).get('product');
      const targetSlug = activeProductModal.slug || activeProductModal.id;
      if (currentParam !== targetSlug) {
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.set('product', targetSlug);
        window.history.replaceState(null, '', newUrl.toString());
      }

      // Dynamic SEO Title & Meta Description
      document.title = `${activeProductModal.name} | Fetecart`;
      const descMeta = document.querySelector('meta[name="description"]');
      if (descMeta) {
        descMeta.setAttribute('content', `${activeProductModal.name} - ${activeProductModal.subtitle}. Buy online at Fetecart with fast tracked worldwide delivery.`);
      }
      const ogTitleMeta = document.querySelector('meta[property="og:title"]');
      if (ogTitleMeta) {
        ogTitleMeta.setAttribute('content', `${activeProductModal.name} | Fetecart`);
      }
    } else {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.has('product') || urlParams.has('p')) {
        urlParams.delete('product');
        urlParams.delete('p');
        const remainingQuery = urlParams.toString();
        const cleanUrl = window.location.pathname + (remainingQuery ? `?${remainingQuery}` : '') + window.location.hash;
        window.history.replaceState(null, '', cleanUrl);
      }

      // Restore base SEO Title & Description
      document.title = baseTitle;
      const descMeta = document.querySelector('meta[name="description"]');
      if (descMeta) {
        descMeta.setAttribute('content', baseDesc);
      }
      const ogTitleMeta = document.querySelector('meta[property="og:title"]');
      if (ogTitleMeta) {
        ogTitleMeta.setAttribute('content', baseTitle);
      }
    }
  }, [activeProductModal]);

  const handleOpenPolicy = (tab: PolicyTab) => {
    setPolicyModalTab(tab);
    setPolicyModalOpen(true);
  };

  // Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync currency to localStorage
  const handleCurrencyChange = (newCurrency: CurrencyCode) => {
    setCurrency(newCurrency);
    if (typeof window !== 'undefined') {
      localStorage.setItem('fetecart_currency', newCurrency);
    }
  };

  // Sync cart to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('fetecart_cart', JSON.stringify(cartItems));
    }
  }, [cartItems]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Cart operations
  const handleAddToCart = (product: Product, quantity = 1) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { product, quantity }];
    });
    showToast(`Added ${product.name} to cart`);
  };

  const handleUpdateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveItem(productId);
      return;
    }
    setCartItems(prev =>
      prev.map(item =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const handleRemoveItem = (productId: string) => {
    setCartItems(prev => prev.filter(item => item.product.id !== productId));
  };

  const handleProceedToStripe = async (itemsToPay?: CartItem[]) => {
    if (checkoutMode === 'unavailable') {
      showToast('Checkout is not configured yet. No payment can be taken.');
      return;
    }
    const targetItems = itemsToPay && itemsToPay.length > 0 ? itemsToPay : cartItems;
    if (targetItems.length === 0) {
      showToast('Your shopping bag is empty.');
      return;
    }

    setCartDrawerOpen(false);
    setActiveProductModal(null);
    setCheckoutItems(targetItems);
    setIsRedirectingToStripe(true);
    setStripeCheckoutLoading(true);
    setStripeCheckoutUrl(null);
    setStripeCheckoutError(null);

    // If running in an iframe, attempt to pre-open a new window during user click gesture to avoid browser popup blockers
    const isInsideIframe = typeof window !== 'undefined' && window.self !== window.top;
    let preOpenedTab: Window | null = null;
    if (isInsideIframe) {
      try {
        preOpenedTab = window.open('about:blank', '_blank');
      } catch {
        preOpenedTab = null;
      }
    }

    try {
      const orderId = `FTC-${Math.floor(10000 + Math.random() * 90000)}`;
      const currentRate = CURRENCY_CONFIGS[currency]?.rate || 1;
      const cleanOrigin =
        typeof window !== 'undefined' && window.location.origin && window.location.origin.startsWith('http')
          ? window.location.origin
          : 'https://www.fetecart.com';

      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: targetItems.map(item => ({
            productName: item.product.name,
            price: Math.round(item.product.basePriceUSD * currentRate * 100) / 100,
            quantity: item.quantity,
            sku: item.product.sku,
            product: {
              name: item.product.name,
              basePriceUSD: Math.round(item.product.basePriceUSD * currentRate * 100) / 100,
              images: item.product.images?.filter((img: string) => typeof img === 'string' && img.startsWith('http')),
              sku: item.product.sku,
            },
          })),
          currency: currency.toLowerCase(),
          orderId,
          successUrl: `${cleanOrigin}/?stripe_session_id={CHECKOUT_SESSION_ID}&order_id=${orderId}&payment_status=success`,
          cancelUrl: `${cleanOrigin}/?stripe_cancel=true`,
        }),
      });

      let data: any = null;
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        throw new Error(`Server returned status ${response.status}: ${text.slice(0, 120)}`);
      }

      if (data && data.success && data.url) {
        setStripeCheckoutUrl(data.url);
        setStripeCheckoutLoading(false);
        setStripeCheckoutError(null);

        // If a popup tab was successfully pre-opened, navigate it directly
        if (preOpenedTab && !preOpenedTab.closed) {
          try {
            preOpenedTab.location.href = data.url;
          } catch {
            // tab navigation fallback handled by UI button
          }
        } else if (!isInsideIframe) {
          // Outside iframe: navigate directly
          window.location.href = data.url;
        } else {
          // Inside iframe: try window.open
          try {
            window.open(data.url, '_blank', 'noopener,noreferrer');
          } catch {
            // UI button handles manual click
          }
        }
      } else {
        if (preOpenedTab && !preOpenedTab.closed) {
          preOpenedTab.close();
        }
        setStripeCheckoutLoading(false);
        const errMsg = data?.error || 'Unable to open Stripe Checkout.';
        setStripeCheckoutError(errMsg);
      }
    } catch (err: any) {
      console.error('[Stripe Redirect Error]:', err);
      if (preOpenedTab && !preOpenedTab.closed) {
        preOpenedTab.close();
      }
      setStripeCheckoutLoading(false);
      setStripeCheckoutError(err.message || 'Network error connecting to Stripe.');
    }
  };

  const handleBuyNow = (product: Product, quantity = 1) => {
    handleAddToCart(product, quantity);
    const existing = cartItems.find(i => i.product.id === product.id);
    const updatedItems: CartItem[] = existing
      ? cartItems.map(i => (i.product.id === product.id ? { ...i, quantity: i.quantity + quantity } : i))
      : [...cartItems, { product, quantity }];
    handleProceedToStripe(updatedItems);
  };

  const handleAddBundle = (bundleId: string) => {
    const bundle = STUDIO_BUNDLES.find(b => b.id === bundleId);
    if (!bundle) return;

    if (products.length > 0) {
      handleAddToCart(products[0], 1);
    }

    setCartDrawerOpen(true);
    showToast(`Added ${bundle.title} to your bag with bundle savings!`);
  };

  // Filtered and sorted products
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      if (selectedCategory !== 'all' && product.category !== selectedCategory) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = product.name.toLowerCase().includes(q);
        const matchesSubtitle = product.subtitle.toLowerCase().includes(q);
        const matchesCat = product.category.toLowerCase().includes(q);
        const matchesSku = product.sku ? product.sku.toLowerCase().includes(q) : false;
        const matchesTags = product.tags ? product.tags.some(t => t.toLowerCase().includes(q) || q.includes(t.toLowerCase())) : false;
        const words = q.split(/\s+/).filter(Boolean);
        const matchesWords = words.length > 1 && words.every(word =>
          product.name.toLowerCase().includes(word) ||
          product.subtitle.toLowerCase().includes(word) ||
          product.category.toLowerCase().includes(word) ||
          (product.tags && product.tags.some(t => t.toLowerCase().includes(word)))
        );
        if (!matchesName && !matchesSubtitle && !matchesCat && !matchesSku && !matchesTags && !matchesWords) {
          return false;
        }
      }
      return true;
    }).sort((a, b) => {
      if (sortBy === 'price-asc') return a.basePriceUSD - b.basePriceUSD;
      if (sortBy === 'price-desc') return b.basePriceUSD - a.basePriceUSD;
      if (sortBy === 'rating') return b.rating - a.rating;
      return 0; // featured
    });
  }, [products, selectedCategory, searchQuery, sortBy]);

  // Dynamic count of products per category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: products.length };
    products.forEach((p) => {
      counts[p.category] = (counts[p.category] || 0) + 1;
    });
    return counts;
  }, [products]);

  const totalCartCount = cartItems.reduce((acc, i) => acc + i.quantity, 0);
  const cartSubtotalUSD = cartItems.reduce((acc, i) => acc + i.product.basePriceUSD * i.quantity, 0);

  return (
    <div className="min-h-screen bg-[#0c0c0b] text-stone-100 flex flex-col selection:bg-amber-500/30 selection:text-amber-200">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-[#181816] text-white text-xs sm:text-sm font-medium px-4 py-3 rounded-xl shadow-2xl border border-stone-700 flex items-center gap-2 animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Navbar with localized currency & tracking trigger */}
      <Navbar
        currentCurrency={currency}
        onSelectCurrency={handleCurrencyChange}
        cartCount={totalCartCount}
        onOpenCart={() => setCartDrawerOpen(true)}
        onOpenTracking={() => setTrackingModalOpen(true)}
        onSelectCategory={setSelectedCategory}
        selectedCategory={selectedCategory}
        cartSubtotalUSD={cartSubtotalUSD}
        onSearch={setSearchQuery}
        onOpenPolicy={handleOpenPolicy}
      />

      <main className="flex-1">
        {/* High Converting Landing Hero */}
        <Hero
          currentCurrency={currency}
          featuredProduct={products[0] || PILATES_PRODUCTS[0]}
          onExploreCatalog={() => {
            const el = document.getElementById('studio-catalog-section');
            el?.scrollIntoView({ behavior: 'smooth' });
          }}
          onOpenShippingCalculator={() => {
            setActiveProductModal(products[0] || PILATES_PRODUCTS[0]);
          }}
          onOpenTracking={() => setTrackingModalOpen(true)}
        />

        {/* Trust & Features Banner */}
        <FeaturesBar currentCurrency={currency} />

        {/* Product Catalog Section */}
        <section id="studio-catalog-section" className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          
          {/* Section Header & Filters */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-stone-800 pb-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-400">
                <span>Direct Sourcing Catalog</span>
                <span className="text-stone-600">•</span>
                <span className="text-emerald-400 font-mono">Precision Calibrated</span>
              </div>
              <h2 className="font-serif text-3xl sm:text-4xl font-normal text-white">
                Studio Apparatus & Props
              </h2>
              <p className="text-xs sm:text-sm text-stone-400">
                Factory-direct pricing in <strong className="text-stone-200">{CURRENCY_CONFIGS[currency].name} ({CURRENCY_CONFIGS[currency].symbol})</strong> with automated shipping to US, UK, EU & AUS.
              </p>
            </div>

            {/* Filter Controls */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
                {[
                  { label: 'All Apparatus', value: 'all' },
                  { label: 'Reformers & Boxes', value: 'Reformers & Towers' },
                  { label: 'Studio Chairs', value: 'Studio Chairs' },
                  { label: 'Props & Resistance', value: 'Props & Resistance' },
                  { label: 'Barrels & Arcs', value: 'Barrels & Arcs' },
                  { label: 'Cardio & Apparatus', value: 'Cardio & Apparatus' },
                  { label: 'Mats & Flooring', value: 'Mats & Platforms' },
                  { label: 'Grip & Studio Wear', value: 'Grip & Studio Wear' },
                ].map((tab) => {
                  const count = categoryCounts[tab.value] ?? 0;
                  return (
                    <button
                      key={tab.value}
                      onClick={() => {
                        setSelectedCategory(tab.value);
                      }}
                      className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer shrink-0 flex items-center gap-1.5 ${
                        selectedCategory === tab.value
                          ? 'bg-amber-500 text-stone-950 font-bold shadow-xs'
                          : 'bg-[#181816] border border-stone-800 text-stone-300 hover:bg-stone-800/80 hover:text-white'
                      }`}
                    >
                      <span>{tab.label}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-semibold ${
                          selectedCategory === tab.value
                            ? 'bg-stone-950/25 text-stone-950'
                            : 'bg-stone-800 text-stone-400'
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Sort By Dropdown */}
              <div className="flex items-center gap-1.5 pl-2 border-l border-stone-800">
                <ArrowUpDown className="w-3.5 h-3.5 text-stone-400" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-[#181816] border border-stone-800 rounded-lg py-1.5 px-2 text-xs text-stone-200 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
                >
                  <option value="featured">Featured</option>
                  <option value="rating">Top Rated</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                </select>
              </div>
            </div>
          </div>

          {/* Quick Find Tags for Trending Items */}
          <div className="flex items-center gap-2 flex-wrap text-xs text-stone-300 bg-[#141413] p-3 rounded-xl border border-stone-800">
            <span className="font-semibold text-amber-400 text-[11px] uppercase tracking-wider shrink-0">
              Quick Filter:
            </span>
            {[
              { label: 'All Items', query: '' },
              { label: 'Wunda Chair', query: 'wunda' },
              { label: 'Mini Stepper', query: 'stepper' },
              { label: 'Reformers', query: 'reformer' },
              { label: 'Balance Dome', query: 'balance' },
              { label: 'Sitting Boxes', query: 'box' },
              { label: 'Burgundy Box', query: 'burgundy' },
              { label: 'Muscle Roller', query: 'clamp' },
              { label: 'Ab Wheel', query: 'wheel' },
              { label: 'Pilates Ball', query: 'ball' },
              { label: 'Reformer Towel', query: 'towel' },
              { label: 'Spine Arc', query: 'spine' },
              { label: 'Jump Rope', query: 'rope' },
              { label: 'Ankle Straps', query: 'ankle' },
              { label: '15mm Mat', query: 'mat' },
              { label: 'Pilates Bar', query: 'pilates bar' },
              { label: 'Figure 8 Band', query: 'figure 8' },
              { label: 'Resistance Bands', query: 'bands' },
              { label: 'Pedal Puller', query: 'pedal puller' },
              { label: 'Grip Socks', query: 'socks' },
            ].map((chip) => {
              const isActive = (chip.query === '' && !searchQuery) || (chip.query !== '' && searchQuery.toLowerCase() === chip.query);
              return (
                <button
                  key={`${chip.label}-${chip.query}`}
                  onClick={() => {
                    if (chip.query === '') {
                      setSelectedCategory('all');
                      setSearchQuery('');
                    } else if (isActive) {
                      setSearchQuery('');
                    } else {
                      setSelectedCategory('all');
                      setSearchQuery(chip.query);
                    }
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs transition-all cursor-pointer ${
                    isActive
                      ? 'bg-amber-500 text-stone-950 font-bold shadow-xs'
                      : 'bg-[#1c1c1a] border border-stone-800 hover:border-amber-500/40 text-stone-300'
                  }`}
                >
                  {chip.label}
                </button>
              );
            })}
          </div>

          {/* Active Search Query Notice */}
          {searchQuery && (
            <div className="p-3 bg-[#181816] border border-amber-500/30 rounded-xl text-xs flex items-center justify-between text-amber-300">
              <span>Showing results matching "<strong>{searchQuery}</strong>"</span>
              <button
                onClick={() => setSearchQuery('')}
                className="text-stone-400 hover:text-white flex items-center gap-1 font-medium cursor-pointer"
              >
                <span>Clear search</span>
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Product Grid */}
          {filteredProducts.length === 0 ? (
            <div className="py-20 text-center space-y-3">
              <p className="font-serif text-xl text-stone-200">No apparatus found matching your criteria.</p>
              <p className="text-xs text-stone-500">Try selecting 'All Apparatus' or clearing your search query.</p>
              <button
                onClick={() => {
                  setSelectedCategory('all');
                  setSearchQuery('');
                }}
                className="px-4 py-2 bg-amber-500 text-stone-950 text-xs rounded-xl font-bold hover:bg-amber-400 transition-colors"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  currentCurrency={currency}
                  onQuickView={(p) => setActiveProductModal(p)}
                  onAddToCart={(p) => handleAddToCart(p, 1)}
                  onShare={(p) => setShareModalProduct(p)}
                />
              ))}
            </div>
          )}

        </section>

        {/* Curated Studio Bundles */}
        <StudioBundles
          currentCurrency={currency}
          onAddBundle={handleAddBundle}
          onExploreProduct={(slug) => {
            const prod = PILATES_PRODUCTS.find(p => p.slug === slug);
            if (prod) setActiveProductModal(prod);
          }}
        />

        {/* Direct Atelier Craftsmanship & Supply Chain Section */}
        <section className="py-16 bg-[#090908] border-t border-b border-[#211f1c]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-[#141413] text-white rounded-3xl p-8 sm:p-12 relative overflow-hidden shadow-2xl border border-stone-800/90">
              
              {/* Subtle map / logistics background visual */}
              <div className="absolute right-0 top-0 bottom-0 w-1/2 opacity-5 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

              <div className="max-w-3xl space-y-6 relative z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 text-xs font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Verified Direct-from-Maker Supply Chain</span>
                </div>

                <h2 className="font-serif text-3xl sm:text-5xl font-normal text-white leading-tight">
                  How Fetecart Cuts Studio Equipment Costs by 50%
                </h2>

                <p className="text-sm sm:text-base text-stone-300 font-light leading-relaxed">
                  Traditional Pilates apparatus brands pass multi-tiered regional distributor markups, luxury showroom leases, and domestic warehousing overhead directly onto studios and home practitioners.
                </p>

                {/* Sourcing Steps Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
                  <div className="p-4 bg-[#181816] rounded-xl border border-stone-800 space-y-2">
                    <div className="w-7 h-7 rounded-lg bg-amber-500 text-stone-950 font-bold text-xs flex items-center justify-center">
                      01
                    </div>
                    <h4 className="font-semibold text-xs sm:text-sm text-stone-100">
                      Tier-1 Master Craftsmen
                    </h4>
                    <p className="text-xs text-stone-400 leading-relaxed">
                      Direct production from ISO-certified commercial Pilates apparatus master craftsmen.
                    </p>
                  </div>

                  <div className="p-4 bg-[#181816] rounded-xl border border-stone-800 space-y-2">
                    <div className="w-7 h-7 rounded-lg bg-emerald-500 text-stone-950 font-bold text-xs flex items-center justify-center">
                      02
                    </div>
                    <h4 className="font-semibold text-xs sm:text-sm text-stone-100">
                      Automated Air Logistics
                    </h4>
                    <p className="text-xs text-stone-400 leading-relaxed">
                      Real-time regional warehouse inventory allocation with priority express air dispatch.
                    </p>
                  </div>

                  <div className="p-4 bg-[#181816] rounded-xl border border-stone-800 space-y-2">
                    <div className="w-7 h-7 rounded-lg bg-amber-400 text-stone-950 font-bold text-xs flex items-center justify-center">
                      03
                    </div>
                    <h4 className="font-semibold text-xs sm:text-sm text-stone-100">
                      DDP Guaranteed
                    </h4>
                    <p className="text-xs text-stone-400 leading-relaxed">
                      Delivered Duty Paid. All import taxes & customs handled upfront for US, UK, EU, and Australia.
                    </p>
                  </div>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <button
                    onClick={() => setTrackingModalOpen(true)}
                    className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-xl font-bold text-xs transition-colors flex items-center gap-2 cursor-pointer shadow-md"
                  >
                    <Truck className="w-4 h-4 text-stone-950" />
                    <span>View Real-Time Order Tracking Pipeline</span>
                  </button>
                  
                  <span className="text-xs text-stone-400 flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-amber-400" />
                    <span>Global Distribution Hubs in California, Frankfurt, and Sydney</span>
                  </span>
                </div>

              </div>

            </div>
          </div>
        </section>

        {/* Dynamic AI Reviews Section */}
        <AiReviewsSection currentCurrency={currency} />

      </main>

      {/* SEO-rich Footer */}
      <Footer
        currentCurrency={currency}
        onSelectCurrency={handleCurrencyChange}
        onOpenTracking={() => setTrackingModalOpen(true)}
        onSelectCategory={(cat) => {
          setSelectedCategory(cat);
          const el = document.getElementById('studio-catalog-section');
          el?.scrollIntoView({ behavior: 'smooth' });
        }}
        onOpenPolicy={handleOpenPolicy}
        onOpenAdmin={() => setAdminPortalOpen(true)}
      />

      {/* Discreet low-visibility downside corner trigger for Store Owner */}
      <button
        onClick={() => setAdminPortalOpen(true)}
        className="fixed bottom-2 right-2 z-40 p-1.5 rounded-full bg-stone-900/30 hover:bg-stone-900 text-stone-600 hover:text-stone-300 opacity-20 hover:opacity-100 transition-all cursor-pointer border border-transparent hover:border-stone-800"
        title="Atelier Management Portal"
        aria-label="Atelier Staff Portal"
      >
        <Lock className="w-3 h-3" />
      </button>

      {/* Product Detail Page Modal */}
      {activeProductModal && (
        <ProductModal
          product={activeProductModal}
          currentCurrency={currency}
          isOpen={true}
          onClose={() => setActiveProductModal(null)}
          onAddToCart={(p, qty) => {
            handleAddToCart(p, qty);
            setActiveProductModal(null);
            setCartDrawerOpen(true);
          }}
          onBuyNow={handleBuyNow}
        />
      )}

      {/* Cart Slide-Over Drawer */}
      <CartDrawer
        isOpen={cartDrawerOpen}
        onClose={() => setCartDrawerOpen(false)}
        items={cartItems}
        currentCurrency={currency}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onProceedToCheckout={() => handleProceedToStripe()}
        checkoutMode={checkoutMode}
      />

      {/* Stripe Hosted Checkout Modal */}
      {isRedirectingToStripe && (() => {
        const modalCheckoutItems = checkoutItems.length > 0 ? checkoutItems : cartItems;
        const totalAmount = modalCheckoutItems.reduce((sum, item) => sum + item.product.basePriceUSD * item.quantity, 0);

        return (
          <div className="fixed inset-0 z-70 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in overflow-y-auto">
            <div className="w-full max-w-lg bg-[#161614] border border-stone-800 rounded-2xl p-4 sm:p-5 text-center space-y-3 shadow-2xl relative my-auto">
              <button
                onClick={() => {
                  setIsRedirectingToStripe(false);
                  setStripeCheckoutUrl(null);
                  setStripeCheckoutLoading(false);
                }}
                className="absolute top-3.5 right-3.5 text-stone-400 hover:text-stone-200 p-1.5 rounded-lg hover:bg-stone-800/80 transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Security Header */}
              <div className="flex items-center justify-center gap-2 text-[11px] text-stone-400 font-mono">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <Lock className="w-3.5 h-3.5 text-emerald-400" />
                <span>Official Stripe 256-Bit Encrypted Gateway</span>
              </div>

              {/* Product & Price Section */}
              <div className="bg-[#10100f] border border-stone-800/90 rounded-xl p-3 sm:p-3.5 text-left space-y-2 shadow-inner">
                <div className="flex items-center justify-between text-[11px] font-mono text-stone-400 border-b border-stone-800/80 pb-1.5">
                  <span className="uppercase tracking-wider">Order Summary</span>
                  <span>{modalCheckoutItems.reduce((acc, i) => acc + i.quantity, 0)} Items</span>
                </div>

                {/* Product List - fully visible with generous max height */}
                <div className="space-y-2 max-h-52 sm:max-h-60 overflow-y-auto pr-1">
                  {modalCheckoutItems.map((item) => (
                    <div key={item.product.id} className="flex items-center gap-3 p-1.5 rounded-lg bg-stone-900/40 border border-stone-800/50">
                      <img
                        src={item.product.images[0]}
                        alt={item.product.name}
                        className="w-12 h-12 rounded-md object-cover bg-stone-900 border border-stone-800 shrink-0 brightness-95"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-semibold text-white truncate font-serif">
                          {item.product.name}
                        </h4>
                        <p className="text-[10px] text-stone-400 font-mono">
                          Qty: {item.quantity} · SKU: {item.product.sku}
                        </p>
                      </div>
                      <div className="text-xs font-bold text-amber-400 shrink-0 text-right">
                        {formatLocalAmount(item.product.basePriceUSD * item.quantity, currency)}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Price Total */}
                <div className="border-t border-stone-800/80 pt-2 flex items-baseline justify-between">
                  <div>
                    <span className="text-xs text-stone-400">Total Price Due ({currency}):</span>
                    <div className="text-[10px] text-emerald-400 flex items-center gap-1 font-mono">
                      <Truck className="w-3 h-3" />
                      <span>Free Tracked Air Freight & Customs Included</span>
                    </div>
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-white tracking-tight">
                    {formatLocalAmount(totalAmount, currency)}
                  </div>
                </div>
              </div>

              {/* DIRECTLY UNDER PRODUCT AND PRICE: PAYMENT LOGOS BANNER (GPAY, APPLE PAY, AMAZON PAY, ETC.) */}
              <PaymentBadges />

              {/* Status / CTA Actions */}
              {stripeCheckoutLoading ? (
                <div className="p-3.5 bg-stone-900/60 rounded-xl border border-stone-800/80 flex items-center justify-center gap-2.5 text-stone-300 text-xs">
                  <Loader2 className="w-4 h-4 animate-spin text-amber-400 shrink-0" />
                  <span>Preparing your official 256-bit Stripe checkout session...</span>
                </div>
              ) : stripeCheckoutError ? (
                <div className="p-3.5 bg-stone-900/60 rounded-xl border border-stone-800 text-center space-y-2.5">
                  <div className="flex items-center justify-center gap-2 text-stone-300 text-xs">
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>{stripeCheckoutError}</span>
                  </div>
                  <div className="flex items-center justify-center gap-2 pt-1">
                    <button
                      onClick={() => handleProceedToStripe(modalCheckoutItems)}
                      className="py-2 px-4 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Retry Checkout</span>
                    </button>
                    <button
                      onClick={() => {
                        setIsRedirectingToStripe(false);
                        setStripeCheckoutError(null);
                      }}
                      className="py-2 px-3 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-medium cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : stripeCheckoutUrl ? (
                <div className="space-y-2 pt-1">
                  <a
                    href={stripeCheckoutUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3.5 px-6 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-xl active:scale-98 cursor-pointer no-underline group"
                  >
                    <span>Proceed to Stripe Payment</span>
                    <ExternalLink className="w-4 h-4 text-stone-950 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </a>

                  <button
                    onClick={() => {
                      setIsRedirectingToStripe(false);
                      setStripeCheckoutUrl(null);
                    }}
                    className="w-full py-2 px-4 rounded-xl bg-stone-900/80 hover:bg-stone-800 text-stone-400 hover:text-stone-200 text-xs font-medium transition-colors border border-stone-800 cursor-pointer"
                  >
                    Return to Shopping Bag
                  </button>
                </div>
              ) : null}

              <div className="text-[10px] text-stone-500 flex items-center justify-center gap-1.5 pt-0.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>PCI-DSS SAQ A Certified · Zero Fraud Liability Guarantee</span>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Live Tracking Modal */}
      <CjTrackingModal
        isOpen={trackingModalOpen}
        onClose={() => setTrackingModalOpen(false)}
        initialTracking={initialTrackingCode}
      />

      {/* Corporate Information, Policies & Social Sharing Modal */}
      <InfoPolicyModal
        isOpen={policyModalOpen}
        activeTab={policyModalTab}
        onClose={() => setPolicyModalOpen(false)}
        onTabChange={setPolicyModalTab}
        currentCurrency={currency}
      />

      {/* Password-Gated Admin Management Portal (Products, Stock, Add/Delete, CJ & Domain) */}
      <AdminPortalModal
        isOpen={adminPortalOpen}
        onClose={() => setAdminPortalOpen(false)}
        onProductsUpdated={(updated) => setProducts(updated)}
      />

      {/* Social Media Share Product Modal */}
      <ShareProductModal
        product={shareModalProduct}
        isOpen={Boolean(shareModalProduct)}
        onClose={() => setShareModalProduct(null)}
        currentCurrency={currency}
      />
    </div>
  );
}
