import React from 'react';

interface PaymentBadgesProps {
  className?: string;
  variant?: string;
}

export const PaymentBadges: React.FC<PaymentBadgesProps> = ({
  className = '',
}) => {
  return (
    <div
      className={`relative w-full overflow-hidden rounded-xl bg-[#141412] border border-stone-800/80 px-2.5 py-2 select-none pointer-events-none shadow-sm ${className}`}
      aria-label="Supported Payment Methods"
    >
      {/* Subtle Ambient Shimmer Sweep */}
      <div className="absolute top-0 bottom-0 w-32 bg-gradient-to-r from-transparent via-amber-400/8 to-transparent pointer-events-none animate-shimmer-sweep" />

      {/* Single Sleek Non-Interactive Banners Row */}
      <div className="relative z-10 flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
        {/* Google Pay */}
        <div className="h-6 sm:h-6.5 px-2 bg-[#1c1c1a] border border-stone-800 rounded-md flex items-center justify-center shadow-xs">
          <div className="flex items-center gap-1">
            <span className="text-[#4285F4] font-black text-[12px] leading-none">G</span>
            <span className="text-white text-[11px] font-semibold leading-none">Pay</span>
            <div className="flex items-center gap-0.5 ml-0.5">
              <span className="w-1 h-1 rounded-full bg-[#4285F4]" />
              <span className="w-1 h-1 rounded-full bg-[#EA4335]" />
              <span className="w-1 h-1 rounded-full bg-[#FBBC05]" />
              <span className="w-1 h-1 rounded-full bg-[#34A853]" />
            </div>
          </div>
        </div>

        {/* Apple Pay */}
        <div className="h-6 sm:h-6.5 px-2 bg-[#1c1c1a] border border-stone-800 rounded-md flex items-center justify-center shadow-xs">
          <div className="flex items-center gap-0.5 text-white">
            <span className="text-[13px] leading-none text-white"></span>
            <span className="font-bold text-[11px] tracking-tight text-white leading-none">Pay</span>
          </div>
        </div>

        {/* Amazon Pay */}
        <div className="h-6 sm:h-6.5 px-2 bg-[#1c1c1a] border border-stone-800 rounded-md flex items-center justify-center shadow-xs">
          <div className="flex flex-col items-center justify-center leading-none">
            <div className="flex items-baseline gap-0.5">
              <span className="font-bold text-[10.5px] text-white tracking-tight font-sans">amazon</span>
              <span className="font-bold text-[9.5px] text-[#FF9900] tracking-tight font-sans">pay</span>
            </div>
            <svg className="w-7 h-1.5 text-[#FF9900] -mt-0.5" viewBox="0 0 60 14" fill="none">
              <path d="M2 4.5C18 13.5 42 13.5 58 4.5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              <path d="M53 1.5L58 4.5L53.5 8" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>

        {/* PayPal */}
        <div className="h-6 sm:h-6.5 px-2 bg-[#1c1c1a] border border-stone-800 rounded-md flex items-center justify-center shadow-xs">
          <div className="flex items-center font-black italic tracking-tight text-[11px] leading-none">
            <span className="text-[#0079C1]">Pay</span>
            <span className="text-[#00457C]">Pal</span>
          </div>
        </div>

        {/* Visa */}
        <div className="h-6 sm:h-6.5 px-2 bg-[#1c1c1a] border border-stone-800 rounded-md flex items-center justify-center shadow-xs">
          <div className="flex items-baseline font-black tracking-wider text-[11px] text-white font-sans italic leading-none">
            <span className="text-[#F7B600] text-[12px]">V</span>
            <span>ISA</span>
          </div>
        </div>

        {/* Mastercard */}
        <div className="h-6 sm:h-6.5 px-2 bg-[#1c1c1a] border border-stone-800 rounded-md flex items-center justify-center shadow-xs">
          <div className="flex items-center gap-1">
            <div className="relative flex items-center -space-x-1.5">
              <span className="w-3 h-3 rounded-full bg-[#EB001B] inline-block shadow-xs" />
              <span className="w-3 h-3 rounded-full bg-[#F79E1B] inline-block opacity-90 shadow-xs" />
            </div>
            <span className="font-bold text-[9px] text-stone-300 tracking-tight lowercase font-sans leading-none">
              mastercard
            </span>
          </div>
        </div>

        {/* American Express */}
        <div className="h-6 sm:h-6.5 px-1.5 bg-[#1c1c1a] border border-stone-800 rounded-md flex items-center justify-center shadow-xs">
          <span className="font-mono font-black text-[8.5px] text-[#006FCF] bg-white px-1 py-0.2 rounded-xs leading-none">
            AMEX
          </span>
        </div>
      </div>
    </div>
  );
};
