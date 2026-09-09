import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  Platform,
} from 'react-native';
import {
  X,
  Trash2,
  Plus,
  Minus,
  Tag,
  CreditCard,
  Banknote,
  Smartphone,
  BookOpen,
  CheckCircle2,
  Calendar,
} from 'lucide-react-native';
import { usePosStore } from '../../store/usePosStore';
import { useAppStore } from '../../store/useAppStore';
import { useInventoryStore } from '../../store/useInventoryStore';
import { useSalesStore } from '../../store/useSalesStore';
import { INDUSTRY_PRESETS } from '../../config/industryPresets';
import { PaymentMethod, SaleTransaction } from '../../types/sale';

interface CartDrawerProps {
  visible: boolean;
  onClose: () => void;
  onSuccessSale: (sale: SaleTransaction) => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  visible,
  onClose,
  onSuccessSale,
}) => {
  const { tenant, activeIndustry } = useAppStore();
  const preset = INDUSTRY_PRESETS[activeIndustry];
  const {
    cart,
    paymentMethod,
    discountPercentage,
    orderType,
    tableNumber,
    customerName,
    customerPhone,
    removeFromCart,
    updateQuantity,
    toggleWholesaleTier,
    setItemInstructions,
    setPaymentMethod,
    setDiscount,
    setCustomer,
    getSubtotal,
    getDiscountTotal,
    getTaxTotal,
    getGrandTotal,
    processCheckout,
    clearCart,
  } = usePosStore();

  const { products, setProducts } = useInventoryStore();

  const [isProcessing, setIsProcessing] = useState(false);
  const [receivedAmount, setReceivedAmount] = useState('');

  const subtotal = getSubtotal();
  const discountTotal = getDiscountTotal();
  const taxTotal = getTaxTotal(tenant.taxRate, tenant.enableTax);
  const grandTotal = getGrandTotal(tenant.taxRate, tenant.enableTax);

  const isPharma = activeIndustry === 'pharmacy';
  const isGeneral = activeIndustry === 'general_store';
  const isRestaurant = activeIndustry === 'restaurant';

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setIsProcessing(true);

    const amount = receivedAmount ? parseFloat(receivedAmount) : grandTotal;
    const res = await processCheckout(amount, tenant, products);
    setIsProcessing(false);

    if (res) {
      setProducts(res.updatedProducts);
      useSalesStore.getState().addSale(res.sale);
      onClose();
      onSuccessSale(res.sale);
    }
  };

  const paymentMethods: { id: PaymentMethod; label: string; icon: any }[] = [
    { id: 'cash', label: 'Cash', icon: Banknote },
    { id: 'card', label: 'Card', icon: CreditCard },
    { id: 'online', label: 'Digital', icon: Smartphone },
    { id: 'credit_ledger', label: 'Ledger', icon: BookOpen },
  ];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Checkout & Cart</Text>
              <Text style={styles.subtitle}>
                {cart.length} item{cart.length !== 1 ? 's' : ''} •{' '}
                {isRestaurant && tableNumber ? `${tableNumber} (${orderType})` : `${tenant.businessName}`}
              </Text>
            </View>
            <View style={styles.headerActions}>
              {cart.length > 0 && (
                <TouchableOpacity onPress={clearCart} style={styles.clearBtn}>
                  <Trash2 size={16} color="#EF4444" />
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <X size={20} color="#94A3B8" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Cart Item Scroll */}
          <ScrollView style={styles.itemsScroll} contentContainerStyle={styles.itemsContent}>
            {cart.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyTitle}>Your cart is empty</Text>
                <Text style={styles.emptySubtitle}>
                  Scan barcodes or select products to start billing.
                </Text>
              </View>
            ) : (
              cart.map((item) => (
                <View key={item.id} style={styles.cartItemRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemName} numberOfLines={1}>
                      {item.product.name}
                    </Text>

                    {/* Sector specific line notes */}
                    {isPharma && item.selectedBatch && (
                      <Text style={styles.itemMeta}>
                        <Calendar size={10} color="#10B981" /> Batch: {item.selectedBatch.batchNumber} (Exp: {item.selectedBatch.expiryDate})
                      </Text>
                    )}

                    {isGeneral && (
                      <TouchableOpacity
                        onPress={() => toggleWholesaleTier(item.id)}
                        style={[
                          styles.wholesaleToggle,
                          item.isWholesale && styles.wholesaleToggleActive,
                        ]}
                      >
                        <Tag size={10} color={item.isWholesale ? '#F59E0B' : '#94A3B8'} />
                        <Text
                          style={[
                            styles.wholesaleText,
                            item.isWholesale && { color: '#F59E0B', fontWeight: '700' },
                          ]}
                        >
                          {item.isWholesale ? 'Wholesale Tier' : 'Switch to Wholesale'}
                        </Text>
                      </TouchableOpacity>
                    )}

                    {isRestaurant && (
                      <TextInput
                        style={styles.instructionInput}
                        placeholder="Add cooking note (e.g. no onions)..."
                        placeholderTextColor="#64748B"
                        value={item.specialInstructions || ''}
                        onChangeText={(text) => setItemInstructions(item.id, text)}
                      />
                    )}

                    <Text style={styles.itemPrice}>
                      {tenant.currencySymbol}
                      {item.unitPrice.toFixed(2)} x {item.quantity} ={' '}
                      <Text style={{ color: '#F8FAFC', fontWeight: '700' }}>
                        {tenant.currencySymbol}
                        {item.totalPrice.toFixed(2)}
                      </Text>
                    </Text>
                  </View>

                  {/* Quantity Stepper */}
                  <View style={styles.itemActions}>
                    <View style={styles.stepper}>
                      <TouchableOpacity
                        onPress={() => updateQuantity(item.id, -1)}
                        style={styles.stepperBtn}
                      >
                        <Minus size={12} color="#F8FAFC" />
                      </TouchableOpacity>
                      <Text style={styles.stepperCount}>{item.quantity}</Text>
                      <TouchableOpacity
                        onPress={() => updateQuantity(item.id, 1)}
                        style={styles.stepperBtn}
                      >
                        <Plus size={12} color="#F8FAFC" />
                      </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                      onPress={() => removeFromCart(item.id)}
                      style={styles.deleteBtn}
                    >
                      <Trash2 size={14} color="#64748B" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}

            {/* Customer & Discount Controls */}
            {cart.length > 0 && (
              <View style={styles.controlsSection}>
                <Text style={styles.sectionTitle}>Customer & Discount</Text>
                <View style={styles.inputRow}>
                  <TextInput
                    style={[styles.smallInput, { flex: 1 }]}
                    placeholder="Customer Name (Optional)"
                    placeholderTextColor="#64748B"
                    value={customerName}
                    onChangeText={(txt) => setCustomer(txt, customerPhone)}
                  />
                  <TextInput
                    style={[styles.smallInput, { width: 90 }]}
                    placeholder="Disc %"
                    placeholderTextColor="#64748B"
                    keyboardType="numeric"
                    value={discountPercentage > 0 ? discountPercentage.toString() : ''}
                    onChangeText={(txt) => setDiscount(parseFloat(txt) || 0)}
                  />
                </View>

                {/* Payment Methods */}
                <Text style={[styles.sectionTitle, { marginTop: 14 }]}>Payment Method</Text>
                <View style={styles.paymentMethodsRow}>
                  {paymentMethods.map((pm) => {
                    const Icon = pm.icon;
                    const isSelected = paymentMethod === pm.id;
                    return (
                      <TouchableOpacity
                        key={pm.id}
                        style={[
                          styles.pmBtn,
                          isSelected && {
                            borderColor: preset.accentColor,
                            backgroundColor: `${preset.accentColor}20`,
                          },
                        ]}
                        onPress={() => setPaymentMethod(pm.id)}
                      >
                        <Icon size={16} color={isSelected ? preset.accentColor : '#94A3B8'} />
                        <Text
                          style={[
                            styles.pmText,
                            isSelected && { color: preset.accentColor, fontWeight: '700' },
                          ]}
                        >
                          {pm.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Amount Received (Cash) */}
                {paymentMethod === 'cash' && (
                  <View style={styles.receivedRow}>
                    <Text style={styles.receivedLabel}>Amount Tendered ({tenant.currencySymbol}):</Text>
                    <TextInput
                      style={styles.receivedInput}
                      placeholder={grandTotal.toFixed(2)}
                      placeholderTextColor="#64748B"
                      keyboardType="numeric"
                      value={receivedAmount}
                      onChangeText={setReceivedAmount}
                    />
                  </View>
                )}
              </View>
            )}
          </ScrollView>

          {/* Footer Totals & Checkout Button */}
          {cart.length > 0 && (
            <View style={styles.footer}>
              <View style={styles.totalsTable}>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Subtotal</Text>
                  <Text style={styles.totalValue}>
                    {tenant.currencySymbol}
                    {subtotal.toFixed(2)}
                  </Text>
                </View>
                {discountTotal > 0 && (
                  <View style={styles.totalRow}>
                    <Text style={[styles.totalLabel, { color: '#10B981' }]}>
                      Discount ({discountPercentage}%)
                    </Text>
                    <Text style={[styles.totalValue, { color: '#10B981' }]}>
                      -{tenant.currencySymbol}
                      {discountTotal.toFixed(2)}
                    </Text>
                  </View>
                )}
                {tenant.enableTax && (
                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Tax ({tenant.taxRate}%)</Text>
                    <Text style={styles.totalValue}>
                      {tenant.currencySymbol}
                      {taxTotal.toFixed(2)}
                    </Text>
                  </View>
                )}
                <View style={[styles.totalRow, styles.grandTotalRow]}>
                  <Text style={styles.grandTotalLabel}>Total Due</Text>
                  <Text style={[styles.grandTotalValue, { color: preset.accentColor }]}>
                    {tenant.currencySymbol}
                    {grandTotal.toFixed(2)}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={handleCheckout}
                disabled={isProcessing}
                style={[styles.checkoutBtn, { backgroundColor: preset.accentColor }]}
                activeOpacity={0.8}
              >
                <CheckCircle2 size={20} color="#FFFFFF" />
                <Text style={styles.checkoutBtnText}>
                  {isProcessing ? 'Processing...' : `Charge ${tenant.currencySymbol}${grandTotal.toFixed(2)}`}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#1E293B',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '88%',
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  subtitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  clearBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#7F1D1D30',
  },
  closeBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#0F172A',
  },
  itemsScroll: {
    flex: 1,
  },
  itemsContent: {
    padding: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#94A3B8',
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
    textAlign: 'center',
    paddingHorizontal: 30,
  },
  cartItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  itemName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  itemMeta: {
    fontSize: 11,
    color: '#10B981',
    marginTop: 3,
  },
  wholesaleToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: '#1E293B',
    alignSelf: 'flex-start',
  },
  wholesaleToggleActive: {
    backgroundColor: '#78350F30',
    borderColor: '#F59E0B',
    borderWidth: 0.5,
  },
  wholesaleText: {
    fontSize: 10,
    color: '#94A3B8',
  },
  instructionInput: {
    fontSize: 11,
    color: '#F8FAFC',
    backgroundColor: '#1E293B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 6,
  },
  itemPrice: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 6,
  },
  itemActions: {
    alignItems: 'flex-end',
    gap: 8,
    marginLeft: 10,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 8,
    padding: 2,
  },
  stepperBtn: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#334155',
    borderRadius: 4,
  },
  stepperCount: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F8FAFC',
    paddingHorizontal: 8,
  },
  deleteBtn: {
    padding: 4,
  },
  controlsSection: {
    backgroundColor: '#0F172A',
    borderRadius: 14,
    padding: 14,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 10,
  },
  smallInput: {
    backgroundColor: '#1E293B',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#F8FAFC',
    fontSize: 13,
    borderWidth: 1,
    borderColor: '#334155',
  },
  paymentMethodsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  pmBtn: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 10,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 4,
  },
  pmText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },
  receivedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
  },
  receivedLabel: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
  },
  receivedInput: {
    backgroundColor: '#1E293B',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    color: '#10B981',
    fontWeight: '800',
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#334155',
    width: 110,
    textAlign: 'right',
  },
  footer: {
    backgroundColor: '#0F172A',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  totalsTable: {
    marginBottom: 12,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  totalLabel: {
    fontSize: 12,
    color: '#94A3B8',
  },
  totalValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F8FAFC',
  },
  grandTotalRow: {
    borderTopWidth: 1,
    borderTopColor: '#334155',
    paddingTop: 8,
    marginTop: 4,
  },
  grandTotalLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  grandTotalValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  checkoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  checkoutBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
