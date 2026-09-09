import { create } from 'zustand';
import { Product, BatchRecord } from '../types/product';
import { CartItem, OrderType, PaymentMethod, SaleTransaction } from '../types/sale';
import { Tenant } from '../types/tenant';
import { FirestoreService } from '../services/firestoreService';
import { useSalesStore } from './useSalesStore';

export interface PosState {
  cart: CartItem[];
  orderType: OrderType;
  tableNumber: string;
  customerName: string;
  customerPhone: string;
  paymentMethod: PaymentMethod;
  discountPercentage: number;
  specialInstructions: string;
  isWholesaleModeGlobal: boolean;

  // Actions
  addToCart: (product: Product, customBatch?: BatchRecord) => boolean;
  removeFromCart: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, delta: number) => void;
  setQuantity: (cartItemId: string, qty: number) => void;
  toggleWholesaleTier: (cartItemId: string) => void;
  setCartItemBatch: (cartItemId: string, batch: BatchRecord) => void;
  setItemInstructions: (cartItemId: string, instructions: string) => void;
  setOrderType: (type: OrderType) => void;
  setTableNumber: (table: string) => void;
  setCustomer: (name: string, phone?: string) => void;
  setPaymentMethod: (method: PaymentMethod) => void;
  setDiscount: (percentage: number) => void;
  clearCart: () => void;

  // Computed / Checkout
  getSubtotal: () => number;
  getTaxTotal: (taxRate?: number, enableTax?: boolean) => number;
  getDiscountTotal: () => number;
  getGrandTotal: (taxRate?: number, enableTax?: boolean) => number;
  processCheckout: (
    amountReceived: number,
    tenant: Tenant,
    currentProducts: Product[],
    cashierName?: string
  ) => Promise<{ sale: SaleTransaction; updatedProducts: Product[] } | null>;
}

