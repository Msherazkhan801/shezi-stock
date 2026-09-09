import { create } from 'zustand';
import { SaleTransaction } from '../types/sale';
import { StockAudit } from '../types/audit';
import { IndustryType } from '../types/industry';
import { FirestoreService } from '../services/firestoreService';
import { useAppStore } from './useAppStore';

export const calculateSaleProfit = (sale: SaleTransaction) => {
  const revenue = sale.grandTotal;
  let totalCost = 0;

  if (sale.items && Array.isArray(sale.items)) {
    sale.items.forEach((item) => {
      // Prioritize FEFO batch cost (Pharmacy) -> Product cost price -> fallback estimate
      const itemCostUnit =
        item.selectedBatch?.costPrice !== undefined && item.selectedBatch?.costPrice > 0
          ? item.selectedBatch.costPrice
          : item.product?.costPrice !== undefined && item.product?.costPrice > 0
          ? item.product.costPrice
          : item.unitPrice * 0.6; // default 40% margin fallback if cost not configured

      totalCost += itemCostUnit * (item.quantity || 1);
    });
  }

  const netProfit = revenue - totalCost;
  const marginPercent = revenue > 0 ? (netProfit / revenue) * 100 : 0;

  return {
    revenue,
    cost: totalCost,
    netProfit,
    marginPercent: Math.max(-100, Math.min(100, marginPercent)),
  };
};

export interface SalesState {
  sales: SaleTransaction[];
  audits: StockAudit[];
  isSalesSyncing: boolean;

  // Actions
  setSales: (sales: SaleTransaction[]) => void;
  addSale: (sale: SaleTransaction) => void;
  addAudit: (audit: StockAudit) => void;
  getSalesByIndustry: (industry: IndustryType, tenantId?: string) => SaleTransaction[];
  getSaleProfit: (sale: SaleTransaction) => {
    revenue: number;
    cost: number;
    netProfit: number;
    marginPercent: number;
  };
  getTodayStats: (industry: IndustryType, tenantId?: string) => {
    revenue: number;
    cost: number;
    netProfit: number;
    profitMargin: number;
    ordersCount: number;
    avgOrderValue: number;
  };
  getAllTimeStats: (industry: IndustryType, tenantId?: string) => {
    totalRevenue: number;
    totalCost: number;
    netProfit: number;
    profitMargin: number;
    totalOrders: number;
    totalUnitsSold: number;
  };
  getRevenueByDay: (industry: IndustryType, days?: number, tenantId?: string) => {
    date: string;
    revenue: number;
    cost: number;
    profit: number;
    orders: number;
  }[];
  getTopSellingItems: (industry: IndustryType, limit?: number, tenantId?: string) => {
    name: string;
    quantity: number;
    revenue: number;
    profit: number;
  }[];
  initSalesSync: (tenantId: string, branchId: string) => () => void;
}

