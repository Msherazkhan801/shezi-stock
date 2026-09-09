import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Platform,
} from 'react-native';
import {
  X,
  ScanBarcode,
  Search,
  CheckCircle2,
  AlertCircle,
  Plus,
  Minus,
  Sparkles,
  Camera,
} from 'lucide-react-native';
import { Product } from '../../types/product';
import { AuditItem } from '../../types/audit';
import { useInventoryStore } from '../../store/useInventoryStore';
import { useAppStore } from '../../store/useAppStore';
import { BarcodeService } from '../../services/barcodeService';
import { Badge } from '../common/Badge';
import { INDUSTRY_PRESETS } from '../../config/industryPresets';

interface BarcodeScannerModalProps {
  visible: boolean;
  onClose: () => void;
  onItemAudited?: (item: AuditItem) => void;
  onDirectAddToPos?: (product: Product) => void;
  mode?: 'audit' | 'pos_scan';
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  visible,
  onClose,
  onItemAudited,
  onDirectAddToPos,
  mode = 'audit',
}) => {
  const { activeIndustry, tenant } = useAppStore();
  const preset = INDUSTRY_PRESETS[activeIndustry];
  const { products, adjustStock } = useInventoryStore();

  const activeProducts = products.filter((p) => p.industry === activeIndustry);

  const [barcodeQuery, setBarcodeQuery] = useState('');
  const [scannedProduct, setScannedProduct] = useState<Product | null>(null);
  const [physicalCount, setPhysicalCount] = useState<number>(0);
  const [notes, setNotes] = useState('');

  const handleBarcodeSubmit = (code: string) => {
    const found = BarcodeService.findProductByBarcode(activeProducts, code);
    if (found) {
      setScannedProduct(found);
      setPhysicalCount(found.currentStock);
      if (mode === 'pos_scan' && onDirectAddToPos) {
        onDirectAddToPos(found);
        onClose();
      }
    } else {
      setScannedProduct(null);
    }
  };

  const handleSelectQuickSample = (p: Product) => {
    setBarcodeQuery(p.barcode);
    setScannedProduct(p);
    setPhysicalCount(p.currentStock);
  };

  const discrepancy = scannedProduct ? physicalCount - scannedProduct.currentStock : 0;
  const lossGainValue = scannedProduct ? discrepancy * scannedProduct.costPrice : 0;

  const handleReconcileAndSave = () => {
    if (!scannedProduct) return;

    // 1. Update stock in inventory
    adjustStock(scannedProduct.id, physicalCount, notes || 'Barcode Stock Audit Count');

    // 2. Report audit line item
    if (onItemAudited) {
      const auditItem: AuditItem = {
        productId: scannedProduct.id,
        productName: scannedProduct.name,
        sku: scannedProduct.sku,
        barcode: scannedProduct.barcode,
        systemStock: scannedProduct.currentStock,
        physicalStock: physicalCount,
        discrepancy,
        unitCost: scannedProduct.costPrice,
        lossGainValue,
        notes: notes.trim() || undefined,
        scannedAt: new Date().toISOString(),
      };
      onItemAudited(auditItem);
    }

    setScannedProduct(null);
    setBarcodeQuery('');
    setNotes('');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={[styles.iconCircle, { backgroundColor: `${preset.accentColor}25` }]}>
                <ScanBarcode size={20} color={preset.accentColor} />
              </View>
              <View>
                <Text style={styles.title}>
                  {mode === 'audit' ? 'Barcode Stock Audit' : 'Scan Product to POS'}
                </Text>
                <Text style={styles.subtitle}>Camera & Barcode Scanner</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
            {/* Camera Viewport Simulation */}
            <View style={styles.cameraViewport}>
              <View style={styles.reticleCornerTL} />
              <View style={styles.reticleCornerTR} />
              <View style={styles.reticleCornerBL} />
              <View style={styles.reticleCornerBR} />
              <View style={[styles.laserBeam, { backgroundColor: preset.accentColor }]} />
              <Camera size={32} color="#64748B" style={styles.cameraIcon} />
              <Text style={styles.cameraHelpText}>Align barcode inside viewfinder</Text>
            </View>

            {/* Manual Barcode Input */}
            <View style={styles.inputRow}>
              <TextInput
                style={styles.barcodeInput}
                placeholder="Enter or scan barcode / SKU..."
                placeholderTextColor="#64748B"
                value={barcodeQuery}
                onChangeText={(text) => {
                  setBarcodeQuery(text);
                  handleBarcodeSubmit(text);
                }}
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={() => handleBarcodeSubmit(barcodeQuery)}
                style={[styles.searchBtn, { backgroundColor: preset.accentColor }]}
              >
                <Search size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {/* Quick Demo Test Barcodes */}
            <Text style={styles.quickLabel}>⚡ 1-Tap Quick Scan ({activeProducts.length} items):</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickBarcodesScroll}>
              {activeProducts.map((p) => (
                <TouchableOpacity
                  key={p.id}
                  style={[
                    styles.quickChip,
                    scannedProduct?.id === p.id && {
                      borderColor: preset.accentColor,
                      backgroundColor: `${preset.accentColor}20`,
                    },
                  ]}
                  onPress={() => handleSelectQuickSample(p)}
                >
                  <Text style={styles.quickChipName} numberOfLines={1}>
                    {p.name}
                  </Text>
                  <Text style={styles.quickChipBarcode}>{p.barcode}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Scanned Result Card & Audit Adjuster */}
            {scannedProduct ? (
              <View style={styles.resultCard}>
                <View style={styles.resultHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.resultCategory}>{scannedProduct.category}</Text>
                    <Text style={styles.resultName}>{scannedProduct.name}</Text>
                    <Text style={styles.resultMeta}>
                      SKU: {scannedProduct.sku} • Barcode: {scannedProduct.barcode}
                    </Text>
                  </View>
                  <Badge label="Match Found" variant="success" size="small" />
                </View>

                {/* System vs Physical Counter */}
                <View style={styles.auditCounterBox}>
                  <View style={styles.countColumn}>
                    <Text style={styles.countLabel}>System Stock</Text>
                    <Text style={styles.systemStockVal}>
                      {scannedProduct.currentStock} {scannedProduct.unit}
                    </Text>
                  </View>

                  <View style={styles.stepperColumn}>
                    <Text style={styles.countLabel}>Physical Count</Text>
                    <View style={styles.stepperRow}>
                      <TouchableOpacity
                        onPress={() => setPhysicalCount(Math.max(0, physicalCount - 1))}
                        style={styles.stepperBtn}
                      >
                        <Minus size={16} color="#F8FAFC" />
                      </TouchableOpacity>
                      <TextInput
                        style={styles.countInput}
                        keyboardType="numeric"
                        value={physicalCount.toString()}
                        onChangeText={(txt) => setPhysicalCount(parseInt(txt) || 0)}
                      />
                      <TouchableOpacity
                        onPress={() => setPhysicalCount(physicalCount + 1)}
                        style={styles.stepperBtn}
                      >
                        <Plus size={16} color="#F8FAFC" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>

                {/* Discrepancy Status */}
                <View style={styles.discrepancyBanner}>
                  <Text style={styles.discrepancyLabel}>Discrepancy:</Text>
                  {discrepancy === 0 ? (
                    <Badge label="Perfect Match (0 Variance)" variant="success" />
                  ) : discrepancy < 0 ? (
                    <Badge
                      label={`Missing ${Math.abs(discrepancy)} units (-${tenant.currencySymbol}${Math.abs(lossGainValue).toFixed(2)})`}
                      variant="danger"
                    />
                  ) : (
                    <Badge
                      label={`Surplus +${discrepancy} units (+${tenant.currencySymbol}${lossGainValue.toFixed(2)})`}
                      variant="warning"
                    />
                  )}
                </View>

                <TextInput
                  style={styles.notesInput}
                  placeholder="Add discrepancy audit note (optional)..."
                  placeholderTextColor="#64748B"
                  value={notes}
                  onChangeText={setNotes}
                />

                <TouchableOpacity
                  onPress={handleReconcileAndSave}
                  style={[styles.reconcileBtn, { backgroundColor: preset.accentColor }]}
                  activeOpacity={0.8}
                >
                  <CheckCircle2 size={18} color="#FFFFFF" />
                  <Text style={styles.reconcileBtnText}>Reconcile & Log Audit</Text>
                </TouchableOpacity>
              </View>
            ) : barcodeQuery.length > 0 ? (
              <View style={styles.noMatchBox}>
                <AlertCircle size={24} color="#EF4444" />
                <Text style={styles.noMatchTitle}>No matching product found</Text>
                <Text style={styles.noMatchSubtext}>
                  No item in {preset.title} matches barcode "{barcodeQuery}".
                </Text>
              </View>
            ) : null}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#1E293B',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '92%',
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
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  subtitle: {
    fontSize: 12,
    color: '#94A3B8',
  },
  closeBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#0F172A',
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 12,
  },
  cameraViewport: {
    height: 140,
    backgroundColor: '#020617',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  reticleCornerTL: {
    position: 'absolute',
    top: 14,
    left: 14,
    width: 24,
    height: 24,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderColor: '#38BDF8',
  },
  reticleCornerTR: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 24,
    height: 24,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderColor: '#38BDF8',
  },
  reticleCornerBL: {
    position: 'absolute',
    bottom: 14,
    left: 14,
    width: 24,
    height: 24,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderColor: '#38BDF8',
  },
  reticleCornerBR: {
    position: 'absolute',
    bottom: 14,
    right: 14,
    width: 24,
    height: 24,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderColor: '#38BDF8',
  },
  laserBeam: {
    position: 'absolute',
    width: '80%',
    height: 2,
    shadowColor: '#38BDF8',
    shadowOpacity: 0.9,
    shadowRadius: 6,
  },
  cameraIcon: {
    opacity: 0.4,
    marginBottom: 4,
  },
  cameraHelpText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  barcodeInput: {
    flex: 1,
    backgroundColor: '#0F172A',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#F8FAFC',
    fontSize: 14,
  },
  searchBtn: {
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
  },
  quickBarcodesScroll: {
    flexDirection: 'row',
    paddingBottom: 4,
  },
  quickChip: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
    marginRight: 8,
    minWidth: 120,
  },
  quickChipName: {
    fontSize: 11,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  quickChipBarcode: {
    fontSize: 10,
    color: '#64748B',
    fontFamily: 'monospace',
    marginTop: 2,
  },
  resultCard: {
    backgroundColor: '#0F172A',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 12,
    marginTop: 6,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  resultCategory: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
  },
  resultName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#F8FAFC',
    lineHeight: 22,
    marginTop: 2,
  },
  resultMeta: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    fontFamily: 'monospace',
  },
  auditCounterBox: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 12,
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  countColumn: {
    flex: 1,
  },
  countLabel: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  systemStockVal: {
    fontSize: 16,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  stepperColumn: {
    alignItems: 'flex-end',
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stepperBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  countInput: {
    backgroundColor: '#0F172A',
    color: '#F8FAFC',
    fontWeight: '800',
    fontSize: 16,
    textAlign: 'center',
    width: 55,
    height: 32,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#334155',
  },
  discrepancyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  discrepancyLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
  },
  notesInput: {
    backgroundColor: '#1E293B',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#F8FAFC',
    fontSize: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  reconcileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  reconcileBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  noMatchBox: {
    backgroundColor: '#7F1D1D20',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#7F1D1D',
    gap: 6,
  },
  noMatchTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F87171',
  },
  noMatchSubtext: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
  },
});
