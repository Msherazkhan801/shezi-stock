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
  Plus,
  ScanBarcode,
  Search,
  Filter,
  Layers,
  Calendar,
  AlertTriangle,
  Boxes,
} from 'lucide-react-native';
import { AppHeader } from '../components/common/AppHeader';
import { SearchBar } from '../components/common/SearchBar';
import { ProductCard } from '../components/inventory/ProductCard';
import { ProductFormModal } from '../components/inventory/ProductFormModal';
import { AddBatchModal } from '../components/inventory/AddBatchModal';
import { RecipeBuilderModal } from '../components/inventory/RecipeBuilderModal';
import { AdjustStockModal } from '../components/inventory/AdjustStockModal';
import { BarcodeScannerModal } from '../components/audit/BarcodeScannerModal';
import { useAppStore } from '../store/useAppStore';
import { useInventoryStore } from '../store/useInventoryStore';
import { INDUSTRY_PRESETS } from '../config/industryPresets';
import { BarcodeService } from '../services/barcodeService';
import { Product } from '../types/product';

export const InventoryScreen: React.FC = () => {
  const { activeIndustry, tenant } = useAppStore();
  const preset = INDUSTRY_PRESETS[activeIndustry];
  const {
    products,
    addProduct,
    updateProduct,
    deleteProduct,
    initInventorySync,
    refreshFromDatabase,
    isSyncing,
  } = useInventoryStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState<'all' | 'low_stock' | 'expiring' | 'expired' | 'raw' | 'dishes'>('all');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [batchProduct, setBatchProduct] = useState<Product | null>(null);
  const [recipeDish, setRecipeDish] = useState<Product | null>(null);
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);
  const [showScannerModal, setShowScannerModal] = useState(false);

  // Real-time Firestore sync listener
  React.useEffect(() => {
    const unsub = initInventorySync(tenant?.id, tenant?.activeBranchId);
    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, [tenant?.id, tenant?.activeBranchId]);

  const isPharma = activeIndustry === 'pharmacy';
  const isGeneral = activeIndustry === 'general_store';
  const isRestaurant = activeIndustry === 'restaurant';

  // Base sector products with resilient casing, active status, and strict tenant isolation
  const industryProducts = useMemo(() => {
    const target = (activeIndustry || 'pharmacy').toLowerCase().trim();
    const currentTenant = tenant?.id;

    return products.filter((p) => {
      const pInd = (p.industry || 'pharmacy').toLowerCase().trim();
      if (pInd !== target || p.isActive === false) return false;
      if (currentTenant && currentTenant !== 'tenant-admin-hq') {
        if (p.tenantId && p.tenantId !== currentTenant) return false;
      }
      return true;
    });
  }, [products, activeIndustry, tenant?.id]);

  // Tab filtering
  const filteredProducts = useMemo(() => {
    let list = BarcodeService.searchProducts(industryProducts, searchQuery);
    const todayStr = new Date().toISOString().split('T')[0];

    if (selectedTab === 'low_stock') {
      list = list.filter((p) => p.currentStock <= p.minStockAlert);
    } else if (selectedTab === 'expiring' && isPharma) {
      list = list.filter((p) =>
        p.batches?.some((b) => {
          const exp = new Date(b.expiryDate);
          const diff = Math.ceil((exp.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
          return diff > 0 && diff <= 60;
        })
      );
    } else if (selectedTab === 'expired' && isPharma) {
      list = list.filter((p) =>
        p.batches?.some((b) => b.expiryDate < todayStr)
      );
    } else if (selectedTab === 'raw' && isRestaurant) {
      list = list.filter((p) => p.itemType === 'raw_ingredient');
    } else if (selectedTab === 'dishes' && isRestaurant) {
      list = list.filter((p) => p.itemType === 'prepared_dish');
    }

    return list;
  }, [industryProducts, searchQuery, selectedTab, isPharma, isRestaurant]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <AppHeader title="Inventory Catalog" showBranchSelector={false} />

      {/* Cloud DB Sync Status Banner */}
      <View style={styles.syncStrip}>
        <View style={styles.syncLeft}>
          <View style={[styles.syncDot, { backgroundColor: isSyncing ? '#F59E0B' : '#10B981' }]} />
          <Text style={styles.syncText}>
            {isSyncing ? 'Syncing with Cloud DB...' : `Cloud DB Live • ${industryProducts.length} items in catalog`}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.refreshBtn}
          onPress={() => refreshFromDatabase(tenant?.id, tenant?.activeBranchId)}
          activeOpacity={0.7}
        >
          <Text style={styles.refreshBtnText}>🔄 Refresh</Text>
        </TouchableOpacity>
      </View>

      {/* Top Filter Tabs */}
      <View style={styles.tabsRow}>
        <TouchableOpacity
          style={[styles.tabChip, selectedTab === 'all' && { backgroundColor: preset.accentColor }]}
          onPress={() => setSelectedTab('all')}
        >
          <Text style={[styles.tabText, selectedTab === 'all' && { color: '#FFFFFF', fontWeight: '800' }]}>
            All Items ({industryProducts.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabChip, selectedTab === 'low_stock' && { backgroundColor: '#EF4444' }]}
          onPress={() => setSelectedTab('low_stock')}
        >
          <Text style={[styles.tabText, selectedTab === 'low_stock' && { color: '#FFFFFF', fontWeight: '800' }]}>
            Low Stock
          </Text>
        </TouchableOpacity>

        {isPharma && (
          <>
            <TouchableOpacity
              style={[styles.tabChip, selectedTab === 'expiring' && { backgroundColor: '#F59E0B' }]}
              onPress={() => setSelectedTab('expiring')}
            >
              <Text style={[styles.tabText, selectedTab === 'expiring' && { color: '#FFFFFF', fontWeight: '800' }]}>
                Expiring &lt;60d
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabChip, selectedTab === 'expired' && { backgroundColor: '#7F1D1D' }]}
              onPress={() => setSelectedTab('expired')}
            >
              <Text style={[styles.tabText, selectedTab === 'expired' && { color: '#FFFFFF', fontWeight: '800' }]}>
                Expired
              </Text>
            </TouchableOpacity>
          </>
        )}

        {isRestaurant && (
          <>
            <TouchableOpacity
              style={[styles.tabChip, selectedTab === 'dishes' && { backgroundColor: '#F97316' }]}
              onPress={() => setSelectedTab('dishes')}
            >
              <Text style={[styles.tabText, selectedTab === 'dishes' && { color: '#FFFFFF', fontWeight: '800' }]}>
                Menu Dishes
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabChip, selectedTab === 'raw' && { backgroundColor: '#6366F1' }]}
              onPress={() => setSelectedTab('raw')}
            >
              <Text style={[styles.tabText, selectedTab === 'raw' && { color: '#FFFFFF', fontWeight: '800' }]}>
                Raw Materials
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Search Bar */}
      <SearchBar
        query={searchQuery}
        onChangeQuery={setSearchQuery}
        placeholder={`Filter ${industryProducts.length} items...`}
        onPressBarcodeScanner={() => setShowScannerModal(true)}
        accentColor={preset.accentColor}
      />

      {/* Product List */}
      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <ProductCard
            product={item}
            onEdit={() => {
              setEditingProduct(item);
              setShowProductModal(true);
            }}
            onAddBatch={() => setBatchProduct(item)}
            onEditRecipe={() => setRecipeDish(item)}
            onAdjustStock={() => setAdjustingProduct(item)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Boxes size={36} color="#64748B" />
            <Text style={styles.emptyTitle}>No products found</Text>
            <Text style={styles.emptySubtitle}>Try changing your filter tabs or search keywords.</Text>
          </View>
        }
      />

      {/* Floating Add Product Button */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: preset.accentColor }]}
        onPress={() => {
          setEditingProduct(null);
          setShowProductModal(true);
        }}
        activeOpacity={0.85}
      >
        <Plus size={22} color="#FFFFFF" />
        <Text style={styles.fabText}>Add Product</Text>
      </TouchableOpacity>

      {/* Product Form Modal */}
      <ProductFormModal
        visible={showProductModal}
        initialProduct={editingProduct}
        onClose={() => {
          setShowProductModal(false);
          setEditingProduct(null);
        }}
        onSave={(data) => {
          if (editingProduct) {
            updateProduct(editingProduct.id, data);
          } else {
            addProduct(data);
          }
        }}
      />

      {/* Add Batch Modal (Pharmacy) */}
      <AddBatchModal
        visible={!!batchProduct}
        product={batchProduct}
        onClose={() => setBatchProduct(null)}
      />

      {/* Recipe Builder Modal (Restaurant) */}
      <RecipeBuilderModal
        visible={!!recipeDish}
        dish={recipeDish}
        onClose={() => setRecipeDish(null)}
      />

      {/* Adjust Stock Modal */}
      <AdjustStockModal
        visible={!!adjustingProduct}
        product={adjustingProduct}
        onClose={() => setAdjustingProduct(null)}
      />

      {/* Barcode Scanner Modal */}
      <BarcodeScannerModal
        visible={showScannerModal}
        onClose={() => setShowScannerModal(false)}
        mode="audit"
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0B1120',
  },
  syncStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#1E293B80',
    borderBottomWidth: 1,
    borderBottomColor: '#33415550',
  },
  syncLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  syncDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  syncText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
  },
  refreshBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#334155',
  },
  refreshBtnText: {
    fontSize: 11,
    color: '#F8FAFC',
    fontWeight: '700',
  },
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#0F172A',
    gap: 8,
  },
  tabChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
  },
  tabText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
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
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 30,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  fabText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
