import React, { useState, useEffect } from 'react';
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
import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import {
  X,
  ScanBarcode,
  Search,
  CheckCircle2,
  AlertCircle,
  Plus,
  Minus,
  Camera,
  Flashlight,
  FlashlightOff,
  RotateCcw,
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

  const [permission, requestPermission] = useCameraPermissions();
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [isCooldown, setIsCooldown] = useState(false);
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);

  const [barcodeQuery, setBarcodeQuery] = useState('');
  const [scannedProduct, setScannedProduct] = useState<Product | null>(null);
  const [physicalCount, setPhysicalCount] = useState<number>(0);
  const [notes, setNotes] = useState('');

  // Automatically request camera permission when modal is opened on native devices
  useEffect(() => {
    if (visible && Platform.OS !== 'web' && (!permission || !permission.granted) && permission?.canAskAgain) {
      requestPermission();
    }
  }, [visible, permission]);

  const triggerHaptic = () => {
    try {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch {
      // Non-blocking
    }
  };

  const handleBarcodeSubmit = (code: string) => {
    const trimmed = code.trim();
    if (!trimmed) return;

    const found = BarcodeService.findProductByBarcode(activeProducts, trimmed);
    if (found) {
      triggerHaptic();
      setScannedProduct(found);
      setPhysicalCount(found.currentStock);
      if (mode === 'pos_scan' && onDirectAddToPos) {
        onDirectAddToPos(found);
        handleCloseModal();
      }
    } else {
      setScannedProduct(null);
    }
  };

  const handleCameraBarcodeScanned = (result: BarcodeScanningResult) => {
    if (!result || !result.data) return;
    const rawData = result.data.trim();
    if (!rawData) return;

    // Prevent spam scanning identical barcode repeatedly
    if (isCooldown && rawData === lastScannedCode) return;

    setLastScannedCode(rawData);
    setIsCooldown(true);
    setBarcodeQuery(rawData);
    handleBarcodeSubmit(rawData);

    setTimeout(() => {
      setIsCooldown(false);
    }, 1600);
  };

  const handleSelectQuickSample = (p: Product) => {
    setBarcodeQuery(p.barcode);
    setScannedProduct(p);
    setPhysicalCount(p.currentStock);
    if (mode === 'pos_scan' && onDirectAddToPos) {
      onDirectAddToPos(p);
      handleCloseModal();
    }
  };

  const handleCloseModal = () => {
    setScannedProduct(null);
    setBarcodeQuery('');
    setNotes('');
    setIsTorchOn(false);
    setIsCooldown(false);
    setLastScannedCode(null);
    onClose();
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

    handleCloseModal();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleCloseModal}>
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
            <TouchableOpacity onPress={handleCloseModal} style={styles.closeBtn}>
              <X size={20} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
            {/* Live Camera Viewport */}
            <View style={styles.cameraViewport}>
              {Platform.OS !== 'web' && permission?.granted ? (
                <>
                  <CameraView
                    style={StyleSheet.absoluteFillObject}
                    facing="back"
                    enableTorch={isTorchOn}
                    barcodeScannerSettings={{
                      barcodeTypes: [
                        'qr',
                        'ean13',
                        'ean8',
                        'code128',
                        'code39',
                        'upc_a',
                        'upc_e',
                        'code93',
                        'itf14',
                        'codabar',
                        'datamatrix',
                        'pdf417',
                        'aztec',
                      ],
                    }}
                    onBarcodeScanned={handleCameraBarcodeScanned}
                  />

                  {/* Viewfinder Reticle Overlay */}
                  <View style={styles.reticleOverlay} pointerEvents="none">
                    <View style={styles.reticleCornerTL} />
                    <View style={styles.reticleCornerTR} />
                    <View style={styles.reticleCornerBL} />
                    <View style={styles.reticleCornerBR} />
                    <View style={[styles.laserBeam, { backgroundColor: preset.accentColor }]} />
                  </View>

                  {/* Live Controls: Status Pill & Flashlight Toggle */}
                  <View style={styles.cameraControlsBar}>
                    <View style={styles.liveIndicator}>
                      <View style={styles.liveDot} />
                      <Text style={styles.liveText}>Scanner Active</Text>
                    </View>
                    <TouchableOpacity
                      style={[styles.torchBtn, isTorchOn && styles.torchBtnActive]}
                      onPress={() => setIsTorchOn(!isTorchOn)}
                      activeOpacity={0.8}
                    >
                      {isTorchOn ? (
                        <Flashlight size={14} color="#FBBF24" />
                      ) : (
                        <FlashlightOff size={14} color="#94A3B8" />
                      )}
                      <Text style={[styles.torchBtnText, isTorchOn && { color: '#FBBF24' }]}>
                        {isTorchOn ? 'Torch On' : 'Torch'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </>
              ) : (
                <View style={styles.cameraFallback}>
                  <Camera size={36} color="#64748B" style={styles.cameraIcon} />
                  <Text style={styles.cameraFallbackTitle}>
                    {Platform.OS === 'web' ? 'Live Camera Scanner' : 'Camera Permission Required'}
                  </Text>
                  <Text style={styles.cameraFallbackSub}>
                    {Platform.OS === 'web'
                      ? 'Point physical barcode or use manual input & test items below'
                      : 'Please enable camera permission to scan barcodes directly on your phone.'}
                  </Text>
                  {Platform.OS !== 'web' && !permission?.granted && (
                    <TouchableOpacity
                      style={[styles.permissionBtn, { backgroundColor: preset.accentColor }]}
                      onPress={requestPermission}
                      activeOpacity={0.85}
                    >
                      <Camera size={14} color="#FFFFFF" />
                      <Text style={styles.permissionBtnText}>Enable Camera Permission</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>

            {/* Manual Barcode / SKU Input */}
            <View style={styles.inputRow}>
              <TextInput
                style={styles.barcodeInput}
                placeholder="Enter barcode or SKU (e.g. 890123456)..."
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
            <Text style={styles.quickLabel}>
              ⚡ 1-Tap Barcode Presets ({activeProducts.length} items in store):
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.quickBarcodesScroll}
            >
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
    height: 220,
    backgroundColor: '#020617',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155',
    position: 'relative',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reticleOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reticleCornerTL: {
    position: 'absolute',
    top: 20,
    left: 20,
    width: 28,
    height: 28,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderColor: '#38BDF8',
  },
  reticleCornerTR: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 28,
    height: 28,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderColor: '#38BDF8',
  },
  reticleCornerBL: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    width: 28,
    height: 28,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderColor: '#38BDF8',
  },
  reticleCornerBR: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 28,
    height: 28,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderColor: '#38BDF8',
  },
  laserBeam: {
    width: '80%',
    height: 2,
    shadowColor: '#38BDF8',
    shadowOpacity: 0.9,
    shadowRadius: 6,
  },
  cameraControlsBar: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  liveText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  torchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  torchBtnActive: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    borderColor: '#F59E0B',
  },
  torchBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
  },
  cameraFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    gap: 8,
  },
  cameraIcon: {
    opacity: 0.5,
  },
  cameraFallbackTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F8FAFC',
    textAlign: 'center',
  },
  cameraFallbackSub: {
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 16,
    maxWidth: 280,
  },
  permissionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 4,
  },
  permissionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
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
    fontSize: 13,
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
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
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
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
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
