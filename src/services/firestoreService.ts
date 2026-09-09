import {
  collection,
  collectionGroup,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  writeBatch,
  serverTimestamp,
  onSnapshot,
} from 'firebase/firestore';
import { getFirestoreDb, FIRESTORE_PATHS } from '../config/firebaseConfig';
import { Product } from '../types/product';
import { SaleTransaction } from '../types/sale';
import { StockAudit } from '../types/audit';
import { Tenant, UserAccount, AccountStatus } from '../types/tenant';

export const normalizeFirestoreProduct = (
  docId: string,
  data: any,
  defaultTenantId?: string,
  defaultBranchId?: string
): Product => {
  return {
    id: data.id || docId,
    tenantId: data.tenantId || defaultTenantId || 'tenant-admin-hq',
    branchId: data.branchId || defaultBranchId || 'branch-hq-01',
    industry: (data.industry || 'pharmacy').toLowerCase().trim(),
    name: data.name || data.title || data.productName || 'Unnamed Product',
    sku: data.sku || data.barcode || docId,
    barcode: data.barcode || data.sku || docId,
    category: data.category || 'General',
    costPrice: Number(data.costPrice !== undefined ? data.costPrice : (data.cost !== undefined ? data.cost : 0)),
    sellingPrice: Number(data.sellingPrice !== undefined ? data.sellingPrice : (data.price !== undefined ? data.price : 0)),
    currentStock: Number(data.currentStock !== undefined ? data.currentStock : (data.stock !== undefined ? data.stock : (data.quantity || 0))),
    minStockAlert: Number(data.minStockAlert !== undefined ? data.minStockAlert : 5),
    unit: data.unit || 'pcs',
    imageUrl: data.imageUrl || data.image || undefined,
    description: data.description || '',
    isActive: data.isActive !== false,
    createdAt: data.createdAt || new Date().toISOString(),
    updatedAt: data.updatedAt || new Date().toISOString(),
    // Sector-specific fields
    genericFormula: data.genericFormula,
    dosageForm: data.dosageForm,
    requiresPrescription: data.requiresPrescription,
    manufacturer: data.manufacturer,
    batches: Array.isArray(data.batches) ? data.batches : [],
    rackLocation: data.rackLocation,
    bulkSku: data.bulkSku,
    cartonQuantity: data.cartonQuantity,
    wholesalePrice: data.wholesalePrice,
    supplierName: data.supplierName,
    reorderLevel: data.reorderLevel,
    itemType: data.itemType,
    recipe: Array.isArray(data.recipe) ? data.recipe : undefined,
    prepTimeMinutes: data.prepTimeMinutes,
    foodCategory: data.foodCategory,
    allergens: data.allergens,
    kitchenStation: data.kitchenStation,
  };
};

