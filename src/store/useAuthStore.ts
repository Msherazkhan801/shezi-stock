import { create } from 'zustand';
import { UserAccount, UserRole, Tenant, AccountStatus } from '../types/tenant';
import { IndustryType } from '../types/industry';
import { useAppStore } from './useAppStore';
import { useInventoryStore } from './useInventoryStore';
import { useSalesStore } from './useSalesStore';
import { FirestoreService } from '../services/firestoreService';

export const INITIAL_TENANTS: Tenant[] = [
  {
    id: 'tenant-admin-hq',
    businessName: 'SheziStock Global HQ',
    industry: 'pharmacy',
    currency: 'USD',
    currencySymbol: '$',
    taxRate: 5,
    enableTax: true,
    branches: [
      {
        id: 'branch-hq-01',
        name: 'Main HQ',
        code: 'HQ-01',
        address: 'Global Operations Tower',
        phone: '+1 (555) 0100',
        email: 'admin@shezistock.io',
        isPrimary: true,
      },
    ],
    activeBranchId: 'branch-hq-01',
    ownerEmail: 'admin@shezistock.io',
    ownerName: 'System Administrator',
    isFirebaseConnected: true,
    offlineMode: false,
    createdAt: '2026-08-01T08:00:00Z',
  },
];

export const INITIAL_USERS: UserAccount[] = [
  {
    id: 'user-admin-01',
    email: 'admin@shezistock.io',
    password: 'admin',
    name: 'Chief Administrator',
    role: 'super_admin',
    status: 'active',
    createdBy: 'admin',
    tenantId: 'tenant-admin-hq',
    storeName: 'SheziStock Global HQ',
    industry: 'pharmacy',
    createdAt: '2026-08-01T08:00:00Z',
    activatedAt: '2026-08-01T08:00:00Z',
  },
];

interface AuthState {
  currentUser: UserAccount | null;
  users: UserAccount[];
  tenants: Tenant[];
  isImpersonating: boolean;
  isFirebaseSyncing: boolean;

  // Actions
  login: (email: string, password?: string) => { success: boolean; error?: string; status?: AccountStatus };
  signup: (params: {
    name: string;
    email: string;
    password?: string;
    storeName: string;
    industry: IndustryType;
    trxId?: string;
  }) => { success: boolean; user?: UserAccount; isPending?: boolean; error?: string; message?: string };
  logout: () => void;
  createStoreAccountAsAdmin: (params: {
    name: string;
    email: string;
    password?: string;
    storeName: string;
    industry: IndustryType;
    role?: UserRole;
  }) => UserAccount;
  activateUserAccount: (userId: string) => void;
  suspendUserAccount: (userId: string) => void;
  deleteUserAccount: (userId: string) => void;
  switchTenantAsAdmin: (tenantId: string) => void;
  deleteTenantAsAdmin: (tenantId: string) => void;
  clearAllDemoData: () => void;
  initAuthSync: () => () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  currentUser: null,
  users: INITIAL_USERS,
  tenants: INITIAL_TENANTS,
  isImpersonating: false,
  isFirebaseSyncing: false,

  login: (email: string, password?: string) => {
    const cleanEmail = email.trim().toLowerCase();
    const user = get().users.find((u) => u.email.toLowerCase() === cleanEmail);

    if (!user) {
      return { success: false, error: 'No account found with this email address.' };
    }

    if (password && user.password && user.password !== password) {
      return { success: false, error: 'Invalid password. Please try again.' };
    }

    // Enforce Approval: Block login if pending or suspended
    if (user.status === 'pending') {
      return {
        success: false,
        status: 'pending',
        error: 'Your account is pending administrator activation. Please contact the admin to activate your store.',
      };
    }

    if (user.status === 'suspended') {
      return {
        success: false,
        status: 'suspended',
        error: 'Your account has been deactivated by the administrator. Contact support for assistance.',
      };
    }

    const tenant = get().tenants.find((t) => t.id === user.tenantId) || INITIAL_TENANTS[0];

    useAppStore.getState().setIndustry(user.industry);
    useAppStore.getState().updateTenant({
      id: tenant.id,
      businessName: user.storeName || tenant.businessName,
      industry: user.industry,
      ownerEmail: user.email,
      ownerName: user.name,
      activeBranchId: tenant.activeBranchId || tenant.branches[0]?.id || 'branch-01',
      branches: tenant.branches,
    });

    // Trigger tenant-scoped inventory and sales synchronization
    useInventoryStore.getState().initInventorySync(tenant.id, tenant.activeBranchId);
    useSalesStore.getState().initSalesSync(tenant.id, tenant.activeBranchId);

    set({ currentUser: user, isImpersonating: false });
    return { success: true, status: user.status };
  },

