import { IndustryType } from './industry';

export interface AuditItem {
  productId: string;
  productName: string;
  sku: string;
  barcode: string;
  systemStock: number;
  physicalStock: number;
  discrepancy: number; // physicalStock - systemStock
  unitCost: number;
  lossGainValue: number;
  notes?: string;
  scannedAt: string;
}

export interface StockAudit {
  id: string;
  tenantId: string;
  branchId: string;
  industry: IndustryType;
  auditTitle: string;
  auditorName: string;
  status: 'draft' | 'completed' | 'reconciled';
  items: AuditItem[];
  totalExpectedUnits: number;
  totalCountedUnits: number;
  totalDiscrepancyUnits: number;
  totalLossGainValue: number;
  createdAt: string;
  reconciledAt?: string;
}
