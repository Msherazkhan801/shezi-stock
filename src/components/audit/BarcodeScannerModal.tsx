import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Platform,
  Animated,
  Easing,
  ActivityIndicator,
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
  SwitchCamera,
  ShoppingBag,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Video,
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
  const preset = INDUSTRY_PRESETS[activeIndustry] || INDUSTRY_PRESETS['pharmacy'];
  const { products, adjustStock } = useInventoryStore();

  const activeProducts = products.filter(
    (p) =>
      (p.industry || 'pharmacy').toLowerCase().trim() === (activeIndustry || 'pharmacy').toLowerCase().trim() &&
      p.isActive !== false
  );

  const [permission, requestPermission] = useCameraPermissions();
  const [cameraFacing, setCameraFacing] = useState<'back' | 'front'>('back');
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [isCooldown, setIsCooldown] = useState(false);
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);

  // POS Rapid Continuous Scan Mode
  const [continuousPosScan, setContinuousPosScan] = useState<boolean>(true);
  const [posSuccessNotification, setPosSuccessNotification] = useState<{
    product: Product;
    count: number;
  } | null>(null);
  const [cartSessionCount, setCartSessionCount] = useState<number>(0);

  const [barcodeQuery, setBarcodeQuery] = useState('');
  const [scannedProduct, setScannedProduct] = useState<Product | null>(null);
  const [physicalCount, setPhysicalCount] = useState<number>(0);
  const [notes, setNotes] = useState('');

  // Web Camera Stream state & refs
  const webVideoRef = useRef<HTMLVideoElement | null>(null);
  const webStreamRef = useRef<MediaStream | null>(null);
  const detectorIntervalRef = useRef<any>(null);
  const [webCameraActive, setWebCameraActive] = useState(false);
  const [webCameraLoading, setWebCameraLoading] = useState(false);
  const [webCameraError, setWebCameraError] = useState<string | null>(null);

  // Laser Animation
  const laserAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Start laser pulse animation
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(laserAnim, {
            toValue: 1,
            duration: 1800,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(laserAnim, {
            toValue: 0,
            duration: 1800,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ])
      );
      loop.start();
      return () => loop.stop();
    }
  }, [visible, laserAnim]);

  // Handle native camera permissions
  useEffect(() => {
    if (visible && Platform.OS !== 'web') {
      if (!permission || !permission.granted) {
        requestPermission();
      }
    }
  }, [visible, permission]);

  // Web camera initialization function
  const startWebCamera = async (forceFacing?: 'back' | 'front') => {
    if (Platform.OS !== 'web') return;
    if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setWebCameraError('Camera access is not supported by your current browser.');
      return;
    }

    const targetFacing = forceFacing || cameraFacing;
    setWebCameraLoading(true);
    setWebCameraError(null);

    // Stop any existing stream
    if (webStreamRef.current) {
      webStreamRef.current.getTracks().forEach((t) => t.stop());
      webStreamRef.current = null;
    }
    if (detectorIntervalRef.current) {
      clearInterval(detectorIntervalRef.current);
      detectorIntervalRef.current = null;
    }

    let stream: MediaStream | null = null;

    // Attempt 1: Try with facingMode constraint
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: targetFacing === 'back' ? { ideal: 'environment' } : { ideal: 'user' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
    } catch (e1) {
      // Attempt 2: Fallback to basic generic video stream (best for laptop webcams)
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      } catch (e2: any) {
        setWebCameraActive(false);
        setWebCameraLoading(false);
        if (e2.name === 'NotAllowedError' || e2.name === 'PermissionDeniedError') {
          setWebCameraError('Camera permission blocked in browser. Click the camera/lock icon in your address bar to allow.');
        } else if (e2.name === 'NotFoundError' || e2.name === 'DevicesNotFoundError') {
          setWebCameraError('No camera found on this device.');
        } else {
          setWebCameraError('Camera could not be started. Tap "Turn On Camera" below to retry.');
        }
        return;
      }
    }

    if (stream) {
      webStreamRef.current = stream;
      setWebCameraActive(true);
      setWebCameraLoading(false);
      setWebCameraError(null);

      if (webVideoRef.current) {
        webVideoRef.current.srcObject = stream;
        webVideoRef.current.play().catch(() => {});
      }

      // Real-time Barcode Detector Loop for Web
      const WindowAny = window as any;
      if (WindowAny.BarcodeDetector) {
        try {
          const barcodeDetector = new WindowAny.BarcodeDetector({
            formats: [
              'qr_code',
              'ean_13',
              'ean_8',
              'code_128',
              'code_39',
              'upc_a',
              'upc_e',
              'data_matrix',
              'itf',
              'codabar',
            ],
          });

          detectorIntervalRef.current = setInterval(async () => {
            if (webVideoRef.current && webVideoRef.current.readyState >= 2) {
              try {
                const barcodes = await barcodeDetector.detect(webVideoRef.current);
                if (barcodes && barcodes.length > 0) {
                  const detected = barcodes[0].rawValue;
                  if (detected) {
                    handleCameraBarcodeScanned({ data: detected, type: barcodes[0].format } as any);
                  }
                }
              } catch {
                // Non-blocking frame skip
              }
            }
          }, 250);
        } catch {
          // Barcode detector init fallback
        }
      }
    }
  };

  // Automatically start web camera when modal opens on Web
  useEffect(() => {
    if (visible && Platform.OS === 'web') {
      startWebCamera();
    }

    return () => {
      if (webStreamRef.current) {
        webStreamRef.current.getTracks().forEach((track) => track.stop());
        webStreamRef.current = null;
      }
      if (detectorIntervalRef.current) {
        clearInterval(detectorIntervalRef.current);
        detectorIntervalRef.current = null;
      }
      setWebCameraActive(false);
      setWebCameraLoading(false);
    };
  }, [visible]);

  const triggerHaptic = (success = true) => {
    try {
      BarcodeService.playBeep(success);
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(
          success
            ? Haptics.NotificationFeedbackType.Success
            : Haptics.NotificationFeedbackType.Error
        );
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
      triggerHaptic(true);
      setScannedProduct(found);
      setPhysicalCount(found.currentStock);

      if (mode === 'pos_scan' && onDirectAddToPos) {
        onDirectAddToPos(found);
        setCartSessionCount((prev) => prev + 1);
        setPosSuccessNotification({
          product: found,
          count: cartSessionCount + 1,
        });

        if (!continuousPosScan) {
          setTimeout(() => {
            handleCloseModal();
          }, 350);
        } else {
          setTimeout(() => {
            setPosSuccessNotification(null);
          }, 2500);
        }
      }
    } else {
      triggerHaptic(false);
      setScannedProduct(null);
    }
  };

  const handleCameraBarcodeScanned = (result: BarcodeScanningResult) => {
    if (!result || !result.data) return;
    const rawData = result.data.trim();
    if (!rawData) return;

    // Prevent spam scanning identical barcode repeatedly during cooldown
    if (isCooldown && rawData === lastScannedCode) return;

    setLastScannedCode(rawData);
    setIsCooldown(true);
    setBarcodeQuery(rawData);
    handleBarcodeSubmit(rawData);

    setTimeout(() => {
      setIsCooldown(false);
    }, 1400);
  };

  const handleSelectQuickSample = (p: Product) => {
    setBarcodeQuery(p.barcode);
    setScannedProduct(p);
    setPhysicalCount(p.currentStock);
    triggerHaptic(true);

    if (mode === 'pos_scan' && onDirectAddToPos) {
      onDirectAddToPos(p);
      setCartSessionCount((prev) => prev + 1);
      setPosSuccessNotification({
        product: p,
        count: cartSessionCount + 1,
      });

      if (!continuousPosScan) {
        setTimeout(() => {
          handleCloseModal();
        }, 350);
      } else {
        setTimeout(() => {
          setPosSuccessNotification(null);
        }, 2500);
      }
    }
  };

  const handleCloseModal = () => {
    if (webStreamRef.current) {
      webStreamRef.current.getTracks().forEach((track) => track.stop());
      webStreamRef.current = null;
    }
    if (detectorIntervalRef.current) {
      clearInterval(detectorIntervalRef.current);
      detectorIntervalRef.current = null;
    }
    setWebCameraActive(false);
    setScannedProduct(null);
    setBarcodeQuery('');
    setNotes('');
    setIsTorchOn(false);
    setIsCooldown(false);
    setLastScannedCode(null);
    setPosSuccessNotification(null);
    setCartSessionCount(0);
    onClose();
  };

  const toggleCameraFacing = () => {
    const nextFacing = cameraFacing === 'back' ? 'front' : 'back';
    setCameraFacing(nextFacing);
    if (Platform.OS === 'web') {
      startWebCamera(nextFacing);
    }
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

    triggerHaptic(true);
    handleCloseModal();
  };

  // Laser line vertical position interpolation
  const laserTranslateY = laserAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-80, 80],
  });

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleCloseModal}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={[styles.iconCircle, { backgroundColor: `${preset.accentColor}25` }]}>
                <ScanBarcode size={20} color={preset.accentColor} />
              </View>
              <View>
                <Text style={styles.title}>
                  {mode === 'audit' ? 'Barcode Stock Audit' : 'Scan Product to POS'}
                </Text>
                <Text style={styles.subtitle}>
                  {mode === 'audit' ? 'Physical stock verification' : 'High-speed checkout scanner'}
                </Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              {mode === 'pos_scan' && (
                <TouchableOpacity
                  style={[
                    styles.modePill,
                    continuousPosScan && {
                      backgroundColor: `${preset.accentColor}20`,
                      borderColor: preset.accentColor,
                    },
                  ]}
                  onPress={() => setContinuousPosScan(!continuousPosScan)}
                  activeOpacity={0.8}
                >
                  <Sparkles
                    size={13}
                    color={continuousPosScan ? preset.accentColor : '#94A3B8'}
                  />
                  <Text
                    style={[
                      styles.modePillText,
                      continuousPosScan && { color: preset.accentColor, fontWeight: '800' },
                    ]}
                  >
                    {continuousPosScan ? 'Rapid Scan' : 'Single'}
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity onPress={handleCloseModal} style={styles.closeBtn}>
                <X size={20} color="#94A3B8" />
              </TouchableOpacity>
            </View>
          </View>

          {/* POS Success Toast Banner */}
          {posSuccessNotification && (
            <View style={[styles.posToastBanner, { backgroundColor: '#10B98125', borderColor: '#10B981' }]}>
              <View style={styles.posToastLeft}>
                <CheckCircle2 size={18} color="#10B981" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.posToastTitle} numberOfLines={1}>
                    Added "{posSuccessNotification.product.name}" to cart
                  </Text>
                  <Text style={styles.posToastSub}>
                    {tenant.currencySymbol}
                    {posSuccessNotification.product.sellingPrice.toFixed(2)} • SKU:{' '}
                    {posSuccessNotification.product.sku}
                  </Text>
                </View>
              </View>
              <View style={styles.posToastCountBadge}>
                <ShoppingBag size={12} color="#10B981" />
                <Text style={styles.posToastCountText}>+{posSuccessNotification.count}</Text>
              </View>
            </View>
          )}

          <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
            {/* Live Camera Viewport */}
            <View style={styles.cameraViewport}>
              {Platform.OS === 'web' ? (
                <View style={StyleSheet.absoluteFillObject}>
                  {/* Web Video Element for Camera Feed */}
                  <video
                    ref={(el) => {
                      webVideoRef.current = el;
                      if (el && webStreamRef.current && el.srcObject !== webStreamRef.current) {
                        el.srcObject = webStreamRef.current;
                        el.play().catch(() => {});
                      }
                    }}
                    autoPlay
                    playsInline
                    muted
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: webCameraActive ? 'block' : 'none',
                    }}
                  />

                  {/* Loading indicator */}
                  {webCameraLoading && (
                    <View style={styles.cameraLoadingOverlay}>
                      <ActivityIndicator size="small" color={preset.accentColor} />
                      <Text style={styles.cameraLoadingText}>Starting Camera Stream...</Text>
                    </View>
                  )}

                  {/* Fallback / Camera Start prompt if camera not active */}
                  {!webCameraActive && !webCameraLoading && (
                    <View style={styles.cameraFallback}>
                      <Camera size={34} color="#64748B" />
                      <Text style={styles.cameraFallbackTitle}>
                        {webCameraError ? 'Camera Unavailable' : 'Camera Ready'}
                      </Text>
                      <Text style={styles.cameraFallbackSub}>
                        {webCameraError ||
                          'Click the button below to turn on your laptop camera, or click any sample barcode below to test instantly.'}
                      </Text>
                      <TouchableOpacity
                        style={[styles.permissionBtn, { backgroundColor: preset.accentColor }]}
                        onPress={() => startWebCamera()}
                        activeOpacity={0.85}
                      >
                        <Video size={14} color="#FFFFFF" />
                        <Text style={styles.permissionBtnText}>Turn On Laptop Camera</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              ) : permission?.granted ? (
                <CameraView
                  style={StyleSheet.absoluteFillObject}
                  facing={cameraFacing}
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
              ) : (
                <View style={styles.cameraFallback}>
                  <Camera size={36} color="#64748B" style={styles.cameraIcon} />
                  <Text style={styles.cameraFallbackTitle}>Camera Permission Required</Text>
                  <Text style={styles.cameraFallbackSub}>
                    Enable camera access to scan barcodes directly through your device lens.
                  </Text>
                  <TouchableOpacity
                    style={[styles.permissionBtn, { backgroundColor: preset.accentColor }]}
                    onPress={requestPermission}
                    activeOpacity={0.85}
                  >
                    <Camera size={14} color="#FFFFFF" />
                    <Text style={styles.permissionBtnText}>Enable Camera</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Viewfinder Reticle Overlay */}
              <View style={styles.reticleOverlay} pointerEvents="none">
                <View style={styles.reticleCornerTL} />
                <View style={styles.reticleCornerTR} />
                <View style={styles.reticleCornerBL} />
                <View style={styles.reticleCornerBR} />
                <Animated.View
                  style={[
                    styles.laserBeam,
                    {
                      backgroundColor: preset.accentColor,
                      transform: [{ translateY: laserTranslateY }],
                    },
                  ]}
                />
              </View>

              {/* Live Controls: Status Pill, Switch Camera, & Flashlight */}
              <View style={styles.cameraControlsBar}>
                <View style={styles.liveIndicator}>
                  <View
                    style={[
                      styles.liveDot,
                      {
                        backgroundColor:
                          (Platform.OS === 'web' ? webCameraActive : permission?.granted)
                            ? isCooldown
                              ? '#F59E0B'
                              : '#10B981'
                            : '#EF4444',
                      },
                    ]}
                  />
                  <Text style={styles.liveText}>
                    {isCooldown
                      ? 'Decoding...'
                      : (Platform.OS === 'web' ? webCameraActive : permission?.granted)
                      ? 'Camera Active'
                      : 'Camera Standby'}
                  </Text>
                </View>

                <View style={{ flexDirection: 'row', gap: 6 }}>
                  {Platform.OS === 'web' && !webCameraActive && (
                    <TouchableOpacity
                      style={[styles.controlPillBtn, { backgroundColor: preset.accentColor }]}
                      onPress={() => startWebCamera()}
                      activeOpacity={0.8}
                    >
                      <RefreshCw size={12} color="#FFFFFF" />
                      <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '700', marginLeft: 4 }}>
                        Start Camera
                      </Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    style={styles.controlPillBtn}
                    onPress={toggleCameraFacing}
                    activeOpacity={0.8}
                  >
                    <SwitchCamera size={13} color="#94A3B8" />
                  </TouchableOpacity>

                  {Platform.OS !== 'web' && (
                    <TouchableOpacity
                      style={[styles.controlPillBtn, isTorchOn && styles.torchBtnActive]}
                      onPress={() => setIsTorchOn(!isTorchOn)}
                      activeOpacity={0.8}
                    >
                      {isTorchOn ? (
                        <Flashlight size={13} color="#FBBF24" />
                      ) : (
                        <FlashlightOff size={13} color="#94A3B8" />
                      )}
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>

            {/* Manual Barcode / SKU Input */}
            <View style={styles.inputRow}>
              <TextInput
                style={styles.barcodeInput}
                placeholder="Type or paste barcode/SKU (e.g. 890103001001)..."
                placeholderTextColor="#64748B"
                value={barcodeQuery}
                onChangeText={(text) => {
                  setBarcodeQuery(text);
                  handleBarcodeSubmit(text);
                }}
                onSubmitEditing={() => handleBarcodeSubmit(barcodeQuery)}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                onPress={() => handleBarcodeSubmit(barcodeQuery)}
                style={[styles.searchBtn, { backgroundColor: preset.accentColor }]}
                activeOpacity={0.8}
              >
                <Search size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {/* Quick 1-Tap Sample Barcodes for Testing */}
            <View style={styles.quickSection}>
              <View style={styles.quickHeader}>
                <Text style={styles.quickLabel}>
                  ⚡ 1-Tap Sample Barcodes ({activeProducts.length} items in catalog)
                </Text>
                <Text style={styles.quickSub}>Tap to simulate scan</Text>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.quickBarcodesScroll}
              >
                {activeProducts.map((p) => {
                  const isSelected = scannedProduct?.id === p.id;
                  return (
                    <TouchableOpacity
                      key={p.id}
                      style={[
                        styles.quickChip,
                        isSelected && {
                          borderColor: preset.accentColor,
                          backgroundColor: `${preset.accentColor}25`,
                        },
                      ]}
                      onPress={() => handleSelectQuickSample(p)}
                      activeOpacity={0.75}
                    >
                      <View style={styles.quickChipTop}>
                        <Text style={styles.quickChipName} numberOfLines={1}>
                          {p.name}
                        </Text>
                      </View>
                      <Text style={styles.quickChipBarcode}>
                        {p.barcode || p.sku} • {tenant.currencySymbol}
                        {p.sellingPrice.toFixed(2)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Scanned Result Card & Audit Adjuster */}
            {scannedProduct ? (
              <View style={styles.resultCard}>
                <View style={styles.resultHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.resultCategory}>{scannedProduct.category}</Text>
                    <Text style={styles.resultName}>{scannedProduct.name}</Text>
                    <Text style={styles.resultMeta}>
                      SKU: {scannedProduct.sku} • Barcode: {scannedProduct.barcode} • Unit:{' '}
                      {scannedProduct.unit}
                    </Text>
                  </View>
                  <Badge label="Match Found" variant="success" size="small" />
                </View>

                {mode === 'audit' ? (
                  <>
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
                          label={`Missing ${Math.abs(discrepancy)} units (-${
                            tenant.currencySymbol
                          }${Math.abs(lossGainValue).toFixed(2)})`}
                          variant="danger"
                        />
                      ) : (
                        <Badge
                          label={`Surplus +${discrepancy} units (+${
                            tenant.currencySymbol
                          }${lossGainValue.toFixed(2)})`}
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
                      activeOpacity={0.85}
                    >
                      <CheckCircle2 size={18} color="#FFFFFF" />
                      <Text style={styles.reconcileBtnText}>Reconcile & Log Audit</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <View style={styles.posScannedActions}>
                    <TouchableOpacity
                      style={[styles.posAddMoreBtn, { backgroundColor: preset.accentColor }]}
                      onPress={() => {
                        if (onDirectAddToPos) onDirectAddToPos(scannedProduct);
                        triggerHaptic(true);
                        setCartSessionCount((prev) => prev + 1);
                        setPosSuccessNotification({
                          product: scannedProduct,
                          count: cartSessionCount + 1,
                        });
                      }}
                      activeOpacity={0.85}
                    >
                      <Plus size={16} color="#FFFFFF" />
                      <Text style={styles.posAddMoreBtnText}>
                        Add Another ({tenant.currencySymbol}
                        {scannedProduct.sellingPrice.toFixed(2)})
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.doneCheckoutBtn}
                      onPress={handleCloseModal}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.doneCheckoutBtnText}>Finish & Return to POS</Text>
                      <ArrowRight size={15} color="#38BDF8" />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ) : barcodeQuery.length > 0 ? (
              <View style={styles.noMatchBox}>
                <AlertCircle size={22} color="#EF4444" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.noMatchTitle}>No matching product found</Text>
                  <Text style={styles.noMatchSubtext}>
                    No active item matches "{barcodeQuery}". Verify product is added to inventory.
                  </Text>
                </View>
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
    backgroundColor: 'rgba(0,0,0,0.78)',
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
    fontSize: 16,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  subtitle: {
    fontSize: 11,
    color: '#94A3B8',
  },
  modePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: '#0F172A',
  },
  modePillText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },
  closeBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#0F172A',
  },
  posToastBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  posToastLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  posToastTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#10B981',
  },
  posToastSub: {
    fontSize: 11,
    color: '#CBD5E1',
    marginTop: 1,
  },
  posToastCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#10B98130',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  posToastCountText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#10B981',
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
  cameraLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(2, 6, 23, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    zIndex: 2,
  },
  cameraLoadingText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
  },
  reticleOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  reticleCornerTL: {
    position: 'absolute',
    top: 24,
    left: 24,
    width: 28,
    height: 28,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderColor: '#38BDF8',
  },
  reticleCornerTR: {
    position: 'absolute',
    top: 24,
    right: 24,
    width: 28,
    height: 28,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderColor: '#38BDF8',
  },
  reticleCornerBL: {
    position: 'absolute',
    bottom: 24,
    left: 24,
    width: 28,
    height: 28,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderColor: '#38BDF8',
  },
  reticleCornerBR: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 28,
    height: 28,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderColor: '#38BDF8',
  },
  laserBeam: {
    width: '75%',
    height: 2,
    shadowColor: '#38BDF8',
    shadowOpacity: 0.95,
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
    zIndex: 3,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
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
  },
  liveText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  controlPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
    justifyContent: 'center',
  },
  torchBtnActive: {
    backgroundColor: 'rgba(245, 158, 11, 0.25)',
    borderColor: '#F59E0B',
  },
  cameraFallback: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    gap: 8,
    backgroundColor: '#020617',
    zIndex: 2,
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
    maxWidth: 290,
  },
  permissionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 6,
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
  quickSection: {
    gap: 6,
  },
  quickHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quickLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
  },
  quickSub: {
    fontSize: 10,
    color: '#64748B',
  },
  quickBarcodesScroll: {
    flexDirection: 'row',
    paddingBottom: 4,
    gap: 8,
  },
  quickChip: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
    minWidth: 130,
  },
  quickChipTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  quickChipName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  quickChipBarcode: {
    fontSize: 10,
    color: '#64748B',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginTop: 3,
  },
  resultCard: {
    backgroundColor: '#0F172A',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 12,
    marginTop: 4,
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
  posScannedActions: {
    gap: 8,
    marginTop: 4,
  },
  posAddMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
  },
  posAddMoreBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  doneCheckoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
  },
  doneCheckoutBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#38BDF8',
  },
  noMatchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#7F1D1D20',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#DC262650',
    gap: 10,
  },
  noMatchTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F87171',
  },
  noMatchSubtext: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 1,
  },
});
