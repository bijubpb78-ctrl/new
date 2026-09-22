import React, { useState } from 'react';
import { 
  X, 
  Copy, 
  Check, 
  Share2, 
  ExternalLink,
  MessageCircle,
  Smartphone
} from 'lucide-react';
import { CurrencyCode, Product } from '../types';
import { formatLocalAmount } from '../utils/currency';

interface ShareProductModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  currentCurrency: CurrencyCode;
}

export const ShareProductModal: React.FC<ShareProductModalProps> = ({
  product,
  isOpen,
  onClose,
  currentCurrency,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !product) return null;

  // Generate canonical direct product URL with query parameter for deep-linking
  const baseUrl = typeof window !== 'undefined' && window.location.hostname.includes('fetecart.com')
    ? window.location.origin
    : 'https://www.fetecart.com';
    
  const productSlugOrId = product.slug || product.id;
  const productUrl = `${baseUrl}/?product=${encodeURIComponent(productSlugOrId)}`;
  
  const shareTitle = `${product.name} | Fetecart Studio Pilates`;
  const shareText = `Check out ${product.name} (${formatLocalAmount(product.basePriceUSD, currentCurrency)}) on Fetecart:`;

  const handleCopy = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(productUrl);
      } else {
        const input = document.createElement('input');
        input.value = productUrl;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: `${shareText} ${product.subtitle}`,
          url: productUrl,
        });
      } catch (err) {
        // User cancelled or share failed, fallback to copy
        if ((err as Error).name !== 'AbortError') {
          handleCopy();
        }
      }
    } else {
      handleCopy();
    }
  };

  const socialLinks = [
    {
      name: 'WhatsApp',
      color: 'bg-[#25D366] hover:bg-[#20ba59] text-white',
      url: `https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareText} ${productUrl}`)}`,
      icon: (
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
        </svg>
      )
    },
    {
      name: 'Facebook',
      color: 'bg-[#1877F2] hover:bg-[#166fe5] text-white',
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(productUrl)}`,
      icon: (
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      )
    },
    {
      name: 'Pinterest',
      color: 'bg-[#BD081C] hover:bg-[#a50719] text-white',
      url: `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(productUrl)}&media=${encodeURIComponent(product.images[0])}&description=${encodeURIComponent(`${product.name} - ${product.subtitle}`)}`,
      icon: (
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345-.09.375-.291 1.199-.334 1.357-.057.235-.19.285-.438.171-1.637-.762-2.66-3.155-2.66-5.078 0-4.135 3.004-7.935 8.668-7.935 4.55 0 8.087 3.243 8.087 7.576 0 4.521-2.85 8.16-6.807 8.16-1.329 0-2.579-.691-3.006-1.506l-.818 3.118c-.296 1.139-1.096 2.568-1.632 3.44C9.539 23.82 10.745 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"/>
        </svg>
      )
    },
    {
      name: 'X (Twitter)',
      color: 'bg-stone-900 hover:bg-black text-white border border-stone-700',
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(productUrl)}`,
      icon: (
        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      )
    },
    {
      name: 'LinkedIn',
      color: 'bg-[#0A66C2] hover:bg-[#084e96] text-white',
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(productUrl)}`,
      icon: (
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
        </svg>
      )
    },
    {
      name: 'Telegram',
      color: 'bg-[#2AABEE] hover:bg-[#2297d4] text-white',
      url: `https://t.me/share/url?url=${encodeURIComponent(productUrl)}&text=${encodeURIComponent(shareText)}`,
      icon: (
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.121l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.458c.538-.196 1.006.128.832.939z"/>
        </svg>
      )
    },
  ];

  return (
    <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div 
        className="bg-[#141413] w-full max-w-lg rounded-2xl border border-stone-800 shadow-2xl overflow-hidden relative text-stone-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="px-5 py-4 border-b border-stone-800 flex items-center justify-between bg-[#0e0e0d]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Share Product Link</h3>
              <p className="text-[11px] text-stone-400">Promote on social media or send directly to clients</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-white hover:bg-stone-800 rounded-full transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Product Preview Snippet */}
        <div className="p-5 space-y-5">
          <div className="flex items-center gap-3.5 p-3 rounded-xl bg-[#1a1a18] border border-stone-800">
            <img 
              src={product.images[0]} 
              alt={product.name}
              className="w-16 h-16 rounded-lg object-cover border border-stone-700/60 shrink-0" 
            />
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider">
                {product.category}
              </span>
              <h4 className="text-sm font-serif font-bold text-white truncate">
                {product.name}
              </h4>
              <p className="text-xs text-stone-400 line-clamp-1">
                {product.subtitle}
              </p>
              <div className="text-xs font-bold text-amber-400 mt-1">
                {formatLocalAmount(product.basePriceUSD, currentCurrency)}
              </div>
            </div>
          </div>

          {/* Quick Copy Link Box */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-stone-300 uppercase tracking-wider">
              Direct Product URL
            </label>
            <div className="flex items-center gap-2 p-1.5 rounded-xl bg-[#0c0c0b] border border-stone-700/80 focus-within:border-amber-500 transition-colors">
              <input 
                type="text" 
                readOnly 
                value={productUrl}
                className="bg-transparent text-xs text-stone-200 px-2 flex-1 outline-hidden font-mono select-all truncate"
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <button
                onClick={handleCopy}
                className={`px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  copied 
                    ? 'bg-emerald-500 text-stone-950 font-extrabold' 
                    : 'bg-amber-500 hover:bg-amber-400 text-stone-950 shadow-sm'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Link</span>
                  </>
                )}
              </button>
            </div>
            {copied && (
              <p className="text-[11px] text-emerald-400 font-medium animate-in fade-in flex items-center gap-1">
                <Check className="w-3 h-3" />
                Link copied to clipboard! Ready to paste into your social media post.
              </p>
            )}
          </div>

          {/* Native Phone / App Share Button */}
          {typeof navigator !== 'undefined' && 'share' in navigator && (
            <button
              onClick={handleNativeShare}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold text-xs flex items-center justify-center gap-2 transition-transform active:scale-98 shadow-md cursor-pointer"
            >
              <Smartphone className="w-4 h-4" />
              <span>Share via Phone Apps (Instagram, Messages, More)</span>
            </button>
          )}

          {/* 1-Click Social Media Platforms */}
          <div className="space-y-2">
            <label className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider block">
              1-Click Share to Social Media
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all hover:scale-102 active:scale-98 shadow-sm cursor-pointer ${social.color}`}
                >
                  {social.icon}
                  <span>{social.name}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Tips for posting */}
          <div className="p-3 rounded-xl bg-[#10100f] border border-stone-800 text-[11px] text-stone-400 space-y-1">
            <span className="font-semibold text-stone-300 block">💡 Social Media Tip:</span>
            <p>
              When you paste this link into Facebook, WhatsApp, Pinterest, or LinkedIn, it will automatically generate a high-resolution preview image, price, and apparatus description.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-stone-800 bg-[#0e0e0d] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-xs font-semibold text-stone-300 transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
