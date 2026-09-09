import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import {
  TrendingUp,
  DollarSign,
  PieChart,
  ShoppingBag,
  Award,
  Layers,
  Calendar,
  Zap,
  Percent,
} from 'lucide-react-native';
import { AppHeader } from '../components/common/AppHeader';
import { StatCard } from '../components/common/StatCard';
import { Badge } from '../components/common/Badge';
import { useAppStore } from '../store/useAppStore';
import { useSalesStore } from '../store/useSalesStore';
import { useInventoryStore } from '../store/useInventoryStore';
import { INDUSTRY_PRESETS } from '../config/industryPresets';

export const AnalyticsScreen: React.FC = () => {
  const { activeIndustry, tenant } = useAppStore();
  const preset = INDUSTRY_PRESETS[activeIndustry];
  const { getSalesByIndustry, getAllTimeStats, getTopSellingItems, initSalesSync } = useSalesStore();
  const { products, getLowStockProducts } = useInventoryStore();

  useEffect(() => {
    if (tenant?.id && tenant?.activeBranchId) {
      const unsub = initSalesSync(tenant.id, tenant.activeBranchId);
      return () => {
        if (typeof unsub === 'function') unsub();
      };
    }
  }, [tenant?.id, tenant?.activeBranchId]);

  const stats = getAllTimeStats(activeIndustry, tenant?.id);
  const topItems = getTopSellingItems(activeIndustry, 5, tenant?.id);
  const lowStock = getLowStockProducts(activeIndustry, tenant?.id);

  return (
    <SafeAreaView style={styles.safeArea}>
      <AppHeader title="Analytics & Profit Reports" showBranchSelector={false} />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Financial KPI Summary Grid */}
        <View style={styles.statsGrid}>
          <StatCard
            title="Total Revenue"
            value={`${tenant.currencySymbol}${stats.totalRevenue.toFixed(2)}`}
            subtitle={`${stats.totalOrders} total sales`}
            icon={DollarSign}
            accentColor={preset.accentColor}
            badgeText="All Time"
            badgeType="success"
          />

          <StatCard
            title="Total Net Profit"
            value={`${tenant.currencySymbol}${stats.netProfit.toFixed(2)}`}
            subtitle={`${stats.profitMargin.toFixed(1)}% profit margin`}
            icon={TrendingUp}
            accentColor="#10B981"
            badgeText={stats.netProfit > 0 ? `+${stats.profitMargin.toFixed(0)}%` : 'Active'}
            badgeType="success"
          />

          <StatCard
            title="Total Cost (COGS)"
            value={`${tenant.currencySymbol}${stats.totalCost.toFixed(2)}`}
            subtitle="Inventory product cost"
            icon={Percent}
            accentColor="#F59E0B"
          />

          <StatCard
            title="Units Dispatched"
            value={stats.totalUnitsSold}
            subtitle={`${lowStock.length} items low stock`}
            icon={ShoppingBag}
            accentColor={preset.accentSecondary}
          />
        </View>

        {/* Top Moving Products with Profit */}
        <Text style={styles.sectionHeader}>Top Selling Products & Profit Contribution</Text>
        <View style={styles.topItemsCard}>
          {topItems.length === 0 ? (
            <Text style={styles.emptyText}>No sales recorded yet to calculate top items.</Text>
          ) : (
            topItems.map((item, idx) => (
              <View key={idx} style={styles.topItemRow}>
                <View style={styles.rankBadge}>
                  <Text style={styles.rankNumber}>#{idx + 1}</Text>
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.topItemName}>{item.name}</Text>
                  <Text style={styles.topItemUnits}>
                    {item.quantity} units sold • Profit: <Text style={{ color: '#10B981', fontWeight: '800' }}>+{tenant.currencySymbol}{item.profit.toFixed(2)}</Text>
                  </Text>
                </View>

                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={[styles.topItemRevenue, { color: preset.accentColor }]}>
                    {tenant.currencySymbol}{item.revenue.toFixed(2)}
                  </Text>
                  <Text style={styles.revenueLabel}>Gross Revenue</Text>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Sector Specific Report Summary */}
        <Text style={styles.sectionHeader}>Sector Performance Breakdown</Text>
        <View style={styles.sectorReportCard}>
          {activeIndustry === 'pharmacy' && (
            <View style={styles.reportItem}>
              <Text style={styles.reportTitle}>💊 Prescription vs OTC Distribution</Text>
              <Text style={styles.reportDesc}>
                62% Over-the-counter wellness • 38% Scheduled Prescription drugs with doctor ID verification.
              </Text>
              <View style={styles.progressTrack}>
                <View style={[styles.progressBar, { width: '62%', backgroundColor: '#10B981' }]} />
                <View style={[styles.progressBar, { width: '38%', backgroundColor: '#EF4444' }]} />
              </View>
            </View>
          )}

          {activeIndustry === 'general_store' && (
            <View style={styles.reportItem}>
              <Text style={styles.reportTitle}>🏬 Retail vs Wholesale Mix</Text>
              <Text style={styles.reportDesc}>
                74% Retail counter sales • 26% Master Carton Wholesale fulfillment.
              </Text>
              <View style={styles.progressTrack}>
                <View style={[styles.progressBar, { width: '74%', backgroundColor: '#6366F1' }]} />
                <View style={[styles.progressBar, { width: '26%', backgroundColor: '#F59E0B' }]} />
              </View>
            </View>
          )}

          {activeIndustry === 'restaurant' && (
            <View style={styles.reportItem}>
              <Text style={styles.reportTitle}>🍽️ Dine-In vs Takeaway Distribution</Text>
              <Text style={styles.reportDesc}>
                58% Dine-in table orders • 42% Takeaway & Delivery orders.
              </Text>
              <View style={styles.progressTrack}>
                <View style={[styles.progressBar, { width: '58%', backgroundColor: '#F97316' }]} />
                <View style={[styles.progressBar, { width: '42%', backgroundColor: '#38BDF8' }]} />
              </View>
            </View>
          )}
        </View>
      </ScrollView>
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
    paddingBottom: 40,
    gap: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '800',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  topItemsCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 12,
  },
  topItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  rankBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankNumber: {
    fontSize: 12,
    fontWeight: '800',
    color: '#94A3B8',
  },
  topItemName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  topItemUnits: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 1,
  },
  topItemRevenue: {
    fontSize: 15,
    fontWeight: '800',
  },
  revenueLabel: {
    fontSize: 9,
    color: '#64748B',
    marginTop: 1,
  },
  emptyText: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    paddingVertical: 10,
  },
  sectorReportCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  reportItem: {
    gap: 6,
  },
  reportTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  reportDesc: {
    fontSize: 12,
    color: '#94A3B8',
    lineHeight: 16,
  },
  progressTrack: {
    flexDirection: 'row',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: '#0F172A',
    marginTop: 8,
  },
  progressBar: {
    height: '100%',
  },
});

