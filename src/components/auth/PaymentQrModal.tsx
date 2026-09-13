import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import Svg, { Rect, Path, G, Defs, LinearGradient, Stop } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import {
  X,
  Copy,
  Check,
  QrCode,
  ShieldCheck,
  CreditCard,
  Building2,
  Smartphone,
  Info,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react-native';

interface PaymentQrModalProps {
  visible: boolean;
  onClose: () => void;
  onCopyTrxPlaceholder?: (suggestedText: string) => void;
}

export const PAYMENT_METHODS = [
  {
    id: 'bank',
    name: 'Bank Transfer',
    icon: Building2,
    accentColor: '#38BDF8',
    address: 'PK36SCBL0000001123456701',
    bankName: 'Standard Chartered Bank',
    accountTitle: 'SheziStock Global Ltd',
    branchCode: '0128',
    fee: '$49.00 USD / Eqv',
    instructions: 'Transfer registration fee to the bank account via IBFT / wire. Enter the Bank Transaction Reference Number in the TRX field.',
  },
  {
    id: 'mobile',
    name: 'Easypaisa',
    icon: Smartphone,
    accentColor: '#F59E0B',
    address: '03001234567',
    accountTitle: 'SheziStock Merchant Pay',
    network: 'JazzCash / EasyPaisa / Raast',
    fee: '$49.00 USD / Eqv',
    instructions: 'Send fee via JazzCash, EasyPaisa, or Raast ID. Paste the 12-digit TID from your SMS receipt in the TRX field.',
  },
];

export const PaymentQrSvg: React.FC<{ size?: number; color?: string; bg?: string }> = ({
  size = 200,
  color = '#38BDF8',
  bg = '#0F172A',
}) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      <Defs>
        <LinearGradient id="qrGrad" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={color} />
          <Stop offset="1" stopColor="#818CF8" />
        </LinearGradient>
      </Defs>

      {/* Background */}
      <Rect width="200" height="200" rx="16" fill={bg} />

      {/* Top-Left Finder Pattern */}
      <Rect x="20" y="20" width="46" height="46" rx="8" fill="url(#qrGrad)" />
      <Rect x="26" y="26" width="34" height="34" rx="5" fill={bg} />
      <Rect x="32" y="32" width="22" height="22" rx="4" fill="url(#qrGrad)" />

      {/* Top-Right Finder Pattern */}
      <Rect x="134" y="20" width="46" height="46" rx="8" fill="url(#qrGrad)" />
      <Rect x="140" y="26" width="34" height="34" rx="5" fill={bg} />
      <Rect x="146" y="32" width="22" height="22" rx="4" fill="url(#qrGrad)" />

      {/* Bottom-Left Finder Pattern */}
      <Rect x="20" y="134" width="46" height="46" rx="8" fill="url(#qrGrad)" />
      <Rect x="26" y="140" width="34" height="34" rx="5" fill={bg} />
      <Rect x="32" y="146" width="22" height="22" rx="4" fill="url(#qrGrad)" />

      {/* Stylized QR Matrix Dots */}
      <G fill="url(#qrGrad)">
        {/* Alignment & Timing dots */}
        <Rect x="76" y="24" width="10" height="10" rx="3" />
        <Rect x="94" y="24" width="10" height="10" rx="3" />
        <Rect x="112" y="24" width="10" height="10" rx="3" />

        <Rect x="76" y="42" width="10" height="10" rx="3" />
        <Rect x="104" y="42" width="18" height="10" rx="3" />

        <Rect x="24" y="76" width="10" height="10" rx="3" />
        <Rect x="42" y="76" width="10" height="10" rx="3" />
        <Rect x="60" y="76" width="10" height="10" rx="3" />
        <Rect x="78" y="76" width="10" height="10" rx="3" />
        <Rect x="96" y="76" width="10" height="10" rx="3" />
        <Rect x="114" y="76" width="10" height="10" rx="3" />
        <Rect x="132" y="76" width="10" height="10" rx="3" />
        <Rect x="150" y="76" width="10" height="10" rx="3" />
        <Rect x="168" y="76" width="10" height="10" rx="3" />

        <Rect x="76" y="94" width="10" height="10" rx="3" />
        <Rect x="112" y="94" width="10" height="10" rx="3" />
        <Rect x="148" y="94" width="10" height="10" rx="3" />
        <Rect x="166" y="94" width="10" height="10" rx="3" />

        <Rect x="24" y="104" width="18" height="10" rx="3" />
        <Rect x="52" y="104" width="10" height="10" rx="3" />
        <Rect x="94" y="104" width="10" height="10" rx="3" />
        <Rect x="130" y="104" width="18" height="10" rx="3" />

        <Rect x="76" y="122" width="18" height="10" rx="3" />
        <Rect x="104" y="122" width="10" height="10" rx="3" />
        <Rect x="140" y="122" width="10" height="10" rx="3" />
        <Rect x="158" y="122" width="18" height="10" rx="3" />

        <Rect x="76" y="140" width="10" height="10" rx="3" />
        <Rect x="94" y="140" width="18" height="10" rx="3" />
        <Rect x="122" y="140" width="10" height="10" rx="3" />
        <Rect x="148" y="140" width="10" height="10" rx="3" />
        <Rect x="166" y="140" width="10" height="10" rx="3" />

        <Rect x="76" y="158" width="18" height="10" rx="3" />
        <Rect x="104" y="158" width="10" height="10" rx="3" />
        <Rect x="130" y="158" width="18" height="10" rx="3" />
        <Rect x="158" y="158" width="10" height="10" rx="3" />
      </G>

      {/* Center Verified Badge */}
      <Rect x="82" y="82" width="36" height="36" rx="8" fill="#1E293B" stroke="url(#qrGrad)" strokeWidth="2" />
      <Path
        d="M93 100 L98 105 L108 94"
        stroke="#38BDF8"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
};

