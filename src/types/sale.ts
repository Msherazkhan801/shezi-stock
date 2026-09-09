import { IndustryType } from './industry';
import { Product, BatchRecord } from './product';

export interface CartItem {
  id: string; // cart item unique id
  product: Product;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  discount: number; // percentage or fixed
  selectedBatch?: BatchRecord; // Pharmacy: selected batch for FEFO
  isWholesale?: boolean; // General store: wholesale pricing toggle
  cartonCount?: number; // General store: carton unit
  specialInstructions?: string; // Restaurant: e.g. "No onions, extra spicy"
  appliedIngredients?: { ingredientId: string; quantityToDeduct: number }[]; // Restaurant
}

export type PaymentMethod = 'cash' | 'card' | 'online' | 'split' | 'credit_ledger';

export type OrderType = 'walk_in' | 'dine_in' | 'takeaway' | 'delivery' | 'wholesale';

export interface SaleTransaction {
  id: string;
  invoiceNumber: string;
  tenantId: string;
  branchId: string;
  industry: IndustryType;
  items: CartItem[];
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  grandTotal: number;
  paymentMethod: PaymentMethod;
  paymentStatus: 'paid' | 'partial' | 'due' | 'refunded';
  amountReceived: number;
  changeDue: number;
  customerName?: string;
  customerPhone?: string;
  notes?: string;
  orderType: OrderType;
  tableNumber?: string; // Restaurant
  waiterName?: string; // Restaurant
  pharmacistLicense?: string; // Pharmacy
  prescriptionId?: string; // Pharmacy
  cashierName: string;
  createdAt: string;
}