export const useSalesStore = create<SalesState>((set, get) => ({
  sales: [],
  audits: [],
  isSalesSyncing: false,

  setSales: (sales) => set({ sales }),

  addSale: (sale) => {
    set((state) => {
      // Avoid duplicate sale entries if already present
      const exists = state.sales.some((s) => s.id === sale.id);
      if (exists) {
        return {
          sales: state.sales.map((s) => (s.id === sale.id ? sale : s)),
        };
      }
      return {
        sales: [sale, ...state.sales],
      };
    });
  },

  addAudit: (audit) => {
    set((state) => ({
      audits: [audit, ...state.audits],
    }));
    FirestoreService.recordStockAudit(audit.tenantId, audit.branchId, audit);
  },

  getSaleProfit: (sale: SaleTransaction) => {
    return calculateSaleProfit(sale);
  },

  getSalesByIndustry: (industry, tenantId) => {
    const currentTenant = tenantId || useAppStore.getState().tenant?.id;
    return get().sales.filter((s) => {
      if (s.industry !== industry) return false;
      if (currentTenant && currentTenant !== 'tenant-admin-hq') {
        if (s.tenantId && s.tenantId !== currentTenant) return false;
      }
      return true;
    });
  },

  getTodayStats: (industry, tenantId) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const targetSales = get().getSalesByIndustry(industry, tenantId).filter((s) => {
      return s.createdAt.startsWith(todayStr);
    });

    let revenue = 0;
    let cost = 0;

    targetSales.forEach((s) => {
      const p = calculateSaleProfit(s);
      revenue += p.revenue;
      cost += p.cost;
    });

    const netProfit = revenue - cost;
    const profitMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;
    const ordersCount = targetSales.length;
    const avgOrderValue = ordersCount > 0 ? revenue / ordersCount : 0;

    return {
      revenue,
      cost,
      netProfit,
      profitMargin,
      ordersCount,
      avgOrderValue,
    };
  },

  getAllTimeStats: (industry, tenantId) => {
    const targetSales = get().getSalesByIndustry(industry, tenantId);

    let totalRevenue = 0;
    let totalCost = 0;
    let totalUnitsSold = 0;

    targetSales.forEach((s) => {
      const p = calculateSaleProfit(s);
      totalRevenue += p.revenue;
      totalCost += p.cost;
      if (s.items) {
        totalUnitsSold += s.items.reduce((sum, i) => sum + (i.quantity || 0), 0);
      }
    });

    const netProfit = totalRevenue - totalCost;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    return {
      totalRevenue,
      totalCost,
      netProfit,
      profitMargin,
      totalOrders: targetSales.length,
      totalUnitsSold,
    };
  },

  getRevenueByDay: (industry, days = 7, tenantId) => {
    const list = get().getSalesByIndustry(industry, tenantId);
    const grouped: Record<string, { revenue: number; cost: number; profit: number; orders: number }> = {};

    list.forEach((s) => {
      const day = s.createdAt.split('T')[0];
      const p = calculateSaleProfit(s);
      if (!grouped[day]) {
        grouped[day] = { revenue: 0, cost: 0, profit: 0, orders: 0 };
      }
      grouped[day].revenue += p.revenue;
      grouped[day].cost += p.cost;
      grouped[day].profit += p.netProfit;
      grouped[day].orders += 1;
    });

    return Object.entries(grouped)
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date));
  },

  getTopSellingItems: (industry, limit = 5, tenantId) => {
    const sales = get().getSalesByIndustry(industry, tenantId);
    const itemMap = new Map<string, { name: string; quantity: number; revenue: number; profit: number }>();

    sales.forEach((s) => {
      s.items?.forEach((item) => {
        const itemRevenue = item.totalPrice || 0;
        const itemCost = (item.selectedBatch?.costPrice ?? item.product?.costPrice ?? (item.unitPrice * 0.6)) * (item.quantity || 1);
        const itemProfit = itemRevenue - itemCost;

        const existing = itemMap.get(item.product.name) || {
          name: item.product.name,
          quantity: 0,
          revenue: 0,
          profit: 0,
        };
        existing.quantity += item.quantity || 1;
        existing.revenue += itemRevenue;
        existing.profit += itemProfit;
        itemMap.set(item.product.name, existing);
      });
    });

    return Array.from(itemMap.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, limit);
  },

  initSalesSync: (tenantId: string, branchId: string) => {
    set({ isSalesSyncing: true });

    const unsubscribe = FirestoreService.subscribeSales(tenantId, branchId, (remoteSales) => {
      if (!remoteSales) return;

      set((state) => {
        const saleMap = new Map<string, SaleTransaction>();

        // Add existing local sales
        state.sales.forEach((s) => saleMap.set(s.id, s));

        // Merge incoming remote sales
        remoteSales.forEach((rs) => saleMap.set(rs.id, rs));

        const mergedSales = Array.from(saleMap.values()).sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        return {
          sales: mergedSales,
          isSalesSyncing: false,
        };
      });
    });

    return unsubscribe;
  },
}));

