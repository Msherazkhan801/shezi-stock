import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
} from 'react-native';
import {
  ShoppingCart,
  ScanBarcode,
  Utensils,
  Pill,
  Tag,
  Search,
  Filter,
  CheckCircle2,
} from 'lucide-react-native';
import { AppHeader } from '../components/common/AppHeader';
import { SearchBar } from '../components/common/SearchBar';
import { PosItemCard } from '../components/pos/PosItemCard';
import { CartDrawer } from '../components/pos/CartDrawer';
import { ReceiptModal } from '../components/pos/ReceiptModal';
import { TableSelectorModal } from '../components/pos/TableSelectorModal';
import { BatchPickerModal } from '../components/pos/BatchPickerModal';
import { BarcodeScannerModal } from '../components/audit/BarcodeScannerModal';
import { useAppStore } from '../store/useAppStore';
import { useInventoryStore } from '../store/useInventoryStore';
import { usePosStore } from '../store/usePosStore';
import { INDUSTRY_PRESETS } from '../config/industryPresets';
import { BarcodeService } from '../services/barcodeService';
import { Product, BatchRecord } from '../types/product';
import { SaleTransaction } from '../types/sale';

export const PosScreen: React.FC = () => {
  const { activeIndustry, tenant } = useAppStore();
  const preset = INDUSTRY_PRESETS[activeIndustry];
  const { products, initInventorySync } = useInventoryStore();
  const {
    cart,
    orderType,
    tableNumber,
    addToCart,
    updateQuantity,
    setTableNumber,
    setOrderType,
    getGrandTotal,
    getSubtotal,
  } = usePosStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showCartDrawer, setShowCartDrawer] = useState(false);
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [showTableModal, setShowTableModal] = useState(false);
  const [batchModalProduct, setBatchModalProduct] = useState<Product | null>(null);
  const [completedSale, setCompletedSale] = useState<SaleTransaction | null>(null);

  // Sync products in real-time from Firestore
  React.useEffect(() => {
    const unsub = initInventorySync(tenant?.id, tenant?.activeBranchId);
    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, [tenant?.id, tenant?.activeBranchId]);

  // Sector products with strict tenant isolation
  const industryProducts = useMemo(() => {
    const target = (activeIndustry || 'pharmacy').toLowerCase().trim();
    const currentTenant = tenant?.id;

    return products.filter((p) => {
      const pInd = (p.industry || 'pharmacy').toLowerCase().trim();
      if (pInd !== target || p.isActive === false) return false;
      // In restaurant mode, we sell prepared dishes on the POS menu (raw ingredients are in inventory/BOM)
      if (target === 'restaurant' && p.itemType === 'raw_ingredient') return false;
      // Strict multi-tenant isolation
      if (currentTenant && currentTenant !== 'tenant-admin-hq') {
        if (p.tenantId && p.tenantId !== currentTenant) return false;
      }
      return true;
    });
  }, [products, activeIndustry, tenant?.id]);

  // Categories list
  const categories = useMemo(() => {
    const set = new Set<string>();
    industryProducts.forEach((p) => set.add(p.category));
    return ['All', ...Array.from(set)];
  }, [industryProducts]);

  // Filtered products
  const filteredProducts = useMemo(() => {
    let result = BarcodeService.searchProducts(industryProducts, searchQuery);
    if (selectedCategory !== 'All') {
      result = result.filter((p) => p.category === selectedCategory);
    }
    return result;
  }, [industryProducts, searchQuery, selectedCategory]);

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const grandTotal = getGrandTotal(tenant.taxRate, tenant.enableTax);

  const isRestaurant = activeIndustry === 'restaurant';
  const isPharma = activeIndustry === 'pharmacy';

  return (
    <SafeAreaView style={styles.safeArea}>
      <AppHeader title={`${preset.title.split(' ')[0]} POS Terminal`} showBranchSelector={false} />

      {/* Top POS Action Toolbar */}
      <View style={styles.toolbar}>
        {isRestaurant && (
          <TouchableOpacity
            style={[styles.toolbarBtn, { borderColor: '#F97316' }]}
            onPress={() => setShowTableModal(true)}
            activeOpacity={0.7}
          >
            <Utensils size={14} color="#F97316" />
            <Text style={[styles.toolbarBtnText, { color: '#F97316' }]}>
              {tableNumber || (orderType === 'dine_in' ? 'Select Table' : orderType.toUpperCase())}
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.toolbarBtn}
          onPress={() => setShowScannerModal(true)}
          activeOpacity={0.7}
        >
          <ScanBarcode size={14} color="#38BDF8" />
          <Text style={[styles.toolbarBtnText, { color: '#38BDF8' }]}>Barcode Scan</Text>
        </TouchableOpacity>
      </View>

      {/* Search & Category Filter Bar */}
      <SearchBar
        query={searchQuery}
        onChangeQuery={setSearchQuery}
        placeholder={
          isPharma
            ? 'Search brand name, generic formula, barcode...'
            : isRestaurant
            ? 'Search menu items, category, SKU...'
            : 'Search item name, rack location, SKU...'
        }
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        onPressBarcodeScanner={() => setShowScannerModal(true)}
        accentColor={preset.accentColor}
      />

      {/* Product Grid / List */}
      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const cartItem = cart.find((ci) => ci.product.id === item.id);
          const cartQty = cartItem ? cartItem.quantity : 0;

          return (
            <PosItemCard
              product={item}
              cartQuantity={cartQty}
              onAddToCart={() => addToCart(item)}
              onIncrement={() => cartItem && updateQuantity(cartItem.id, 1)}
              onDecrement={() => cartItem && updateQuantity(cartItem.id, -1)}
              onPressBatchSelector={() => setBatchModalProduct(item)}
            />
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Search size={32} color="#64748B" />
            <Text style={styles.emptyTitle}>No items match your search</Text>
            <Text style={styles.emptySubtitle}>Try adjusting filters or scan a barcode.</Text>
          </View>
        }
      />

      {/* Floating Bottom Cart Bar */}
      {totalCartCount > 0 && (
        <View style={styles.cartBarWrapper}>
          <TouchableOpacity
            style={[styles.cartBar, { backgroundColor: preset.accentColor }]}
            onPress={() => setShowCartDrawer(true)}
            activeOpacity={0.9}
          >
            <View style={styles.cartCountPill}>
              <ShoppingCart size={16} color="#0F172A" />
              <Text style={styles.cartCountText}>{totalCartCount}</Text>
            </View>

            <View style={styles.cartBarCenter}>
              <Text style={styles.cartBarTitle}>View Order & Checkout</Text>
              <Text style={styles.cartBarSub}>
                {isRestaurant && tableNumber ? `${tableNumber} • ` : ''}Tap to charge payment
              </Text>
            </View>

            <Text style={styles.cartBarTotal}>
              {tenant.currencySymbol}{grandTotal.toFixed(2)}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Cart Drawer Modal */}
      <CartDrawer
        visible={showCartDrawer}
        onClose={() => setShowCartDrawer(false)}
        onSuccessSale={(sale) => setCompletedSale(sale)}
      />

      {/* Receipt Modal */}
      <ReceiptModal
        visible={!!completedSale}
        sale={completedSale}
        onClose={() => setCompletedSale(null)}
        onNewSale={() => setCompletedSale(null)}
      />

      {/* Table Selector Modal (Restaurant) */}
      <TableSelectorModal
        visible={showTableModal}
        selectedTable={tableNumber}
        orderType={orderType}
        onSelectTable={(table, type) => {
          setTableNumber(table);
          setOrderType(type);
        }}
        onClose={() => setShowTableModal(false)}
      />

      {/* Batch Picker Modal (Pharmacy) */}
      <BatchPickerModal
        visible={!!batchModalProduct}
        product={batchModalProduct}
        onSelectBatch={(batch) => {
          if (batchModalProduct) {
            addToCart(batchModalProduct, batch);
          }
        }}
        onClose={() => setBatchModalProduct(null)}
      />

      {/* Barcode Scanner Modal */}
      <BarcodeScannerModal
        visible={showScannerModal}
        onClose={() => setShowScannerModal(false)}
        mode="pos_scan"
        onDirectAddToPos={(product) => addToCart(product)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0B1120',
  },
  toolbar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 10,
    backgroundColor: '#0F172A',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  toolbarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
    borderWidth: 1,
    borderColor: '#334155',
  },
  toolbarBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
  },
  listContent: {
    padding: 16,
    paddingBottom: 90,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#94A3B8',
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#64748B',
  },
  cartBarWrapper: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
  },
  cartBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  cartCountPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  cartCountText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#0F172A',
  },
  cartBarCenter: {
    flex: 1,
    paddingHorizontal: 12,
  },
  cartBarTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  cartBarSub: {
    fontSize: 11,
    color: '#FFFFFFCC',
  },
  cartBarTotal: {
    fontSize: 17,
    fontWeight: '900',
    color: '#FFFFFF',
  },
});
