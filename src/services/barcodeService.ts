import { Product } from '../types/product';

export class BarcodeService {
  /**
   * Look up a product in the given list by barcode, SKU, or bulk SKU with resilient normalization
   */
  static findProductByBarcode(products: Product[], query: string): Product | undefined {
    if (!query) return undefined;
    const cleanQuery = query.trim().toLowerCase();
    if (!cleanQuery) return undefined;

    // Direct match
    const directMatch = products.find(
      (p) =>
        (p.barcode && p.barcode.toLowerCase() === cleanQuery) ||
        (p.sku && p.sku.toLowerCase() === cleanQuery) ||
        (p.bulkSku && p.bulkSku.toLowerCase() === cleanQuery) ||
        (p.id && p.id.toLowerCase() === cleanQuery)
    );
    if (directMatch) return directMatch;

    // Normalized match (stripping hyphens, spaces, leading zeros)
    const strippedQuery = cleanQuery.replace(/[-\s_]/g, '');
    if (!strippedQuery) return undefined;

    return products.find((p) => {
      const b = (p.barcode || '').toLowerCase().replace(/[-\s_]/g, '');
      const s = (p.sku || '').toLowerCase().replace(/[-\s_]/g, '');
      const bs = (p.bulkSku || '').toLowerCase().replace(/[-\s_]/g, '');
      return b === strippedQuery || s === strippedQuery || bs === strippedQuery;
    });
  }

  /**
   * Play an audible POS checkout / scanner confirmation beep
   */
  static playBeep(success: boolean = true): void {
    if (typeof window !== 'undefined') {
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          const ctx = new AudioCtx();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);

          if (success) {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(1046.5, ctx.currentTime); // C6 tone
            osc.frequency.setValueAtTime(1318.5, ctx.currentTime + 0.06); // E6 tone
            gain.gain.setValueAtTime(0.2, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.12);
          } else {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(260, ctx.currentTime);
            gain.gain.setValueAtTime(0.2, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.2);
          }
        }
      } catch {
        // Non-blocking if audio context is restricted
      }
    }
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
      const matchName = (p.name || '').toLowerCase().includes(q);
      const matchBarcode = (p.barcode || '').toLowerCase().includes(q);
      const matchSku = (p.sku || '').toLowerCase().includes(q);
      const matchCategory = (p.category || '').toLowerCase().includes(q);
      const matchGeneric = (p.genericFormula || '').toLowerCase().includes(q);
      const matchRack = (p.rackLocation || '').toLowerCase().includes(q);

      return matchName || matchBarcode || matchSku || matchCategory || matchGeneric || matchRack;
    });
  }
}

