import React, { useState, useMemo, useEffect } from 'react';
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
  Receipt,
  Search,
  ChevronRight,
  TrendingUp,
  DollarSign,
  Layers,
  Calendar,
  CreditCard,
  Banknote,
  Smartphone,
  BookOpen,
  PieChart,
} from 'lucide-react-native';
import { AppHeader } from '../components/common/AppHeader';
import { SearchBar } from '../components/common/SearchBar';
import { Badge } from '../components/common/Badge';
import { StatCard } from '../components/common/StatCard';
import { ReceiptModal } from '../components/pos/ReceiptModal';
import { useAppStore } from '../store/useAppStore';
import { useSalesStore, calculateSaleProfit } from '../store/useSalesStore';
import { INDUSTRY_PRESETS } from '../config/industryPresets';
import { SaleTransaction } from '../types/sale';

export const SalesHistoryScreen: React.FC = () => {
  const { activeIndustry, tenant } = useAppStore();
  const preset = INDUSTRY_PRESETS[activeIndustry];
  const { getSalesByIndustry, getAllTimeStats, initSalesSync } = useSalesStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [selectedSale, setSelectedSale] = useState<SaleTransaction | null>(null);

  // Sync real-time sales from Firestore
  useEffect(() => {
    if (tenant?.id && tenant?.activeBranchId) {
      const unsub = initSalesSync(tenant.id, tenant.activeBranchId);
      return () => {
        if (typeof unsub === 'function') unsub();
      };
    }
  }, [tenant?.id, tenant?.activeBranchId]);

  const sales = getSalesByIndustry(activeIndustry, tenant?.id);
  const stats = getAllTimeStats(activeIndustry, tenant?.id);

  const filteredSales = useMemo(() => {
    return sales.filter((s) => {
      const matchSearch =
        s.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.customerName && s.customerName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (s.tableNumber && s.tableNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
        s.items?.some((i) => i.product?.name?.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchPayment = paymentFilter === 'all' || s.paymentMethod === paymentFilter;

      return matchSearch && matchPayment;
    });
  }, [sales, searchQuery, paymentFilter]);

  const paymentFilters = [
    { id: 'all', label: 'All Payments' },
    { id: 'cash', label: 'Cash' },
    { id: 'card', label: 'Card' },
    { id: 'online', label: 'Digital' },
    { id: 'credit_ledger', label: 'Ledger' },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <AppHeader title="Sales Records & Profit" showBranchSelector={false} />

      {/* Financial Executive Summary Cards */}
      <View style={styles.metricsContainer}>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Total Revenue</Text>
          <Text style={styles.metricValue}>
            {tenant.currencySymbol}{stats.totalRevenue.toFixed(2)}
          </Text>
          <Text style={styles.metricSub}>{stats.totalOrders} total sales recorded</Text>
        </View>

        <View style={[styles.metricCard, styles.profitCard]}>
          <View style={styles.profitHeaderRow}>
            <Text style={[styles.metricLabel, { color: '#34D399' }]}>Net Profit</Text>
            <View style={styles.marginBadge}>
              <Text style={styles.marginBadgeText}>
                {stats.profitMargin >= 0 ? '+' : ''}{stats.profitMargin.toFixed(1)}% Margin
              </Text>
            </View>
          </View>
          <Text style={[styles.metricValue, { color: '#10B981' }]}>
            {tenant.currencySymbol}{stats.netProfit.toFixed(2)}
          </Text>
          <Text style={styles.metricSub}>
            Cost (COGS): {tenant.currencySymbol}{stats.totalCost.toFixed(2)}
          </Text>
        </View>
      </View>

      {/* Payment Method Filters */}
      <View style={styles.filterRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {paymentFilters.map((pf) => (
            <TouchableOpacity
              key={pf.id}
              style={[
                styles.filterChip,
                paymentFilter === pf.id && {
                  backgroundColor: preset.accentColor,
                  borderColor: preset.accentColor,
                },
              ]}
              onPress={() => setPaymentFilter(pf.id)}
            >
              <Text
                style={[
                  styles.filterText,
                  paymentFilter === pf.id && { color: '#FFFFFF', fontWeight: '800' },
                ]}
              >
                {pf.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Search Bar */}
      <SearchBar
        query={searchQuery}
        onChangeQuery={setSearchQuery}
        placeholder="Search invoice #, customer, medicine / dish..."
        accentColor={preset.accentColor}
      />

      {/* Invoices List */}
      <FlatList
        data={filteredSales}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const profitData = calculateSaleProfit(item);

          return (
            <TouchableOpacity
              style={styles.invoiceCard}
              onPress={() => setSelectedSale(item)}
              activeOpacity={0.7}
            >
              <View style={styles.invoiceTop}>
                <View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={styles.invoiceNumber}>{item.invoiceNumber}</Text>
                    {item.industry === 'pharmacy' && item.items.some((i) => i.selectedBatch) && (
                      <View style={styles.fefoBadge}>
                        <Text style={styles.fefoBadgeText}>FEFO Batch</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.invoiceTime}>
                    {new Date(item.createdAt).toLocaleDateString()} •{' '}
                    {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>

                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.invoiceAmount}>
                    {tenant.currencySymbol}{item.grandTotal.toFixed(2)}
                  </Text>
                  <Badge
                    label={item.paymentMethod.toUpperCase().replace('_', ' ')}
                    variant={item.paymentMethod === 'cash' ? 'success' : 'info'}
                    size="small"
                  />
                </View>
              </View>

              {/* Items preview */}
              <View style={styles.invoiceDetails}>
                <Text style={styles.itemsSummary} numberOfLines={1}>
                  {item.items?.map((i) => `${i.quantity}x ${i.product?.name || 'Item'}`).join(', ') || 'No item details'}
                </Text>

                {/* Profit & Margin Indicator Strip */}
                <View style={styles.profitStrip}>
                  <View style={styles.profitStripItem}>
                    <Text style={styles.profitStripLabel}>Cost:</Text>
                    <Text style={styles.profitStripVal}>
                      {tenant.currencySymbol}{profitData.cost.toFixed(2)}
                    </Text>
                  </View>

                  <View style={styles.profitStripItem}>
                    <Text style={styles.profitStripLabel}>Net Profit:</Text>
                    <Text
                      style={[
                        styles.profitStripVal,
                        { color: profitData.netProfit >= 0 ? '#10B981' : '#EF4444', fontWeight: '800' },
                      ]}
                    >
                      {profitData.netProfit >= 0 ? '+' : ''}{tenant.currencySymbol}{profitData.netProfit.toFixed(2)}
                      {' '}({profitData.marginPercent.toFixed(1)}%)
                    </Text>
                  </View>

                  <View style={styles.invoiceMetaRow}>
                    <Text style={styles.metaSub}>
                      👤 {item.customerName || 'Walk-in'}
                    </Text>
                    <ChevronRight size={14} color="#64748B" />
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Receipt size={36} color="#64748B" />
            <Text style={styles.emptyTitle}>No transaction receipts found</Text>
            <Text style={styles.emptySubtitle}>
              Completed checkouts will record automatically here and show live Net Profit.
            </Text>
          </View>
        }
      />

      {/* Receipt Preview & Printing Modal */}
      <ReceiptModal
        visible={!!selectedSale}
        sale={selectedSale}
        onClose={() => setSelectedSale(null)}
        onNewSale={() => setSelectedSale(null)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0B1120',
  },
  metricsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 10,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  profitCard: {
    borderColor: '#05966960',
    backgroundColor: '#064E3B20',
  },
  profitHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  marginBadge: {
    backgroundColor: '#10B98125',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#10B98150',
  },
  marginBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#34D399',
  },
  metricLabel: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  metricValue: {
    fontSize: 19,
    fontWeight: '900',
    color: '#F8FAFC',
    marginVertical: 2,
  },
  metricSub: {
    fontSize: 10,
    color: '#64748B',
  },
  filterRow: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#0F172A',
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
  },
  filterText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 10,
  },
  invoiceCard: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  invoiceTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  invoiceNumber: {
    fontSize: 15,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  fefoBadge: {
    backgroundColor: '#10B98125',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: '#10B981',
  },
  fefoBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#34D399',
  },
  invoiceTime: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  invoiceAmount: {
    fontSize: 16,
    fontWeight: '900',
    color: '#F8FAFC',
    marginBottom: 4,
  },
  invoiceDetails: {
    borderTopWidth: 1,
    borderTopColor: '#334155',
    paddingTop: 8,
  },
  itemsSummary: {
    fontSize: 12,
    color: '#CBD5E1',
    fontWeight: '500',
    marginBottom: 8,
  },
  profitStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 8,
    padding: 8,
    gap: 12,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  profitStripItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  profitStripLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '700',
  },
  profitStripVal: {
    fontSize: 11,
    color: '#CBD5E1',
    fontWeight: '600',
  },
  invoiceMetaRow: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 4,
  },
  metaSub: {
    fontSize: 11,
    color: '#94A3B8',
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
    textAlign: 'center',
    maxWidth: 280,
  },
});