  signup: ({ name, email, password, storeName, industry, trxId }) => {
    const cleanEmail = email.trim().toLowerCase();
    const existing = get().users.find((u) => u.email.toLowerCase() === cleanEmail);
    if (existing) {
      return { success: false, error: 'An account with this email already exists.' };
    }

    const tenantId = `tenant-${Date.now()}`;
    const branchId = `branch-${Date.now()}`;

    const newTenant: Tenant = {
      id: tenantId,
      businessName: storeName.trim(),
      industry,
      currency: 'USD',
      currencySymbol: '$',
      taxRate: 5,
      enableTax: true,
      branches: [
        {
          id: branchId,
          name: `${storeName.trim()} Main Branch`,
          code: `${industry.substring(0, 3).toUpperCase()}-01`,
          address: 'Main Commercial Location',
          phone: '+1 (555) 0000',
          email: cleanEmail,
          isPrimary: true,
        },
      ],
      activeBranchId: branchId,
      ownerEmail: cleanEmail,
      ownerName: name.trim(),
      isFirebaseConnected: true,
      offlineMode: false,
      createdAt: new Date().toISOString(),
    };

    const newUser: UserAccount = {
      id: `user-${Date.now()}`,
      email: cleanEmail,
      password: password || 'password',
      name: name.trim(),
      role: 'store_owner',
      status: 'pending', // Self-registered accounts start PENDING admin approval
      createdBy: 'self',
      tenantId,
      storeName: storeName.trim(),
      industry,
      trxId: trxId ? trxId.trim() : undefined,
      createdAt: new Date().toISOString(),
    };

    // Update in local state immediately
    set((state) => ({
      tenants: [newTenant, ...state.tenants],
      users: [newUser, ...state.users],
    }));

    // Persist to Cloud Firestore
    FirestoreService.saveTenant(newTenant);
    FirestoreService.saveUser(newUser);

    return {
      success: true,
      user: newUser,
      isPending: true,
      message: 'Store registered successfully! Your account is pending administrator activation. Once approved by the admin, you will be able to log in.',
    };
  },

  logout: () => {
    set({ currentUser: null, isImpersonating: false });
  },

  createStoreAccountAsAdmin: ({ name, email, password, storeName, industry, role = 'store_owner' }) => {
    const tenantId = `tenant-${Date.now()}`;
    const branchId = `branch-${Date.now()}`;

    const newTenant: Tenant = {
      id: tenantId,
      businessName: storeName.trim(),
      industry,
      currency: 'USD',
      currencySymbol: '$',
      taxRate: 5,
      enableTax: true,
      branches: [
        {
          id: branchId,
          name: `${storeName.trim()} Main Branch`,
          code: `${industry.substring(0, 3).toUpperCase()}-01`,
          address: 'Main Commercial Location',
          phone: '+1 (555) 0000',
          email: email.trim().toLowerCase(),
          isPrimary: true,
        },
      ],
      activeBranchId: branchId,
      ownerEmail: email.trim().toLowerCase(),
      ownerName: name.trim(),
      isFirebaseConnected: true,
      offlineMode: false,
      createdAt: new Date().toISOString(),
    };

    const newUser: UserAccount = {
      id: `user-${Date.now()}`,
      email: email.trim().toLowerCase(),
      password: password || 'password',
      name: name.trim(),
      role,
      status: 'active', // Admin created accounts are IMMEDIATELY ACTIVE
      createdBy: 'admin',
      tenantId,
      storeName: storeName.trim(),
      industry,
      createdAt: new Date().toISOString(),
      activatedAt: new Date().toISOString(),
    };

    // Update in local state immediately
    set((state) => ({
      tenants: [newTenant, ...state.tenants],
      users: [newUser, ...state.users],
    }));

    // Persist to Cloud Firestore
    FirestoreService.saveTenant(newTenant);
    FirestoreService.saveUser(newUser);

    return newUser;
  },

  activateUserAccount: (userId: string) => {
    const nowIso = new Date().toISOString();
    set((state) => ({
      users: state.users.map((u) =>
        u.id === userId
          ? { ...u, status: 'active', activatedAt: nowIso }
          : u
      ),
    }));

    // Persist to Cloud Firestore
    FirestoreService.updateUserStatus(userId, 'active', nowIso);
  },

  suspendUserAccount: (userId: string) => {
    set((state) => ({
      users: state.users.map((u) =>
        u.id === userId ? { ...u, status: 'suspended' } : u
      ),
    }));

    // Persist to Cloud Firestore
    FirestoreService.updateUserStatus(userId, 'suspended');
  },

