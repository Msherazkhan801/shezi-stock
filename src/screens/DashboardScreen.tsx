import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Clock,
  Plus,
  QrCode,
  Receipt,
  ChevronRight,
  Sparkles,
  Layers,
  MapPin,
  UtensilsCrossed,
  Pill,
  PieChart,
} from 'lucide-react-native';
import { AppHeader } from '../components/common/AppHeader';
import { StatCard } from '../components/common/StatCard';
import { Badge } from '../components/common/Badge';
import { ActionButton } from '../components/common/ActionButton';
import { ReceiptModal } from '../components/pos/ReceiptModal';
import { ProductFormModal } from '../components/inventory/ProductFormModal';
import { BarcodeScannerModal } from '../components/audit/BarcodeScannerModal';
import { useAppStore } from '../store/useAppStore';
import { useInventoryStore } from '../store/useInventoryStore';
import { useSalesStore, calculateSaleProfit } from '../store/useSalesStore';
import { INDUSTRY_PRESETS } from '../config/industryPresets';
import { SaleTransaction } from '../types/sale';

export const DashboardScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { activeIndustry, tenant } = useAppStore();
  const preset = INDUSTRY_PRESETS[activeIndustry];

  const {
    getLowStockProducts,
    getExpiringProducts,
    getExpiredProducts,
    getRawIngredients,
    addProduct,
    initInventorySync,
  } = useInventoryStore();

  const { getTodayStats, getSalesByIndustry, initSalesSync } = useSalesStore();

  const [selectedSale, setSelectedSale] = useState<SaleTransaction | null>(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showScannerModal, setShowScannerModal] = useState(false);

  // Sync sales and inventory from Firestore in real-time
  useEffect(() => {
    if (tenant?.id && tenant?.activeBranchId) {
      const unsubSales = initSalesSync(tenant.id, tenant.activeBranchId);
      const unsubInventory = initInventorySync(tenant.id, tenant.activeBranchId);
      return () => {
        if (typeof unsubSales === 'function') unsubSales();
        if (typeof unsubInventory === 'function') unsubInventory();
      };
    }
  }, [tenant?.id, tenant?.activeBranchId]);

  const stats = getTodayStats(activeIndustry, tenant?.id);
  const lowStockItems = getLowStockProducts(activeIndustry, tenant?.id);
  const expiringItems = getExpiringProducts(60, tenant?.id);
  const expiredItems = getExpiredProducts(tenant?.id);
  const rawIngredients = getRawIngredients(tenant?.id);
  const lowIngredients = rawIngredients.filter((r) => r.currentStock <= r.minStockAlert);
  const recentSales = getSalesByIndustry(activeIndustry, tenant?.id).slice(0, 6);

  const isPharma = activeIndustry === 'pharmacy';
  const isGeneral = activeIndustry === 'general_store';
  const isRestaurant = activeIndustry === 'restaurant';

  return (
    <SafeAreaView style={styles.safeArea}>
      <AppHeader />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Dynamic Sector Alerts */}
        {isPharma && expiredItems.length > 0 && (
          <View style={styles.alertBanner}>
            <AlertTriangle size={18} color="#EF4444" />
            <View style={{ flex: 1 }}>
              <Text style={styles.alertTitle}>Expired Drug Alert</Text>
              <Text style={styles.alertDesc}>
                {expiredItems.length} medicine batch{expiredItems.length !== 1 ? 'es are' : ' is'} past expiry. Pull from shelves immediately.
              </Text>
            </View>
          </View>
        )}

        {isRestaurant && lowIngredients.length > 0 && (
          <View style={[styles.alertBanner, { backgroundColor: '#7C2D1225', borderColor: '#EA580C' }]}>
            <Layers size={18} color="#F97316" />
            <View style={{ flex: 1 }}>
              <Text style={[styles.alertTitle, { color: '#F97316' }]}>Low Raw Ingredient Alert</Text>
              <Text style={styles.alertDesc}>
                {lowIngredients.length} ingredients running low.
              </Text>
            </View>
          </View>
        )}

        {/* Dynamic KPI Cards Grid */}
        <View style={styles.statsGrid}>
          <StatCard
            title="Today's Revenue"
            value={`${tenant.currencySymbol}${stats.revenue.toFixed(2)}`}
            subtitle={`${stats.ordersCount} sales recorded`}
            icon={DollarSign}
            accentColor={preset.accentColor}
            badgeText={stats.ordersCount > 0 ? `${stats.ordersCount} sales` : 'No Sales'}
            badgeType="success"
          />

          <StatCard
            title="Today's Net Profit"
            value={`${tenant.currencySymbol}${stats.netProfit.toFixed(2)}`}
            subtitle={`${stats.profitMargin.toFixed(1)}% profit margin`}
            icon={TrendingUp}
            accentColor="#10B981"
            badgeText={stats.netProfit > 0 ? `+${stats.profitMargin.toFixed(0)}%` : 'Active'}
            badgeType="success"
          />

          <StatCard
            title="Avg Order Value"
            value={`${tenant.currencySymbol}${stats.avgOrderValue.toFixed(2)}`}
            subtitle="Per checkout ticket"
            icon={PieChart}
            accentColor={preset.accentSecondary}
          />

          {isPharma ? (
            <StatCard
              title="Expiring Soon"
              value={expiringItems.length}
              subtitle="Within next 60 days"
              icon={Clock}
              accentColor="#F59E0B"
              badgeText={expiringItems.length > 0 ? 'FEFO Active' : 'All Clear'}
              badgeType={expiringItems.length > 0 ? 'warning' : 'success'}
            />
          ) : isGeneral ? (
            <StatCard
              title="Low Stock Items"
              value={lowStockItems.length}
              subtitle="Needs reorder from supplier"
              icon={AlertTriangle}
              accentColor="#F59E0B"
              badgeText={`${lowStockItems.length} SKUs`}
              badgeType={lowStockItems.length > 0 ? 'warning' : 'success'}
            />
          ) : (
            <StatCard
              title="Low Ingredients"
              value={lowIngredients.length}
              subtitle="Affects dish recipes"
              icon={Layers}
              accentColor="#F97316"
              badgeText={`${lowIngredients.length} raw`}
              badgeType={lowIngredients.length > 0 ? 'warning' : 'success'}
            />
          )}
        </View>

        {/* Quick Industry Action Buttons */}
        <Text style={styles.sectionHeader}>Operational Actions</Text>
        <View style={styles.actionRow}>
          <ActionButton
            label="Open POS Terminal"
            icon={Sparkles}
            onPress={() => navigation.navigate('POS')}
            variant="primary"
            accentColor={preset.accentColor}
          />
          <ActionButton
            label="Add New Product"
            icon={Plus}
            onPress={() => setShowProductModal(true)}
            variant="secondary"
          />
          <ActionButton
            label="Scan Barcode / Audit"
            icon={QrCode}
            onPress={() => setShowScannerModal(true)}
            variant="outline"
          />
        </View>

        {/* Recent Transactions List with Net Profit */}
        <View style={styles.recentSalesHeader}>
          <Text style={styles.sectionHeader}>Recent Closed Sales</Text>
          <TouchableOpacity onPress={() => navigation.navigate('History')}>
            <Text style={[styles.viewAllLink, { color: preset.accentColor }]}>View All Records →</Text>
          </TouchableOpacity>
        </View>

        {recentSales.length === 0 ? (
          <View style={styles.emptySalesCard}>
            <Receipt size={28} color="#64748B" />
            <Text style={styles.emptySalesText}>No sales recorded yet today</Text>
            <TouchableOpacity
              style={[styles.startPosBtn, { backgroundColor: preset.accentColor }]}
              onPress={() => navigation.navigate('POS')}
            >
              <Text style={styles.startPosBtnText}>Open POS & Start Selling</Text>
            </TouchableOpacity>
          </View>
        ) : (
          recentSales.map((sale) => {
            const profit = calculateSaleProfit(sale);

            return (
              <TouchableOpacity
                key={sale.id}
                style={styles.saleItemCard}
                onPress={() => setSelectedSale(sale)}
                activeOpacity={0.7}
              >
                <View style={[styles.saleIconBox, { backgroundColor: `${preset.accentColor}20` }]}>
                  <Receipt size={18} color={preset.accentColor} />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.saleInvoice}>{sale.invoiceNumber}</Text>
                  <Text style={styles.saleMeta}>
                    {new Date(sale.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {sale.customerName || 'Walk-in'}
                    {sale.tableNumber ? ` (${sale.tableNumber})` : ''}
                  </Text>
                  <Text style={styles.profitBadgeText}>
                    Net Profit: <Text style={{ color: '#10B981', fontWeight: '800' }}>+{tenant.currencySymbol}{profit.netProfit.toFixed(2)}</Text> ({profit.marginPercent.toFixed(0)}%)
                  </Text>
                </View>

                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.saleAmount}>
                    {tenant.currencySymbol}{sale.grandTotal.toFixed(2)}
                  </Text>
                  <Badge label={sale.paymentMethod.toUpperCase().replace('_', ' ')} variant="neutral" size="small" />
                </View>
                <ChevronRight size={16} color="#64748B" style={{ marginLeft: 6 }} />
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* Invoice Receipt Modal */}
      <ReceiptModal
        visible={!!selectedSale}
        sale={selectedSale}
        onClose={() => setSelectedSale(null)}
        onNewSale={() => {
          setSelectedSale(null);
          navigation.navigate('POS');
        }}
      />

      {/* Product Form Modal */}
      <ProductFormModal
        visible={showProductModal}
        onClose={() => setShowProductModal(false)}
        onSave={(data) => addProduct(data)}
      />

      {/* Barcode Scanner Audit Modal */}
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
  scroll: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#7F1D1D25',
    borderWidth: 1,
    borderColor: '#DC2626',
    borderRadius: 14,
    padding: 14,
    gap: 12,
    marginBottom: 16,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#F87171',
  },
  alertDesc: {
    fontSize: 12,
    color: '#CBD5E1',
    marginTop: 2,
    lineHeight: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '800',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  recentSalesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  viewAllLink: {
    fontSize: 12,
    fontWeight: '700',
  },
  emptySalesCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
    gap: 8,
  },
  emptySalesText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#94A3B8',
  },
  startPosBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 4,
  },
  startPosBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  saleItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  saleIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  saleInvoice: {
    fontSize: 14,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  saleMeta: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  profitBadgeText: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 3,
    fontWeight: '600',
  },
  saleAmount: {
    fontSize: 15,
    fontWeight: '800',
    color: '#F8FAFC',
    marginBottom: 2,
  },
});
