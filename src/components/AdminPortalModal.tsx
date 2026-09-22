import React, { useState, useEffect } from 'react';
import { Product, WarehouseStock } from '../types';
import { 
  getStoredProducts, 
  saveProduct, 
  deleteProduct, 
  updateProductStock, 
  resetProductsToDefault,
  verifyAdminPassword,
  getAdminPassword,
  setAdminPassword,
  calculateTotalStock 
} from '../utils/productStore';
import { 
  DEFAULT_CJ_API_KEY, 
  getCjApiKey, 
  setCjApiKey, 
  testCjConnection, 
  queryCjStock,
  lookupCjProduct
} from '../utils/cjApi';
import {
  DEFAULT_STRIPE_PUBLISHABLE_KEY,
  DEFAULT_STRIPE_SECRET_KEY,
  getStripePublishableKey,
  setStripePublishableKey,
  getStripeSecretKey,
  setStripeSecretKey,
  isStripeLiveMode,
  isStripeSecretKey,
  maskStripeKey,
  maskStripeSecretKey,
  extractStripeAccountId
} from '../utils/stripe';
import { 
  Lock, 
  Unlock, 
  X, 
  Check, 
  Plus, 
  Trash2, 
  Edit3, 
  Package, 
  Search, 
  Filter, 
  Layers, 
  Globe, 
  Key, 
  ShieldCheck, 
  AlertTriangle, 
  RefreshCw, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  ArrowLeft,
  DollarSign,
  Copy,
  Boxes,
  Server,
  Settings,
  Image as ImageIcon,
  RotateCcw,
  Sparkles,
  Download,
  ExternalLink,
  CreditCard,
  Radio,
  Mail,
  Send,
  Inbox
} from 'lucide-react';
import { CjWebhookPanel } from './CjWebhookPanel';

interface AdminPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProductsUpdated?: (products: Product[]) => void;
}

type AdminTab = 'products' | 'editor' | 'inventory' | 'integrations' | 'webhooks';

const CATEGORIES: Product['category'][] = [
  'Reformers & Towers',
  'Studio Chairs',
  'Barrels & Arcs',
  'Props & Resistance',
  'Cardio & Apparatus',
  'Mats & Platforms',
  'Grip & Studio Wear'
];

const WAREHOUSE_NAMES: WarehouseStock['warehouse'][] = [
  'US West (California)',
  'US East (New Jersey)',
  'EU Central (Frankfurt)',
  'AU Pacific (Sydney)',
  'Central Atelier Hub'
];