export const usePosStore = create<PosState>((set, get) => ({
  cart: [],
  orderType: 'walk_in',
  tableNumber: '',
  customerName: '',
  customerPhone: '',
  paymentMethod: 'cash',
  discountPercentage: 0,
  specialInstructions: '',
  isWholesaleModeGlobal: false,

  addToCart: (product: Product, customBatch?: BatchRecord) => {
    const isPharma = product.industry === 'pharmacy';

    let selectedBatch = customBatch;
    if (isPharma && !selectedBatch && product.batches && product.batches.length > 0) {
      const today = new Date().toISOString().split('T')[0];
      const validBatches = [...product.batches]
        .filter((b) => b.quantity > 0 && b.expiryDate >= today)
        .sort((a, b) => a.expiryDate.localeCompare(b.expiryDate));

      selectedBatch = validBatches.length > 0 ? validBatches[0] : product.batches[0];
    }

    const cart = get().cart;
    const existingIndex = cart.findIndex(
      (item) =>
        item.product.id === product.id &&
        (!isPharma || item.selectedBatch?.id === selectedBatch?.id)
    );

    if (existingIndex > -1) {
      const updatedCart = [...cart];
      const current = updatedCart[existingIndex];
      const newQty = current.quantity + 1;
      const unitPrice = current.isWholesale && product.wholesalePrice ? product.wholesalePrice : product.sellingPrice;
      
      updatedCart[existingIndex] = {
        ...current,
        quantity: newQty,
        totalPrice: unitPrice * newQty,
      };
      set({ cart: updatedCart });
      return true;
    }

    const unitPrice = product.sellingPrice;
    const newItem: CartItem = {
      id: `cart-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      product,
      quantity: 1,
      unitPrice,
      totalPrice: unitPrice,
      discount: 0,
      selectedBatch,
      isWholesale: false,
    };

    set({ cart: [...cart, newItem] });
    return true;
  },

  removeFromCart: (cartItemId: string) => {
    set((state) => ({
      cart: state.cart.filter((item) => item.id !== cartItemId),
    }));
  },

  updateQuantity: (cartItemId: string, delta: number) => {
    set((state) => {
      const updatedCart = state.cart
        .map((item) => {
          if (item.id === cartItemId) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            return {
              ...item,
              quantity: newQty,
              totalPrice: item.unitPrice * newQty,
            };
          }
          return item;
        })
        .filter(Boolean) as CartItem[];

      return { cart: updatedCart };
    });
  },

  setQuantity: (cartItemId: string, qty: number) => {
    if (qty <= 0) {
      get().removeFromCart(cartItemId);
      return;
    }
    set((state) => ({
      cart: state.cart.map((item) => {
        if (item.id === cartItemId) {
          return {
            ...item,
            quantity: qty,
            totalPrice: item.unitPrice * qty,
          };
        }
        return item;
      }),
    }));
  },

  toggleWholesaleTier: (cartItemId: string) => {
    set((state) => ({
      cart: state.cart.map((item) => {
        if (item.id === cartItemId) {
          const nextWholesale = !item.isWholesale;
          const unitPrice =
            nextWholesale && item.product.wholesalePrice
              ? item.product.wholesalePrice
              : item.product.sellingPrice;

          return {
            ...item,
            isWholesale: nextWholesale,
            unitPrice,
            totalPrice: unitPrice * item.quantity,
          };
        }
        return item;
      }),
    }));
  },

  setCartItemBatch: (cartItemId: string, batch: BatchRecord) => {
    set((state) => ({
      cart: state.cart.map((item) => {
        if (item.id === cartItemId) {
          return {
            ...item,
            selectedBatch: batch,
          };
        }
        return item;
      }),
    }));
  },

  setItemInstructions: (cartItemId: string, instructions: string) => {
    set((state) => ({
      cart: state.cart.map((item) => {
        if (item.id === cartItemId) {
          return {
            ...item,
            specialInstructions: instructions,
          };
        }
        return item;
      }),
    }));
  },

  setOrderType: (orderType: OrderType) => set({ orderType }),
  setTableNumber: (tableNumber: string) => set({ tableNumber }),
  setCustomer: (customerName: string, customerPhone = '') => set({ customerName, customerPhone }),
  setPaymentMethod: (paymentMethod: PaymentMethod) => set({ paymentMethod }),
  setDiscount: (discountPercentage: number) => set({ discountPercentage }),

  clearCart: () =>
    set({
      cart: [],
      discountPercentage: 0,
      customerName: '',
      customerPhone: '',
      tableNumber: '',
      specialInstructions: '',
    }),

  getSubtotal: () => {
    return get().cart.reduce((sum, item) => sum + item.totalPrice, 0);
  },

  getDiscountTotal: () => {
    const subtotal = get().getSubtotal();
    return (subtotal * get().discountPercentage) / 100;
  },

  getTaxTotal: (taxRate = 5, enableTax = true) => {
    const subtotal = get().getSubtotal();
    const discount = get().getDiscountTotal();
    const taxableAmount = Math.max(0, subtotal - discount);
    if (!enableTax) return 0;
    return (taxableAmount * taxRate) / 100;
  },

  getGrandTotal: (taxRate = 5, enableTax = true) => {
    const subtotal = get().getSubtotal();
    const discount = get().getDiscountTotal();
    const tax = get().getTaxTotal(taxRate, enableTax);
    return Math.max(0, subtotal - discount + tax);
  },

  processCheckout: async (
    amountReceived: number,
    tenant: Tenant,
    currentProducts: Product[],
    cashierName = 'Store Manager'
  ) => {
    const state = get();
    if (state.cart.length === 0) return null;

    const subtotal = state.getSubtotal();
    const discountTotal = state.getDiscountTotal();
    const taxTotal = state.getTaxTotal(tenant.taxRate, tenant.enableTax);
    const grandTotal = state.getGrandTotal(tenant.taxRate, tenant.enableTax);
    const changeDue = Math.max(0, amountReceived - grandTotal);

    const industryPrefix =
      tenant.industry === 'pharmacy' ? 'PHARM' : tenant.industry === 'restaurant' ? 'REST' : 'GEN';
    const invoiceNumber = `INV-${industryPrefix}-${Math.floor(1000 + Math.random() * 9000)}`;

    const sale: SaleTransaction = {
      id: `sale-${Date.now()}`,
      invoiceNumber,
      tenantId: tenant.id,
      branchId: tenant.activeBranchId,
      industry: tenant.industry,
      items: [...state.cart],
      subtotal,
      discountTotal,
      taxTotal,
      grandTotal,
      paymentMethod: state.paymentMethod,
      paymentStatus: 'paid',
      amountReceived,
      changeDue,
      customerName: state.customerName || (state.orderType === 'dine_in' ? state.tableNumber : 'Walk-in Customer'),
      customerPhone: state.customerPhone,
      orderType: state.orderType,
      tableNumber: state.tableNumber,
      cashierName,
      createdAt: new Date().toISOString(),
    };

    // Immediately record in Sales store for instant UI reactivity
    useSalesStore.getState().addSale(sale);

    const { updatedProducts } = await FirestoreService.recordSaleTransaction(
      tenant,
      sale,
      currentProducts
    );

    state.clearCart();

    return { sale, updatedProducts };
  },
}));
