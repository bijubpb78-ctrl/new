import React, { useState } from 'react';
import { 
  X, 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  Truck, 
  RotateCcw, 
  ShieldCheck, 
  Info, 
  Share2, 
  Copy, 
  Check, 
  ExternalLink,
  Send,
  Building,
  CheckCircle2,
  Sparkles,
  MessageSquare,
  HelpCircle,
  Package,
  Globe2,
  Calendar,
  Loader2
} from 'lucide-react';
import { CurrencyCode } from '../types';
import { CURRENCY_CONFIGS } from '../utils/currency';

export type PolicyTab = 'about' | 'shipping' | 'returns' | 'privacy' | 'contact' | 'share';

interface InfoPolicyModalProps {
  isOpen: boolean;
  activeTab: PolicyTab;
  onClose: () => void;
  onTabChange: (tab: PolicyTab) => void;
  currentCurrency: CurrencyCode;
}

export const InfoPolicyModal: React.FC<InfoPolicyModalProps> = ({
  isOpen,
  activeTab,
  onClose,
  onTabChange,
  currentCurrency,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);
  
  // Contact Form state
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactSubject, setContactSubject] = useState('Equipment Consultation');
  const [contactMessage, setContactMessage] = useState('');
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [ticketId, setTicketId] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [contactError, setContactError] = useState('');
  const [routedEmail, setRoutedEmail] = useState('contact@fetecart.com');

  if (!isOpen) return null;

  const currentUrl = typeof window !== 'undefined' ? window.location.href : 'https://fetecart.com';
  const shareTitle = 'Fetecart - Studio Grade Pilates Equipment & Direct Atelier Sourcing';
  const shareDescription = 'Explore factory-direct studio Pilates reformers, stability chairs, spine correctors, and precision resistance gear with localized currency and fast global shipping.';

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(currentUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleCopyPhone = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText('+16263133939');
      setCopiedPhone(true);
      setTimeout(() => setCopiedPhone(false), 2500);
    }
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName.trim() || !contactEmail.trim() || !contactMessage.trim()) return;

    setIsSending(true);
    setContactError('');
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: contactName.trim(),
          email: contactEmail.trim(),
          phone: contactPhone.trim() || undefined,
          subject: contactSubject,
          message: contactMessage.trim(),
        }),
      });

      const data = await response.json();
      if (!response.ok || !data?.ticketId) {
        throw new Error(data?.error || 'Unable to submit your enquiry.');
      }
      if (data && data.ticketId) {
        setTicketId(data.ticketId);
        if (data.recipient) {
          setRoutedEmail(data.recipient);
        }
      }
      setContactSubmitted(true);
    } catch (err) {
      setContactError(err instanceof Error ? err.message : 'Unable to submit your enquiry. Please email contact@fetecart.com.');
    } finally {
      setIsSending(false);
    }
  };

  const resetContactForm = () => {
    setContactSubmitted(false);
    setContactName('');
    setContactEmail('');
    setContactPhone('');
    setContactMessage('');
    setContactError('');
  };

  const currencyConfig = CURRENCY_CONFIGS[currentCurrency];

  const shareLinks = [
    {
      name: 'Pinterest',
      icon: (
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345-.09.375-.291 1.199-.334 1.357-.057.235-.19.285-.438.171-1.637-.762-2.66-3.155-2.66-5.078 0-4.135 3.004-7.935 8.668-7.935 4.55 0 8.087 3.243 8.087 7.576 0 4.521-2.85 8.16-6.807 8.16-1.329 0-2.579-.691-3.006-1.506l-.818 3.118c-.296 1.139-1.096 2.568-1.632 3.44C9.539 23.82 10.745 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"/>
        </svg>
      ),
      color: 'bg-red-600 hover:bg-red-700 text-white',
      url: `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(currentUrl)}&description=${encodeURIComponent(shareTitle + ' - ' + shareDescription)}`,
    },
    {
      name: 'Facebook',
      icon: (
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      ),
      color: 'bg-[#1877F2] hover:bg-[#166fe5] text-white',
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`,
    },
    {
      name: 'X / Twitter',
      icon: (
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      ),
      color: 'bg-stone-900 hover:bg-black text-white',
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareTitle)}&url=${encodeURIComponent(currentUrl)}`,
    },
    {
      name: 'WhatsApp',
      icon: (
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
        </svg>
      ),
      color: 'bg-[#25D366] hover:bg-[#20bd5a] text-white',
      url: `https://api.whatsapp.com/send?text=${encodeURIComponent(shareTitle + ' ' + currentUrl)}`,
    },
  ];

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 md:p-8 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-[#121211] w-full max-w-4xl rounded-2xl shadow-2xl border border-stone-800 overflow-hidden relative max-h-[90vh] flex flex-col text-stone-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-stone-800 flex items-center justify-between bg-[#0c0c0b] shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500 text-stone-950 flex items-center justify-center font-serif font-bold text-sm">
              F
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif text-lg font-bold text-white tracking-tight">fetecart.com</span>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#181816] border border-stone-800 text-amber-400">
                  Direct Atelier
                </span>
              </div>
              <p className="text-[11px] text-stone-400">
                Official Company Disclosures, Customer Care & Global Policies
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="px-6 border-b border-stone-800 bg-[#121211] flex items-center gap-2 sm:gap-4 overflow-x-auto shrink-0 scrollbar-none">
          {[
            { id: 'about', label: 'About Us', icon: Building },
            { id: 'shipping', label: 'Shipping Policy', icon: Truck },
            { id: 'returns', label: 'Return Policy', icon: RotateCcw },
            { id: 'privacy', label: 'Privacy Policy', icon: ShieldCheck },
            { id: 'contact', label: 'Contact Us', icon: Mail },
            { id: 'share', label: 'Share Store', icon: Share2 },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id as PolicyTab)}
                className={`py-3 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'border-amber-500 text-amber-400 font-bold'
                    : 'border-transparent text-stone-400 hover:text-stone-200 hover:border-stone-700'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-amber-400' : 'text-stone-500'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Body Content */}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1 space-y-6 text-stone-300">

          {/* ===================== TAB 1: ABOUT US ===================== */}
          {activeTab === 'about' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-500">
                  Our Atelier Heritage
                </span>
                <h2 className="font-serif text-2xl sm:text-3xl font-normal text-white">
                  Precision Engineering for Dedicated Practitioners
                </h2>
                <p className="text-stone-400 text-sm sm:text-base leading-relaxed">
                  Fetecart is a direct-from-maker Pilates apparatus atelier. Founded with the mission to liberate practitioners and studio owners from bloated distributor markups, we combine traditional joinery craftsmanship with modern aerospace-grade metallurgical standards.
                </p>
              </div>

              {/* Corporate Identity & Registration Card */}
              <div className="p-5 bg-[#181816] rounded-2xl border border-stone-800 space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
                  <Building className="w-4 h-4 text-amber-500" />
                  <span>Corporate Entity & Headquarters</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1">
                    <span className="text-stone-500 uppercase tracking-wider font-semibold text-[10px]">
                      Legal Business Name
                    </span>
                    <p className="text-white font-semibold text-sm">Fetecart store LLC</p>
                    <p className="text-stone-400">Registered Limited Liability Company</p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-stone-500 uppercase tracking-wider font-semibold text-[10px]">
                      Registered Corporate Address
                    </span>
                    <p className="text-white font-semibold">30N, STR E, Gould street</p>
                    <p className="text-stone-400">Sheridan, Wyoming, United States</p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-stone-500 uppercase tracking-wider font-semibold text-[10px]">
                      Direct Telephone Line
                    </span>
                    <p className="text-white font-semibold flex items-center gap-2">
                      <a href="tel:+16263133939" className="hover:text-amber-400 underline">
                        +1 (626) 313-3939
                      </a>
                    </p>
                    <p className="text-stone-400">Concierge Desk (US Toll-Free & International)</p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-stone-500 uppercase tracking-wider font-semibold text-[10px]">
                      Customer & Studio Relations
                    </span>
                    <p className="text-white font-semibold">contact@fetecart.com</p>
                    <p className="text-stone-400">Average response time under 4 hours</p>
                  </div>
                </div>
              </div>

              {/* Atelier Pillars */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div className="p-4 bg-[#181816] rounded-xl border border-stone-800 space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                    1
                  </div>
                  <h4 className="font-serif font-bold text-white text-sm">Solid Hardwood Chassis</h4>
                  <p className="text-xs text-stone-400 leading-relaxed">
                    Sustainably harvested multi-ply Baltic birch and certified European German beechwood frames, kiln-dried and multi-coated with scratch-resistant matte lacquer.
                  </p>
                </div>

                <div className="p-4 bg-[#181816] rounded-xl border border-stone-800 space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                    2
                  </div>
                  <h4 className="font-serif font-bold text-white text-sm">Whisper-Glide Carriages</h4>
                  <p className="text-xs text-stone-400 leading-relaxed">
                    Anodized aluminum dual tracks paired with sealed ABEC-7 polyurethane ball-bearing wheels for frictionless, dead-silent carriage movement during delicate repertoire.
                  </p>
                </div>

                <div className="p-4 bg-[#181816] rounded-xl border border-stone-800 space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                    3
                  </div>
                  <h4 className="font-serif font-bold text-white text-sm">Global Regional Hubs</h4>
                  <p className="text-xs text-stone-400 leading-relaxed">
                    Strategically stocked inventory hubs across California, Frankfurt, and Sydney ensure fast transit times and completely prepaid customs clearance (DDP).
                  </p>
                </div>
              </div>

              {/* Callout */}
              <div className="p-4 bg-[#141413] rounded-xl border border-stone-800 flex items-center justify-between text-xs text-stone-300">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span>Every apparatus undergoes a 32-point inspection and tension-calibration before dispatch.</span>
                </div>
                <button
                  onClick={() => onTabChange('contact')}
                  className="text-amber-400 font-semibold hover:underline cursor-pointer shrink-0 ml-4"
                >
                  Speak with an Atelier Specialist →
                </button>
              </div>
            </div>
          )}

          {/* ===================== TAB 2: CONTACT US ===================== */}
          {activeTab === 'contact' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-500">
                  Direct Studio Concierge
                </span>
                <h2 className="font-serif text-2xl sm:text-3xl font-normal text-white">
                  We are Here to Support Your Practice
                </h2>
                <p className="text-stone-400 text-xs sm:text-sm">
                  Whether you need custom studio apparatus quotes, shipping delivery estimates, or equipment assembly advice, our team is available 6 days a week.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                
                {/* Contact Information Sidebar */}
                <div className="lg:col-span-2 space-y-4">
                  {/* Address Card */}
                  <div className="p-4 bg-[#181816] rounded-2xl border border-stone-800 space-y-3 text-xs">
                    <div className="flex items-start gap-3">
                      <MapPin className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-white block text-sm">Fetecart store LLC</span>
                        <p className="text-stone-400">30N, STR E, Gould street</p>
                        <p className="text-stone-400">Sheridan, Wyoming, United States</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 pt-2 border-t border-stone-800">
                      <Phone className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <span className="font-bold text-white block">Phone Support</span>
                        <a 
                          href="tel:+16263133939" 
                          className="text-amber-400 font-mono font-bold hover:underline block text-sm"
                        >
                          +1 (626) 313-3939
                        </a>
                        <button
                          onClick={handleCopyPhone}
                          className="inline-flex items-center gap-1 text-[11px] text-stone-500 hover:text-stone-300 transition-colors cursor-pointer"
                        >
                          {copiedPhone ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedPhone ? 'Copied to clipboard' : 'Copy phone number'}</span>
                        </button>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 pt-2 border-t border-stone-800">
                      <Mail className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-white block">Email Concierge</span>
                        <a href="mailto:contact@fetecart.com" className="text-amber-400 hover:underline">
                          contact@fetecart.com
                        </a>
                        <p className="text-[11px] text-stone-500 mt-0.5">Replies within 4 business hours</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 pt-2 border-t border-stone-800">
                      <Clock className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-white block">Concierge Hours</span>
                        <p className="text-stone-400">Monday – Saturday: 8:00 AM – 8:00 PM EST</p>
                        <p className="text-[11px] text-stone-500">Sunday: Closed for Studio Maintenance</p>
                      </div>
                    </div>
                  </div>

                  {/* Guaranteed Response Banner */}
                  <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-stone-200 flex items-start gap-2.5">
                    <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-amber-400 block">Certified Equipment Consultation</span>
                      <p className="text-[11px] text-stone-400 leading-relaxed mt-0.5">
                        Our equipment specialists have over 10+ years of classical and contemporary Pilates studio operation experience.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Contact Form */}
                <div className="lg:col-span-3 bg-[#181816] p-5 sm:p-6 rounded-2xl border border-stone-800">
                  {contactSubmitted ? (
                    <div className="text-center py-8 space-y-4 animate-in zoom-in-95">
                      <div className="w-12 h-12 rounded-full bg-emerald-950/60 border border-emerald-800 text-emerald-400 flex items-center justify-center mx-auto">
                        <CheckCircle2 className="w-7 h-7" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="font-serif text-xl font-bold text-white">Message Dispatched</h3>
                        <p className="text-xs text-stone-300 max-w-sm mx-auto">
                          Your enquiry has been automatically routed to <strong className="text-amber-400 font-mono">{routedEmail}</strong> and our studio apparatus consultants have been notified.
                        </p>
                        <p className="text-[11px] text-stone-400 max-w-xs mx-auto pt-1">
                          An automated confirmation email has also been prepared for your email address.
                        </p>
                      </div>
                      <div className="inline-block px-3 py-1.5 bg-[#121211] rounded-lg text-xs font-mono font-semibold text-amber-400 border border-stone-800">
                        Reference Ticket: {ticketId}
                      </div>
                      <div>
                        <button
                          onClick={resetContactForm}
                          className="text-xs text-amber-400 font-semibold hover:underline cursor-pointer"
                        >
                          Send another inquiry
                        </button>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleContactSubmit} className="space-y-3.5 text-xs">
                      <h3 className="font-bold text-white text-sm border-b border-stone-800 pb-2">
                        Send an Inquiry to the Atelier
                      </h3>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="font-semibold text-stone-300 block">Full Name *</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Sarah Jenkins"
                            value={contactName}
                            onChange={(e) => setContactName(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-stone-700 focus:outline-none focus:ring-1 focus:ring-amber-500 bg-[#121211] text-white"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="font-semibold text-stone-300 block">Email Address *</label>
                          <input
                            type="email"
                            required
                            placeholder="sarah@studio.com"
                            value={contactEmail}
                            onChange={(e) => setContactEmail(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-stone-700 focus:outline-none focus:ring-1 focus:ring-amber-500 bg-[#121211] text-white"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="font-semibold text-stone-300 block">Phone (Optional)</label>
                          <input
                            type="tel"
                            placeholder="+1 (555) 000-0000"
                            value={contactPhone}
                            onChange={(e) => setContactPhone(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-stone-700 focus:outline-none focus:ring-1 focus:ring-amber-500 bg-[#121211] text-white"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="font-semibold text-stone-300 block">Topic / Department</label>
                          <select
                            value={contactSubject}
                            onChange={(e) => setContactSubject(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-stone-700 focus:outline-none focus:ring-1 focus:ring-amber-500 bg-[#121211] text-white cursor-pointer"
                          >
                            <option value="Equipment Consultation">Equipment Consultation</option>
                            <option value="Commercial & Studio Orders">Commercial & Studio Orders (Bulk)</option>
                            <option value="Order Tracking & Shipping">Order Tracking & Shipping</option>
                            <option value="Warranty & Maintenance">Warranty & 30-Day Returns</option>
                            <option value="General Inquiry">General Question</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="font-semibold text-stone-300 block">Message *</label>
                        <textarea
                          rows={4}
                          required
                          placeholder="Please let us know how we can help you with your Pilates equipment needs..."
                          value={contactMessage}
                          onChange={(e) => setContactMessage(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-stone-700 focus:outline-none focus:ring-1 focus:ring-amber-500 bg-[#121211] text-white resize-none"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isSending}
                        className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-stone-950 font-bold flex items-center justify-center gap-2 transition-all shadow-sm active:scale-98 cursor-pointer text-xs"
                      >
                        {isSending ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Transmitting Inquiry to Concierge...</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-3.5 h-3.5" />
                            <span>Submit Inquiry to contact@fetecart.com</span>
                          </>
                        )}
                      </button>
                      {contactError && <p role="alert" className="text-red-400 text-xs">{contactError}</p>}
                    </form>
                  )}
                </div>

              </div>
            </div>
          )}

          {/* ===================== TAB 3: SHIPPING POLICY ===================== */}
          {activeTab === 'shipping' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-500">
                  Global Logistics Protocol
                </span>
                <h2 className="font-serif text-2xl sm:text-3xl font-normal text-white">
                  Transparent Worldwide Shipping Policy
                </h2>
                <p className="text-stone-400 text-xs sm:text-sm leading-relaxed">
                  Fetecart delivers studio apparatus directly to homes and commercial studios across the <strong>United States, United Kingdom, European Union, and Australia</strong>. All orders are processed with transparent Delivered Duty Paid (DDP) compliance.
                </p>
              </div>

              {/* Free Shipping Highlight */}
              <div className="p-4 bg-emerald-950/40 border border-emerald-800/60 rounded-xl flex items-center justify-between text-xs text-emerald-200">
                <div className="flex items-center gap-3">
                  <Truck className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div>
                    <span className="font-bold text-sm block text-emerald-300">Free Priority Shipping Available</span>
                    <p className="text-emerald-400/80">
                      Orders exceeding {currencyConfig.symbol}{currencyConfig.freeShippingThreshold} qualify for 100% complimentary air & freight delivery in your region.
                    </p>
                  </div>
                </div>
              </div>

              {/* Region-by-Region Breakdown */}
              <div className="space-y-3">
                <h3 className="font-serif text-lg font-bold text-white">
                  Regional Transit Schedules & Freight Carriers
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {/* USA */}
                  <div className="p-4 bg-[#181816] rounded-xl border border-stone-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white flex items-center gap-1.5">
                        <span>🇺🇸</span>
                        <span>United States (US)</span>
                      </span>
                      <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-medium text-[10px]">
                        3–6 Business Days
                      </span>
                    </div>
                    <p className="text-stone-400 text-[11px]">
                      Dispatched from California & New Jersey hubs. Reformers ship via Liftgate Freight with curbside appointment delivery; props ship via FedEx / UPS.
                    </p>
                    <div className="text-[10px] text-stone-500 font-mono">
                      Free shipping threshold: $150 USD · DDP Included
                    </div>
                  </div>

                  {/* UK */}
                  <div className="p-4 bg-[#181816] rounded-xl border border-stone-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white flex items-center gap-1.5">
                        <span>🇬🇧</span>
                        <span>United Kingdom (UK)</span>
                      </span>
                      <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-medium text-[10px]">
                        4–7 Business Days
                      </span>
                    </div>
                    <p className="text-stone-400 text-[11px]">
                      Dispatched via dedicated UK linehaul. Heavy apparatus delivered via specialized freight tail-lift; props and wear delivered via Royal Mail Tracked 24/48 or DPD.
                    </p>
                    <div className="text-[10px] text-stone-500 font-mono">
                      Free shipping threshold: £120 GBP · VAT Pre-Cleared
                    </div>
                  </div>

                  {/* EU */}
                  <div className="p-4 bg-[#181816] rounded-xl border border-stone-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white flex items-center gap-1.5">
                        <span>🇪🇺</span>
                        <span>European Union (EU)</span>
                      </span>
                      <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-medium text-[10px]">
                        4–8 Business Days
                      </span>
                    </div>
                    <p className="text-stone-400 text-[11px]">
                      Routed through our Central European hub in Frankfurt. Seamless cross-border delivery across Germany, France, Italy, Spain, and Benelux via DHL Express and Dachser.
                    </p>
                    <div className="text-[10px] text-stone-500 font-mono">
                      Free shipping threshold: €140 EUR · Zero Customs Fees
                    </div>
                  </div>

                  {/* Australia */}
                  <div className="p-4 bg-[#181816] rounded-xl border border-stone-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white flex items-center gap-1.5">
                        <span>🇦🇺</span>
                        <span>Australia (AUS)</span>
                      </span>
                      <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-medium text-[10px]">
                        5–9 Business Days
                      </span>
                    </div>
                    <p className="text-stone-400 text-[11px]">
                      Dispatched from our Pacific atelier hub in Sydney. Final delivery via Australia Post eParcel Express and Toll Global Express with live SMS notifications.
                    </p>
                    <div className="text-[10px] text-stone-500 font-mono">
                      Free shipping threshold: A$220 AUD · GST Pre-Cleared
                    </div>
                  </div>
                </div>
              </div>

              {/* DDP Customs Guarantee */}
              <div className="p-4 bg-[#181816] rounded-xl border border-stone-800 space-y-2 text-xs">
                <div className="flex items-center gap-2 font-bold text-white">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Delivered Duty Paid (DDP) Guarantee</span>
                </div>
                <p className="text-stone-400 leading-relaxed text-[11px]">
                  All customs duties, cross-border import taxes, VAT, and brokerage fees are 100% prepaid and absorbed by Fetecart store LLC. The final price you see at checkout is all-inclusive; you will never be contacted by postal carriers or customs authorities to pay additional import fees.
                </p>
              </div>

              {/* Tracking Policy */}
              <div className="p-4 bg-[#141413] rounded-xl border border-stone-800 text-xs text-stone-300 space-y-1">
                <span className="font-bold text-white block">Automated Dispatch & Tracking</span>
                <p className="text-[11px] text-stone-400">
                  Orders are dispatched within 12–24 business hours. A tracking code (e.g., <code className="text-amber-400 bg-stone-900 border border-stone-800 px-1 py-0.5 rounded font-mono">FTC-US-982341</code>) is automatically generated and sent to your email, viewable in real-time through our on-site tracker.
                </p>
              </div>
            </div>
          )}

          {/* ===================== TAB 4: RETURN POLICY ===================== */}
          {activeTab === 'returns' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-500">
                  Client Satisfaction Assurance
                </span>
                <h2 className="font-serif text-2xl sm:text-3xl font-normal text-white">
                  30-Day In-Studio Trial & Return Guarantee
                </h2>
                <p className="text-stone-400 text-xs sm:text-sm leading-relaxed">
                  We stand firmly behind the calibration and ergonomic integrity of every apparatus we craft. If your equipment does not exceed your studio standards, we will make it right.
                </p>
              </div>

              {/* Policy Highlights */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-4 bg-[#181816] rounded-xl border border-stone-800 space-y-1.5">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                    30
                  </div>
                  <span className="font-bold text-white block">30-Day Trial Period</span>
                  <p className="text-stone-400 text-[11px]">
                    Enjoy full 30 days from delivery date to test the equipment on your carriage repertoire.
                  </p>
                </div>

                <div className="p-4 bg-[#181816] rounded-xl border border-stone-800 space-y-1.5">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                    100%
                  </div>
                  <span className="font-bold text-white block">Full Refund Guarantee</span>
                  <p className="text-stone-400 text-[11px]">
                    Refunds are returned to your original payment method (Stripe or PayPal) within 3–5 business days.
                  </p>
                </div>

                <div className="p-4 bg-[#181816] rounded-xl border border-stone-800 space-y-1.5">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                    2YR
                  </div>
                  <span className="font-bold text-white block">Mechanical Warranty</span>
                  <p className="text-stone-400 text-[11px]">
                    All frames, spring carousels, and bearing assemblies include a comprehensive 2-year warranty.
                  </p>
                </div>
              </div>

              {/* 4 Steps to Return */}
              <div className="space-y-3">
                <h3 className="font-serif text-lg font-bold text-white">
                  How to Initiate a Return or Exchange
                </h3>

                <div className="space-y-2.5 text-xs text-stone-300">
                  <div className="p-3 bg-[#181816] rounded-xl border border-stone-800 flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-amber-500 text-stone-950 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                      1
                    </span>
                    <div>
                      <span className="font-bold text-white block">Contact the Concierge Desk</span>
                      <p className="text-stone-400 text-[11px]">
                        Call our direct line at <strong>+1 (626) 313-3939</strong> or email <strong>contact@fetecart.com</strong> with your order confirmation number.
                      </p>
                    </div>
                  </div>

                  <div className="p-3 bg-[#181816] rounded-xl border border-stone-800 flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-amber-500 text-stone-950 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                      2
                    </span>
                    <div>
                      <span className="font-bold text-white block">Prepaid Return Label or Freight Pickup</span>
                      <p className="text-stone-400 text-[11px]">
                        For props, mats, and accessories, we email an instant prepaid return shipping label. For full-size studio reformers, our freight team coordinates a white-glove curbside pickup from your address.
                      </p>
                    </div>
                  </div>

                  <div className="p-3 bg-[#181816] rounded-xl border border-stone-800 flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-amber-500 text-stone-950 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                      3
                    </span>
                    <div>
                      <span className="font-bold text-white block">Inspection & Restocking</span>
                      <p className="text-stone-400 text-[11px]">
                        Upon receipt at our regional warehouse (California, Frankfurt, or Sydney), our atelier technicians verify the apparatus condition within 48 hours.
                      </p>
                    </div>
                  </div>

                  <div className="p-3 bg-[#181816] rounded-xl border border-stone-800 flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-amber-500 text-stone-950 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                      4
                    </span>
                    <div>
                      <span className="font-bold text-white block">Instant Reimbursement</span>
                      <p className="text-stone-400 text-[11px]">
                        Funds are released back to your original payment card via Stripe or PayPal without hidden administrative deductions.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-[#181816] rounded-xl border border-stone-800">
                <div className="text-xs text-stone-400">
                  Have questions about returning a heavy apparatus or exchanging resistance springs?
                </div>
                <button
                  onClick={() => onTabChange('contact')}
                  className="px-4 py-2 bg-amber-500 text-stone-950 text-xs font-bold rounded-lg hover:bg-amber-400 transition-colors shrink-0 cursor-pointer"
                >
                  Start Return with Concierge
                </button>
              </div>
            </div>
          )}

          {/* ===================== TAB: PRIVACY POLICY ===================== */}
          {activeTab === 'privacy' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-500 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Consumer Privacy & Data Protection</span>
                </span>
                <h2 className="font-serif text-2xl sm:text-3xl font-normal text-white">
                  Privacy Policy & Global Security Standards
                </h2>
                <p className="text-stone-400 text-xs sm:text-sm leading-relaxed">
                  Fetecart store LLC is committed to protecting your privacy and ensuring the security of your personal and transaction data. This Privacy Policy details how we collect, handle, process, and safeguard information across our global digital storefront.
                </p>
                <div className="flex items-center gap-3 text-[11px] text-stone-500 pt-1 font-mono">
                  <span>Effective Date: September 2026</span>
                  <span>•</span>
                  <span>Compliance: GDPR (EU/UK) & CCPA/CPRA (US)</span>
                </div>
              </div>

              {/* Data Controller Notice */}
              <div className="p-4 bg-[#181816] rounded-xl border border-stone-800 flex items-start gap-3">
                <Building className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1 text-xs">
                  <span className="font-bold text-white">Data Controller & Legal Entity</span>
                  <p className="text-stone-400 leading-relaxed">
                    <strong>Fetecart store LLC</strong> (Registration: Wyoming, USA)<br />
                    Principal Office: 30N, STR E, Gould street, Sheridan, Wyoming<br />
                    Direct Contact: <a href="mailto:privacy@fetecart.com" className="text-amber-400 hover:underline">privacy@fetecart.com</a> | Telephone: <a href="tel:+16263133939" className="text-amber-400 hover:underline font-mono">+1 (626) 313-3939</a>
                  </p>
                </div>
              </div>

              {/* Grid of Key Privacy Principles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-[#141413] rounded-xl border border-stone-800 space-y-2">
                  <div className="flex items-center gap-2 text-white font-semibold text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Information We Collect</span>
                  </div>
                  <ul className="text-[11px] text-stone-400 space-y-1.5 leading-relaxed list-disc list-inside">
                    <li><strong className="text-stone-200">Contact Details:</strong> Name, billing and shipping addresses, email, and phone number for delivery coordination.</li>
                    <li><strong className="text-stone-200">Payment Data:</strong> Tokenized payment confirmations via Stripe or PayPal. We never store credit card numbers.</li>
                    <li><strong className="text-stone-200">Regional Preferences:</strong> Currency preference (USD, GBP, EUR, AUD) and IP-based country code for tax and shipping estimates.</li>
                  </ul>
                </div>

                <div className="p-4 bg-[#141413] rounded-xl border border-stone-800 space-y-2">
                  <div className="flex items-center gap-2 text-white font-semibold text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>How Your Data Is Used</span>
                  </div>
                  <ul className="text-[11px] text-stone-400 space-y-1.5 leading-relaxed list-disc list-inside">
                    <li><strong className="text-stone-200">Order Fulfillment:</strong> Routing your apparatus order to regional warehousing and fulfillment hubs (CJ Dropshipping).</li>
                    <li><strong className="text-stone-200">Logistics Tracking:</strong> Sending live courier milestones and delivery notifications.</li>
                    <li><strong className="text-stone-200">Customer Support:</strong> Resolving inquiries, warranty claims, and returns via our concierge desk.</li>
                  </ul>
                </div>

                <div className="p-4 bg-[#141413] rounded-xl border border-stone-800 space-y-2">
                  <div className="flex items-center gap-2 text-white font-semibold text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Third-Party Processors</span>
                  </div>
                  <ul className="text-[11px] text-stone-400 space-y-1.5 leading-relaxed list-disc list-inside">
                    <li><strong className="text-stone-200">Payment Gateways:</strong> Stripe (PCI-DSS Level 1) & PayPal for encrypted transactions.</li>
                    <li><strong className="text-stone-200">Logistics & Warehouses:</strong> CJ Dropshipping API, FedEx Freight, DHL Express, DPD, Australia Post.</li>
                    <li><strong className="text-stone-200">Zero Data Brokering:</strong> We strictly never sell, trade, or monetize your personal information.</li>
                  </ul>
                </div>

                <div className="p-4 bg-[#141413] rounded-xl border border-stone-800 space-y-2">
                  <div className="flex items-center gap-2 text-white font-semibold text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Your Rights & Choices</span>
                  </div>
                  <ul className="text-[11px] text-stone-400 space-y-1.5 leading-relaxed list-disc list-inside">
                    <li><strong className="text-stone-200">Access & Export:</strong> Request a complete copy of personal records held by Fetecart.</li>
                    <li><strong className="text-stone-200">Right to Erasure:</strong> Request permanent deletion of customer profile records under GDPR Article 17.</li>
                    <li><strong className="text-stone-200">Opt-Out:</strong> Opt out of promotional newsletters or marketing notifications at any moment.</li>
                  </ul>
                </div>
              </div>

              {/* Security & Cookies */}
              <div className="p-4 bg-[#181816] rounded-xl border border-stone-800 space-y-3">
                <span className="text-xs font-bold text-white uppercase tracking-wider block">
                  Encryption, Cookies & Data Retention
                </span>
                <p className="text-[11px] text-stone-400 leading-relaxed">
                  All communications with <strong className="text-amber-400">www.fetecart.com</strong> are encrypted using industry-standard 256-bit TLS (Transport Layer Security). We use essential session cookies to remember your shopping cart contents and selected currency. We do not employ third-party tracking pixels that monitor your activity across external websites.
                </p>
                <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-t border-stone-800 text-[11px] text-stone-400">
                  <span>To submit a data access or deletion request, email our Data Protection Officer:</span>
                  <a
                    href="mailto:privacy@fetecart.com?subject=Privacy%20Data%20Request%20-%20Fetecart"
                    className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs transition-colors shrink-0 cursor-pointer"
                  >
                    privacy@fetecart.com
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* ===================== TAB 5: SOCIAL SHARING ===================== */}
          {activeTab === 'share' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-500">
                  Studio Community
                </span>
                <h2 className="font-serif text-2xl sm:text-3xl font-normal text-white">
                  Share Fetecart with Your Pilates Community
                </h2>
                <p className="text-stone-400 text-xs sm:text-sm leading-relaxed">
                  Recommend factory-direct Pilates apparatus, stability chairs, and precision props to fellow studio instructors, clients, and home movement practitioners.
                </p>
              </div>

              {/* Direct One-Click Social Channels */}
              <div className="space-y-3">
                <span className="text-xs font-semibold text-stone-300 uppercase tracking-wider block">
                  Select a Network to Share:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {shareLinks.map((item) => (
                    <a
                      key={item.name}
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`p-3.5 rounded-xl flex items-center justify-between transition-all shadow-xs hover:shadow-md cursor-pointer ${item.color}`}
                    >
                      <div className="flex items-center gap-3">
                        {item.icon}
                        <span className="font-semibold text-xs sm:text-sm">Share on {item.name}</span>
                      </div>
                      <ExternalLink className="w-4 h-4 opacity-80" />
                    </a>
                  ))}
                </div>
              </div>

              {/* Copy URL Link Card */}
              <div className="p-5 bg-[#181816] rounded-2xl border border-stone-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Direct Web Address
                  </span>
                  {copiedLink && (
                    <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1 animate-in fade-in">
                      <Check className="w-3.5 h-3.5" />
                      <span>Link copied to clipboard!</span>
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex-1 px-3 py-2.5 rounded-xl bg-[#121211] border border-stone-700 font-mono text-xs text-amber-400 truncate select-all">
                    {currentUrl}
                  </div>
                  <button
                    onClick={handleCopyLink}
                    className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-98 cursor-pointer shrink-0"
                  >
                    {copiedLink ? <Check className="w-4 h-4 text-stone-950" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedLink ? 'Copied' : 'Copy Link'}</span>
                  </button>
                </div>
                <p className="text-[11px] text-stone-500">
                  Share this link directly via Instagram DM, email newsletter, or WhatsApp group.
                </p>
              </div>

              {/* Corporate Reference Badge */}
              <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-3 text-xs text-stone-200">
                <Building className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-amber-400">Fetecart store LLC Official Portal</span>
                  <p className="text-[11px] text-stone-400 leading-relaxed mt-0.5">
                    30N, STR E, Gould street, Sheridan, Wyoming · Phone: +1 (626) 313-3939 · Serving practitioners worldwide.
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-[#0c0c0b] border-t border-stone-800 flex flex-col sm:flex-row items-center justify-between text-xs text-stone-400 gap-2 shrink-0">
          <div className="flex items-center gap-2 text-[11px]">
            <span className="font-semibold text-stone-300">Fetecart store LLC</span>
            <span>•</span>
            <span>Sheridan, Wyoming</span>
            <span>•</span>
            <a href="tel:+16263133939" className="hover:text-amber-400 underline font-mono">
              +1 (626) 313-3939
            </a>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg border border-stone-700 bg-[#181816] hover:bg-stone-800 text-stone-300 font-medium text-xs transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
