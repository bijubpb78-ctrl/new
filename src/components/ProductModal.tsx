import React, { useState, useEffect } from 'react';
import { 
  X, 
  Star, 
  Truck, 
  ShieldCheck, 
  Building2, 
  Package, 
  Check, 
  ShoppingBag, 
  Sparkles, 
  HelpCircle, 
  ExternalLink,
  ChevronRight,
  Send,
  Loader2,
  Calendar,
  CheckCircle2,
  Info,
  Share2,
  Copy,
  Smartphone,
  Headphones,
  Radio
} from 'lucide-react';
import { CurrencyCode, Product, Review } from '../types';
import { CURRENCY_CONFIGS, formatLocalAmount } from '../utils/currency';
import { calculateShippingOptions } from '../utils/cjShipping';
import { generateAiReviewInsight, getProductReviewAnalytics } from '../services/aiReviews';
import { PaymentBadges } from './PaymentBadges';

interface ProductModalProps {
  product: Product;
  currentCurrency: CurrencyCode;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number) => void;
  onBuyNow: (product: Product, quantity: number) => void;
}

export const ProductModal: React.FC<ProductModalProps> = ({
  product,
  currentCurrency,
  isOpen,
  onClose,
  onAddToCart,
  onBuyNow,
}) => {
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'overview' | 'shipping' | 'ai_reviews' | 'specs'>('overview');
  
  // Shipping calculator state
  const [calcCountry, setCalcCountry] = useState<CurrencyCode>(currentCurrency);
  const [calcPostalCode, setCalcPostalCode] = useState('90210');
  
  // AI Reviews state
  const [selectedPersona, setSelectedPersona] = useState<string>('Studio Owner');
  const [aiCustomQuestion, setAiCustomQuestion] = useState('');
  const [aiInsightText, setAiInsightText] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isAiGenerated, setIsAiGenerated] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const currencyConfig = CURRENCY_CONFIGS[currentCurrency];
  const analytics = getProductReviewAnalytics(product);

  const baseUrl = typeof window !== 'undefined' && window.location.hostname.includes('fetecart.com')
    ? window.location.origin
    : 'https://www.fetecart.com';
  const productSlugOrId = product.slug || product.id;
  const productUrl = `${baseUrl}/?product=${encodeURIComponent(productSlugOrId)}`;
  const shareText = `Check out ${product.name} on Fetecart - Studio Pilates Equipment:`;

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(productUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `${product.name} | Fetecart Studio Pilates`,
          text: `${shareText} ${product.subtitle}`,
          url: productUrl,
        });
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          handleCopyLink();
        }
      }
    } else {
      handleCopyLink();
    }
  };

  useEffect(() => {
    setCalcCountry(currentCurrency);
  }, [currentCurrency]);

  // Load initial AI Review insight
  useEffect(() => {
    let isMounted = true;
    setIsAiLoading(true);
    generateAiReviewInsight(product, selectedPersona).then(res => {
      if (isMounted) {
        setAiInsightText(res.insight);
        setIsAiGenerated(res.isAiGenerated);
        setIsAiLoading(false);
      }
    });
    return () => { isMounted = false; };
  }, [product, selectedPersona]);

  if (!isOpen) return null;

  // Calculate live shipping options
  const shippingOptions = calculateShippingOptions(calcCountry, product.basePriceUSD * quantity, product.weightKg * quantity);

  const handleCustomQuestionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiCustomQuestion.trim()) return;
    setIsAiLoading(true);
    const res = await generateAiReviewInsight(product, selectedPersona, aiCustomQuestion);
    setAiInsightText(res.insight);
    setIsAiGenerated(res.isAiGenerated);
    setIsAiLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6 animate-in fade-in duration-200">
      
      {/* Modal Container */}
      <div 
        className="bg-[#121211] w-full max-w-5xl rounded-2xl shadow-2xl border border-stone-800 overflow-hidden relative max-h-[92vh] flex flex-col text-stone-200"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header Bar */}
        <div className="px-5 py-4 border-b border-stone-800 flex items-center justify-between bg-[#0c0c0b]">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-amber-400 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-800/60">
              SKU: {product.sku}
            </span>
            <span className="text-xs text-stone-700">|</span>
            <span className="text-xs text-stone-300 font-medium flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Verified Commercial Studio Standards
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-white hover:bg-stone-800 rounded-full transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="overflow-y-auto p-5 sm:p-7 space-y-6 flex-1">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left Column: Gallery */}
            <div className="lg:col-span-6 space-y-3">
              {/* Main Image */}
              <div className="relative aspect-4/3 rounded-xl overflow-hidden bg-[#181816] border border-stone-800">
                <img
                  src={product.images[selectedImage] || product.images[0]}
                  alt={product.name}
                  className="w-full h-full object-cover object-center brightness-95"
                />
                {product.badge && (
                  <div className="absolute top-3 left-3 bg-black/80 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold text-amber-400 border border-amber-500/30 shadow-md">
                    {product.badge}
                  </div>
                )}
              </div>

              {/* Thumbnails */}
              {product.images.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {product.images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImage(idx)}
                      className={`relative w-20 h-16 rounded-lg overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                        selectedImage === idx ? 'border-amber-500 shadow-md' : 'border-stone-800 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={img} alt={`Thumb ${idx}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}

              {/* Warehouse Inventory Stock Breakdown */}
              <div className="p-4 bg-[#181816] rounded-xl border border-stone-800 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-stone-200">
                  <span className="flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-amber-500" />
                    <span>Global Warehouse Stock Sync</span>
                  </span>
                  <span className="text-[11px] font-normal text-emerald-400 bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-800/60">
                    Live Stock
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  {product.warehouses.map((wh) => (
                    <div key={wh.warehouse} className="p-2 bg-[#141413] rounded-lg border border-stone-700/60">
                      <div className="text-[11px] text-stone-400 font-medium">{wh.warehouse}</div>
                      <div className="flex items-baseline justify-between mt-0.5">
                        <span className="font-bold text-white">{wh.stock} units</span>
                        <span className="text-[10px] text-stone-400">{wh.dispatchHours}h dispatch</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Right Column: Title, Pricing, Actions & Tabs */}
            <div className="lg:col-span-6 space-y-5">
              <div>
                <div className="flex items-center gap-2 text-xs text-stone-400 mb-1">
                  <span className="uppercase tracking-wider font-semibold text-amber-400">
                    {product.category}
                  </span>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span className="font-bold text-white">{product.rating}</span>
                    <span className="text-stone-400">({product.reviewCount} reviews)</span>
                  </div>
                </div>

                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-white">
                  {product.name}
                </h2>
                <p className="text-sm text-stone-400 mt-1">
                  {product.subtitle}
                </p>
              </div>

              {/* Price & Currency Display */}
              <div className="p-3.5 bg-[#181816] rounded-xl border border-stone-800 flex items-center justify-between">
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl sm:text-3xl font-extrabold text-amber-400">
                      {formatLocalAmount(product.basePriceUSD * quantity, currentCurrency)}
                    </span>
                    {product.compareAtPriceUSD && (
                      <span className="text-sm text-stone-500 line-through">
                        {formatLocalAmount(product.compareAtPriceUSD * quantity, currentCurrency)}
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-stone-400">
                    {currencyConfig.taxLabel} · Direct Atelier Workshop Sourcing
                  </div>
                </div>

                {/* Quantity Control */}
                <div className="flex items-center border border-stone-700 rounded-lg bg-[#141413] overflow-hidden shadow-xs">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-3 py-1.5 text-stone-300 hover:bg-stone-800 text-sm font-semibold transition-colors cursor-pointer"
                  >
                    -
                  </button>
                  <span className="px-3 py-1.5 text-xs font-bold text-white min-w-[28px] text-center">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="px-3 py-1.5 text-stone-300 hover:bg-stone-800 text-sm font-semibold transition-colors cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => onAddToCart(product, quantity)}
                  id="modal-add-to-cart-btn"
                  className="flex-1 py-3 px-5 rounded-xl bg-stone-800 hover:bg-stone-700 border border-stone-700 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-md active:scale-98 cursor-pointer"
                >
                  <ShoppingBag className="w-4 h-4 text-amber-400" />
                  <span>Add to Bag ({formatLocalAmount(product.basePriceUSD * quantity, currentCurrency)})</span>
                </button>

                <button
                  onClick={() => onBuyNow(product, quantity)}
                  id="modal-buy-now-btn"
                  className="py-3 px-6 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-sm font-bold transition-all shadow-lg active:scale-98 cursor-pointer"
                >
                  Buy Now with Stripe
                </button>
              </div>

              {/* Express Payment Wallets (GPay, Apple Pay, Amazon Pay) & Security Badges */}
              <PaymentBadges variant="checkout" />

              {/* Social Sharing Toolbar */}
              <div className="flex items-center justify-between gap-2 p-2.5 bg-[#181816] rounded-xl border border-stone-800 text-xs">
                <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider flex items-center gap-1">
                  <Share2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>Share Apparatus:</span>
                </span>

                <div className="flex items-center gap-1.5 flex-wrap">
                  {/* Pinterest Pin */}
                  <a
                    href={`https://pinterest.com/pin/create/button/?url=${encodeURIComponent(productUrl)}&media=${encodeURIComponent(product.images[0])}&description=${encodeURIComponent(`${product.name} - ${product.subtitle}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-md bg-red-600 hover:bg-red-700 text-white transition-transform hover:scale-105"
                    title="Pin to Pinterest Pilates Board"
                  >
                    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                      <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345-.09.375-.291 1.199-.334 1.357-.057.235-.19.285-.438.171-1.637-.762-2.66-3.155-2.66-5.078 0-4.135 3.004-7.935 8.668-7.935 4.55 0 8.087 3.243 8.087 7.576 0 4.521-2.85 8.16-6.807 8.16-1.329 0-2.579-.691-3.006-1.506l-.818 3.118c-.296 1.139-1.096 2.568-1.632 3.44C9.539 23.82 10.745 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"/>
                    </svg>
                  </a>

                  {/* Facebook Share */}
                  <a
                    href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(productUrl)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-md bg-[#1877F2] hover:bg-[#166fe5] text-white transition-transform hover:scale-105"
                    title="Share on Facebook"
                  >
                    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </a>

                  {/* X Twitter */}
                  <a
                    href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(productUrl)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-md bg-stone-900 hover:bg-black text-white transition-transform hover:scale-105 border border-stone-700"
                    title="Share on X"
                  >
                    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                  </a>

                  {/* WhatsApp */}
                  <a
                    href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareText} ${productUrl}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-md bg-[#25D366] hover:bg-[#20ba59] text-white transition-transform hover:scale-105"
                    title="Share on WhatsApp"
                  >
                    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                    </svg>
                  </a>

                  {/* LinkedIn */}
                  <a
                    href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(productUrl)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-md bg-[#0A66C2] hover:bg-[#084e96] text-white transition-transform hover:scale-105"
                    title="Share on LinkedIn"
                  >
                    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                    </svg>
                  </a>

                  {/* Native Share on Phones */}
                  {typeof navigator !== 'undefined' && 'share' in navigator && (
                    <button
                      onClick={handleNativeShare}
                      className="p-1.5 rounded-md bg-amber-500 hover:bg-amber-400 text-stone-950 transition-transform hover:scale-105 cursor-pointer"
                      title="Share via device apps (Instagram, Messages)"
                    >
                      <Smartphone className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {/* Copy Link button */}
                  <button
                    onClick={handleCopyLink}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 text-xs font-medium cursor-pointer transition-colors"
                    title="Copy direct product link"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-stone-300" />}
                    <span>{copiedLink ? 'Copied!' : 'Copy Link'}</span>
                  </button>
                </div>
              </div>

              {/* Navigation Tabs for PDP Subsections */}
              <div className="border-b border-stone-800 flex gap-4 text-xs font-medium pt-2">
                {[
                  { id: 'overview', label: 'Overview & Features' },
                  { id: 'shipping', label: 'Automated Shipping Calculator' },
                  { id: 'ai_reviews', label: 'AI Review Insights' },
                  { id: 'specs', label: 'Specifications' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`pb-2.5 transition-colors cursor-pointer relative ${
                      activeTab === tab.id
                        ? 'text-amber-400 font-semibold border-b-2 border-amber-500'
                        : 'text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab 1: Overview */}
              {activeTab === 'overview' && (
                <div className="space-y-4 text-xs sm:text-sm text-stone-300 leading-relaxed animate-in fade-in">
                  <p>{product.description}</p>
                  
                  <div className="space-y-2 pt-1">
                    <h4 className="font-semibold text-white text-xs uppercase tracking-wider">
                      Key Highlights:
                    </h4>
                    <ul className="grid grid-cols-1 gap-1.5">
                      {product.features.map((feat, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-stone-300">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-3 bg-[#181816] rounded-xl border border-stone-800 text-xs space-y-1">
                    <div className="font-semibold text-white">What is inside the package:</div>
                    <ul className="list-disc list-inside text-stone-300 space-y-0.5">
                      {product.includedItems.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Tab 2: Automated Shipping Calculator */}
              {activeTab === 'shipping' && (
                <div className="space-y-4 animate-in fade-in">
                  <div className="p-3.5 bg-[#181816] rounded-xl border border-stone-800 space-y-3">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                      <div className="text-xs font-semibold text-white">
                        Automated Worldwide Shipping Calculator
                      </div>
                      <span className="text-[10px] text-emerald-400 bg-emerald-950/50 border border-emerald-800/60 px-2 py-0.5 rounded font-mono">
                        Weight: {product.weightKg * quantity} kg
                      </span>
                    </div>

                    {/* Destination Country & Postal Code Inputs */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] text-stone-400 font-medium mb-1">
                          Destination Country:
                        </label>
                        <select
                          value={calcCountry}
                          onChange={(e) => setCalcCountry(e.target.value as CurrencyCode)}
                          className="w-full p-2 text-xs bg-[#141413] border border-stone-700 text-white rounded-lg focus:ring-1 focus:ring-amber-500 focus:outline-none"
                        >
                          <option value="USD">🇺🇸 United States (USD)</option>
                          <option value="GBP">🇬🇧 United Kingdom (GBP)</option>
                          <option value="EUR">🇪🇺 European Union (EUR)</option>
                          <option value="AUD">🇦🇺 Australia (AUD)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] text-stone-400 font-medium mb-1">
                          Zip / Postal Code:
                        </label>
                        <input
                          type="text"
                          value={calcPostalCode}
                          onChange={(e) => setCalcPostalCode(e.target.value)}
                          placeholder="e.g. 90210 / SW1A 1AA"
                          className="w-full p-2 text-xs bg-[#141413] border border-stone-700 text-white rounded-lg focus:ring-1 focus:ring-amber-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Calculated Shipping Options */}
                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-stone-300">
                      Available Express Delivery Options:
                    </div>

                    {shippingOptions.map((opt) => (
                      <div 
                        key={opt.method.id}
                        className="p-3 bg-[#181816] rounded-xl border border-stone-800 hover:border-amber-500/50 transition-colors flex items-center justify-between text-xs shadow-md"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-white">{opt.method.name}</span>
                            {opt.isFree ? (
                              <span className="px-1.5 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-850 font-bold text-[10px]">
                                FREE
                              </span>
                            ) : null}
                          </div>
                          <div className="text-[11px] text-stone-400">
                            {opt.method.carrier} · Est. Delivery: <strong className="text-stone-300">{opt.estimatedDeliveryDate}</strong>
                          </div>
                          <div className="text-[10px] text-stone-500">
                            {opt.method.description}
                          </div>
                        </div>

                        <div className="text-right shrink-0 ml-3">
                          <div className="font-bold text-white text-sm">
                            {opt.isFree ? <span className="text-emerald-400">FREE</span> : formatLocalAmount(opt.costLocal, calcCountry)}
                          </div>
                          <div className="text-[10px] text-emerald-400 font-medium">
                            DDP Duty Paid
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="p-3 bg-amber-950/30 border border-amber-800/40 rounded-xl text-xs text-amber-300 flex items-start gap-2">
                    <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span>
                      Orders are fulfilled directly from regional studio fulfillment hubs with automated tracking generation within 24 hours.
                    </span>
                  </div>
                </div>
              )}

              {/* Tab 3: AI Review Insights */}
              {activeTab === 'ai_reviews' && (
                <div className="space-y-4 animate-in fade-in">
                  
                  {/* Persona Selector for Personalized AI Feedback */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-stone-300 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>Select Your Practitioner Profile for Tailored AI Feedback:</span>
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {['Studio Owner', 'Beginner', 'Home Practitioner', 'Physical Rehab'].map((p) => (
                        <button
                          key={p}
                          onClick={() => setSelectedPersona(p)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                            selectedPersona === p
                              ? 'bg-amber-500 text-stone-950 font-bold'
                              : 'bg-stone-800 hover:bg-stone-700 text-stone-300'
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* AI Generated Insight Box */}
                  <div className="p-4 bg-[#141413] text-stone-100 rounded-xl border border-stone-800 shadow-lg space-y-2.5 relative">
                    <div className="flex items-center justify-between text-xs text-stone-400 border-b border-stone-800 pb-2">
                      <span className="flex items-center gap-1.5 font-semibold text-amber-400">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>AI Review Intelligence ({selectedPersona} Perspective)</span>
                      </span>
                      <span className="text-[10px] text-stone-500">
                        Synthesized from {product.reviewCount} verified purchases
                      </span>
                    </div>

                    {isAiLoading ? (
                      <div className="py-6 flex items-center justify-center gap-2 text-stone-400 text-xs">
                        <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                        <span>Synthesizing dynamic customer feedback with AI...</span>
                      </div>
                    ) : (
                      <p className="text-xs sm:text-sm text-stone-200 leading-relaxed whitespace-pre-line">
                        {aiInsightText}
                      </p>
                    )}
                  </div>

                  {/* Ask AI Custom Question Input */}
                  <form onSubmit={handleCustomQuestionSubmit} className="flex gap-2">
                    <input
                      type="text"
                      value={aiCustomQuestion}
                      onChange={(e) => setAiCustomQuestion(e.target.value)}
                      placeholder="Ask AI: e.g. 'Is this spring tension safe for thoracic disc bulge?'"
                      className="flex-1 p-2.5 text-xs bg-[#141413] border border-stone-700 text-white rounded-xl focus:ring-1 focus:ring-amber-500 focus:outline-none"
                    />
                    <button
                      type="submit"
                      disabled={isAiLoading || !aiCustomQuestion.trim()}
                      className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-stone-950 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5 text-stone-950" />
                      <span>Ask AI</span>
                    </button>
                  </form>

                  {/* Verified Reviews Preview */}
                  <div className="space-y-3 pt-2">
                    <div className="text-xs font-bold text-white uppercase tracking-wider">
                      Recent Verified Customer Reviews:
                    </div>
                    {product.reviews.map((rev) => (
                      <div key={rev.id} className="p-3 bg-[#181816] rounded-xl border border-stone-800 text-xs space-y-1.5">
                        <div className="flex items-center justify-between">
                          <div className="font-semibold text-white flex items-center gap-1.5">
                            <span>{rev.author}</span>
                            <span className="text-[10px] font-normal text-emerald-400 bg-emerald-950/50 px-1.5 py-0.2 rounded border border-emerald-800/60">
                              Verified Buyer ({rev.countryCode})
                            </span>
                          </div>
                          <div className="flex items-center text-amber-400">
                            {[...Array(rev.rating)].map((_, idx) => (
                              <Star key={idx} className="w-3 h-3 fill-amber-400 text-amber-400" />
                            ))}
                          </div>
                        </div>
                        <div className="font-medium text-stone-200">{rev.title}</div>
                        <p className="text-stone-400 leading-relaxed">{rev.comment}</p>
                      </div>
                    ))}
                  </div>

                </div>
              )}

              {/* Tab 4: Specifications */}
              {activeTab === 'specs' && (
                <div className="space-y-3 text-xs animate-in fade-in">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-3 bg-[#181816] rounded-lg border border-stone-800">
                      <div className="text-stone-400 text-[10px] uppercase font-semibold">Dimensions</div>
                      <div className="font-medium text-white mt-0.5">{product.dimensions}</div>
                    </div>
                    <div className="p-3 bg-[#181816] rounded-lg border border-stone-800">
                      <div className="text-stone-400 text-[10px] uppercase font-semibold">Gross Weight</div>
                      <div className="font-medium text-white mt-0.5">{product.weightKg} kg (Air palletized)</div>
                    </div>
                    <div className="p-3 bg-[#181816] rounded-lg border border-stone-800 col-span-2">
                      <div className="text-stone-400 text-[10px] uppercase font-semibold">Primary Materials</div>
                      <div className="font-medium text-white mt-0.5">{product.material}</div>
                    </div>
                    {product.springConfiguration && (
                      <div className="p-3 bg-[#181816] rounded-lg border border-stone-800 col-span-2">
                        <div className="text-stone-400 text-[10px] uppercase font-semibold">Spring Resistance</div>
                        <div className="font-medium text-white mt-0.5">{product.springConfiguration}</div>
                      </div>
                    )}
                  </div>

                  <div className="p-3 bg-[#141413] border border-stone-800 rounded-lg text-[11px] text-stone-400 space-y-1">
                    <div className="font-bold text-white">Studio Quality Guarantee:</div>
                    <p>
                      Manufactured under ISO9001 certified precision equipment protocols. Multi-point quality inspection prior to air pallet dispatch.
                    </p>
                  </div>
                </div>
              )}

            </div>

          </div>
        </div>

      </div>

    </div>
  );
};
