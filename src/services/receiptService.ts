import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import { SaleTransaction } from '../types/sale';
import { Tenant } from '../types/tenant';

export const generateReceiptHtml = (sale: SaleTransaction, tenant: Tenant): string => {
  const isPharma = sale.industry === 'pharmacy';
  const isRestaurant = sale.industry === 'restaurant';
  const isGeneral = sale.industry === 'general_store';

  const itemsHtml = sale.items
    .map((item, index) => {
      let metaDetails = '';

      if (isPharma && item.selectedBatch) {
        metaDetails = `
          <div style="font-size: 10px; color: #4b5563; margin-top: 2px;">
            Batch: <b>${item.selectedBatch.batchNumber}</b> | Exp: <b>${item.selectedBatch.expiryDate}</b>
            ${item.product.genericFormula ? `<br/><span style="color:#059669;">Formula: ${item.product.genericFormula}</span>` : ''}
          </div>
        `;
      } else if (isGeneral && item.isWholesale) {
        metaDetails = `
          <div style="font-size: 10px; color: #4f46e5; margin-top: 2px;">
            [WHOLESALE TIER] ${item.product.rackLocation ? `Loc: ${item.product.rackLocation}` : ''}
          </div>
        `;
      } else if (isRestaurant && item.specialInstructions) {
        metaDetails = `
          <div style="font-size: 10px; color: #ea580c; font-style: italic; margin-top: 2px;">
            Note: "${item.specialInstructions}"
          </div>
        `;
      }

      return `
        <tr style="border-bottom: 1px dashed #e5e7eb;">
          <td style="padding: 8px 0; text-align: left; vertical-align: top;">
            <div style="font-weight: 600; font-size: 12px; color: #111827;">${item.product.name}</div>
            ${metaDetails}
          </td>
          <td style="padding: 8px 0; text-align: center; vertical-align: top; font-size: 12px; color: #374151;">
            ${item.quantity} ${item.product.unit || 'pcs'}
          </td>
          <td style="padding: 8px 0; text-align: right; vertical-align: top; font-size: 12px; color: #374151;">
            ${tenant.currencySymbol}${item.unitPrice.toFixed(2)}
          </td>
          <td style="padding: 8px 0; text-align: right; vertical-align: top; font-weight: 600; font-size: 12px; color: #111827;">
            ${tenant.currencySymbol}${item.totalPrice.toFixed(2)}
          </td>
        </tr>
      `;
    })
    .join('');

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Receipt ${sale.invoiceNumber}</title>
        <style>
          @page { size: 80mm auto; margin: 4mm; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            margin: 0;
            padding: 16px;
            color: #111827;
            background: #fff;
            max-width: 380px;
            margin: auto;
          }
          .header { text-align: center; border-bottom: 2px solid #111827; padding-bottom: 12px; margin-bottom: 12px; }
          .brand-title { font-size: 18px; font-weight: 800; letter-spacing: -0.5px; text-transform: uppercase; margin: 0; }
          .branch-name { font-size: 11px; color: #4b5563; margin-top: 3px; }
          .invoice-tag {
            display: inline-block;
            background: #111827;
            color: #fff;
            font-size: 10px;
            font-weight: 700;
            padding: 3px 8px;
            border-radius: 4px;
            margin-top: 6px;
            text-transform: uppercase;
          }
          .meta-grid { font-size: 11px; margin-bottom: 12px; border-bottom: 1px dashed #cbd5e1; padding-bottom: 8px; }
          .meta-row { display: flex; justify-content: space-between; margin-bottom: 3px; }
          .meta-label { color: #6b7280; }
          .meta-val { font-weight: 600; color: #111827; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
          th { font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; color: #6b7280; padding-bottom: 6px; border-bottom: 1px solid #111827; }
          .totals-section { border-top: 1px solid #111827; padding-top: 8px; font-size: 12px; }
          .total-row { display: flex; justify-content: space-between; margin-bottom: 4px; }
          .grand-total { font-size: 16px; font-weight: 800; border-top: 2px solid #111827; padding-top: 6px; margin-top: 6px; }
          .footer { text-align: center; margin-top: 18px; font-size: 10px; color: #6b7280; border-top: 1px dashed #cbd5e1; padding-top: 12px; }
          .barcode-mock { text-align: center; font-family: monospace; font-size: 14px; letter-spacing: 4px; margin-top: 8px; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 class="brand-title">${tenant.businessName}</h1>
          <div class="branch-name">SheziStock Powered • ${tenant.branches.find(b => b.id === tenant.activeBranchId)?.name || 'Main Branch'}</div>
          <div class="invoice-tag">${sale.industry.replace('_', ' ')} RECEIPT</div>
        </div>

        <div class="meta-grid">
          <div class="meta-row"><span class="meta-label">Invoice #:</span><span class="meta-val">${sale.invoiceNumber}</span></div>
          <div class="meta-row"><span class="meta-label">Date/Time:</span><span class="meta-val">${new Date(sale.createdAt).toLocaleString()}</span></div>
          <div class="meta-row"><span class="meta-label">Cashier / Staff:</span><span class="meta-val">${sale.cashierName}</span></div>
          ${sale.customerName ? `<div class="meta-row"><span class="meta-label">Customer:</span><span class="meta-val">${sale.customerName}</span></div>` : ''}
          ${isRestaurant && sale.tableNumber ? `<div class="meta-row"><span class="meta-label">Table:</span><span class="meta-val" style="color:#ea580c; font-weight:700;">${sale.tableNumber}</span></div>` : ''}
          ${isPharma && sale.pharmacistLicense ? `<div class="meta-row"><span class="meta-label">Pharmacist Lic:</span><span class="meta-val">${sale.pharmacistLicense}</span></div>` : ''}
          ${isPharma && sale.prescriptionId ? `<div class="meta-row"><span class="meta-label">Rx Number:</span><span class="meta-val">${sale.prescriptionId}</span></div>` : ''}
        </div>

        <table>
          <thead>
            <tr>
              <th style="text-align: left;">Item</th>
              <th style="text-align: center;">Qty</th>
              <th style="text-align: right;">Price</th>
              <th style="text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div class="totals-section">
          <div class="total-row"><span>Subtotal:</span><span>${tenant.currencySymbol}${sale.subtotal.toFixed(2)}</span></div>
          ${sale.discountTotal > 0 ? `<div class="total-row" style="color:#10b981;"><span>Discount:</span><span>-${tenant.currencySymbol}${sale.discountTotal.toFixed(2)}</span></div>` : ''}
          <div class="total-row"><span>Tax (${tenant.taxRate}%):</span><span>${tenant.currencySymbol}${sale.taxTotal.toFixed(2)}</span></div>
          <div class="total-row grand-total"><span>GRAND TOTAL:</span><span>${tenant.currencySymbol}${sale.grandTotal.toFixed(2)}</span></div>
          <div class="total-row" style="margin-top: 6px; color: #4b5563;"><span>Payment (${sale.paymentMethod.toUpperCase()}):</span><span>${tenant.currencySymbol}${sale.amountReceived.toFixed(2)}</span></div>
          ${sale.changeDue > 0 ? `<div class="total-row" style="color: #059669; font-weight:600;"><span>Change Returned:</span><span>${tenant.currencySymbol}${sale.changeDue.toFixed(2)}</span></div>` : ''}
        </div>

        <div class="footer">
          <div>Thank you for choosing ${tenant.businessName}!</div>
          <div>Goods once sold can be exchanged with valid receipt within 7 days.</div>
          <div class="barcode-mock">||| |||| || ||||| |||</div>
          <div style="font-size: 9px; color: #9ca3af; margin-top: 4px;">SheziStock Multi-Tenant POS v1.0</div>
        </div>
      </body>
    </html>
  `;
};

export const printOrShareReceipt = async (sale: SaleTransaction, tenant: Tenant) => {
  const html = generateReceiptHtml(sale, tenant);
  try {
    if (Platform.OS === 'web') {
      const win = (globalThis as any).window;
      if (win && win.open) {
        const printWindow = win.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(html);
          printWindow.document.close();
          printWindow.focus();
          setTimeout(() => {
            printWindow.print();
          }, 300);
        }
      }
      return;
    }

    const { uri } = await Print.printToFileAsync({ html });
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
    } else {
      await Print.printAsync({ html });
    }
  } catch (error) {
    console.error('Error generating/printing receipt:', error);
  }
};