const PRESET_IMAGES = [
  { label: 'Studio Reformer 1', url: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1200&q=80' },
  { label: 'Studio Reformer 2', url: 'https://images.unsplash.com/photo-1599447421416-3414500d18a5?auto=format&fit=crop&w=1200&q=80' },
  { label: 'Pilates Apparatus 3', url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=1200&q=80' },
  { label: 'Wunda Chair', url: 'https://images.unsplash.com/photo-1575052814086-f385e2e2ad1b?auto=format&fit=crop&w=1200&q=80' },
  { label: 'Spine Arc', url: 'https://images.unsplash.com/photo-1518310383802-640c2de311b2?auto=format&fit=crop&w=1200&q=80' },
  { label: 'Studio Props', url: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1200&q=80' }
];

export const AdminPortalModal: React.FC<AdminPortalModalProps> = ({
  isOpen,
  onClose,
  onProductsUpdated
}) => {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('fetecart_admin_session') === 'true';
    }
    return false;
  });
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Active Tab
  const [activeTab, setActiveTab] = useState<AdminTab>('products');

  // Product Data
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [inventoryFilter, setInventoryFilter] = useState<'all' | 'low' | 'out'>('all');

  // Product Editor State
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [productForm, setProductForm] = useState<Partial<Product>>({
    name: '',
    slug: '',
    subtitle: '',
    category: 'Reformers & Towers',
    basePriceUSD: 850,
    compareAtPriceUSD: 1200,
    sku: '',
    weightKg: 35,
    dimensions: '',
    material: '',
    springConfiguration: '',
    images: ['https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1200&q=80'],
    description: '',
    features: ['Studio Grade Construction', 'Commercial Warranty Included'],
    includedItems: ['Main Frame Apparatus', 'Setup Guide'],
    badge: 'Atelier Selection',
    rating: 5.0,
    reviewCount: 1,
    warehouses: [
      { warehouse: 'US West (California)', stock: 10, dispatchHours: 24 },
      { warehouse: 'US East (New Jersey)', stock: 8, dispatchHours: 24 },
      { warehouse: 'EU Central (Frankfurt)', stock: 6, dispatchHours: 24 },
      { warehouse: 'AU Pacific (Sydney)', stock: 5, dispatchHours: 48 },
      { warehouse: 'Central Atelier Hub', stock: 25, dispatchHours: 12 }
    ]
  });
  const [newFeatureText, setNewFeatureText] = useState('');
  const [newIncludedText, setNewIncludedText] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');

  // Delete Confirmation Modal
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  // Admin Passcode change state
  const [newPasscode, setNewPasscode] = useState('');
  const [confirmPasscode, setConfirmPasscode] = useState('');
  const [passcodeSuccess, setPasscodeSuccess] = useState(false);
  const [passcodeMsg, setPasscodeMsg] = useState('');

  // CJ API State
  const [cjKeyInput, setCjKeyInput] = useState('');
  const [cjTestLoading, setCjTestLoading] = useState(false);
  const [cjTestStatus, setCjTestStatus] = useState<any>(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [cjImportInput, setCjImportInput] = useState('');
  const [cjImportLoading, setCjImportLoading] = useState(false);
  const [cjSearchResult, setCjSearchResult] = useState<{
    item: any;
    suggestedPriceUSD: number;
  } | null>(null);
  const [cjSearchFeedback, setCjSearchFeedback] = useState<{
    type: 'success' | 'warning' | 'error';
    text: string;
  } | null>(null);

  // Stripe API Key State (Publishable + Secret Keys)
  const [stripeKeyInput, setStripeKeyInput] = useState('');
  const [copiedStripeKey, setCopiedStripeKey] = useState(false);
  const [stripeSecretKeyInput, setStripeSecretKeyInput] = useState('');
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [copiedStripeSecretKey, setCopiedStripeSecretKey] = useState(false);

  // Email & Customer Inquiries State
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [isLoadingInquiries, setIsLoadingInquiries] = useState(false);
  const [isSendingTestInquiry, setIsSendingTestInquiry] = useState(false);

  // Notifications
  const [adminToast, setAdminToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setAdminToast(msg);
    setTimeout(() => setAdminToast(null), 3500);
  };

  // Reset to authentic catalog
  const handleResetToDefaults = () => {
    if (window.confirm('Restore store catalog to the 10 authentic, handcrafted Pilates apparatus and remove any test/fake items?')) {
      const reset = resetProductsToDefault();
      setProducts(reset);
      if (onProductsUpdated) onProductsUpdated(reset);
      showToast('Catalog restored to official Fetecart Pilates Collection');
    }
  };

  // Load products & CJ Key on open
  useEffect(() => {
    if (isOpen) {
      const loaded = getStoredProducts();
      setProducts(loaded);
      setCjKeyInput(getCjApiKey());
      setStripeKeyInput(getStripePublishableKey());
      setStripeSecretKeyInput(getStripeSecretKey());
      // Check session
      if (sessionStorage.getItem('fetecart_admin_session') === 'true') {
        setIsAuthenticated(true);
      }
      fetchInquiries();
    }
  }, [isOpen]);

  const fetchInquiries = async () => {
    setIsLoadingInquiries(true);
    try {
      const res = await fetch('/api/contact/messages');
      const data = await res.json();
      if (data && Array.isArray(data.inquiries)) {
        setInquiries(data.inquiries);
      }
    } catch (err) {
      console.error('Error loading inquiries:', err);
    } finally {
      setIsLoadingInquiries(false);
    }
  };

  const handleSendTestInquiry = async () => {
    setIsSendingTestInquiry(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Sarah Jenkins (Studio Owner)',
          email: 'sarah@pilates-core.com',
          phone: '+1 (626) 313-3939',
          subject: 'Commercial Studio Order & Bulk Sourcing',
          message: 'Automated test inquiry verifying server-side routing to contact@fetecart.com with ticket generation.',
        }),
      });
      const data = await res.json();
      if (data && data.success) {
        showToast(`Test inquiry #${data.ticketId} sent to contact@fetecart.com!`);
        fetchInquiries();
      } else {
        showToast('Error sending test inquiry');
      }
    } catch (err) {
      showToast('Error communicating with contact API');
    } finally {
      setIsSendingTestInquiry(false);
    }
  };

  if (!isOpen) return null;

  // Handle Login
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (verifyAdminPassword(passwordInput)) {
      setIsAuthenticated(true);
      setPasswordError(false);
      setPasswordInput('');
      sessionStorage.setItem('fetecart_admin_session', 'true');
      showToast('Admin access granted');
    } else {
      setPasswordError(true);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('fetecart_admin_session');
    onClose();
  };

  // Switch to Editor for New Product
  const handleStartNewProduct = () => {
    setEditingProductId(null);
    setCjSearchResult(null);
    setCjSearchFeedback(null);
    setCjImportInput('');
    const generatedSku = `FTC-PLT-${Date.now().toString().slice(-4)}`;
    setProductForm({
      id: `prod-custom-${Date.now()}`,
      name: '',
      slug: '',
      subtitle: '',
      category: 'Reformers & Towers',
      basePriceUSD: 850,
      compareAtPriceUSD: 1150,
      sku: generatedSku,
      weightKg: 38,
      dimensions: '228 cm L × 65 cm W × 36 cm H',
      material: 'Aerospace Aluminum, Hard Maple, Commercial Antibacterial PU',
      springConfiguration: '5 High-Carbon Music Wire Springs',
      images: ['https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1200&q=80'],
      description: 'Hand-crafted Pilates apparatus engineered for precision movement and lifelong durability in commercial studios or private residences.',
      features: [
        'WhisperGlide Ultra-Silent Polyurethane Bearing Rollers',
        'Multi-position ergonomic footbar and padded headrest',
        'Commercial grade antibacterial upholstery'
      ],
      includedItems: [
        'Studio Reformer Frame & Carriage Assembly',
        'Padded Sitting Box with Dual Strap Handles',
        'Assembly Toolkit & Digital Quick-Start Manual'
      ],
      badge: 'New Arrival',
      rating: 5.0,
      reviewCount: 0,
      reviews: [],
      warehouses: [
        { warehouse: 'US West (California)', stock: 12, dispatchHours: 24 },
        { warehouse: 'US East (New Jersey)', stock: 8, dispatchHours: 24 },
        { warehouse: 'EU Central (Frankfurt)', stock: 10, dispatchHours: 24 },
        { warehouse: 'AU Pacific (Sydney)', stock: 5, dispatchHours: 48 },
        { warehouse: 'Central Atelier Hub', stock: 30, dispatchHours: 12 }
      ]
    });
    setActiveTab('editor');
  };

  // 1-Click Import from CJ Dropshipping with Verification Preview
  const handleImportFromCj = async () => {
    if (!cjImportInput.trim()) {
      showToast('Please enter a SKU or keyword');
      return;
    }
    setCjImportLoading(true);
    setCjSearchResult(null);
    setCjSearchFeedback(null);

    try {
      const res = await lookupCjProduct(cjImportInput.trim());
      if (res.success && res.product) {
        const item = res.product;
        const sellPriceNum = Number(item.sellPrice) || 350;
        const retailPrice = Math.round(sellPriceNum * 1.5);

        setCjSearchResult({
          item,
          suggestedPriceUSD: retailPrice
        });
        setCjSearchFeedback({
          type: 'success',
          text: `Verified equipment match found on CJ: "${item.productName}". Preview the product below and click "Apply to Form" to confirm.`
        });
      } else {
        const cleanSku = cjImportInput.trim().toUpperCase();
        // NEVER overwrite form with fake product! Set the SKU field so user can manually complete form
        setProductForm(prev => ({
          ...prev,
          sku: cleanSku,
        }));
        setCjSearchFeedback({
          type: 'warning',
          text: res.message || `No product found in CJ Dropshipping for SKU "${cleanSku}". The SKU has been saved to your form below so you can enter your product title, images, specifications, and pricing manually.`
        });
      }
    } catch (err: any) {
      setCjSearchFeedback({
        type: 'error',
        text: 'Could not contact CJ Dropshipping API. You can enter your product details manually below.'
      });
    } finally {
      setCjImportLoading(false);
    }
  };

  // Apply previewed CJ product to the actual form
  const handleApplyCjResult = () => {
    if (!cjSearchResult) return;
    const { item, suggestedPriceUSD } = cjSearchResult;
    const price = suggestedPriceUSD || Number(item.suggestedRetailPrice) || 68;
    const imagesToUse = (item.productImageSet && item.productImageSet.length > 0)
      ? item.productImageSet
      : item.productImage
      ? [item.productImage]
      : [];

    setProductForm(prev => ({
      ...prev,
      name: item.productName || prev.name,
      sku: item.productSku || prev.sku,
      category: item.categoryName || prev.category || 'Props & Resistance',
      basePriceUSD: price,
      compareAtPriceUSD: Math.round(price * 1.3),
      images: imagesToUse.length > 0 ? imagesToUse : prev.images,
      weightKg: item.weightKg || prev.weightKg,
      dimensions: item.dimensions || prev.dimensions || '92 cm L × 3 cm Diameter (Modular Bar Assembly)',
      material: item.material || prev.material,
      description: item.description || prev.description,
      features: (item.features && item.features.length > 0) ? item.features : prev.features,
      includedItems: [
        'Steel Core Modular Pilates Bar Assembly',
        '2 × Heavy-Duty Cloth-Cased Resistance Tubes',
        '2 × Non-Slip Foot Stirrups & Handles',
        'Quick-Start Workout Guide'
      ],
      badge: 'CJ Direct Sync'
    }));
    showToast(`Applied ${item.productName?.slice(0, 30)}... to product form`);
    setCjSearchResult(null);
    setCjSearchFeedback({
      type: 'success',
      text: 'Product specifications and studio gallery applied to form! Click "Publish to Storefront" when ready.'
    });
  };

  // Discard previewed CJ product
  const handleDiscardCjResult = () => {
    setCjSearchResult(null);
    setCjSearchFeedback(null);
    showToast('Discarded CJ search result.');
  };

  // Switch to Editor for Existing Product
  const handleStartEditProduct = (prod: Product) => {
    setEditingProductId(prod.id);
    setProductForm({ ...prod });
    setActiveTab('editor');
  };

  // Save Product
  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.name?.trim()) {
      showToast('Please enter a product title.');
      return;
    }

    const finalId = editingProductId || productForm.id || `prod-custom-${Date.now()}`;
    const slug = productForm.slug?.trim() || productForm.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const sku = productForm.sku?.trim() || `FTC-SKU-${Date.now().toString().slice(-4)}`;

    const fullProduct: Product = {
      id: finalId,
      name: productForm.name.trim(),
      slug,
      subtitle: productForm.subtitle?.trim() || '',
      category: productForm.category || 'Reformers & Towers',
      basePriceUSD: Number(productForm.basePriceUSD) || 100,
      compareAtPriceUSD: productForm.compareAtPriceUSD ? Number(productForm.compareAtPriceUSD) : undefined,
      sku,
      weightKg: Number(productForm.weightKg) || 20,
      dimensions: productForm.dimensions || '228 cm L × 65 cm W',
      material: productForm.material || 'Commercial Hardwood & Aluminum',
      springConfiguration: productForm.springConfiguration || undefined,
      images: productForm.images && productForm.images.length > 0 ? productForm.images : ['https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1200&q=80'],
      description: productForm.description || '',
      features: productForm.features || [],
      includedItems: productForm.includedItems || [],
      warehouses: productForm.warehouses || [
        { warehouse: 'US West (California)', stock: 10, dispatchHours: 24 },
        { warehouse: 'Central Atelier Hub', stock: 20, dispatchHours: 12 }
      ],
      reviews: productForm.reviews || [],
      rating: productForm.rating || 5.0,
      reviewCount: productForm.reviewCount || 0,
      badge: productForm.badge || undefined
    };

    const updated = saveProduct(fullProduct);
    setProducts(updated);
    if (onProductsUpdated) onProductsUpdated(updated);
    showToast(editingProductId ? `Updated ${fullProduct.name}` : `Published ${fullProduct.name} to store`);
    setActiveTab('products');
  };

  // Delete Product Handler
  const confirmDeleteProduct = () => {
    if (!productToDelete) return;
    const updated = deleteProduct(productToDelete.id);
    setProducts(updated);
    if (onProductsUpdated) onProductsUpdated(updated);
    showToast(`Deleted ${productToDelete.name}`);
    setProductToDelete(null);
  };

  // Direct Stock Adjuster
  const handleAdjustStock = (productId: string, warehouseName: string, delta: number) => {
    const prod = products.find(p => p.id === productId);
    if (!prod) return;
    const currentStock = prod.warehouses.find(w => w.warehouse === warehouseName)?.stock || 0;
    const nextStock = Math.max(0, currentStock + delta);
    const updated = updateProductStock(productId, warehouseName, nextStock);
    setProducts(updated);
    if (onProductsUpdated) onProductsUpdated(updated);
  };

  const handleSetExactStock = (productId: string, warehouseName: string, value: string) => {
    const parsed = parseInt(value, 10);
    if (isNaN(parsed) || parsed < 0) return;
    const updated = updateProductStock(productId, warehouseName, parsed);
    setProducts(updated);
    if (onProductsUpdated) onProductsUpdated(updated);
  };

  // Passcode Change
  const handleChangePasscode = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPasscode.length < 4) {
      setPasscodeMsg('Passcode must be at least 4 characters.');
      setPasscodeSuccess(false);
      return;
    }
    if (newPasscode !== confirmPasscode) {
      setPasscodeMsg('Passcodes do not match.');
      setPasscodeSuccess(false);
      return;
    }
    setAdminPassword(newPasscode);
    setPasscodeSuccess(true);
    setPasscodeMsg('Admin passcode successfully updated!');
    setNewPasscode('');
    setConfirmPasscode('');
  };

  // CJ Key verify & save
  const handleSaveCjKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cjKeyInput.trim()) return;
    setCjApiKey(cjKeyInput.trim());
    setCjTestLoading(true);
    const res = await testCjConnection(cjKeyInput.trim());
    setCjTestLoading(false);
    setCjTestStatus(res);
    showToast('CJ Dropshipping API Key saved');
  };

  // Stripe Key Save, Copy & Reset
  const handleSaveStripeKey = (e: React.FormEvent) => {
    e.preventDefault();
    const rawKey = stripeKeyInput.trim();
    if (!rawKey) {
      showToast('Please enter a valid Stripe Publishable Key');
      return;
    }
    if (isStripeSecretKey(rawKey)) {
      // User entered a secret key in this field - automatically save to Secret Key!
      showToast('Add the secret key in Vercel settings, not on this website.');
      return;
    }
    setStripePublishableKey(rawKey);
    showToast('Stripe Publishable Key saved successfully!');
  };

  const handleCopyStripeKey = () => {
    const key = stripeKeyInput.trim() || getStripePublishableKey();
    navigator.clipboard.writeText(key);
    setCopiedStripeKey(true);
    showToast('Stripe Publishable Key copied to clipboard');
    setTimeout(() => setCopiedStripeKey(false), 2000);
  };

  const handleResetStripeKey = () => {
    setStripePublishableKey(DEFAULT_STRIPE_PUBLISHABLE_KEY);
    setStripeKeyInput(DEFAULT_STRIPE_PUBLISHABLE_KEY);
    showToast('Stripe Key restored to live default.');
  };

  const handleSaveStripeSecretKey = (e: React.FormEvent) => {
    e.preventDefault();
    const rawKey = stripeSecretKeyInput.trim();
    if (!rawKey) {
      showToast('Please enter a valid Stripe Secret Key');
      return;
    }
    setStripeSecretKey(rawKey);
    showToast('Stripe Secret Key (sk_live_...) updated and activated for fetecart.com!');
  };

  const handleCopyStripeSecretKey = () => {
    const key = stripeSecretKeyInput.trim() || getStripeSecretKey();
    navigator.clipboard.writeText(key);
    setCopiedStripeSecretKey(true);
    showToast('Stripe Secret Key copied to clipboard');
    setTimeout(() => setCopiedStripeSecretKey(false), 2000);
  };

  const handleResetStripeSecretKey = () => {
    setStripeSecretKey(DEFAULT_STRIPE_SECRET_KEY);
    setStripeSecretKeyInput(DEFAULT_STRIPE_SECRET_KEY);
    showToast('Stripe Secret Key restored to default.');
  };

  // Total calculated metrics
  const totalCatalogValue = products.reduce((acc, p) => acc + p.basePriceUSD * calculateTotalStock(p), 0);
  const totalUnitsInFleet = products.reduce((acc, p) => acc + calculateTotalStock(p), 0);
  const lowStockCount = products.filter(p => calculateTotalStock(p) > 0 && calculateTotalStock(p) <= 10).length;
  const outOfStockCount = products.filter(p => calculateTotalStock(p) === 0).length;

  // Filtered Products for Tab 1
  const filteredProducts = products.filter(p => {
    if (selectedCategory !== 'all' && p.category !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = p.name.toLowerCase().includes(q);
      const matchSku = p.sku.toLowerCase().includes(q);
      return matchName || matchSku;
    }
    return true;
  });

  // Filtered Inventory for Tab 3
  const filteredInventory = products.filter(p => {
    const total = calculateTotalStock(p);
    if (inventoryFilter === 'low' && (total > 10 || total === 0)) return false;
    if (inventoryFilter === 'out' && total > 0) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      
      {/* Toast Notification */}
      {adminToast && (
        <div className="fixed top-5 right-5 z-60 bg-amber-500 text-stone-950 font-bold px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 text-xs border border-amber-400">
          <CheckCircle2 className="w-4 h-4 text-stone-950" />
          <span>{adminToast}</span>
        </div>
      )}

      {/* Security Gating Modal if not authenticated */}
      {!isAuthenticated ? (
        <div className="relative w-full max-w-md bg-[#141413] border border-stone-800 rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6 text-stone-200">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto">
              <Lock className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-serif font-bold text-white tracking-tight">
              Fetecart Atelier Portal
            </h2>
            <p className="text-xs text-stone-400">
              Restricted management console for store administrators only.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-stone-300">
                Admin Security Passcode
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Enter administrator passcode"
                  autoFocus
                  className="w-full px-3.5 py-2.5 bg-[#0c0c0b] border border-stone-700 rounded-xl text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-stone-400 hover:text-stone-200 p-0.5"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {passwordError && (
                <p className="text-xs text-rose-400 flex items-center gap-1 mt-1">
                  <AlertTriangle className="w-3 h-3" />
                  <span>Invalid administrator passcode. Access denied.</span>
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md"
            >
              <Unlock className="w-4 h-4" />
              <span>Unlock Admin Suite</span>
            </button>
          </form>

          <div className="p-3 bg-[#0c0c0b] rounded-xl border border-stone-800/80 text-[11px] text-stone-500 space-y-1">
            <div className="flex items-center gap-1.5 text-stone-400 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>Security Note:</span>
            </div>
            <p>
              This downside corner entrance is hidden with low opacity to prevent storefront visitors from tampering with stock, products, or CJ Dropshipping keys.
            </p>
          </div>
        </div>
      ) : (
        /* Authenticated Full Management Suite */
        <div className="relative w-full max-w-6xl max-h-[92vh] bg-[#121211] border border-stone-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-stone-200">
          
          {/* Header Bar */}
          <div className="px-6 py-4 bg-[#0c0c0b] border-b border-stone-800 flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
                <Boxes className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-serif text-lg font-bold text-white">
                    Fetecart Store Management
                  </h2>
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                    Live Atelier Connected
                  </span>
                </div>
                <p className="text-xs text-stone-400">
                  Manual product catalogue, real-time stock allocation & CJ bridge
                </p>
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="flex items-center gap-3 text-xs">
              <div className="px-3 py-1.5 bg-[#181816] rounded-lg border border-stone-800 hidden md:block">
                <span className="text-stone-400">Catalog: </span>
                <strong className="text-white">{products.length} Products</strong>
              </div>
              <div className="px-3 py-1.5 bg-[#181816] rounded-lg border border-stone-800 hidden md:block">
                <span className="text-stone-400">Total Units: </span>
                <strong className="text-amber-400 font-mono">{totalUnitsInFleet}</strong>
              </div>
              <button
                onClick={() => setActiveTab('integrations')}
                className="px-3 py-1.5 bg-[#181816] hover:bg-stone-800 text-stone-300 hover:text-amber-300 rounded-lg border border-stone-700 text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                title="Change Admin Password & Settings"
              >
                <Key className="w-3.5 h-3.5 text-amber-400" />
                <span>Password</span>
              </button>
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-stone-400 hover:text-stone-200 rounded-lg border border-stone-700 text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                title="Lock admin session"
              >
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>Lock & Exit</span>
              </button>
              <button
                onClick={onClose}
                className="p-1.5 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="px-6 bg-[#161614] border-b border-stone-800 flex items-center gap-2 overflow-x-auto text-xs py-2 scrollbar-none">
            <button
              type="button"
              onClick={() => setActiveTab('products')}
              className={`px-3 py-1.5 rounded-lg font-medium flex items-center gap-2 transition-colors cursor-pointer shrink-0 whitespace-nowrap ${
                activeTab === 'products'
                  ? 'bg-amber-500 text-stone-950 font-bold'
                  : 'text-stone-400 hover:text-white hover:bg-stone-800'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>Product Listing ({products.length})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (activeTab !== 'editor') handleStartNewProduct();
              }}
              className={`px-3 py-1.5 rounded-lg font-medium flex items-center gap-2 transition-colors cursor-pointer shrink-0 whitespace-nowrap ${
                activeTab === 'editor'
                  ? 'bg-amber-500 text-stone-950 font-bold'
                  : 'text-stone-400 hover:text-white hover:bg-stone-800'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{editingProductId ? 'Edit Product' : 'Add New Product'}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('inventory')}
              className={`px-3 py-1.5 rounded-lg font-medium flex items-center gap-2 transition-colors cursor-pointer shrink-0 whitespace-nowrap ${
                activeTab === 'inventory'
                  ? 'bg-amber-500 text-stone-950 font-bold'
                  : 'text-stone-400 hover:text-white hover:bg-stone-800'
              }`}
            >
              <Boxes className="w-3.5 h-3.5" />
              <span>Stock Inventory</span>
              {lowStockCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('webhooks')}
              className={`px-3 py-1.5 rounded-lg font-medium flex items-center gap-2 transition-colors cursor-pointer shrink-0 whitespace-nowrap ${
                activeTab === 'webhooks'
                  ? 'bg-amber-500 text-stone-950 font-bold'
                  : 'text-stone-400 hover:text-white hover:bg-stone-800'
              }`}
            >
              <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>CJ Webhook & Orders</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('integrations')}
              className={`px-3 py-1.5 rounded-lg font-medium flex items-center gap-2 transition-colors cursor-pointer shrink-0 whitespace-nowrap ${
                activeTab === 'integrations'
                  ? 'bg-amber-500 text-stone-950 font-bold'
                  : 'text-stone-400 hover:text-white hover:bg-stone-800'
              }`}
            >
              <Server className="w-3.5 h-3.5" />
              <span>CJ API & Domain Settings</span>
            </button>
          </div>

          {/* Main Tab Views */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">

            {/* TAB 1: PRODUCT LISTING PAGE */}
            {activeTab === 'products' && (
              <div className="space-y-4">
                {/* Search & Actions Bar */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-72">
                      <Search className="w-3.5 h-3.5 text-stone-500 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search products by title or SKU..."
                        className="w-full pl-9 pr-3 py-1.5 bg-[#181816] border border-stone-800 rounded-lg text-xs text-white placeholder-stone-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="px-3 py-1.5 bg-[#181816] border border-stone-800 rounded-lg text-xs text-stone-300 focus:outline-none"
                    >
                      <option value="all">All Categories</option>
                      {CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      onClick={handleResetToDefaults}
                      className="w-full sm:w-auto px-3 py-2 bg-[#181816] hover:bg-stone-800 text-stone-400 hover:text-stone-200 border border-stone-700 rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      title="Clear any test or unwanted products and restore official Pilates apparatus catalog"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                      <span>Reset to Authentic Collection</span>
                    </button>

                    <button
                      onClick={handleStartNewProduct}
                      className="w-full sm:w-auto px-4 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold rounded-lg text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add New Apparatus</span>
                    </button>
                  </div>
                </div>

                {/* Products Table */}
                <div className="bg-[#181816] border border-stone-800 rounded-xl overflow-hidden shadow">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-stone-300">
                      <thead className="bg-[#0f0f0e] text-stone-400 text-[11px] uppercase border-b border-stone-800">
                        <tr>
                          <th className="px-4 py-3">Product</th>
                          <th className="px-4 py-3">SKU</th>
                          <th className="px-4 py-3">Category</th>
                          <th className="px-4 py-3">Base Price</th>
                          <th className="px-4 py-3">Stock Units</th>
                          <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-800/60">
                        {filteredProducts.map(prod => {
                          const totalStock = calculateTotalStock(prod);
                          return (
                            <tr key={prod.id} className="hover:bg-stone-800/40 transition-colors">
                              <td className="px-4 py-3 flex items-center gap-3">
                                <img
                                  src={prod.images[0] || 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=200&q=80'}
                                  alt={prod.name}
                                  className="w-12 h-12 object-cover rounded-lg border border-stone-700 shrink-0"
                                />
                                <div>
                                  <span className="font-semibold text-white block">{prod.name}</span>
                                  <span className="text-[11px] text-stone-500 line-clamp-1">{prod.subtitle}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3 font-mono text-[11px] text-amber-300">
                                {prod.sku}
                              </td>
                              <td className="px-4 py-3">
                                <span className="px-2 py-0.5 rounded bg-stone-800 text-stone-300 text-[10px]">
                                  {prod.category}
                                </span>
                              </td>
                              <td className="px-4 py-3 font-mono font-semibold text-white">
                                ${prod.basePriceUSD.toLocaleString()}
                                {prod.compareAtPriceUSD && (
                                  <span className="text-[10px] text-stone-500 line-through ml-1.5">
                                    ${prod.compareAtPriceUSD.toLocaleString()}
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-3">
                                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-medium ${
                                  totalStock === 0
                                    ? 'bg-rose-950/80 text-rose-300 border border-rose-800/50'
                                    : totalStock <= 10
                                    ? 'bg-amber-950/80 text-amber-300 border border-amber-800/50'
                                    : 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/50'
                                }`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${
                                    totalStock === 0 ? 'bg-rose-400' : totalStock <= 10 ? 'bg-amber-400' : 'bg-emerald-400'
                                  }`} />
                                  <span>{totalStock} units</span>
                                </span>
                              </td>
                              <td className="px-4 py-3 text-right space-x-1.5">
                                <button
                                  onClick={() => handleStartEditProduct(prod)}
                                  className="p-1.5 bg-stone-800 hover:bg-stone-700 text-amber-300 rounded-lg transition-colors cursor-pointer"
                                  title="Edit Product Details"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => {
                                    setSearchQuery(prod.sku);
                                    setActiveTab('inventory');
                                  }}
                                  className="p-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-lg transition-colors cursor-pointer"
                                  title="Manage Stock"
                                >
                                  <Boxes className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => setProductToDelete(prod)}
                                  className="p-1.5 bg-stone-800 hover:bg-rose-900/60 text-stone-400 hover:text-rose-300 rounded-lg transition-colors cursor-pointer"
                                  title="Delete Product"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: ADD / EDIT PRODUCT PAGE */}
            {activeTab === 'editor' && (
              <form onSubmit={handleSaveProduct} className="space-y-6">
                <div className="flex items-center justify-between pb-3 border-b border-stone-800">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab('products')}
                      className="p-1.5 hover:bg-stone-800 rounded-lg text-stone-400 hover:text-white"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                    <div>
                      <h3 className="text-base font-serif font-bold text-white">
                        {editingProductId ? `Edit: ${productForm.name}` : 'Create New Apparatus'}
                      </h3>
                      <p className="text-xs text-stone-400">
                        Changes are saved instantly to the live storefront and local database.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab('products')}
                      className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-lg text-xs"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold rounded-lg text-xs transition-colors flex items-center gap-1.5"
                    >
                      <Check className="w-4 h-4" />
                      <span>Publish to Storefront</span>
                    </button>
                  </div>
                </div>

                {/* 1-Click Direct Import from CJ Dropshipping with Verification Safeguards */}
                <div className="p-4 bg-gradient-to-r from-amber-500/10 via-[#1a1917] to-[#141413] border border-amber-500/30 rounded-xl space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <span className="font-serif font-bold text-white text-xs sm:text-sm">
                        Lookup Product by SKU or Keyword (CJ Dropshipping)
                      </span>
                    </div>
                    <span className="text-[10px] text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60 font-mono flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-400" />
                      Strict Match Verification
                    </span>
                  </div>
                  <p className="text-stone-400 text-[11px] leading-relaxed">
                    Have a supplier SKU code from CJ Dropshipping? Paste it below to search. Fetecart validates exact equipment matches to prevent fake or unrelated dropshipping items from entering your atelier catalog.
                  </p>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={cjImportInput}
                      onChange={(e) => setCjImportInput(e.target.value)}
                      placeholder="Paste CJ SKU (e.g. CJJJJT00123) or equipment keyword"
                      className="flex-1 px-3 py-2 bg-[#0c0c0b] border border-stone-700 rounded-lg text-white font-mono text-xs focus:ring-1 focus:ring-amber-500"
                    />
                    <button
                      type="button"
                      onClick={handleImportFromCj}
                      disabled={cjImportLoading || !cjImportInput.trim()}
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold rounded-lg text-xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 shrink-0"
                    >
                      <Search className="w-3.5 h-3.5 text-stone-950" />
                      <span>{cjImportLoading ? 'Verifying...' : 'Search SKU'}</span>
                    </button>
                  </div>

                  {/* Feedback Banner */}
                  {cjSearchFeedback && (
                    <div
                      className={`p-3 rounded-lg border text-xs flex items-start gap-2.5 animate-in fade-in ${
                        cjSearchFeedback.type === 'success'
                          ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                          : cjSearchFeedback.type === 'warning'
                          ? 'bg-amber-950/30 border-amber-800/50 text-amber-200'
                          : 'bg-rose-950/40 border-rose-800/50 text-rose-300'
                      }`}
                    >
                      {cjSearchFeedback.type === 'success' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1 text-[11px] leading-relaxed">
                        {cjSearchFeedback.text}
                      </div>
                    </div>
                  )}

                  {/* Verified Item Preview Card */}
                  {cjSearchResult && (
                    <div className="p-3.5 bg-[#121211] border border-amber-500/40 rounded-xl space-y-3 shadow-lg animate-in fade-in">
                      <div className="flex items-center justify-between border-b border-stone-800 pb-2">
                        <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Equipment Found on CJ Dropshipping — Confirm Preview</span>
                        </span>
                        <span className="text-[10px] font-mono text-stone-400 bg-stone-900 px-2 py-0.5 rounded border border-stone-800">
                          SKU: {cjSearchResult.item.productSku}
                        </span>
                      </div>

                      <div className="flex items-start gap-3">
                        <img
                          src={
                            cjSearchResult.item.productImage ||
                            'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=300&q=80'
                          }
                          alt={cjSearchResult.item.productName || 'Preview'}
                          className="w-16 h-16 object-cover rounded-lg border border-stone-700 shrink-0"
                        />
                        <div className="flex-1 min-w-0 space-y-1">
                          <h5 className="font-semibold text-white text-xs line-clamp-1">
                            {cjSearchResult.item.productName}
                          </h5>
                          <p className="text-[11px] text-stone-400">
                            Category: <span className="text-stone-300">{cjSearchResult.item.categoryName || 'Pilates Apparatus'}</span>
                          </p>
                          <div className="flex items-center gap-3 text-[11px]">
                            <span className="text-stone-400">
                              CJ Sourced Cost: <strong className="text-stone-200 font-mono">${cjSearchResult.item.sellPrice || 350}</strong>
                            </span>
                            <span className="text-amber-400">
                              Suggested Retail: <strong className="font-mono">${cjSearchResult.suggestedPriceUSD}</strong>
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-stone-800 flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={handleDiscardCjResult}
                          className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-stone-400 hover:text-stone-200 rounded-lg text-xs transition-colors cursor-pointer border border-stone-800"
                        >
                          Discard
                        </button>
                        <button
                          type="button"
                          onClick={handleApplyCjResult}
                          className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold rounded-lg text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Apply to Product Form</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column: Basic Info & Copy */}
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-stone-300">Product Title *</label>
                      <input
                        type="text"
                        required
                        value={productForm.name || ''}
                        onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                        placeholder="e.g. The Atelier Foldable Studio Reformer"
                        className="w-full px-3 py-2 bg-[#181816] border border-stone-700 rounded-lg text-white text-xs focus:ring-1 focus:ring-amber-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-stone-300">SKU Code *</label>
                        <input
                          type="text"
                          required
                          value={productForm.sku || ''}
                          onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })}
                          placeholder="e.g. FTC-PLT-REF-05"
                          className="w-full px-3 py-2 bg-[#181816] border border-stone-700 rounded-lg text-white font-mono text-xs focus:ring-1 focus:ring-amber-500"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-stone-300">Category *</label>
                        <select
                          value={productForm.category}
                          onChange={(e) => setProductForm({ ...productForm, category: e.target.value as any })}
                          className="w-full px-3 py-2 bg-[#181816] border border-stone-700 rounded-lg text-white text-xs focus:ring-1 focus:ring-amber-500"
                        >
                          {CATEGORIES.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-stone-300">Subtitle / Tagline</label>
                      <input
                        type="text"
                        value={productForm.subtitle || ''}
                        onChange={(e) => setProductForm({ ...productForm, subtitle: e.target.value })}
                        placeholder="e.g. Studio-Grade 5-Spring Carriage with Quick-Fold Mechanism"
                        className="w-full px-3 py-2 bg-[#181816] border border-stone-700 rounded-lg text-white text-xs"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-stone-300">Base Price ($ USD) *</label>
                        <input
                          type="number"
                          required
                          min="1"
                          value={productForm.basePriceUSD || 0}
                          onChange={(e) => setProductForm({ ...productForm, basePriceUSD: parseFloat(e.target.value) })}
                          className="w-full px-3 py-2 bg-[#181816] border border-stone-700 rounded-lg text-white font-mono text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-stone-300">MSRP / Compare-At ($ USD)</label>
                        <input
                          type="number"
                          value={productForm.compareAtPriceUSD || ''}
                          onChange={(e) => setProductForm({ ...productForm, compareAtPriceUSD: e.target.value ? parseFloat(e.target.value) : undefined })}
                          placeholder="Optional discount price"
                          className="w-full px-3 py-2 bg-[#181816] border border-stone-700 rounded-lg text-white font-mono text-xs"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-stone-300">Merchandising Badge</label>
                      <input
                        type="text"
                        value={productForm.badge || ''}
                        onChange={(e) => setProductForm({ ...productForm, badge: e.target.value })}
                        placeholder="e.g. Best Seller & Studio Choice, New Arrival"
                        className="w-full px-3 py-2 bg-[#181816] border border-stone-700 rounded-lg text-white text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-stone-300">Detailed Description</label>
                      <textarea
                        rows={4}
                        value={productForm.description || ''}
                        onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                        placeholder="Describe materials, engineering, carriage travel, and studio benefits..."
                        className="w-full px-3 py-2 bg-[#181816] border border-stone-700 rounded-lg text-white text-xs leading-relaxed"
                      />
                    </div>
                  </div>

                  {/* Right Column: Specs & Media */}
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-stone-300">Weight (kg)</label>
                        <input
                          type="number"
                          value={productForm.weightKg || 0}
                          onChange={(e) => setProductForm({ ...productForm, weightKg: parseFloat(e.target.value) })}
                          className="w-full px-3 py-2 bg-[#181816] border border-stone-700 rounded-lg text-white font-mono text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-stone-300">Dimensions</label>
                        <input
                          type="text"
                          value={productForm.dimensions || ''}
                          onChange={(e) => setProductForm({ ...productForm, dimensions: e.target.value })}
                          placeholder="e.g. 228 cm L × 65 cm W × 36 cm H"
                          className="w-full px-3 py-2 bg-[#181816] border border-stone-700 rounded-lg text-white text-xs"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-stone-300">Material Composition</label>
                      <input
                        type="text"
                        value={productForm.material || ''}
                        onChange={(e) => setProductForm({ ...productForm, material: e.target.value })}
                        placeholder="e.g. Aerospace Aluminum, Hard Maple, High-Density PU"
                        className="w-full px-3 py-2 bg-[#181816] border border-stone-700 rounded-lg text-white text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-stone-300">Spring Configuration</label>
                      <input
                        type="text"
                        value={productForm.springConfiguration || ''}
                        onChange={(e) => setProductForm({ ...productForm, springConfiguration: e.target.value })}
                        placeholder="e.g. 5 Music-Wire Springs (1 Heavy, 2 Medium, 2 Light)"
                        className="w-full px-3 py-2 bg-[#181816] border border-stone-700 rounded-lg text-white text-xs"
                      />
                    </div>

                    {/* Image Management */}
                    <div className="space-y-2 p-3 bg-[#181816] rounded-xl border border-stone-800">
                      <label className="text-xs font-semibold text-white flex items-center justify-between">
                        <span>Product Images (URLs)</span>
                        <span className="text-[10px] text-stone-500 font-normal">Primary image first</span>
                      </label>

                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newImageUrl}
                          onChange={(e) => setNewImageUrl(e.target.value)}
                          placeholder="Paste image URL (https://...)"
                          className="flex-1 px-3 py-1.5 bg-[#0f0f0e] border border-stone-700 rounded-lg text-xs text-white"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (newImageUrl.trim()) {
                              setProductForm({
                                ...productForm,
                                images: [...(productForm.images || []), newImageUrl.trim()]
                              });
                              setNewImageUrl('');
                            }
                          }}
                          className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-amber-400 font-medium rounded-lg text-xs cursor-pointer"
                        >
                          + Add
                        </button>
                      </div>

                      {/* Image Thumbnails List */}
                      <div className="flex flex-wrap gap-2 pt-1">
                        {(productForm.images || []).map((img, idx) => (
                          <div key={idx} className="relative group w-14 h-14 rounded-lg overflow-hidden border border-stone-700">
                            <img src={img} alt="Preview" className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => {
                                const nextImgs = (productForm.images || []).filter((_, i) => i !== idx);
                                setProductForm({ ...productForm, images: nextImgs });
                              }}
                              className="absolute inset-0 bg-black/70 text-rose-400 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>

                      {/* Quick Presets Picker */}
                      <div className="pt-2 border-t border-stone-800">
                        <span className="text-[10px] text-stone-400 block mb-1">Quick Studio Presets:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {PRESET_IMAGES.map((preset, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => {
                                if (!(productForm.images || []).includes(preset.url)) {
                                  setProductForm({
                                    ...productForm,
                                    images: [...(productForm.images || []), preset.url]
                                  });
                                }
                              }}
                              className="px-2 py-0.5 rounded bg-stone-800 hover:bg-stone-700 text-[10px] text-stone-300 cursor-pointer"
                            >
                              + {preset.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Features List input */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-stone-300">Key Features</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newFeatureText}
                          onChange={(e) => setNewFeatureText(e.target.value)}
                          placeholder="Add a product feature..."
                          className="flex-1 px-3 py-1.5 bg-[#181816] border border-stone-700 rounded-lg text-xs text-white"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (newFeatureText.trim()) {
                              setProductForm({
                                ...productForm,
                                features: [...(productForm.features || []), newFeatureText.trim()]
                              });
                              setNewFeatureText('');
                            }
                          }}
                          className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs rounded-lg"
                        >
                          Add
                        </button>
                      </div>
                      <div className="space-y-1 max-h-24 overflow-y-auto">
                        {(productForm.features || []).map((feat, idx) => (
                          <div key={idx} className="flex items-center justify-between px-2.5 py-1 bg-[#181816] rounded text-[11px] text-stone-300">
                            <span>• {feat}</span>
                            <button
                              type="button"
                              onClick={() => {
                                const next = (productForm.features || []).filter((_, i) => i !== idx);
                                setProductForm({ ...productForm, features: next });
                              }}
                              className="text-stone-500 hover:text-rose-400 p-0.5"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-stone-800 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveTab('products')}
                    className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-lg text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold rounded-lg text-xs shadow-md transition-colors"
                  >
                    Save & Publish to Store
                  </button>
                </div>
              </form>
            )}

            {/* TAB 3: STOCK INVENTORY PAGE */}
            {activeTab === 'inventory' && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-serif font-bold text-white">
                      Multi-Hub Regional Stock Allocation
                    </h3>
                    <p className="text-xs text-stone-400">
                      Adjust available units manually per warehouse. Updates sync directly with the storefront and checkout limits.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setInventoryFilter('all')}
                      className={`px-2.5 py-1 rounded text-xs cursor-pointer ${
                        inventoryFilter === 'all' ? 'bg-amber-500 text-stone-950 font-bold' : 'bg-stone-800 text-stone-400'
                      }`}
                    >
                      All ({products.length})
                    </button>
                    <button
                      onClick={() => setInventoryFilter('low')}
                      className={`px-2.5 py-1 rounded text-xs cursor-pointer ${
                        inventoryFilter === 'low' ? 'bg-amber-500 text-stone-950 font-bold' : 'bg-stone-800 text-stone-400'
                      }`}
                    >
                      Low Stock (&le;10)
                    </button>
                    <button
                      onClick={() => setInventoryFilter('out')}
                      className={`px-2.5 py-1 rounded text-xs cursor-pointer ${
                        inventoryFilter === 'out' ? 'bg-amber-500 text-stone-950 font-bold' : 'bg-stone-800 text-stone-400'
                      }`}
                    >
                      Out of Stock
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  {filteredInventory.map(prod => {
                    const total = calculateTotalStock(prod);
                    return (
                      <div key={prod.id} className="p-4 bg-[#181816] rounded-xl border border-stone-800 space-y-3">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-3">
                            <img
                              src={prod.images[0]}
                              alt={prod.name}
                              className="w-10 h-10 object-cover rounded-lg border border-stone-700"
                            />
                            <div>
                              <span className="font-semibold text-white text-xs block">{prod.name}</span>
                              <span className="text-[11px] font-mono text-amber-400">SKU: {prod.sku}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-xs text-stone-400">Total Fleet Stock:</span>
                            <span className={`font-mono font-bold text-sm px-2.5 py-0.5 rounded ${
                              total === 0 ? 'bg-rose-950 text-rose-400 border border-rose-800' :
                              total <= 10 ? 'bg-amber-950 text-amber-400 border border-amber-800' :
                              'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            }`}>
                              {total} units
                            </span>
                          </div>
                        </div>

                        {/* Warehouses Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 pt-2">
                          {WAREHOUSE_NAMES.map(hub => {
                            const whStock = prod.warehouses.find(w => w.warehouse === hub)?.stock || 0;
                            return (
                              <div key={hub} className="p-2.5 bg-[#10100f] rounded-lg border border-stone-800/80 space-y-2">
                                <div className="text-[11px] font-medium text-stone-300 truncate" title={hub}>
                                  {hub}
                                </div>
                                <div className="flex items-center justify-between gap-1">
                                  <button
                                    onClick={() => handleAdjustStock(prod.id, hub, -1)}
                                    className="w-6 h-6 rounded bg-stone-800 hover:bg-stone-700 text-stone-300 flex items-center justify-center text-xs font-bold cursor-pointer"
                                  >
                                    -
                                  </button>
                                  <input
                                    type="number"
                                    min="0"
                                    value={whStock}
                                    onChange={(e) => handleSetExactStock(prod.id, hub, e.target.value)}
                                    className="w-14 text-center py-0.5 bg-[#181816] border border-stone-700 rounded text-xs font-mono text-white font-bold"
                                  />
                                  <button
                                    onClick={() => handleAdjustStock(prod.id, hub, 1)}
                                    className="w-6 h-6 rounded bg-stone-800 hover:bg-stone-700 text-stone-300 flex items-center justify-center text-xs font-bold cursor-pointer"
                                  >
                                    +
                                  </button>
                                </div>
                                <div className="flex items-center justify-between text-[10px] text-stone-500 pt-1 border-t border-stone-800/50">
                                  <button
                                    onClick={() => handleAdjustStock(prod.id, hub, 10)}
                                    className="hover:text-amber-400 cursor-pointer"
                                  >
                                    +10 Restock
                                  </button>
                                  <button
                                    onClick={() => handleSetExactStock(prod.id, hub, '0')}
                                    className="hover:text-rose-400 cursor-pointer"
                                  >
                                    Zero out
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 4: CJ API & DOMAIN SETTINGS */}
            {activeTab === 'integrations' && (
              <div className="space-y-6">

                {/* Section A: CJ API Key Management */}
                <div className="p-4 bg-[#181816] rounded-xl border border-stone-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Server className="w-4 h-4 text-amber-400" />
                      <h4 className="font-serif font-bold text-white text-sm">
                        CJ Dropshipping API v2.0 Credentials
                      </h4>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <a
                        href="https://www.cjdropshipping.com/my.html"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] text-amber-400 hover:text-amber-300 inline-flex items-center gap-1 font-semibold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20"
                        title="Open CJ Dropshipping Merchant Portal"
                      >
                        <span>CJ Portal</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                      <a
                        href="https://developers.cjdropshipping.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] text-stone-300 hover:text-white inline-flex items-center gap-1 font-medium bg-stone-800 px-2 py-0.5 rounded border border-stone-700"
                        title="Open CJ Dropshipping Developer Center"
                      >
                        <span>CJ Developer</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                      <span className="text-[10px] font-mono bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded border border-emerald-800">
                        ID: CJ5837386
                      </span>
                    </div>
                  </div>

                  <form onSubmit={handleSaveCjKey} className="space-y-3">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-xs text-stone-300 font-semibold">Active CJ API Key:</label>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(cjKeyInput);
                            setCopiedKey(true);
                            setTimeout(() => setCopiedKey(false), 2000);
                          }}
                          className="text-[11px] text-stone-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
                        >
                          {copiedKey ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedKey ? 'Copied' : 'Copy Key'}</span>
                        </button>
                      </div>
                      <input
                        type="text"
                        value={cjKeyInput}
                        onChange={(e) => setCjKeyInput(e.target.value)}
                        placeholder="CJ5837386@api@..."
                        className="w-full px-3 py-2 bg-[#121211] border border-stone-700 rounded-lg text-white font-mono text-xs focus:ring-1 focus:ring-amber-500"
                      />
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        type="submit"
                        disabled={cjTestLoading}
                        className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold rounded-lg text-xs transition-colors flex items-center gap-2 cursor-pointer shadow disabled:opacity-50"
                      >
                        <Key className="w-3.5 h-3.5 text-stone-950" />
                        <span>{cjTestLoading ? 'Verifying with CJ...' : 'Save & Verify Key'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setCjKeyInput(DEFAULT_CJ_API_KEY);
                          setCjApiKey(DEFAULT_CJ_API_KEY);
                          showToast('Reset to default owner key');
                        }}
                        className="px-3 py-2 bg-[#121211] hover:bg-stone-800 text-stone-400 hover:text-stone-200 border border-stone-700 rounded-lg text-xs cursor-pointer"
                      >
                        Load Owner Default Key
                      </button>
                    </div>
                  </form>

                  {cjTestStatus && (
                    <div className="p-3 bg-[#121211] rounded-lg border border-stone-800 text-xs space-y-1">
                      <div className="flex items-center gap-2 font-semibold text-emerald-400">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>CJ Connection Validated: {cjTestStatus.message}</span>
                      </div>
                      <p className="text-stone-500 text-[11px]">
                        Orders from the checkout pipeline will automatically route tracking payloads through this endpoint.
                      </p>
                    </div>
                  )}

                  {/* Troubleshooting "Store Not Found" in CJ */}
                  <div className="mt-3 p-3.5 bg-amber-950/20 border border-amber-500/30 rounded-xl space-y-2.5">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-400" />
                        <span className="font-semibold text-amber-300 text-xs">
                          Troubleshooting: CJ shows "Store Not Found" when clicking List / Push?
                        </span>
                      </div>
                      <a
                        href="https://www.cjdropshipping.com/my.html#/authorize/APIStores"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] text-amber-400 hover:text-amber-300 inline-flex items-center gap-1 font-semibold underline"
                      >
                        <span>Open CJ Store Auth Page</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>

                    <p className="text-stone-300 text-[11px] leading-relaxed">
                      On <code className="text-amber-300">cjdropshipping.com</code>, clicking "List" expects an authorized store in your account. To connect Fetecart:
                    </p>

                    <ol className="list-decimal list-inside space-y-1 text-[11px] text-stone-400">
                      <li>Log in to CJ Dropshipping and open <strong>Authorization → API</strong>.</li>
                      <li>Click <strong>"Add Store"</strong>, enter Store Name: <strong className="text-amber-300">Fetecart</strong> and URL: <strong className="text-amber-300">https://fetecart.com</strong>.</li>
                      <li>Click <strong>Save/Authorize</strong>. Once saved, your account recognizes Fetecart as an authorized store.</li>
                      <li>Alternatively, you can always use the <strong>1-Click SKU Importer</strong> in the <em>Add / Edit Product</em> tab without needing CJ's push button!</li>
                    </ol>
                  </div>

                  {/* Live CJ Webhook Receiver Feature Card */}
                  <div className="mt-3 p-3.5 bg-gradient-to-r from-emerald-950/30 to-[#121211] border border-emerald-500/40 rounded-xl space-y-2.5">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
                        <span className="font-semibold text-white text-xs">
                          Live CJ Webhook Listener Active (/api/webhook/cj)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveTab('webhooks')}
                        className="text-[11px] text-emerald-400 hover:text-emerald-300 inline-flex items-center gap-1 font-semibold cursor-pointer underline"
                      >
                        <span>Open Webhook Monitor & Simulator &rarr;</span>
                      </button>
                    </div>

                    <p className="text-stone-300 text-[11px] leading-relaxed">
                      Your store now has an active, fully integrated <strong>CJ Dropshipping Webhook Receiver</strong>. When CJ dispatches an order or assigns a tracking number, they ping your webhook URL and your store immediately attaches the tracking number and notifies the customer.
                    </p>

                    <div className="p-2.5 bg-[#181816] rounded-lg border border-stone-800 text-[11px] space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-stone-400">Public Callback URL:</span>
                        <button
                          type="button"
                          onClick={() => {
                            const url = `${window.location.origin}/api/webhook/cj`;
                            navigator.clipboard.writeText(url);
                            showToast('Webhook URL copied');
                          }}
                          className="text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
                        >
                          <Copy className="w-3 h-3" />
                          <span>Copy URL</span>
                        </button>
                      </div>
                      <code className="text-emerald-400 font-mono text-[10.5px] block truncate">
                        {typeof window !== 'undefined' ? `${window.location.origin}/api/webhook/cj` : 'https://fetecart.com/api/webhook/cj'}
                      </code>
                    </div>
                  </div>
                </div>

                {/* Section B: Custom Domain Configuration */}
                <div className="p-4 bg-[#181816] rounded-xl border border-stone-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-sky-400" />
                      <h4 className="font-serif font-bold text-white text-sm">
                        Custom Domain Mapping: fetecart.com
                      </h4>
                    </div>
                    <span className="text-[10px] text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/40">
                      DNS Ready
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 bg-[#121211] rounded-lg border border-stone-800 space-y-1.5">
                      <span className="font-bold text-white block">1. www Subdomain (CNAME)</span>
                      <div className="text-[11px] font-mono text-stone-400">
                        Host: <strong className="text-amber-400">www</strong><br />
                        Target: <strong className="text-amber-400">ghs.googlehosted.com</strong>
                      </div>
                    </div>

                    <div className="p-3 bg-[#121211] rounded-lg border border-stone-800 space-y-1.5">
                      <span className="font-bold text-white block">2. Apex Forwarding (Root Domain)</span>
                      <div className="text-[11px] font-mono text-stone-400">
                        From: <strong className="text-stone-300">https://fetecart.com</strong><br />
                        To: <strong className="text-stone-300">https://www.fetecart.com</strong> (301 Permanent)
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section C: Security Passcode Settings */}
                <div className="p-4 bg-[#181816] rounded-xl border border-stone-800 space-y-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <h4 className="font-serif font-bold text-white text-sm">
                      Admin Security Passcode Settings
                    </h4>
                  </div>
                  <p className="text-xs text-stone-400">
                    Change the password required to open this downside corner management console.
                  </p>

                  <form onSubmit={handleChangePasscode} className="flex flex-col sm:flex-row items-center gap-3">
                    <input
                      type="password"
                      value={newPasscode}
                      onChange={(e) => setNewPasscode(e.target.value)}
                      placeholder="New Admin Passcode"
                      className="w-full sm:w-48 px-3 py-2 bg-[#121211] border border-stone-700 rounded-lg text-white text-xs"
                    />
                    <input
                      type="password"
                      value={confirmPasscode}
                      onChange={(e) => setConfirmPasscode(e.target.value)}
                      placeholder="Confirm New Passcode"
                      className="w-full sm:w-48 px-3 py-2 bg-[#121211] border border-stone-700 rounded-lg text-white text-xs"
                    />
                    <button
                      type="submit"
                      className="w-full sm:w-auto px-4 py-2 bg-stone-800 hover:bg-stone-700 text-amber-300 font-bold rounded-lg text-xs cursor-pointer"
                    >
                      Update Passcode
                    </button>
                  </form>
                  {passcodeMsg && (
                    <p className={`text-xs ${passcodeSuccess ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {passcodeMsg}
                    </p>
                  )}
                </div>

                {/* Section D: Stripe Gateway & Dashboard Authorization Guide */}
                <div className="p-4 bg-[#181816] rounded-xl border border-stone-800 space-y-4">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-violet-400" />
                      <h4 className="font-serif font-bold text-white text-sm">
                        Stripe Payment Gateway Configuration
                      </h4>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] px-2 py-0.5 rounded border font-mono flex items-center gap-1 text-emerald-400 bg-emerald-950/80 border-emerald-800/50">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                        <span>Configure in Cloudflare</span>
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded border font-mono flex items-center gap-1 ${
                        isStripeLiveMode(stripeKeyInput || getStripePublishableKey())
                          ? 'text-emerald-400 bg-emerald-950/80 border-emerald-800/50'
                          : 'text-amber-400 bg-amber-950/80 border-amber-800/50'
                      }`}>
                        <span>{isStripeLiveMode(stripeKeyInput || getStripePublishableKey()) ? 'Live Production' : 'Test Mode'}</span>
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-stone-300 leading-relaxed">
                    Stripe checkout is configured through your hosting provider. Check the Stripe Dashboard for actual payment status and orders.
                  </p>

                  <p className="text-xs text-amber-300 leading-relaxed rounded-xl border border-amber-800/50 bg-amber-950/20 p-3">
                    Stripe secret keys must be saved as encrypted secrets in Cloudflare Pages Settings → Variables and Secrets under the name STRIPE_SECRET_KEY. Never enter a secret key on this website or store it in the browser.
                  </p>

                  {/* 2. Active Stripe Publishable Key Form */}
                  <form onSubmit={handleSaveStripeKey} className="space-y-2 p-3 bg-[#121211] rounded-xl border border-stone-800">
                    <div className="flex items-center justify-between flex-wrap gap-1">
                      <label className="text-xs font-semibold text-stone-200 flex items-center gap-1.5">
                        <Key className="w-3.5 h-3.5 text-amber-400" />
                        <span>Stripe Publishable Key (pk_live_...)</span>
                        <span className="text-[10px] font-normal text-stone-400 bg-stone-900 px-1.5 py-0.2 rounded border border-stone-800">
                          Client-Side Checkout
                        </span>
                      </label>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleCopyStripeKey}
                          className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
                        >
                          <Copy className="w-3 h-3" />
                          <span>{copiedStripeKey ? 'Copied!' : 'Copy'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleResetStripeKey}
                          className="text-[11px] text-stone-500 hover:text-stone-300 cursor-pointer underline"
                          title="Restore to default live key"
                        >
                          Reset
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        value={stripeKeyInput}
                        onChange={(e) => setStripeKeyInput(e.target.value)}
                        placeholder="pk_live_... or pk_test_..."
                        className="flex-1 px-3 py-2 bg-[#0c0c0b] border border-stone-700 rounded-lg text-white font-mono text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none"
                      />
                      <button
                        type="submit"
                        className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold rounded-lg text-xs transition-colors cursor-pointer whitespace-nowrap"
                      >
                        Save Key
                      </button>
                    </div>

                    <div className="text-[11px] text-stone-400 flex items-center justify-between pt-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-stone-500">Current Key:</span>
                        <code className="text-emerald-400 font-mono text-[10.5px]">
                          {maskStripeKey(stripeKeyInput || getStripePublishableKey())}
                        </code>
                      </div>
                      <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Ready for Customer Payments</span>
                      </span>
                    </div>
                  </form>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                    <div className="p-3 bg-[#121211] rounded-lg border border-stone-800 space-y-1.5">
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        1. What is Working Right Now:
                      </span>
                      <ul className="text-[11px] text-stone-400 space-y-1 list-disc list-inside">
                        <li>Customer credit/debit card entry (Visa, MC, Amex).</li>
                        <li>Automated address & shipping carrier selection.</li>
                        <li>Order confirmation modal with instant tracking code.</li>
                        <li>Compatible with live customer cards and Stripe test cards.</li>
                      </ul>
                    </div>

                    <div className="p-3 bg-[#121211] rounded-lg border border-stone-800 space-y-1.5">
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        <ExternalLink className="w-3.5 h-3.5 text-sky-400" />
                        2. Things to Authorize in Stripe Dashboard:
                      </span>
                      <ul className="text-[11px] text-stone-400 space-y-1 list-disc list-inside">
                        <li>
                          <strong>Authorize Domain:</strong> In Stripe Dashboard &rarr; <em>Settings &rarr; Payment Methods &rarr; Apple Pay</em>, add <code className="text-amber-400">fetecart.com</code>.
                        </li>
                        <li>
                          <strong>Enable Currencies:</strong> Under <em>Payment Methods</em>, toggle ON USD, GBP, EUR, AUD.
                        </li>
                        <li>
                          <strong>Statement Descriptor:</strong> Under <em>Public Details</em>, set statement name to <strong className="text-stone-200">FETECART</strong>.
                        </li>
                      </ul>
                    </div>

                    <div className="md:col-span-2 p-3.5 bg-[#121211] rounded-lg border border-stone-800 space-y-2">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <span className="text-xs font-bold text-white flex items-center gap-1.5">
                          <Radio className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                          3. Stripe Webhook Listener (/api/webhook/stripe)
                        </span>
                        <span className="text-[10px] text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 rounded font-mono">
                          Active &amp; Listening
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-400 leading-relaxed">
                        To receive instant server-to-server notifications for paid checkouts, payment intents, and dashboard refunds, add this webhook endpoint in your <strong className="text-stone-300">Stripe Dashboard &rarr; Developers &rarr; Webhooks</strong>:
                      </p>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          readOnly
                          value={typeof window !== 'undefined' ? `${window.location.origin}/api/webhook/stripe` : 'https://fetecart.com/api/webhook/stripe'}
                          className="flex-1 bg-black border border-stone-800 rounded px-2.5 py-1 text-xs font-mono text-amber-400 select-all"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const url = `${window.location.origin}/api/webhook/stripe`;
                            navigator.clipboard.writeText(url);
                            showToast('Stripe Webhook URL copied to clipboard');
                          }}
                          className="px-3 py-1 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs rounded font-medium cursor-pointer transition-colors"
                        >
                          Copy URL
                        </button>
                      </div>
                      <p className="text-[10px] text-stone-500">
                        Events to select: <code className="text-stone-400">payment_intent.succeeded</code>, <code className="text-stone-400">checkout.session.completed</code>, <code className="text-stone-400">payment_intent.payment_failed</code>, <code className="text-stone-400">charge.refunded</code>.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Section E: Automated Email Sender & Customer Enquiries */}
                <div className="p-4 bg-[#181816] rounded-xl border border-stone-800 space-y-4">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-amber-400" />
                      <h4 className="font-serif font-bold text-white text-sm">
                        Automated Server-Side Email Sender (contact@fetecart.com)
                      </h4>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] px-2 py-0.5 rounded border font-mono flex items-center gap-1 text-emerald-400 bg-emerald-950/80 border-emerald-800/50">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                        <span>Routing: contact@fetecart.com</span>
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded border text-stone-400 bg-stone-900 border-stone-800 font-mono">
                        {inquiries.length} Enquiries Logged
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-stone-300 leading-relaxed">
                    When visitors submit enquiries through the storefront Contact window, this server-side dispatcher formats a high-contrast HTML notification, sends it to <strong className="text-amber-400">contact@fetecart.com</strong> with the customer set as <code className="text-stone-400">Reply-To</code>, and delivers an automated reference ticket acknowledgment to the customer.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="p-3 bg-[#121211] rounded-lg border border-stone-800 space-y-1">
                      <span className="text-[10px] uppercase font-bold text-stone-500 block">Recipient Inbox</span>
                      <strong className="text-white font-mono block truncate">contact@fetecart.com</strong>
                      <span className="text-[10.5px] text-stone-400">Configurable via <code className="text-amber-400">CONTACT_EMAIL</code></span>
                    </div>

                    <div className="p-3 bg-[#121211] rounded-lg border border-stone-800 space-y-1">
                      <span className="text-[10px] uppercase font-bold text-stone-500 block">Sender Identity</span>
                      <strong className="text-white font-mono block truncate">Fetecart Concierge</strong>
                      <span className="text-[10.5px] text-stone-400">Configurable via <code className="text-amber-400">SMTP_FROM</code></span>
                    </div>

                    <div className="p-3 bg-[#121211] rounded-lg border border-stone-800 space-y-1">
                      <span className="text-[10px] uppercase font-bold text-stone-500 block">Relay Protocol</span>
                      <div className="text-emerald-400 font-semibold flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Server Dispatch Active</span>
                      </div>
                      <span className="text-[10.5px] text-stone-400">Auto-relay + Admin Ledger</span>
                    </div>
                  </div>

                  {/* Actions bar */}
                  <div className="flex items-center justify-between flex-wrap gap-2 pt-1 border-t border-stone-800/80">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Inbox className="w-3.5 h-3.5 text-amber-400" />
                      <span>Customer Enquiries Inbox ({inquiries.length})</span>
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={fetchInquiries}
                        disabled={isLoadingInquiries}
                        className="px-2.5 py-1 bg-stone-900 hover:bg-stone-800 text-stone-300 border border-stone-700 rounded text-xs flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <RefreshCw className={`w-3 h-3 ${isLoadingInquiries ? 'animate-spin' : ''}`} />
                        <span>Refresh</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleSendTestInquiry}
                        disabled={isSendingTestInquiry}
                        className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold rounded text-xs flex items-center gap-1 cursor-pointer transition-colors shadow-sm"
                      >
                        <Send className="w-3 h-3" />
                        <span>{isSendingTestInquiry ? 'Sending...' : 'Test Send Enquiry'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Inquiry list */}
                  <div className="space-y-2">
                    {inquiries.length === 0 ? (
                      <div className="p-6 bg-[#121211] rounded-lg border border-stone-800 text-center space-y-2">
                        <Inbox className="w-8 h-8 text-stone-600 mx-auto" />
                        <p className="text-xs text-stone-400">No inquiries received yet in this container session.</p>
                        <p className="text-[11px] text-stone-500">
                          Click &quot;Test Send Enquiry&quot; above to simulate an inquiry and verify automated ticket routing.
                        </p>
                      </div>
                    ) : (
                      inquiries.map((inq: any) => (
                        <div key={inq.id || inq.ticketId} className="p-3.5 bg-[#121211] rounded-xl border border-stone-800 space-y-2">
                          <div className="flex items-start justify-between flex-wrap gap-2">
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-white text-xs">{inq.name}</span>
                                <span className="px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] font-mono font-bold">
                                  {inq.ticketId}
                                </span>
                                <span className="text-[10px] text-stone-500">
                                  {new Date(inq.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <div className="text-[11px] text-stone-400 flex items-center gap-3">
                                <span>Email: <strong className="text-stone-300 font-mono">{inq.email}</strong></span>
                                {inq.phone && <span>Phone: <strong className="text-stone-300">{inq.phone}</strong></span>}
                                <span>Topic: <strong className="text-amber-400">{inq.subject}</strong></span>
                              </div>
                            </div>
                            <a
                              href={`mailto:${inq.email}?subject=${encodeURIComponent(`Re: [Ticket ${inq.ticketId}] ${inq.subject}`)}`}
                              className="px-2.5 py-1 bg-stone-800 hover:bg-stone-700 text-amber-400 rounded text-[11px] font-medium flex items-center gap-1 border border-stone-700 transition-colors"
                            >
                              <Mail className="w-3 h-3" />
                              <span>Reply to Customer</span>
                            </a>
                          </div>
                          <div className="p-2.5 bg-[#181816] rounded-lg border border-stone-800/80 text-xs text-stone-300 leading-relaxed whitespace-pre-wrap">
                            {inq.message}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Section F: Factory Reset Safeguard */}
                <div className="p-4 bg-[#141413] rounded-xl border border-stone-800/80 flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <span className="font-semibold text-white text-xs block">Reset Catalog to Factory Defaults</span>
                    <p className="text-[11px] text-stone-500">
                      Reverts all manual edits back to the initial 8 studio pilates products and stock allocations.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm('Reset all products to initial studio defaults? Any custom added items will be wiped.')) {
                        const defaults = resetProductsToDefault();
                        setProducts(defaults);
                        if (onProductsUpdated) onProductsUpdated(defaults);
                        showToast('Catalog reset to factory default');
                      }
                    }}
                    className="px-3 py-1.5 bg-stone-900 hover:bg-rose-950 text-stone-400 hover:text-rose-300 border border-stone-800 hover:border-rose-800 rounded-lg text-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset Products</span>
                  </button>
                </div>

              </div>
            )}

            {/* TAB 5: CJ DROPSHIPPING WEBHOOKS & REAL-TIME ORDER TRACKING */}
            {activeTab === 'webhooks' && (
              <CjWebhookPanel onShowToast={showToast} initialSubTab="orders" />
            )}

          </div>

          {/* Footer Bar */}
          <div className="px-6 py-3 bg-[#0c0c0b] border-t border-stone-800 flex items-center justify-between text-xs text-stone-400">
            <div className="flex items-center gap-2 text-[11px]">
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>Fetecart Store LLC · Private Administration Engine</span>
            </div>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs cursor-pointer"
            >
              Done & Close
            </button>
          </div>

        </div>
      )}

      {/* Delete Confirmation Modal */}
      {productToDelete && (
        <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-black/90">
          <div className="w-full max-w-sm bg-[#161614] border border-stone-800 rounded-2xl p-6 space-y-4 text-center shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="font-serif font-bold text-white text-base">Delete Product?</h4>
              <p className="text-xs text-stone-400">
                Are you sure you want to permanently remove <strong className="text-white">{productToDelete.name}</strong> from the store catalogue?
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setProductToDelete(null)}
                className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-lg text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteProduct}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg text-xs cursor-pointer shadow"
              >
                Yes, Delete Product
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