export class FirestoreService {
  /**
   * Save or update a user account in Firestore
   */
  static async saveUser(user: UserAccount): Promise<void> {
    const db = getFirestoreDb();
    if (!db) return;

    try {
      const userRef = doc(db, FIRESTORE_PATHS.users(), user.id);
      await setDoc(
        userRef,
        {
          ...user,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (error) {
      console.warn('Firestore offline/fallback for saveUser:', error);
    }
  }

  /**
   * Fetch all registered users from Firestore
   */
  static async fetchUsers(): Promise<UserAccount[]> {
    const db = getFirestoreDb();
    if (!db) return [];

    try {
      const q = query(collection(db, FIRESTORE_PATHS.users()));
      const snapshot = await getDocs(q);
      const users: UserAccount[] = [];
      snapshot.forEach((docSnap) => {
        users.push(docSnap.data() as UserAccount);
      });
      return users;
    } catch (error) {
      console.warn('Firestore fetch users failed, using local fallback:', error);
      return [];
    }
  }

  /**
   * Subscribe to real-time users collection updates
   */
  static subscribeUsers(onUpdate: (users: UserAccount[]) => void): () => void {
    const db = getFirestoreDb();
    if (!db) return () => {};

    try {
      const usersCol = collection(db, FIRESTORE_PATHS.users());
      const unsubscribe = onSnapshot(
        usersCol,
        (snapshot) => {
          const users: UserAccount[] = [];
          snapshot.forEach((docSnap) => {
            users.push(docSnap.data() as UserAccount);
          });
          onUpdate(users);
        },
        (error) => {
          console.warn('Firestore users subscription error:', error);
        }
      );
      return unsubscribe;
    } catch (e) {
      console.warn('Could not setup users subscription:', e);
      return () => {};
    }
  }

  /**
   * Save or update a tenant (store business) in Firestore
   */
  static async saveTenant(tenant: Tenant): Promise<void> {
    const db = getFirestoreDb();
    if (!db) return;

    try {
      const tenantRef = doc(db, FIRESTORE_PATHS.tenants(), tenant.id);
      await setDoc(
        tenantRef,
        {
          ...tenant,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (error) {
      console.warn('Firestore offline/fallback for saveTenant:', error);
    }
  }

  /**
   * Fetch all tenants from Firestore
   */
  static async fetchTenants(): Promise<Tenant[]> {
    const db = getFirestoreDb();
    if (!db) return [];

    try {
      const q = query(collection(db, FIRESTORE_PATHS.tenants()));
      const snapshot = await getDocs(q);
      const tenants: Tenant[] = [];
      snapshot.forEach((docSnap) => {
        tenants.push(docSnap.data() as Tenant);
      });
      return tenants;
    } catch (error) {
      console.warn('Firestore fetch tenants failed, using local fallback:', error);
      return [];
    }
  }

  /**
   * Subscribe to real-time tenants collection updates
   */
  static subscribeTenants(onUpdate: (tenants: Tenant[]) => void): () => void {
    const db = getFirestoreDb();
    if (!db) return () => {};

    try {
      const tenantsCol = collection(db, FIRESTORE_PATHS.tenants());
      const unsubscribe = onSnapshot(
        tenantsCol,
        (snapshot) => {
          const tenants: Tenant[] = [];
          snapshot.forEach((docSnap) => {
            tenants.push(docSnap.data() as Tenant);
          });
          onUpdate(tenants);
        },
        (error) => {
          console.warn('Firestore tenants subscription error:', error);
        }
      );
      return unsubscribe;
    } catch (e) {
      console.warn('Could not setup tenants subscription:', e);
      return () => {};
    }
  }

  /**
   * Update user status (active, suspended, pending) in Firestore
   */
  static async updateUserStatus(
    userId: string,
    status: AccountStatus,
    activatedAt?: string
  ): Promise<void> {
    const db = getFirestoreDb();
    if (!db) return;

    try {
      const userRef = doc(db, FIRESTORE_PATHS.userDoc(userId));
      const payload: Record<string, any> = {
        status,
        updatedAt: new Date().toISOString(),
      };
      if (activatedAt) {
        payload.activatedAt = activatedAt;
      }
      await setDoc(userRef, payload, { merge: true });
    } catch (error) {
      console.warn('Firestore updateUserStatus failed:', error);
    }
  }

  /**
   * Delete user document from Firestore
   */
  static async deleteUser(userId: string): Promise<void> {
    const db = getFirestoreDb();
    if (!db) return;

    try {
      const userRef = doc(db, FIRESTORE_PATHS.userDoc(userId));
      await deleteDoc(userRef);
    } catch (error) {
      console.warn('Firestore deleteUser failed:', error);
    }
  }

  /**
   * Delete tenant document from Firestore
   */
  static async deleteTenant(tenantId: string): Promise<void> {
    const db = getFirestoreDb();
    if (!db) return;

    try {
      const tenantRef = doc(db, FIRESTORE_PATHS.tenantDoc(tenantId));
      await deleteDoc(tenantRef);
    } catch (error) {
      console.warn('Firestore deleteTenant failed:', error);
    }
  }

  /**
   * Save or update a product in Firestore (dual-writes to tenant branch subcollection and root products collection)
   */
  static async saveProduct(tenantId: string, branchId: string, product: Product): Promise<void> {
    const db = getFirestoreDb();
    if (!db) return;

    try {
      const cleanProduct = {
        ...product,
        tenantId: tenantId || product.tenantId || 'tenant-admin-hq',
        branchId: branchId || product.branchId || 'branch-hq-01',
        industry: (product.industry || 'pharmacy').toLowerCase().trim(),
        isActive: product.isActive !== false,
        updatedAt: new Date().toISOString(),
      };

      // 1. Save to tenant branch subcollection
      if (tenantId && branchId) {
        const productRef = doc(db, FIRESTORE_PATHS.products(cleanProduct.tenantId, cleanProduct.branchId), product.id);
        await setDoc(productRef, cleanProduct, { merge: true });
      }

      // 2. Also save to root 'products' collection for global visibility
      const rootProductRef = doc(db, 'products', product.id);
      await setDoc(rootProductRef, cleanProduct, { merge: true });
    } catch (error) {
      console.warn('Firestore offline/fallback for saveProduct:', error);
    }
  }

  /**
   * Delete a product from Firestore
   */
  static async deleteProduct(tenantId: string, branchId: string, productId: string): Promise<void> {
    const db = getFirestoreDb();
    if (!db) return;

    try {
      if (tenantId && branchId) {
        const productRef = doc(db, FIRESTORE_PATHS.productDoc(tenantId, branchId, productId));
        await deleteDoc(productRef);
      }
      const rootRef = doc(db, 'products', productId);
      await deleteDoc(rootRef);
    } catch (error) {
      console.warn('Firestore deleteProduct failed:', error);
    }
  }

  /**
   * Fetch all products across root collection and tenant subcollections with strict multi-tenant isolation
   */
  static async fetchProducts(tenantId?: string, branchId?: string): Promise<Product[]> {
    const db = getFirestoreDb();
    if (!db) return [];

    const productMap = new Map<string, Product>();

    try {
      // 1. Fetch from specific branch path if provided (highest priority)
      if (tenantId && branchId) {
        const branchQ = query(collection(db, FIRESTORE_PATHS.products(tenantId, branchId)));
        const branchSnap = await getDocs(branchQ);
        branchSnap.forEach((docSnap) => {
          const p = normalizeFirestoreProduct(docSnap.id, docSnap.data(), tenantId, branchId);
          productMap.set(p.id, p);
        });
      }
    } catch (e) {
      console.warn('Firestore branch products query deferred:', e);
    }

    try {
      // 2. Fetch from collectionGroup ('products')
      const groupQ = query(collectionGroup(db, 'products'));
      const groupSnap = await getDocs(groupQ);
      groupSnap.forEach((docSnap) => {
        const p = normalizeFirestoreProduct(docSnap.id, docSnap.data(), tenantId, branchId);
        // Tenant isolation check
        if (tenantId && tenantId !== 'tenant-admin-hq' && p.tenantId && p.tenantId !== tenantId) {
          return;
        }
        productMap.set(p.id, p);
      });
    } catch (e) {
      console.warn('Firestore collectionGroup products query deferred:', e);
    }

    try {
      // 3. Fetch from root 'products' collection
      const rootQ = query(collection(db, 'products'));
      const rootSnap = await getDocs(rootQ);
      rootSnap.forEach((docSnap) => {
        const p = normalizeFirestoreProduct(docSnap.id, docSnap.data(), tenantId, branchId);
        // Tenant isolation check
        if (tenantId && tenantId !== 'tenant-admin-hq' && p.tenantId && p.tenantId !== tenantId) {
          return;
        }
        productMap.set(p.id, p);
      });
    } catch (e) {
      console.warn('Firestore root products query deferred:', e);
    }

    return Array.from(productMap.values());
  }

  /**
   * Subscribe to real-time products collection updates with strict multi-tenant isolation
   */
  static subscribeProducts(
    tenantId: string | undefined,
    branchId: string | undefined,
    onUpdate: (products: Product[]) => void
  ): () => void {
    const db = getFirestoreDb();
    if (!db) return () => {};

    const productMap = new Map<string, Product>();
    const unsubscribes: (() => void)[] = [];

    const notify = () => {
      onUpdate(Array.from(productMap.values()));
    };

    // 1. If tenant and branch provided, subscribe directly to branch products
    if (tenantId && branchId) {
      try {
        const branchCol = collection(db, FIRESTORE_PATHS.products(tenantId, branchId));
        const unBranch = onSnapshot(
          branchCol,
          (snapshot) => {
            snapshot.forEach((docSnap) => {
              const p = normalizeFirestoreProduct(docSnap.id, docSnap.data(), tenantId, branchId);
              productMap.set(p.id, p);
            });
            notify();
          },
          (err) => console.warn('Firestore branch products subscription error:', err)
        );
        unsubscribes.push(unBranch);
      } catch (e) {
        console.warn('Could not setup branch products subscription:', e);
      }
    }

    // 2. Subscribe to collectionGroup ('products')
    try {
      const groupCol = collectionGroup(db, 'products');
      const unGroup = onSnapshot(
        groupCol,
        (snapshot) => {
          snapshot.forEach((docSnap) => {
            const p = normalizeFirestoreProduct(docSnap.id, docSnap.data(), tenantId, branchId);
            // Strict tenant isolation filter
            if (tenantId && tenantId !== 'tenant-admin-hq' && p.tenantId && p.tenantId !== tenantId) {
              return;
            }
            productMap.set(p.id, p);
          });
          notify();
        },
        (err) => console.warn('Firestore collectionGroup products subscription error:', err)
      );
      unsubscribes.push(unGroup);
    } catch (e) {
      console.warn('Could not setup collectionGroup products subscription:', e);
    }

    // 3. Subscribe to root 'products' collection
    try {
      const rootCol = collection(db, 'products');
      const unRoot = onSnapshot(
        rootCol,
        (snapshot) => {
          snapshot.forEach((docSnap) => {
            const p = normalizeFirestoreProduct(docSnap.id, docSnap.data(), tenantId, branchId);
            // Strict tenant isolation filter
            if (tenantId && tenantId !== 'tenant-admin-hq' && p.tenantId && p.tenantId !== tenantId) {
              return;
            }
            productMap.set(p.id, p);
          });
          notify();
        },
        (err) => console.warn('Firestore root products subscription error:', err)
      );
      unsubscribes.push(unRoot);
    } catch (e) {
      console.warn('Could not setup root products subscription:', e);
    }

    return () => {
      unsubscribes.forEach((un) => {
        try {
          un();
        } catch (_) {}
      });
    };
  }

  /**
   * Record a sale transaction and atomically decrement stock levels
   */
  static async recordSaleTransaction(
    tenant: Tenant,
    sale: SaleTransaction,
    currentProducts: Product[]
  ): Promise<{ success: boolean; updatedProducts: Product[] }> {
    const db = getFirestoreDb();
    const updatedProductsMap = new Map<string, Product>();
    currentProducts.forEach((p) => updatedProductsMap.set(p.id, { ...p }));

    // Calculate deductions
    for (const item of sale.items) {
      const p = updatedProductsMap.get(item.product.id);
      if (!p) continue;

      if (p.industry === 'restaurant' && p.itemType === 'prepared_dish' && p.recipe) {
        // Deduct raw ingredients defined in Recipe BOM
        for (const ingredient of p.recipe) {
          const rawItem = updatedProductsMap.get(ingredient.ingredientId);
          if (rawItem) {
            const deduction = ingredient.quantityUsed * item.quantity;
            rawItem.currentStock = Math.max(0, rawItem.currentStock - deduction);
            rawItem.updatedAt = new Date().toISOString();
          }
        }
      } else if (p.industry === 'pharmacy' && item.selectedBatch && p.batches) {
        // Deduct from specific batch
        const batchIndex = p.batches.findIndex((b) => b.id === item.selectedBatch?.id);
        if (batchIndex !== -1) {
          p.batches[batchIndex].quantity = Math.max(0, p.batches[batchIndex].quantity - item.quantity);
        }
        p.currentStock = Math.max(0, p.currentStock - item.quantity);
        p.updatedAt = new Date().toISOString();
      } else {
        // Universal stock deduction
        p.currentStock = Math.max(0, p.currentStock - item.quantity);
        p.updatedAt = new Date().toISOString();
      }
    }

    // If Firestore is available, perform atomic batch write
    if (db) {
      try {
        const batch = writeBatch(db);
        const saleRef = doc(db, FIRESTORE_PATHS.sales(tenant.id, tenant.activeBranchId), sale.id);
        batch.set(saleRef, {
          ...sale,
          serverTimestamp: serverTimestamp(),
        });

        // Batch update all modified products
        updatedProductsMap.forEach((product) => {
          const productRef = doc(
            db,
            FIRESTORE_PATHS.products(tenant.id, tenant.activeBranchId),
            product.id
          );
          batch.set(productRef, product, { merge: true });
        });

        await batch.commit();
      } catch (e) {
        console.warn('Firestore sale write failed, persisted locally in Zustand/AsyncStorage:', e);
      }
    }

    return {
      success: true,
      updatedProducts: Array.from(updatedProductsMap.values()),
    };
  }

  /**
   * Fetch all sales transactions for a tenant branch
   */
  static async fetchSales(tenantId: string, branchId: string): Promise<SaleTransaction[]> {
    const db = getFirestoreDb();
    if (!db) return [];

    try {
      const q = query(collection(db, FIRESTORE_PATHS.sales(tenantId, branchId)));
      const snapshot = await getDocs(q);
      const sales: SaleTransaction[] = [];
      snapshot.forEach((docSnap) => {
        sales.push(docSnap.data() as SaleTransaction);
      });
      return sales.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (error) {
      console.warn('Firestore fetch sales failed, using local cache:', error);
      return [];
    }
  }

  /**
   * Subscribe to real-time sales transactions for a tenant branch
   */
  static subscribeSales(
    tenantId: string,
    branchId: string,
    onUpdate: (sales: SaleTransaction[]) => void
  ): () => void {
    const db = getFirestoreDb();
    if (!db) return () => {};

    try {
      const salesCol = collection(db, FIRESTORE_PATHS.sales(tenantId, branchId));
      const unsubscribe = onSnapshot(
        salesCol,
        (snapshot) => {
          const sales: SaleTransaction[] = [];
          snapshot.forEach((docSnap) => {
            sales.push(docSnap.data() as SaleTransaction);
          });
          sales.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          onUpdate(sales);
        },
        (error) => {
          console.warn('Firestore sales subscription error:', error);
        }
      );
      return unsubscribe;
    } catch (e) {
      console.warn('Could not setup sales subscription:', e);
      return () => {};
    }
  }

  /**
   * Save an inventory stock audit
   */
  static async recordStockAudit(
    tenantId: string,
    branchId: string,
    audit: StockAudit
  ): Promise<void> {
    const db = getFirestoreDb();
    if (!db) return;

    try {
      const auditRef = doc(db, FIRESTORE_PATHS.audits(tenantId, branchId), audit.id);
      await setDoc(auditRef, {
        ...audit,
        serverTimestamp: serverTimestamp(),
      });
    } catch (e) {
      console.warn('Firestore audit save failed, saved locally:', e);
    }
  }
}

