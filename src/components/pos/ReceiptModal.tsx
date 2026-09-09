import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import {
  CheckCircle2,
  Printer,
  Share2,
  PlusCircle,
  X,
  Calendar,
  Store,
  Pill,
  UtensilsCrossed,
} from 'lucide-react-native';
import { SaleTransaction } from '../../types/sale';
import { useAppStore } from '../../store/useAppStore';
import { useSalesStore, calculateSaleProfit } from '../../store/useSalesStore';
import { printOrShareReceipt } from '../../services/receiptService';
import { INDUSTRY_PRESETS } from '../../config/industryPresets';

interface ReceiptModalProps {
  visible: boolean;
  sale: SaleTransaction | null;
  onClose: () => void;
  onNewSale: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  visible,
  sale,
  onClose,
  onNewSale,
}) => {
  const { tenant } = useAppStore();
  if (!sale) return null;

  const preset = INDUSTRY_PRESETS[sale.industry];
  const isPharma = sale.industry === 'pharmacy';
  const isGeneral = sale.industry === 'general_store';
  const isRestaurant = sale.industry === 'restaurant';
  const profitData = calculateSaleProfit(sale);

  const handlePrint = () => {
    printOrShareReceipt(sale, tenant);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Top Success Badge */}
          <View style={styles.successBanner}>
            <CheckCircle2 size={24} color="#10B981" />
            <Text style={styles.successTitle}>Payment Successful!</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={18} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          {/* Receipt Preview Paper */}
          <ScrollView style={styles.paperScroll} contentContainerStyle={styles.paperContent}>
            <View style={styles.paper}>
              <View style={styles.storeHeader}>
                <Text style={styles.storeName}>{tenant.businessName}</Text>
                <Text style={styles.storeBranch}>
                  {tenant.branches.find((b) => b.id === sale.branchId)?.name || 'Main Branch'}
                </Text>
                <View style={[styles.industryPill, { backgroundColor: `${preset.accentColor}25` }]}>
                  <Text style={[styles.industryPillText, { color: preset.accentColor }]}>
                    {sale.industry.toUpperCase().replace('_', ' ')} RECEIPT
                  </Text>
                </View>
              </View>

              {/* Receipt Metadata */}
              <View style={styles.metaBox}>
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>Invoice No:</Text>
                  <Text style={styles.metaVal}>{sale.invoiceNumber}</Text>
                </View>
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>Date:</Text>
                  <Text style={styles.metaVal}>{new Date(sale.createdAt).toLocaleDateString()} {new Date(sale.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                </View>
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>Staff:</Text>
                  <Text style={styles.metaVal}>{sale.cashierName}</Text>
                </View>
                {sale.customerName && (
                  <View style={styles.metaRow}>
                    <Text style={styles.metaLabel}>Customer:</Text>
                    <Text style={styles.metaVal}>{sale.customerName}</Text>
                  </View>
                )}
                {isRestaurant && sale.tableNumber && (
                  <View style={styles.metaRow}>
                    <Text style={styles.metaLabel}>Table / Order:</Text>
                    <Text style={[styles.metaVal, { color: '#F97316' }]}>{sale.tableNumber} ({sale.orderType})</Text>
                  </View>
                )}
                {isPharma && sale.pharmacistLicense && (
                  <View style={styles.metaRow}>
                    <Text style={styles.metaLabel}>Pharmacist Lic:</Text>
                    <Text style={styles.metaVal}>{sale.pharmacistLicense}</Text>
                  </View>
                )}
              </View>

              {/* Items List */}
              <View style={styles.itemsTable}>
                <View style={styles.tableHeader}>
                  <Text style={[styles.th, { flex: 2 }]}>ITEM</Text>
                  <Text style={[styles.th, { width: 40, textAlign: 'center' }]}>QTY</Text>
                  <Text style={[styles.th, { width: 60, textAlign: 'right' }]}>PRICE</Text>
                  <Text style={[styles.th, { width: 65, textAlign: 'right' }]}>TOTAL</Text>
                </View>

                {sale.items.map((item, idx) => (
                  <View key={idx} style={styles.itemRow}>
                    <View style={{ flex: 2 }}>
                      <Text style={styles.itemName}>{item.product.name}</Text>
                      {isPharma && item.selectedBatch && (
                        <Text style={styles.itemSubtext}>
                          Batch {item.selectedBatch.batchNumber} (Exp {item.selectedBatch.expiryDate})
                        </Text>
                      )}
                      {isGeneral && item.isWholesale && (
                        <Text style={[styles.itemSubtext, { color: '#F59E0B' }]}>
                          [Wholesale Tier]
                        </Text>
                      )}
                      {isRestaurant && item.specialInstructions && (
                        <Text style={[styles.itemSubtext, { color: '#EA580C' }]}>
                          "{item.specialInstructions}"
                        </Text>
                      )}
                    </View>
                    <Text style={[styles.itemQty, { width: 40, textAlign: 'center' }]}>
                      {item.quantity}
                    </Text>
                    <Text style={[styles.itemPrice, { width: 60, textAlign: 'right' }]}>
                      {tenant.currencySymbol}{item.unitPrice.toFixed(2)}
                    </Text>
                    <Text style={[styles.itemTotal, { width: 65, textAlign: 'right' }]}>
                      {tenant.currencySymbol}{item.totalPrice.toFixed(2)}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Financial Totals */}
              <View style={styles.totalsBox}>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Subtotal</Text>
                  <Text style={styles.totalVal}>{tenant.currencySymbol}{sale.subtotal.toFixed(2)}</Text>
                </View>
                {sale.discountTotal > 0 && (
                  <View style={styles.totalRow}>
                    <Text style={[styles.totalLabel, { color: '#059669' }]}>Discount</Text>
                    <Text style={[styles.totalVal, { color: '#059669' }]}>-{tenant.currencySymbol}{sale.discountTotal.toFixed(2)}</Text>
                  </View>
                )}
                {sale.taxTotal > 0 && (
                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Tax ({tenant.taxRate}%)</Text>
                    <Text style={styles.totalVal}>{tenant.currencySymbol}{sale.taxTotal.toFixed(2)}</Text>
                  </View>
                )}
                <View style={[styles.totalRow, styles.grandTotalRow]}>
                  <Text style={styles.grandTotalLabel}>TOTAL PAID</Text>
                  <Text style={styles.grandTotalVal}>{tenant.currencySymbol}{sale.grandTotal.toFixed(2)}</Text>
                </View>
                <View style={[styles.totalRow, { marginTop: 4 }]}>
                  <Text style={styles.paymentMethodLabel}>Paid via {sale.paymentMethod.toUpperCase()}</Text>
                  {sale.changeDue > 0 && (
                    <Text style={styles.changeLabel}>Change: {tenant.currencySymbol}{sale.changeDue.toFixed(2)}</Text>
                  )}
                </View>
              </View>

            

              {/* Barcode Mock */}
              <View style={styles.receiptBarcode}>
                <Text style={styles.barcodeLines}>||| | ||||| | |||| ||| ||</Text>
                <Text style={styles.barcodeId}>{sale.invoiceNumber}</Text>
              </View>
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.actionsFooter}>
            <TouchableOpacity onPress={handlePrint} style={styles.printBtn} activeOpacity={0.8}>
              <Printer size={18} color="#FFFFFF" />
              <Text style={styles.printBtnText}>Thermal Print / Share PDF</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={onNewSale} style={styles.newSaleBtn} activeOpacity={0.8}>
              <PlusCircle size={18} color={preset.accentColor} />
              <Text style={[styles.newSaleBtnText, { color: preset.accentColor }]}>
                New Sale
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    height: '86%',
    backgroundColor: '#1E293B',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#334155',
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#064E3B',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  successTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '800',
    color: '#34D399',
  },
  closeBtn: {
    padding: 4,
  },
  paperScroll: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  paperContent: {
    padding: 14,
  },
  paper: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  storeHeader: {
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#111827',
    paddingBottom: 10,
    marginBottom: 10,
  },
  storeName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  storeBranch: {
    fontSize: 11,
    color: '#4B5563',
    marginTop: 2,
  },
  industryPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 6,
  },
  industryPillText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  metaBox: {
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    borderStyle: 'dashed',
    paddingBottom: 8,
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  metaLabel: {
    fontSize: 10,
    color: '#6B7280',
  },
  metaVal: {
    fontSize: 10,
    fontWeight: '600',
    color: '#111827',
  },
  itemsTable: {
    marginBottom: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#111827',
    paddingBottom: 4,
    marginBottom: 6,
  },
  th: {
    fontSize: 9,
    fontWeight: '800',
    color: '#6B7280',
    textTransform: 'uppercase',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  itemName: {
    fontSize: 11,
    fontWeight: '700',
    color: '#111827',
  },
  itemSubtext: {
    fontSize: 9,
    color: '#4B5563',
    marginTop: 1,
  },
  itemQty: {
    fontSize: 11,
    color: '#374151',
    fontWeight: '600',
  },
  itemPrice: {
    fontSize: 11,
    color: '#4B5563',
  },
  itemTotal: {
    fontSize: 11,
    fontWeight: '700',
    color: '#111827',
  },
  totalsBox: {
    borderTopWidth: 1,
    borderTopColor: '#111827',
    paddingTop: 8,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  totalLabel: {
    fontSize: 11,
    color: '#4B5563',
  },
  totalVal: {
    fontSize: 11,
    fontWeight: '600',
    color: '#111827',
  },
  grandTotalRow: {
    borderTopWidth: 2,
    borderTopColor: '#111827',
    paddingTop: 6,
    marginTop: 4,
  },
  grandTotalLabel: {
    fontSize: 14,
    fontWeight: '900',
    color: '#111827',
  },
  grandTotalVal: {
    fontSize: 16,
    fontWeight: '900',
    color: '#111827',
  },
  paymentMethodLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6B7280',
  },
  changeLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
  },
  managerProfitBox: {
    marginTop: 10,
    backgroundColor: '#F0FDF4',
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  managerProfitTitle: {
    fontSize: 9,
    fontWeight: '800',
    color: '#15803D',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  managerProfitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  managerProfitLabel: {
    fontSize: 10,
    color: '#4B5563',
    fontWeight: '600',
  },
  managerProfitVal: {
    fontSize: 10,
    fontWeight: '800',
  },
  receiptBarcode: {
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  barcodeLines: {
    fontFamily: 'monospace',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 4,
    color: '#111827',
  },
  barcodeId: {
    fontSize: 9,
    color: '#6B7280',
    marginTop: 2,
  },
  actionsFooter: {
    padding: 14,
    backgroundColor: '#1E293B',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  printBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  printBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  newSaleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F172A',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  newSaleBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