  deleteUserAccount: (userId: string) => {
    const targetUser = get().users.find((u) => u.id === userId);
    if (!targetUser) return;

    set((state) => ({
      users: state.users.filter((u) => u.id !== userId),
      tenants: state.tenants.filter((t) => t.id !== targetUser.tenantId),
    }));

    // Remove products for this tenant
    useInventoryStore.getState().setProducts(
      useInventoryStore.getState().products.filter((p) => p.tenantId !== targetUser.tenantId)
    );

    // Delete from Cloud Firestore
    FirestoreService.deleteUser(userId);
    if (targetUser.tenantId && targetUser.tenantId !== 'tenant-admin-hq') {
      FirestoreService.deleteTenant(targetUser.tenantId);
    }
  },

  switchTenantAsAdmin: (tenantId: string) => {
    const tenant = get().tenants.find((t) => t.id === tenantId);
    if (!tenant) return;

    useAppStore.getState().setIndustry(tenant.industry);
    useAppStore.getState().updateTenant(tenant);
    set({ isImpersonating: true });

    useInventoryStore.getState().initInventorySync(tenant.id, tenant.activeBranchId);
    useSalesStore.getState().initSalesSync(tenant.id, tenant.activeBranchId);
  },

  deleteTenantAsAdmin: (tenantId: string) => {
    set((state) => ({
      tenants: state.tenants.filter((t) => t.id !== tenantId),
      users: state.users.filter((u) => u.tenantId !== tenantId),
    }));

    useInventoryStore.getState().setProducts(
      useInventoryStore.getState().products.filter((p) => p.tenantId !== tenantId)
    );

    // Delete from Cloud Firestore
    if (tenantId !== 'tenant-admin-hq') {
      FirestoreService.deleteTenant(tenantId);
    }
  },

  clearAllDemoData: () => {
    // Reset to only super admin and clean slate
    set({
      currentUser: null,
      users: INITIAL_USERS,
      tenants: INITIAL_TENANTS,
      isImpersonating: false,
    });
    useSalesStore.setState({ sales: [], audits: [] });
    // Re-sync existing products from Firestore
    useInventoryStore.getState().refreshFromDatabase();
  },

  initAuthSync: () => {
    set({ isFirebaseSyncing: true });

    // Seed super admin user and tenant into Firestore if not present
    FirestoreService.saveUser(INITIAL_USERS[0]);
    FirestoreService.saveTenant(INITIAL_TENANTS[0]);

    // Subscribe to Firestore users in real-time
    const unsubscribeUsers = FirestoreService.subscribeUsers((remoteUsers) => {
      if (!remoteUsers || remoteUsers.length === 0) return;

      set((state) => {
        const userMap = new Map<string, UserAccount>();

        // Always preserve base admin
        INITIAL_USERS.forEach((u) => userMap.set(u.id, u));

        // Add / merge local users
        state.users.forEach((u) => userMap.set(u.id, u));

        // Merge incoming remote Firestore users
        remoteUsers.forEach((ru) => {
          userMap.set(ru.id, ru);
        });

        const mergedUsers = Array.from(userMap.values());

        // Update currentUser if their remote record changed (e.g. activated by admin)
        let updatedCurrentUser = state.currentUser;
        if (state.currentUser) {
          const freshCurrent = userMap.get(state.currentUser.id);
          if (freshCurrent) {
            updatedCurrentUser = freshCurrent;
          }
        }

        return {
          users: mergedUsers,
          currentUser: updatedCurrentUser,
          isFirebaseSyncing: false,
        };
      });
    });

    // Subscribe to Firestore tenants in real-time
    const unsubscribeTenants = FirestoreService.subscribeTenants((remoteTenants) => {
      if (!remoteTenants || remoteTenants.length === 0) return;

      set((state) => {
        const tenantMap = new Map<string, Tenant>();

        // Always preserve HQ tenant
        INITIAL_TENANTS.forEach((t) => tenantMap.set(t.id, t));

        // Add local tenants
        state.tenants.forEach((t) => tenantMap.set(t.id, t));

        // Merge incoming remote Firestore tenants
        remoteTenants.forEach((rt) => {
          tenantMap.set(rt.id, rt);
        });

        return {
          tenants: Array.from(tenantMap.values()),
        };
      });
    });

    return () => {
      unsubscribeUsers();
      unsubscribeTenants();
    };
  },
}));

// Initialize real-time synchronization on module load
try {
  useAuthStore.getState().initAuthSync();
} catch (e) {
  console.warn('Auto auth sync initialization deferred:', e);
}


