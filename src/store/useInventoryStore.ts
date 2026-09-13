import { create } from 'zustand';
import { Product, BatchRecord, RecipeIngredient } from '../types/product';
import { IndustryType } from '../types/industry';
import {
  MOCK_PHARMACY_PRODUCTS,
  MOCK_GENERAL_STORE_PRODUCTS,
  MOCK_RESTAURANT_PRODUCTS,
} from '../services/mockData';
import { FirestoreService } from '../services/firestoreService';
import { useAppStore } from './useAppStore';

const initialPharma = MOCK_PHARMACY_PRODUCTS.map((p) => ({ ...p, tenantId: 'tenant-pharm-01' }));
const initialGen = MOCK_GENERAL_STORE_PRODUCTS.map((p) => ({ ...p, tenantId: 'tenant-gen-02' }));
const initialRest = MOCK_RESTAURANT_PRODUCTS.map((p) => ({ ...p, tenantId: 'tenant-rest-03' }));

export interface InventoryState {
  products: Product[];
  selectedCategory: string;
  searchQuery: string;
  isSyncing: boolean;
  lastSyncedAt: string | null;

  // Actions
  setProducts: (products: Product[]) => void;
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => Product;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  adjustStock: (productId: string, newStock: number, reason?: string) => void;

  // Pharmacy Specific
  addBatchToProduct: (productId: string, batch: Omit<BatchRecord, 'id'>) => void;
  updateBatch: (productId: string, batchId: string, updates: Partial<BatchRecord>) => void;

  // Restaurant Specific
  updateRecipe: (dishId: string, recipe: RecipeIngredient[]) => void;

  // Real-time Cloud Sync
  initInventorySync: (tenantId?: string, branchId?: string) => () => void;
  refreshFromDatabase: (tenantId?: string, branchId?: string) => Promise<void>;

  // Getters
  getProductsByIndustry: (industry: IndustryType, tenantId?: string) => Product[];
  getLowStockProducts: (industry: IndustryType, tenantId?: string) => Product[];
  getExpiringProducts: (daysThreshold?: number, tenantId?: string) => { product: Product; batch: BatchRecord; daysLeft: number }[];
  getExpiredProducts: (tenantId?: string) => { product: Product; batch: BatchRecord }[];
  getRawIngredients: (tenantId?: string) => Product[];
  getPreparedDishes: (tenantId?: string) => Product[];
  resetToDefaults: () => void;
}