export const PaymentQrModal: React.FC<PaymentQrModalProps> = ({ visible, onClose }) => {
  const [selectedMethodId, setSelectedMethodId] = useState('bank');
  const [copied, setCopied] = useState(false);

  const selectedMethod = PAYMENT_METHODS.find((m) => m.id === selectedMethodId) || PAYMENT_METHODS[0];

  const handleCopyAddress = () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        navigator.clipboard.writeText(selectedMethod.address);
      }
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Non-blocking
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={styles.iconCircle}>
                <QrCode size={20} color="#38BDF8" />
              </View>
              <View>
                <Text style={styles.title}>Payment & Activation QR</Text>
                <Text style={styles.subtitle}>Scan to pay store registration fee</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={18} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
            {/* Method Tabs */}
            <View style={styles.tabsRow}>
              {PAYMENT_METHODS.map((m) => {
                const isSelected = m.id === selectedMethodId;
                const IconComponent = m.icon;
                return (
                  <TouchableOpacity
                    key={m.id}
                    style={[
                      styles.tabChip,
                      isSelected && {
                        backgroundColor: `${m.accentColor}25`,
                        borderColor: m.accentColor,
                      },
                    ]}
                    onPress={() => setSelectedMethodId(m.id)}
                    activeOpacity={0.8}
                  >
                    <IconComponent size={14} color={isSelected ? m.accentColor : '#94A3B8'} />
                    <Text
                      style={[
                        styles.tabChipText,
                        isSelected && { color: m.accentColor, fontWeight: '800' },
                      ]}
                    >
                      {m.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* QR Code Container */}
            <View style={styles.qrWrapper}>
              <View style={[styles.qrBorderFrame, { borderColor: `${selectedMethod.accentColor}60` }]}>
                <PaymentQrSvg size={200} color={selectedMethod.accentColor} />
              </View>

              <View style={styles.feeBadge}>
                <ShieldCheck size={14} color="#10B981" />
                <Text style={styles.feeBadgeText}>Activation Fee: {selectedMethod.fee}</Text>
              </View>
            </View>

            {/* Account / Address Box */}
            <View style={styles.addressBox}>
              <View style={{ flex: 1 }}>
                <Text style={styles.addressLabel}>
                  {selectedMethod.id === 'bank'
                    ? `Account IBAN (${selectedMethod.bankName})`
                    : `Account Number (${selectedMethod.network || selectedMethod.name})`}
                </Text>
                <Text style={styles.addressValue} numberOfLines={2}>
                  {selectedMethod.address}
                </Text>
                {selectedMethod.accountTitle && (
                  <Text style={styles.accountTitleMeta}>
                    Title: {selectedMethod.accountTitle}
                  </Text>
                )}
              </View>

              <TouchableOpacity
                style={[
                  styles.copyBtn,
                  copied && { backgroundColor: '#10B981', borderColor: '#10B981' },
                ]}
                onPress={handleCopyAddress}
                activeOpacity={0.8}
              >
                {copied ? <Check size={16} color="#FFFFFF" /> : <Copy size={16} color="#38BDF8" />}
                <Text style={[styles.copyBtnText, copied && { color: '#FFFFFF' }]}>
                  {copied ? 'Copied' : 'Copy'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Step-by-Step Instructions */}
            <View style={styles.instructionsBox}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <Info size={14} color="#38BDF8" />
                <Text style={styles.instructionsTitle}>How to complete activation:</Text>
              </View>
              <Text style={styles.instructionStep}>
                1. Scan QR code or copy the address above.
              </Text>
              <Text style={styles.instructionStep}>
                2. Send the registration fee ({selectedMethod.fee}).
              </Text>
              <Text style={styles.instructionStep}>
                3. Copy your <Text style={{ color: '#F8FAFC', fontWeight: '700' }}>Transaction ID / TXID</Text> from your banking/wallet receipt.
              </Text>
              <Text style={styles.instructionStep}>
                4. Paste the ID in the <Text style={{ color: '#38BDF8', fontWeight: '700' }}>TRX</Text> field on the signup form.
              </Text>
            </View>

            {/* Finish Action Button */}
            <TouchableOpacity style={styles.doneBtn} onPress={onClose} activeOpacity={0.85}>
              <CheckCircle2 size={18} color="#FFFFFF" />
              <Text style={styles.doneBtnText}>I Have Sent Payment / Enter TRX</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.82)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    width: '100%',
    maxWidth: 460,
    maxHeight: '90%',
    borderWidth: 1,
    borderColor: '#334155',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    backgroundColor: '#38BDF820',
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
  closeBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#0F172A',
  },
  scroll: {
    flexGrow: 0,
  },
  content: {
    padding: 18,
    gap: 14,
    alignItems: 'center',
  },
  tabsRow: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
  },
  tabChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 10,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
    gap: 6,
  },
  tabChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
  },
  qrWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    gap: 10,
  },
  qrBorderFrame: {
    padding: 10,
    borderRadius: 20,
    backgroundColor: '#0F172A',
    borderWidth: 2,
    borderStyle: 'dashed',
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  feeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#10B98120',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#10B98140',
  },
  feeBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#10B981',
  },
  addressBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#334155',
    width: '100%',
    gap: 10,
  },
  addressLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  addressValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F8FAFC',
    marginTop: 2,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  accountTitleMeta: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#38BDF820',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#38BDF850',
  },
  copyBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#38BDF8',
  },
  instructionsBox: {
    backgroundColor: '#0F172A80',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#33415550',
    width: '100%',
    gap: 4,
  },
  instructionsTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#38BDF8',
  },
  instructionStep: {
    fontSize: 11,
    color: '#94A3B8',
    lineHeight: 16,
  },
  doneBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0284C7',
    paddingVertical: 14,
    borderRadius: 12,
    width: '100%',
    gap: 8,
  },
  doneBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
});
