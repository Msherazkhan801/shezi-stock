import React, { useState } from 'react';
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
  ScanBarcode,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  Plus,
  Trash2,
  Calendar,
  Layers,
} from 'lucide-react-native';
import { AppHeader } from '../components/common/AppHeader';
import { BarcodeScannerModal } from '../components/audit/BarcodeScannerModal';
import { Badge } from '../components/common/Badge';
import { useAppStore } from '../store/useAppStore';
import { useSalesStore } from '../store/useSalesStore';
import { INDUSTRY_PRESETS } from '../config/industryPresets';
import { AuditItem, StockAudit } from '../types/audit';

export const StockAuditScreen: React.FC = () => {
  const { activeIndustry, tenant } = useAppStore();
  const preset = INDUSTRY_PRESETS[activeIndustry];
  const { audits, addAudit } = useSalesStore();

  const [activeAuditItems, setActiveAuditItems] = useState<AuditItem[]>([]);
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [auditTitle, setAuditTitle] = useState('Weekly Cycle Count');

  const industryAudits = audits.filter((a) => {
    if (a.industry !== activeIndustry) return false;
    if (tenant?.id && tenant.id !== 'tenant-admin-hq') {
      if (a.tenantId && a.tenantId !== tenant.id) return false;
    }
    return true;
  });

  const totalExpected = activeAuditItems.reduce((sum, item) => sum + item.systemStock, 0);
  const totalCounted = activeAuditItems.reduce((sum, item) => sum + item.physicalStock, 0);
  const totalDiscrepancy = totalCounted - totalExpected;
  const totalLossGain = activeAuditItems.reduce((sum, item) => sum + item.lossGainValue, 0);

  const handleCompleteAuditSession = () => {
    if (activeAuditItems.length === 0) return;

    const newAudit: StockAudit = {
      id: `audit-${Date.now()}`,
      tenantId: tenant.id,
      branchId: tenant.activeBranchId,
      industry: activeIndustry,
      auditTitle,
      auditorName: 'Store Auditor',
      status: 'reconciled',
      items: [...activeAuditItems],
      totalExpectedUnits: totalExpected,
      totalCountedUnits: totalCounted,
      totalDiscrepancyUnits: totalDiscrepancy,
      totalLossGainValue: totalLossGain,
      createdAt: new Date().toISOString(),
      reconciledAt: new Date().toISOString(),
    };

    addAudit(newAudit);
    setActiveAuditItems([]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <AppHeader title="Barcode Stock Audit" showBranchSelector={false} />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Active Audit Session Card */}
        <View style={styles.sessionCard}>
          <View style={styles.sessionHeader}>
            <View>
              <Text style={styles.sessionTitle}>Live Count Session</Text>
              <Text style={styles.sessionSubtitle}>
                {activeAuditItems.length} product{activeAuditItems.length !== 1 ? 's' : ''} scanned
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.scanBtn, { backgroundColor: preset.accentColor }]}
              onPress={() => setShowScannerModal(true)}
              activeOpacity={0.8}
            >
              <ScanBarcode size={18} color="#FFFFFF" />
              <Text style={styles.scanBtnText}>Scan Item</Text>
            </TouchableOpacity>
          </View>

          {/* Live Variance Metrics */}
          {activeAuditItems.length > 0 && (
            <View style={styles.metricsGrid}>
              <View style={styles.metricBox}>
                <Text style={styles.metricLabel}>Expected</Text>
                <Text style={styles.metricVal}>{totalExpected}</Text>
              </View>
              <View style={styles.metricBox}>
                <Text style={styles.metricLabel}>Counted</Text>
                <Text style={styles.metricVal}>{totalCounted}</Text>
              </View>
              <View style={styles.metricBox}>
                <Text style={styles.metricLabel}>Discrepancy</Text>
                <Text
                  style={[
                    styles.metricVal,
                    {
                      color:
                        totalDiscrepancy === 0
                          ? '#10B981'
                          : totalDiscrepancy < 0
                          ? '#EF4444'
                          : '#F59E0B',
                    },
                  ]}
                >
                  {totalDiscrepancy > 0 ? `+${totalDiscrepancy}` : totalDiscrepancy}
                </Text>
              </View>
              <View style={styles.metricBox}>
                <Text style={styles.metricLabel}>Variance Value</Text>
                <Text
                  style={[
                    styles.metricVal,
                    { color: totalLossGain >= 0 ? '#10B981' : '#EF4444' },
                  ]}
                >
                  {tenant.currencySymbol}{Math.abs(totalLossGain).toFixed(2)}
                </Text>
              </View>
            </View>
          )}

          {/* Active Items Scanned */}
          {activeAuditItems.length > 0 ? (
            <View style={styles.activeItemsList}>
              {activeAuditItems.map((item, idx) => (
                <View key={idx} style={styles.itemRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemName}>{item.productName}</Text>
                    <Text style={styles.itemBarcode}>
                      Barcode: {item.barcode} • SKU: {item.sku}
                    </Text>
                    {item.notes && <Text style={styles.itemNotes}>"{item.notes}"</Text>}
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 4 }}>
                    <Text style={styles.itemCountText}>
                      Sys: {item.systemStock} → Count: <Text style={{ color: '#F8FAFC', fontWeight: '800' }}>{item.physicalStock}</Text>
                    </Text>
                    {item.discrepancy === 0 ? (
                      <Badge label="0 Variance" variant="success" size="small" />
                    ) : item.discrepancy < 0 ? (
                      <Badge
                        label={`Missing ${Math.abs(item.discrepancy)}`}
                        variant="danger"
                        size="small"
                      />
                    ) : (
                      <Badge
                        label={`Surplus +${item.discrepancy}`}
                        variant="warning"
                        size="small"
                      />
                    )}
                  </View>
                </View>
              ))}

              <TouchableOpacity
                style={[styles.finishBtn, { backgroundColor: preset.accentColor }]}
                onPress={handleCompleteAuditSession}
                activeOpacity={0.8}
              >
                <FileCheck size={18} color="#FFFFFF" />
                <Text style={styles.finishBtnText}>Complete & Save Audit Record</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.emptySessionBox}>
              <ScanBarcode size={32} color="#64748B" />
              <Text style={styles.emptySessionText}>No items scanned in current session</Text>
              <Text style={styles.emptySessionSubtext}>
                Tap "Scan Item" to scan physical items and compare against system inventory.
              </Text>
            </View>
          )}
        </View>

        {/* Audit History Log */}
        <Text style={styles.sectionHeader}>Completed Audit Logs</Text>
        {industryAudits.length === 0 ? (
          <View style={styles.emptyHistoryBox}>
            <Text style={styles.emptyHistoryText}>No past audits recorded yet.</Text>
          </View>
        ) : (
          industryAudits.map((audit) => (
            <View key={audit.id} style={styles.historyCard}>
              <View style={styles.historyTop}>
                <View>
                  <Text style={styles.historyTitle}>{audit.auditTitle}</Text>
                  <Text style={styles.historyDate}>
                    {new Date(audit.createdAt).toLocaleDateString()} • {audit.auditorName}
                  </Text>
                </View>
                <Badge label="RECONCILED" variant="success" size="small" />
              </View>

              <View style={styles.historyStatsRow}>
                <Text style={styles.historyStat}>
                  Expected: <Text style={styles.boldWhite}>{audit.totalExpectedUnits}</Text>
                </Text>
                <Text style={styles.historyStat}>
                  Counted: <Text style={styles.boldWhite}>{audit.totalCountedUnits}</Text>
                </Text>
                <Text style={styles.historyStat}>
                  Variance:{' '}
                  <Text
                    style={{
                      color:
                        audit.totalDiscrepancyUnits === 0
                          ? '#10B981'
                          : audit.totalDiscrepancyUnits < 0
                          ? '#EF4444'
                          : '#F59E0B',
                      fontWeight: '800',
                    }}
                  >
                    {audit.totalDiscrepancyUnits}
                  </Text>
                </Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Barcode Scanner Modal */}
      <BarcodeScannerModal
        visible={showScannerModal}
        onClose={() => setShowScannerModal(false)}
        onItemAudited={(item) => {
          setActiveAuditItems((prev) => [item, ...prev]);
        }}
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
    paddingBottom: 40,
    gap: 16,
  },
  sessionCard: {
    backgroundColor: '#1E293B',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sessionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  sessionSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  scanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  scanBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  metricsGrid: {
    flexDirection: 'row',
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  metricBox: {
    flex: 1,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  metricVal: {
    fontSize: 15,
    fontWeight: '800',
    color: '#F8FAFC',
    marginTop: 2,
  },
  activeItemsList: {
    gap: 10,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  itemName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  itemBarcode: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    fontFamily: 'monospace',
  },
  itemNotes: {
    fontSize: 11,
    color: '#F59E0B',
    fontStyle: 'italic',
    marginTop: 2,
  },
  itemCountText: {
    fontSize: 12,
    color: '#94A3B8',
  },
  finishBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    marginTop: 8,
  },
  finishBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  emptySessionBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 36,
    gap: 6,
  },
  emptySessionText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  emptySessionSubtext: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '800',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  emptyHistoryBox: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
  },
  emptyHistoryText: {
    fontSize: 13,
    color: '#64748B',
  },
  historyCard: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  historyTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  historyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  historyDate: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  historyStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#0F172A',
    borderRadius: 8,
    padding: 10,
  },
  historyStat: {
    fontSize: 12,
    color: '#94A3B8',
  },
  boldWhite: {
    color: '#F8FAFC',
    fontWeight: '700',
  },
});
