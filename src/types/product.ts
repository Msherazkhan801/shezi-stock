import { IndustryType } from './industry';

export interface BatchRecord {
  id: string;
  batchNumber: string;
  expiryDate: string; // YYYY-MM-DD
  quantity: number;
  costPrice: number;
  sellingPrice: number;
  supplier?: string;
  manufacturingDate?: string;
}

export interface RecipeIngredient {
  ingredientId: string;
  ingredientName: string;
  quantityUsed: number;
  unit: string;
}

export interface Product {
  id: string;
  tenantId: string;
  branchId: string;
  industry: IndustryType;
  name: string;
  sku: string;
  barcode: string;
  category: string;
  costPrice: number;
  sellingPrice: number;
  currentStock: number;
  minStockAlert: number;
  unit: string;
  imageUrl?: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;

  // Sector: Pharmacy
  genericFormula?: string;
  dosageForm?: string; // Tablet, Capsule, Syrup, Injection, etc.
  requiresPrescription?: boolean;
  manufacturer?: string;
  batches?: BatchRecord[];

  // Sector: General Store
  rackLocation?: string; // e.g. "Aisle 2 - Rack B"
  bulkSku?: string;
  cartonQuantity?: number; // e.g. 12 units/carton
  wholesalePrice?: number;
  supplierName?: string;
  reorderLevel?: number;

  // Sector: Restaurant
  itemType?: 'prepared_dish' | 'raw_ingredient';
  recipe?: RecipeIngredient[];
  prepTimeMinutes?: number;
  foodCategory?: string; // Starter, Main, Dessert, Drink, Ingredient
  allergens?: string[];
  kitchenStation?: string; // Grill, Bar, Kitchen
}