export const useInventoryStore = create<InventoryState>((set, get) => ({
  products: [
    ...initialPharma,
    ...initialGen,
    ...initialRest,
  ],
  selectedCategory: 'All',
  searchQuery: '',
  isSyncing: false,
  lastSyncedAt: new Date().toISOString(),

  setProducts: (products: Product[]) => set({ products }),

  addProduct: (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    const currentTenant = useAppStore.getState().tenant;
    const currentIndustry = useAppStore.getState().activeIndustry;

    const newProduct: Product = {
      ...productData,
      id: `prod-${Date.now()}`,
      tenantId: productData.tenantId || currentTenant?.id || 'tenant-admin-hq',
      branchId: productData.branchId || currentTenant?.activeBranchId || 'branch-hq-01',
      industry: ((productData.industry || currentIndustry || 'pharmacy').toLowerCase().trim()) as IndustryType,
      isActive: productData.isActive !== false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    set((state) => ({
      products: [newProduct, ...state.products.filter((p) => p.id !== newProduct.id)],
    }));

    FirestoreService.saveProduct(newProduct.tenantId, newProduct.branchId, newProduct);
    return newProduct;
  },

  updateProduct: (id: string, updates: Partial<Product>) => {
    set((state) => {
      const updatedList = state.products.map((p) => {
        if (p.id === id) {
          const updated: Product = {
            ...p,
            ...updates,
            industry: updates.industry ? (((updates.industry as string).toLowerCase().trim()) as IndustryType) : p.industry,
            updatedAt: new Date().toISOString(),
          };
          FirestoreService.saveProduct(p.tenantId, p.branchId, updated);
          return updated;
        }
        return p;
      });
      return { products: updatedList };
    });
  },

  deleteProduct: (id: string) => {
    const targetProduct = get().products.find((p) => p.id === id);
    set((state) => ({
      products: state.products.filter((p) => p.id !== id),
    }));
    if (targetProduct) {
      FirestoreService.deleteProduct(targetProduct.tenantId, targetProduct.branchId, id);
    }
  },

  adjustStock: (productId: string, newStock: number, reason?: string) => {
    set((state) => {
      const updatedList = state.products.map((p) => {
        if (p.id === productId) {
          const updated: Product = {
            ...p,
            currentStock: Math.max(0, newStock),
            updatedAt: new Date().toISOString(),
          };
          FirestoreService.saveProduct(p.tenantId, p.branchId, updated);
          return updated;
        }
        return p;
      });
      return { products: updatedList };
    });
  },

  addBatchToProduct: (productId: string, batchData: Omit<BatchRecord, 'id'>) => {
    set((state) => {
      const updatedList = state.products.map((p) => {
        if (p.id === productId) {
          const newBatch: BatchRecord = {
            ...batchData,
            id: `batch-${Date.now()}`,
          };
          const currentBatches = p.batches || [];
          const updatedBatches = [...currentBatches, newBatch];
          const newStock = updatedBatches.reduce((sum, b) => sum + b.quantity, 0);

          const updated: Product = {
            ...p,
            batches: updatedBatches,
            currentStock: newStock,
            updatedAt: new Date().toISOString(),
          };
          FirestoreService.saveProduct(p.tenantId, p.branchId, updated);
          return updated;
        }
        return p;
      });
      return { products: updatedList };
    });
  },

  updateBatch: (productId: string, batchId: string, updates: Partial<BatchRecord>) => {
    set((state) => {
      const updatedList = state.products.map((p) => {
        if (p.id === productId && p.batches) {
          const updatedBatches = p.batches.map((b) => (b.id === batchId ? { ...b, ...updates } : b));
          const newStock = updatedBatches.reduce((sum, b) => sum + b.quantity, 0);
          const updated: Product = {
            ...p,
            batches: updatedBatches,
            currentStock: newStock,
            updatedAt: new Date().toISOString(),
          };
          FirestoreService.saveProduct(p.tenantId, p.branchId, updated);
          return updated;
        }
        return p;
      });
      return { products: updatedList };
    });
  },

  updateRecipe: (dishId: string, recipe: RecipeIngredient[]) => {
    set((state) => {
      const updatedList = state.products.map((p) => {
        if (p.id === dishId) {
          const updated: Product = {
            ...p,
            recipe,
            updatedAt: new Date().toISOString(),
          };
          FirestoreService.saveProduct(p.tenantId, p.branchId, updated);
          return updated;
        }
        return p;
      });
      return { products: updatedList };
    });
  },

  refreshFromDatabase: async (tenantId?: string, branchId?: string) => {
    set({ isSyncing: true });
    try {
      const remoteProducts = await FirestoreService.fetchProducts(tenantId, branchId);
      if (remoteProducts && remoteProducts.length > 0) {
        set((state) => {
          const map = new Map<string, Product>();
          state.products.forEach((p) => map.set(p.id, p));
          remoteProducts.forEach((rp) => map.set(rp.id, rp));
          return {
            products: Array.from(map.values()),
            isSyncing: false,
            lastSyncedAt: new Date().toISOString(),
          };
        });
      } else {
        set({ isSyncing: false, lastSyncedAt: new Date().toISOString() });
      }
    } catch (e) {
      console.warn('Manual inventory refresh deferred:', e);
      set({ isSyncing: false });
    }
  },

  initInventorySync: (tenantId?: string, branchId?: string) => {
    set({ isSyncing: true });

    // 1. Trigger initial fetch
    FirestoreService.fetchProducts(tenantId, branchId).then((remoteProducts) => {
      if (remoteProducts && remoteProducts.length > 0) {
        set((state) => {
          const map = new Map<string, Product>();
          // Keep existing local products
          state.products.forEach((p) => map.set(p.id, p));
          // Merge incoming database products
          remoteProducts.forEach((rp) => map.set(rp.id, rp));
          return {
            products: Array.from(map.values()),
            isSyncing: false,
            lastSyncedAt: new Date().toISOString(),
          };
        });
      } else {
        set({ isSyncing: false });
      }
    }).catch((err) => {
      console.warn('Initial product sync fetch error:', err);
      set({ isSyncing: false });
    });

    // 2. Subscribe to real-time updates
    const unsubscribe = FirestoreService.subscribeProducts(tenantId, branchId, (remoteProducts) => {
      if (!remoteProducts || remoteProducts.length === 0) return;

      set((state) => {
        const map = new Map<string, Product>();
        // Keep existing
        state.products.forEach((p) => map.set(p.id, p));
        // Overwrite / add from database
        remoteProducts.forEach((rp) => map.set(rp.id, rp));

        return {
          products: Array.from(map.values()),
          isSyncing: false,
          lastSyncedAt: new Date().toISOString(),
        };
      });
    });

    return unsubscribe;
  },

  getProductsByIndustry: (industry: IndustryType, tenantId?: string) => {
    const target = (industry || 'pharmacy').toLowerCase().trim();
    const currentTenant = tenantId || useAppStore.getState().tenant?.id;

    return get().products.filter((p) => {
      const pInd = (p.industry || 'pharmacy').toLowerCase().trim();
      if (pInd !== target) return false;
      if (p.isActive === false) return false;
      // Strict multi-tenant isolation
      if (currentTenant && currentTenant !== 'tenant-admin-hq') {
        if (p.tenantId && p.tenantId !== currentTenant) return false;
      }
      return true;
    });
  },

  getLowStockProducts: (industry: IndustryType, tenantId?: string) => {
    const target = (industry || 'pharmacy').toLowerCase().trim();
    const currentTenant = tenantId || useAppStore.getState().tenant?.id;

    return get().products.filter((p) => {
      const pInd = (p.industry || 'pharmacy').toLowerCase().trim();
      if (pInd !== target) return false;
      if (p.isActive === false) return false;
      if (currentTenant && currentTenant !== 'tenant-admin-hq') {
        if (p.tenantId && p.tenantId !== currentTenant) return false;
      }
      return p.currentStock <= p.minStockAlert;
    });
  },

  getExpiringProducts: (daysThreshold = 60, tenantId?: string) => {
    const today = new Date();
    const currentTenant = tenantId || useAppStore.getState().tenant?.id;
    const results: { product: Product; batch: BatchRecord; daysLeft: number }[] = [];

    get().products
      .filter((p) => {
        const pInd = (p.industry || 'pharmacy').toLowerCase().trim();
        if (pInd !== 'pharmacy' || !p.batches || p.batches.length === 0) return false;
        if (p.isActive === false) return false;
        if (currentTenant && currentTenant !== 'tenant-admin-hq') {
          if (p.tenantId && p.tenantId !== currentTenant) return false;
        }
        return true;
      })
      .forEach((p) => {
        p.batches?.forEach((b) => {
          const exp = new Date(b.expiryDate);
          const diffDays = Math.ceil((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          if (diffDays > 0 && diffDays <= daysThreshold) {
            results.push({ product: p, batch: b, daysLeft: diffDays });
          }
        });
      });

    return results.sort((a, b) => a.daysLeft - b.daysLeft);
  },

  getExpiredProducts: (tenantId?: string) => {
    const today = new Date();
    const currentTenant = tenantId || useAppStore.getState().tenant?.id;
    const results: { product: Product; batch: BatchRecord }[] = [];

    get().products
      .filter((p) => {
        const pInd = (p.industry || 'pharmacy').toLowerCase().trim();
        if (pInd !== 'pharmacy' || !p.batches || p.batches.length === 0) return false;
        if (p.isActive === false) return false;
        if (currentTenant && currentTenant !== 'tenant-admin-hq') {
          if (p.tenantId && p.tenantId !== currentTenant) return false;
        }
        return true;
      })
      .forEach((p) => {
        p.batches?.forEach((b) => {
          const exp = new Date(b.expiryDate);
          if (exp.getTime() < today.getTime()) {
            results.push({ product: p, batch: b });
          }
        });
      });

    return results;
  },

  getRawIngredients: (tenantId?: string) => {
    const currentTenant = tenantId || useAppStore.getState().tenant?.id;
    return get().products.filter((p) => {
      const pInd = (p.industry || '').toLowerCase().trim();
      if (pInd !== 'restaurant' || p.itemType !== 'raw_ingredient') return false;
      if (p.isActive === false) return false;
      if (currentTenant && currentTenant !== 'tenant-admin-hq') {
        if (p.tenantId && p.tenantId !== currentTenant) return false;
      }
      return true;
    });
  },

  getPreparedDishes: (tenantId?: string) => {
    const currentTenant = tenantId || useAppStore.getState().tenant?.id;
    return get().products.filter((p) => {
      const pInd = (p.industry || '').toLowerCase().trim();
      if (pInd !== 'restaurant' || p.itemType !== 'prepared_dish') return false;
      if (p.isActive === false) return false;
      if (currentTenant && currentTenant !== 'tenant-admin-hq') {
        if (p.tenantId && p.tenantId !== currentTenant) return false;
      }
      return true;
    });
  },

  resetToDefaults: () => {
    set({
      products: [
        ...initialPharma,
        ...initialGen,
        ...initialRest,
      ],
    });
  },
}));

// Automatically initialize inventory sync on module load
try {
  useInventoryStore.getState().initInventorySync();
} catch (e) {
  console.warn('Auto inventory sync initialization deferred:', e);
}
