import { Product } from '../types/product';

export class BarcodeService {
  /**
   * Look up a product in the given list by barcode or SKU
   */
  static findProductByBarcode(products: Product[], query: string): Product | undefined {
    const cleanQuery = query.trim().toLowerCase();
    if (!cleanQuery) return undefined;

    return products.find(
      (p) =>
        p.barcode.toLowerCase() === cleanQuery ||
        p.sku.toLowerCase() === cleanQuery ||
        (p.bulkSku && p.bulkSku.toLowerCase() === cleanQuery)
    );
  }

  /**
   * Generate a unique standardized barcode (e.g. for new products)
   */
  static generateBarcode(prefix: string = '890'): string {
    const randomPart = Math.floor(100000000 + Math.random() * 900000000).toString();
    return `${prefix}${randomPart}`;
  }

  /**
   * Check if a scanned barcode has an exact or partial match for search
   */
  static searchProducts(products: Product[], query: string): Product[] {
    const q = query.trim().toLowerCase();
    if (!q) return products;

    return products.filter((p) => {
      const matchName = p.name.toLowerCase().includes(q);
      const matchBarcode = p.barcode.toLowerCase().includes(q);
      const matchSku = p.sku.toLowerCase().includes(q);
      const matchCategory = p.category.toLowerCase().includes(q);
      const matchGeneric = p.genericFormula?.toLowerCase().includes(q);
      const matchRack = p.rackLocation?.toLowerCase().includes(q);

      return matchName || matchBarcode || matchSku || matchCategory || matchGeneric || matchRack;
    });
  }
}
