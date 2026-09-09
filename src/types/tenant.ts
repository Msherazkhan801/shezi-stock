import { IndustryType } from './industry';

export type UserRole = 'super_admin' | 'store_owner' | 'cashier';
export type AccountStatus = 'active' | 'pending' | 'suspended';

export interface UserAccount {
  id: string;
  email: string;
  password?: string;
  name: string;
  role: UserRole;
  status: AccountStatus;
  createdBy: 'admin' | 'self';
  tenantId: string;
  storeName: string;
  industry: IndustryType;
  phone?: string;
  avatar?: string;
  createdAt: string;
  activatedAt?: string;
}

export interface Branch {
  id: string;
  name: string;
  code: string;
  address: string;
  phone: string;
  email: string;
  isPrimary: boolean;
}

export interface Tenant {
  id: string;
  businessName: string;
  industry: IndustryType;
  currency: string;
  currencySymbol: string;
  taxRate: number; // e.g. 5 for 5%
  enableTax: boolean;
  branches: Branch[];
  activeBranchId: string;
  ownerEmail: string;
  ownerName: string;
  isFirebaseConnected: boolean;
  offlineMode: boolean;
  createdAt: string;
}
