import { create } from 'zustand';
import { IndustryType } from '../types/industry';
import { Tenant, Branch } from '../types/tenant';
import { INITIAL_TENANT } from '../services/mockData';

interface AppState {
  activeIndustry: IndustryType;
  tenant: Tenant;
  isSyncing: boolean;
  isOnline: boolean;
  lastSyncedAt: string | null;

  // Actions
  setIndustry: (industry: IndustryType) => void;
  updateTenant: (partial: Partial<Tenant>) => void;
  setActiveBranch: (branchId: string) => void;
  addBranch: (branch: Branch) => void;
  setOnlineStatus: (online: boolean) => void;
  triggerSync: () => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  activeIndustry: 'pharmacy',
  tenant: INITIAL_TENANT,
  isSyncing: false,
  isOnline: true,
  lastSyncedAt: new Date().toISOString(),

  setIndustry: (industry: IndustryType) => {
    set((state) => ({
      activeIndustry: industry,
      tenant: {
        ...state.tenant,
        industry,
      },
    }));
  },

  updateTenant: (partial: Partial<Tenant>) => {
    set((state) => ({
      tenant: {
        ...state.tenant,
        ...partial,
      },
    }));
  },

  setActiveBranch: (branchId: string) => {
    set((state) => ({
      tenant: {
        ...state.tenant,
        activeBranchId: branchId,
      },
    }));
  },

  addBranch: (branch: Branch) => {
    set((state) => ({
      tenant: {
        ...state.tenant,
        branches: [...state.tenant.branches, branch],
      },
    }));
  },

  setOnlineStatus: (online: boolean) => {
    set({ isOnline: online });
  },

  triggerSync: async () => {
    set({ isSyncing: true });
    // Simulate cloud Firestore multi-tab sync handshake
    await new Promise((resolve) => setTimeout(resolve, 800));
    set({ isSyncing: false, lastSyncedAt: new Date().toISOString() });
  },
}));
