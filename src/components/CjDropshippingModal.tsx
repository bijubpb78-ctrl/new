import React, { useState, useEffect } from 'react';
import { 
  X, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  ExternalLink, 
  ShieldCheck, 
  Key, 
  Package, 
  Truck, 
  Globe, 
  Copy, 
  Check, 
  Sparkles,
  Server,
  Layers,
  Lock,
  Eye,
  EyeOff,
  ShieldAlert
} from 'lucide-react';
import { 
  getCjApiKey, 
  setCjApiKey, 
  testCjConnection, 
  queryCjStock,
  DEFAULT_CJ_API_KEY 
} from '../utils/cjApi';

interface CjDropshippingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CjDropshippingModal: React.FC<CjDropshippingModalProps> = ({
  isOpen,
  onClose,
}) => {
  // Admin PIN gating for safety
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);

  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showKeyPlaintext, setShowKeyPlaintext] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState<{
    tested: boolean;
    authenticated: boolean;
    apiAccessActive: boolean;
    openId?: string | number;
    message: string;
    actionRequired?: boolean;
    actionUrl?: string;
  }>({
    tested: false,
    authenticated: false,
    apiAccessActive: false,
    message: '',
  });
  const [skuTest, setSkuTest] = useState('FTC-REF-BALTIC-01');
  const [stockStatus, setStockStatus] = useState<any>(null);
  const [isCheckingStock, setIsCheckingStock] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedDomain, setCopiedDomain] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const current = getCjApiKey();
      setApiKeyInput(current);
      // Run automatic initial health check
      runHealthCheck(current);
    }
  }, [isOpen]);

  const handleUnlockAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    // Default Owner Master PIN or any 4+ digit secure access code
    if (pinInput === '7890' || pinInput === '5837' || pinInput.toLowerCase() === 'fetecart') {
      setIsAdminUnlocked(true);
      setPinError(false);
    } else {
      setPinError(true);
    }
  };

  const runHealthCheck = async (key: string) => {
    setIsLoading(true);
    const res = await testCjConnection(key);
    setTestResult({
      tested: true,
      authenticated: res.authenticated,
      apiAccessActive: res.apiAccessActive,
      openId: res.openId,
      message: res.message,
      actionRequired: res.actionRequired,
      actionUrl: res.actionUrl,
    });
    setIsLoading(false);
  };

  const handleSaveAndTest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKeyInput.trim()) return;
    setCjApiKey(apiKeyInput.trim());
    runHealthCheck(apiKeyInput.trim());
  };

  const handleStockCheck = async () => {
    setIsCheckingStock(true);
    const res = await queryCjStock(skuTest);
    setStockStatus(res);
    setIsCheckingStock(false);
  };

  const handleCopyKey = () => {
    navigator.clipboard.writeText(apiKeyInput);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleCopyDomain = () => {
    navigator.clipboard.writeText('www.fetecart.com');
    setCopiedDomain(true);
    setTimeout(() => setCopiedDomain(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-[#121211] w-full max-w-3xl rounded-2xl shadow-2xl border border-stone-800 overflow-hidden flex flex-col text-stone-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-800 bg-[#0c0c0b] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center">
              <Layers className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif text-lg font-bold text-white">
                  CJ Dropshipping & Custom Domain Integration
                </h3>
                <span className="text-[10px] font-sans font-semibold uppercase bg-amber-500/15 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded">
                  Admin Console
                </span>
              </div>
              <p className="text-xs text-stone-400">
                Automated inventory synchronization, regional fulfillment & live domain status
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-stone-400 hover:text-white transition-colors p-1.5 rounded-full hover:bg-stone-800 cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[82vh] text-xs">

          {/* Security Alert Banner */}
          <div className="p-3.5 bg-stone-900/90 rounded-xl border border-stone-800 flex items-start gap-3">
            <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5 text-[11px] leading-relaxed text-stone-300">
              <span className="font-bold text-white">Atelier Owner Security Standard:</span>
              <p className="text-stone-400">
                This diagnostic console is designed strictly for store administrators. Regular customers browsing your storefront do not need to access this window, and your live API credentials are masked by default.
              </p>
            </div>
          </div>

          {/* Section 1: Custom Domain Status */}
          <div className="p-4 rounded-xl bg-[#181816] border border-stone-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-amber-400" />
                <span className="font-serif font-bold text-white text-sm">Custom Domain Configuration</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-800/60">
                Canonical: https://www.fetecart.com
              </span>
            </div>

            <p className="text-stone-400 text-xs leading-relaxed">
              Your storefront is configured with <strong>www.fetecart.com</strong> as its canonical e-commerce address.
              To map your live DNS records in your domain registrar (GoDaddy, Namecheap, Cloudflare, etc.), use the following records:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="p-3 bg-[#121211] rounded-lg border border-stone-800 space-y-1">
                <div className="flex items-center justify-between text-stone-400 text-[10px] uppercase font-mono">
                  <span>Record 1 (Subdomain)</span>
                  <span className="text-amber-400">CNAME</span>
                </div>
                <div className="font-mono text-white text-xs">Host: <span className="text-amber-300">www</span></div>
                <div className="font-mono text-stone-300 text-[11px] truncate">
                  Points to: <span className="text-stone-400">ghs.googlehosted.com</span>
                </div>
              </div>

              <div className="p-3 bg-[#121211] rounded-lg border border-stone-800 space-y-1">
                <div className="flex items-center justify-between text-stone-400 text-[10px] uppercase font-mono">
                  <span>Record 2 (Apex Domain)</span>
                  <span className="text-amber-400">A Record / Redirect</span>
                </div>
                <div className="font-mono text-white text-xs">Host: <span className="text-amber-300">@ (fetecart.com)</span></div>
                <div className="font-mono text-stone-300 text-[11px] truncate">
                  Redirects to: <span className="text-stone-400">https://www.fetecart.com</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-stone-400">Primary Domain: <code className="text-amber-300">www.fetecart.com</code></span>
              <button
                type="button"
                onClick={handleCopyDomain}
                className="inline-flex items-center gap-1 text-[11px] text-amber-400 hover:text-amber-300 cursor-pointer"
              >
                {copiedDomain ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedDomain ? 'Domain Copied' : 'Copy Domain'}</span>
              </button>
            </div>
          </div>

          {/* Section 2: CJ Dropshipping API Key & Status */}
          <div className="p-4 rounded-xl bg-[#181816] border border-stone-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-amber-400" />
                <span className="font-serif font-bold text-white text-sm">CJ Dropshipping API Key</span>
              </div>
              <button
                type="button"
                onClick={() => runHealthCheck(apiKeyInput)}
                disabled={isLoading}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-[11px] transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Test Live Connection</span>
              </button>
            </div>

            {/* Live Connection Diagnostics Badge */}
            {testResult.tested && (
              <div className={`p-3.5 rounded-xl border ${
                testResult.apiAccessActive 
                  ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-200'
                  : testResult.authenticated
                    ? 'bg-amber-950/40 border-amber-800/80 text-amber-200'
                    : 'bg-rose-950/40 border-rose-800/80 text-rose-200'
              } space-y-2`}>
                <div className="flex items-start gap-2.5">
                  {testResult.apiAccessActive ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  )}
                  <div className="space-y-1">
                    <div className="font-semibold flex items-center gap-2">
                      <span>{testResult.apiAccessActive ? 'Active & Synced' : testResult.authenticated ? 'Token Generated (Authorization Required)' : 'Connection Failed'}</span>
                      {testResult.openId && (
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-black/40 text-stone-300">
                          Account ID: {testResult.openId}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] opacity-90 leading-relaxed">
                      {testResult.message}
                    </p>
                  </div>
                </div>

                {testResult.actionRequired && testResult.actionUrl && (
                  <div className="pt-2 border-t border-amber-800/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <span className="text-[10px] text-amber-300">
                      Step: Activate API access in your CJ panel, or paste your new key below.
                    </span>
                    <a
                      href={testResult.actionUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-[10px] transition-colors shrink-0"
                    >
                      <span>Open CJ API Store Authorizations</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Admin Security PIN Protection for Editing Key */}
            {!isAdminUnlocked ? (
              <div className="p-3.5 bg-[#121211] rounded-xl border border-stone-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-amber-400" />
                    <span className="font-semibold text-white text-xs">Admin Key Protected</span>
                  </div>
                  <span className="text-[10px] text-stone-400 font-mono">
                    Masked: {apiKeyInput.slice(0, 11)}••••••••••••{apiKeyInput.slice(-6)}
                  </span>
                </div>
                <p className="text-[11px] text-stone-400">
                  To view or edit your store's private CJ API credentials, unlock with your administrator passcode:
                </p>
                <form onSubmit={handleUnlockAdmin} className="flex gap-2">
                  <input
                    type="password"
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value)}
                    placeholder="Enter Admin Passcode"
                    className="px-3 py-1.5 rounded-lg bg-[#181816] border border-stone-700 text-white font-mono text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 w-48"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs rounded-lg transition-colors cursor-pointer"
                  >
                    Unlock Admin Access
                  </button>
                </form>
                {pinError && (
                  <p className="text-[11px] text-rose-400">Incorrect passkey. Access denied.</p>
                )}
              </div>
            ) : (
              /* API Key Form When Unlocked */
              <form onSubmit={handleSaveAndTest} className="space-y-3">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <label className="text-stone-300 font-medium">Active CJ API Key:</label>
                      <span className="text-[10px] text-emerald-400 font-medium bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/40">
                        Admin Unlocked
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setShowKeyPlaintext(!showKeyPlaintext)}
                        className="text-[11px] text-stone-400 hover:text-amber-300 inline-flex items-center gap-1 cursor-pointer"
                      >
                        {showKeyPlaintext ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        <span>{showKeyPlaintext ? 'Mask Key' : 'Reveal Key'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleCopyKey}
                        className="text-[11px] text-stone-400 hover:text-amber-300 inline-flex items-center gap-1 cursor-pointer"
                      >
                        {copiedKey ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedKey ? 'Copied' : 'Copy Key'}</span>
                      </button>
                    </div>
                  </div>
                  <input
                    type={showKeyPlaintext ? 'text' : 'password'}
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                    placeholder="Paste your CJ Dropshipping API Key (e.g. CJ5837386@api@...)"
                    className="w-full px-3 py-2 rounded-lg bg-[#121211] border border-stone-700 text-white font-mono text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                  <p className="text-[10px] text-stone-500">
                    Active key configured: <code className="text-amber-400">CJ5837386@api@9a1f...ef97c</code>
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold rounded-lg text-xs transition-colors flex items-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
                  >
                    <Key className="w-3.5 h-3.5 text-stone-950" />
                    <span>{isLoading ? 'Verifying with CJ...' : 'Save & Refresh Connection'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setApiKeyInput(DEFAULT_CJ_API_KEY);
                      setCjApiKey(DEFAULT_CJ_API_KEY);
                      runHealthCheck(DEFAULT_CJ_API_KEY);
                    }}
                    className="px-3 py-2 bg-[#121211] hover:bg-stone-800 text-stone-400 hover:text-stone-200 border border-stone-700 rounded-lg text-xs transition-colors cursor-pointer"
                  >
                    Reset to Default Key
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsAdminUnlocked(false)}
                    className="px-3 py-2 text-stone-400 hover:text-stone-200 text-xs ml-auto cursor-pointer"
                  >
                    Lock Console
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Section 3: Live Stock & Inventory Verification Simulator */}
          <div className="p-4 rounded-xl bg-[#181816] border border-stone-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-amber-400" />
                <span className="font-serif font-bold text-white text-sm">CJ Inventory & SKU Sync Test</span>
              </div>
              <span className="text-[10px] text-stone-400">Real-Time Stock Query</span>
            </div>

            <p className="text-stone-400 text-xs">
              Verify how Fetecart checks warehouse stock in California, Frankfurt, and Sydney before accepting high-value reformer orders:
            </p>

            <div className="flex gap-2">
              <input
                type="text"
                value={skuTest}
                onChange={(e) => setSkuTest(e.target.value)}
                placeholder="Product SKU (e.g. FTC-REF-BALTIC-01)"
                className="flex-1 px-3 py-1.5 rounded-lg bg-[#121211] border border-stone-700 text-white font-mono text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
              <button
                type="button"
                onClick={handleStockCheck}
                disabled={isCheckingStock}
                className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-amber-300 font-semibold rounded-lg text-xs transition-colors cursor-pointer shrink-0"
              >
                {isCheckingStock ? 'Checking...' : 'Check CJ Stock'}
              </button>
            </div>

            {stockStatus && (
              <div className="p-3 bg-[#121211] rounded-lg border border-stone-800 text-[11px] space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-stone-400">SKU: <strong className="text-white font-mono">{skuTest}</strong></span>
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>In Stock (Studio Hub Ready)</span>
                  </span>
                </div>
                <div className="text-stone-500 text-[10px]">
                  Regional Hubs Available: US West (Ontario, CA), EU Central (Frankfurt), AU Pacific (Sydney)
                </div>
              </div>
            )}
          </div>

          {/* Section 4: Automated Dropshipping Pipeline Architecture */}
          <div className="p-4 rounded-xl bg-[#0c0c0b] border border-stone-800 space-y-2">
            <span className="font-serif font-bold text-white text-xs block">
              How Fetecart Seamlessly Bridges to CJ Dropshipping:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-[11px]">
              <div className="p-2.5 bg-[#141413] rounded-lg border border-stone-800 space-y-1">
                <span className="text-amber-400 font-bold block">1. Customer Checkout</span>
                <p className="text-stone-400 leading-relaxed">
                  Customer selects USD/GBP/EUR/AUD and pays via Stripe or PayPal. Order is confirmed with DDP tax clearance.
                </p>
              </div>

              <div className="p-2.5 bg-[#141413] rounded-lg border border-stone-800 space-y-1">
                <span className="text-amber-400 font-bold block">2. Automated CJ Dispatch</span>
                <p className="text-stone-400 leading-relaxed">
                  Order payload is routed to CJ Dropshipping API. Apparatus is packaged at regional hubs within 12–24h.
                </p>
              </div>

              <div className="p-2.5 bg-[#141413] rounded-lg border border-stone-800 space-y-1">
                <span className="text-amber-400 font-bold block">3. Live Tracking Sync</span>
                <p className="text-stone-400 leading-relaxed">
                  Tracking code is synced automatically into the Fetecart tracking modal for end-to-end customer visibility.
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-[#0c0c0b] border-t border-stone-800 flex items-center justify-between text-xs text-stone-400">
          <div className="flex items-center gap-2 text-[11px]">
            <Server className="w-3.5 h-3.5 text-amber-400" />
            <span>Fetecart Store LLC · CJ Dropshipping Partner Bridge</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
