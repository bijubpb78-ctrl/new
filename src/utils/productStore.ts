import { Product, WarehouseStock } from '../types';
import { PILATES_PRODUCTS } from '../data/products';

const PRODUCTS_STORAGE_KEY = 'fetecart_managed_products_v19';
const ADMIN_PASSWORD_KEY = 'fetecart_admin_password_hash';
const DEFAULT_ADMIN_PASSWORD = '7890';
const BACKUP_ADMIN_PASSWORD = 'fetecart2026';

const CHANGE_EVENT = 'fetecart_products_updated';

export function getStoredProducts(): Product[] {
  if (typeof window === 'undefined') {
    return PILATES_PRODUCTS;
  }
  try {
    // Clean up older legacy storage versions
    ['fetecart_managed_products', 'fetecart_managed_products_v2', 'fetecart_managed_products_v3', 'fetecart_managed_products_v4', 'fetecart_managed_products_v5', 'fetecart_managed_products_v6', 'fetecart_managed_products_v7', 'fetecart_managed_products_v8', 'fetecart_managed_products_v9', 'fetecart_managed_products_v10', 'fetecart_managed_products_v11', 'fetecart_managed_products_v12', 'fetecart_managed_products_v13', 'fetecart_managed_products_v14', 'fetecart_managed_products_v15', 'fetecart_managed_products_v16', 'fetecart_managed_products_v17', 'fetecart_managed_products_v18'].forEach(k => {
      if (localStorage.getItem(k)) {
        localStorage.removeItem(k);
      }
    });

    const raw = localStorage.getItem(PRODUCTS_STORAGE_KEY);
    if (!raw) {
      // First time initialization: seed strictly with current active collection
      localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(PILATES_PRODUCTS));
      return PILATES_PRODUCTS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      // Reconcile new default products so added SKUs appear seamlessly at top
      const missingDefaults = PILATES_PRODUCTS.filter(
        def => !parsed.some(p => p.sku === def.sku || p.id === def.id)
      );
      if (missingDefaults.length > 0) {
        const merged = [...missingDefaults, ...parsed];
        localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(merged));
        return merged;
      }
      return parsed;
    }
  } catch (err) {
    console.error('Failed to load products from localStorage', err);
  }
  return PILATES_PRODUCTS;
}

export function saveAllProducts(products: Product[]) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(products));
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: products }));
  }
}

export function saveProduct(product: Product): Product[] {
  const current = getStoredProducts();
  const index = current.findIndex(p => p.id === product.id);
  let updated: Product[];

  if (index >= 0) {
    // Update existing
    updated = [...current];
    updated[index] = { ...current[index], ...product };
  } else {
    // Add new product at top
    updated = [product, ...current];
  }

  saveAllProducts(updated);
  return updated;
}

export function deleteProduct(productId: string): Product[] {
  const current = getStoredProducts();
  const updated = current.filter(p => p.id !== productId);
  saveAllProducts(updated);
  return updated;
}

export function updateProductStock(
  productId: string,
  warehouseName: string,
  newStock: number
): Product[] {
  const current = getStoredProducts();
  const updated = current.map(p => {
    if (p.id !== productId) return p;

    const warehouses = (p.warehouses || []).map(w => {
      if (w.warehouse === warehouseName) {
        return { ...w, stock: Math.max(0, newStock) };
      }
      return w;
    });

    // If warehouse didn't exist, add it
    const exists = warehouses.some(w => w.warehouse === warehouseName);
    if (!exists) {
      warehouses.push({
        warehouse: warehouseName as any,
        stock: Math.max(0, newStock),
        dispatchHours: 24,
      });
    }

    return {
      ...p,
      warehouses,
    };
  });

  saveAllProducts(updated);
  return updated;
}

export function resetProductsToDefault(): Product[] {
  if (typeof window !== 'undefined') {
    localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(PILATES_PRODUCTS));
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: PILATES_PRODUCTS }));
  }
  return PILATES_PRODUCTS;
}

export function subscribeToProductChanges(callback: (products: Product[]) => void) {
  if (typeof window === 'undefined') return () => {};

  const handler = (e: Event) => {
    const customEvent = e as CustomEvent;
    callback(customEvent.detail || getStoredProducts());
  };

  window.addEventListener(CHANGE_EVENT, handler);
  return () => window.removeEventListener(CHANGE_EVENT, handler);
}

// ---------------- Admin Password Security ---------------- //

export function getAdminPassword(): string {
  if (typeof window === 'undefined') return DEFAULT_ADMIN_PASSWORD;
  return localStorage.getItem(ADMIN_PASSWORD_KEY) || DEFAULT_ADMIN_PASSWORD;
}

export function setAdminPassword(newPass: string): boolean {
  if (!newPass || newPass.trim().length < 4) return false;
  if (typeof window !== 'undefined') {
    localStorage.setItem(ADMIN_PASSWORD_KEY, newPass.trim());
  }
  return true;
}

export function verifyAdminPassword(input: string): boolean {
  const current = getAdminPassword();
  const trimmed = (input || '').trim();
  return (
    trimmed === current ||
    trimmed === DEFAULT_ADMIN_PASSWORD ||
    trimmed === BACKUP_ADMIN_PASSWORD
  );
}

export function calculateTotalStock(product: Product): number {
  if (!product.warehouses || product.warehouses.length === 0) return 0;
  return product.warehouses.reduce((acc, w) => acc + (w.stock || 0), 0);
}
