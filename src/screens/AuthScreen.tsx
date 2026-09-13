import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  Zap,
  Lock,
  Mail,
  User,
  Store,
  Pill,
  UtensilsCrossed,
  ShieldCheck,
  ArrowRight,
  QrCode,
  Receipt,
  Copy,
  Check,
  ExternalLink,
  CreditCard,
  Building2,
  Info,
  Sparkles,
} from 'lucide-react-native';
import { useAuthStore } from '../store/useAuthStore';
import { IndustryType } from '../types/industry';
import { INDUSTRY_PRESETS } from '../config/industryPresets';
import { PaymentQrModal, PaymentQrSvg, PAYMENT_METHODS } from '../components/auth/PaymentQrModal';

export const AuthScreen: React.FC = () => {
  const { login, signup } = useAuthStore();

  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [storeName, setStoreName] = useState('');
  const [trxId, setTrxId] = useState('');
  const [trxError, setTrxError] = useState(false);
  const [selectedIndustry, setSelectedIndustry] = useState<IndustryType>('pharmacy');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pendingNotice, setPendingNotice] = useState<string | null>(null);
  const [showQrModal, setShowQrModal] = useState(false);
  const [quickCopied, setQuickCopied] = useState(false);
  const [registeredPendingStore, setRegisteredPendingStore] = useState<{
    storeName: string;
    email: string;
    industry: IndustryType;
    trxId?: string;
  } | null>(null);

  const defaultMethod = PAYMENT_METHODS[0]; // USDT TRC20

  const handleCopyQuickAddress = () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        navigator.clipboard.writeText(defaultMethod.address);
      }
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      setQuickCopied(true);
      setTimeout(() => setQuickCopied(false), 2000);
    } catch {
      // Non-blocking
    }
  };

  const handleLogin = () => {
    setErrorMessage(null);
    setPendingNotice(null);
    if (!email.trim()) {
      setErrorMessage('Please enter your email address.');
      return;
    }
    const res = login(email, password);
    if (!res.success) {
      if (res.status === 'pending') {
        setPendingNotice(res.error || 'Account is pending admin activation.');
      } else {
        setErrorMessage(res.error || 'Login failed. Please check credentials.');
      }
    }
  };

  const handleSignup = () => {
    setErrorMessage(null);
    setPendingNotice(null);
    setTrxError(false);
    if (!name.trim() || !email.trim() || !storeName.trim()) {
      setErrorMessage('Please fill in your Name, Email, and Store / Business Name.');
      return;
    }

    if (!trxId.trim()) {
      setTrxError(true);
      setErrorMessage(
        'Payment Transaction ID (TRX) is required. Please check your payment SMS receipt and enter the Transaction ID / TID.'
      );
      return;
    }

    const res = signup({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
      storeName: storeName.trim(),
      industry: selectedIndustry,
      trxId: trxId.trim(),
    });

    if (!res.success) {
      setErrorMessage(res.error || 'Registration failed.');
    } else {
      setRegisteredPendingStore({
        storeName: storeName.trim(),
        email: email.trim().toLowerCase(),
        industry: selectedIndustry,
        trxId: trxId.trim(),
      });
      setName('');
      setPassword('');
      setTrxId('');
      setTrxError(false);
    }
  };

  const currentPreset = INDUSTRY_PRESETS[selectedIndustry] || INDUSTRY_PRESETS['pharmacy'];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.centeredWrapper}>
          {/* Brand Header */}
          <View style={styles.header}>
            <View style={styles.logoBadge}>
              <Zap size={26} color="#38BDF8" />
            </View>
            <Text style={styles.brandTitle}>SheziStock</Text>
            <Text style={styles.brandSubtitle}>
              Multi-Tenant Enterprise POS & Inventory Platform
            </Text>
          </View>

          {/* Pending Registration Success Card */}
          {registeredPendingStore ? (
            <View style={styles.pendingSuccessCard}>
              <View style={styles.pendingIconBadge}>
                <ShieldCheck size={28} color="#F59E0B" />
              </View>
              <Text style={styles.pendingSuccessTitle}>Store Registration Submitted!</Text>
              <Text style={styles.pendingSuccessSubtitle}>
                <Text style={{ fontWeight: '800', color: '#F8FAFC' }}>
                  {registeredPendingStore.storeName}
                </Text>{' '}
                has been registered under the{' '}
                <Text style={{ fontWeight: '800', color: '#38BDF8' }}>
                  {registeredPendingStore.industry.toUpperCase()}
                </Text>{' '}
                edition.
              </Text>

              {registeredPendingStore.trxId && (
                <View style={styles.submittedTrxCard}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Receipt size={14} color="#FBBF24" />
                    <Text style={styles.submittedTrxLabel}>SUBMITTED PAYMENT TRX ID:</Text>
                  </View>
                  <Text style={styles.submittedTrxValue} numberOfLines={1}>
                    {registeredPendingStore.trxId}
                  </Text>
                </View>
              )}

              <View style={styles.pendingInfoBox}>
                <Text style={styles.pendingInfoText}>
                  ⏳ <Text style={{ fontWeight: '800' }}>Status: Pending Admin Activation</Text>
                  {'\n'}Your account and payment reference have been submitted for Super Admin review. Once the administrator approves and activates your license in the Admin Command Center, you will be able to log in with{' '}
                  <Text style={{ color: '#38BDF8', fontWeight: '700' }}>{registeredPendingStore.email}</Text>.
                </Text>
              </View>

              <TouchableOpacity
                style={styles.pendingLoginBtn}
                onPress={() => {
                  setEmail(registeredPendingStore.email);
                  setRegisteredPendingStore(null);
                  setMode('login');
                }}
                activeOpacity={0.85}
              >
                <Text style={styles.pendingLoginBtnText}>Return to Sign In</Text>
                <ArrowRight size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {/* Auth Mode Toggle (Login vs Sign Up) */}
              <View style={styles.tabToggle}>
                <TouchableOpacity
                  style={[styles.toggleBtn, mode === 'login' && styles.toggleBtnActive]}
                  onPress={() => {
                    setMode('login');
                    setErrorMessage(null);
                    setPendingNotice(null);
                    setTrxError(false);
                  }}
                >
                  <Text style={[styles.toggleText, mode === 'login' && styles.toggleTextActive]}>
                    Sign In
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.toggleBtn, mode === 'signup' && styles.toggleBtnActive]}
                  onPress={() => {
                    setMode('signup');
                    setErrorMessage(null);
                    setPendingNotice(null);
                    setTrxError(false);
                  }}
                >
                  <Text style={[styles.toggleText, mode === 'signup' && styles.toggleTextActive]}>
                    Register New Store
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Pending Notice Alert Box */}
              {pendingNotice && (
                <View style={styles.pendingNoticeBox}>
                  <Text style={styles.pendingNoticeTitle}>⏳ Account Pending Activation</Text>
                  <Text style={styles.pendingNoticeText}>{pendingNotice}</Text>
                </View>
              )}

              {/* Error Alert Box */}
              {errorMessage && (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>⚠️ {errorMessage}</Text>
                </View>
              )}

              {/* Form Container */}
              <View style={styles.formCard}>
                {mode === 'signup' && (
                  <>
                    {/* Owner Name */}
                    <View style={styles.fieldGroup}>
                      <Text style={styles.label}>Owner / Manager Full Name *</Text>
                      <View style={styles.inputWrapper}>
                        <User size={16} color="#64748B" style={styles.inputIcon} />
                        <TextInput
                          style={styles.input}
                          placeholder="e.g. Dr. Sarah Lin / Carlos D."
                          placeholderTextColor="#64748B"
                          value={name}
                          onChangeText={setName}
                        />
                      </View>
                    </View>

                    {/* Store Name */}
                    <View style={styles.fieldGroup}>
                      <Text style={styles.label}>Store / Business Name * (Prints on Receipts)</Text>
                      <View style={styles.inputWrapper}>
                        <Store size={16} color="#64748B" style={styles.inputIcon} />
                        <TextInput
                          style={styles.input}
                          placeholder="e.g. City Care Pharmacy / Metro Mart"
                          placeholderTextColor="#64748B"
                          value={storeName}
                          onChangeText={setStoreName}
                        />
                      </View>
                    </View>

                    {/* Industry Sector Selector */}
                    <View style={styles.fieldGroup}>
                      <Text style={styles.label}>Select Operational Industry Sector *</Text>
                      <View style={styles.industryGrid}>
                        <TouchableOpacity
                          style={[
                            styles.industryOption,
                            selectedIndustry === 'pharmacy' && {
                              borderColor: '#10B981',
                              backgroundColor: '#064E3B30',
                            },
                          ]}
                          onPress={() => setSelectedIndustry('pharmacy')}
                        >
                          <Pill size={18} color="#10B981" />
                          <Text
                            style={[
                              styles.industryOptionText,
                              selectedIndustry === 'pharmacy' && {
                                color: '#10B981',
                                fontWeight: '800',
                              },
                            ]}
                          >
                            Pharmacy
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[
                            styles.industryOption,
                            selectedIndustry === 'general_store' && {
                              borderColor: '#6366F1',
                              backgroundColor: '#312E8130',
                            },
                          ]}
                          onPress={() => setSelectedIndustry('general_store')}
                        >
                          <Store size={18} color="#6366F1" />
                          <Text
                            style={[
                              styles.industryOptionText,
                              selectedIndustry === 'general_store' && {
                                color: '#6366F1',
                                fontWeight: '800',
                              },
                            ]}
                          >
                            General Mart
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[
                            styles.industryOption,
                            selectedIndustry === 'restaurant' && {
                              borderColor: '#F97316',
                              backgroundColor: '#7C2D1230',
                            },
                          ]}
                          onPress={() => setSelectedIndustry('restaurant')}
                        >
                          <UtensilsCrossed size={18} color="#F97316" />
                          <Text
                            style={[
                              styles.industryOptionText,
                              selectedIndustry === 'restaurant' && {
                                color: '#F97316',
                                fontWeight: '800',
                              },
                            ]}
                          >
                            Restaurant
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </>
                )}

                {/* Email */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>Email Address *</Text>
                  <View style={styles.inputWrapper}>
                    <Mail size={16} color="#64748B" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="you@yourstore.com"
                      placeholderTextColor="#64748B"
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  </View>
                </View>

                {/* Password */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>Password *</Text>
                  <View style={styles.inputWrapper}>
                    <Lock size={16} color="#64748B" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="••••••••"
                      placeholderTextColor="#64748B"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry
                    />
                  </View>
                </View>

                {/* QR Code & Mandatory TRX Payment Section (Only on Signup) */}
                {mode === 'signup' && (
                  <>
                    {/* Payment QR Code Showcase Card */}
                    <View style={styles.paymentQrCard}>
                      <View style={styles.paymentQrTopRow}>
                        <TouchableOpacity
                          style={styles.qrThumbWrapper}
                          onPress={() => setShowQrModal(true)}
                          activeOpacity={0.85}
                        >
                          <PaymentQrSvg size={64} color="#38BDF8" bg="#0B1120" />
                          <View style={styles.qrZoomOverlay}>
                            <QrCode size={12} color="#FFFFFF" />
                            <Text style={styles.qrZoomText}>Tap to Zoom</Text>
                          </View>
                        </TouchableOpacity>

                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Sparkles size={14} color="#FBBF24" />
                            <Text style={styles.paymentQrTitle}>Store License Activation</Text>
                          </View>
                          <Text style={styles.paymentQrSub}>
                            Scan payment QR code ({defaultMethod.fee}) to activate your store license.
                          </Text>

                          <TouchableOpacity
                            style={styles.openQrBtn}
                            onPress={() => setShowQrModal(true)}
                            activeOpacity={0.8}
                          >
                            <QrCode size={13} color="#38BDF8" />
                            <Text style={styles.openQrBtnText}>Show Payment QR Code</Text>
                          </TouchableOpacity>
                        </View>
                      </View>

                      {/* Quick Address Snippet with Copy */}
                      <View style={styles.quickAddressRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.quickAddressLabel}>
                            {defaultMethod.name} ({defaultMethod.id === 'bank' ? defaultMethod.bankName : defaultMethod.name}) Payee:
                          </Text>
                          <Text style={styles.quickAddressVal} numberOfLines={1}>
                            {defaultMethod.address}
                          </Text>
                        </View>

                        <TouchableOpacity
                          style={[styles.quickCopyBtn, quickCopied && styles.quickCopyBtnActive]}
                          onPress={handleCopyQuickAddress}
                          activeOpacity={0.75}
                        >
                          {quickCopied ? (
                            <Check size={13} color="#FFFFFF" />
                          ) : (
                            <Copy size={13} color="#38BDF8" />
                          )}
                          <Text style={[styles.quickCopyBtnText, quickCopied && { color: '#FFFFFF' }]}>
                            {quickCopied ? 'Copied' : 'Copy'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Mandatory TRX Input Field */}
                    <View style={styles.fieldGroup}>
                      <View style={styles.trxHeaderRow}>
                        <Text style={[styles.label, trxError && styles.labelError]}>
                          {trxError
                            ? '⚠️ Enter TID from Payment SMS / Reference *'
                            : 'Payment Transaction ID (TRX / Reference) *'}
                        </Text>
                        <View style={[styles.mustBadge, trxError && styles.mustBadgeError]}>
                          <Text style={[styles.mustBadgeText, trxError && styles.mustBadgeTextError]}>
                            {trxError ? 'SMS TID REQUIRED' : 'REQUIRED'}
                          </Text>
                        </View>
                      </View>
                      <View
                        style={[
                          styles.inputWrapper,
                          { borderColor: trxError ? '#EF4444' : '#F59E0B70' },
                          trxError && styles.inputWrapperError,
                        ]}
                      >
                        <Receipt size={16} color={trxError ? '#EF4444' : '#FBBF24'} style={styles.inputIcon} />
                        <TextInput
                          style={[styles.input, trxError && { color: '#FCA5A5' }]}
                          placeholder="Enter 12-digit TID from SMS / Bank Reference"
                          placeholderTextColor={trxError ? '#F8717180' : '#64748B'}
                          value={trxId}
                          onChangeText={(text) => {
                            setTrxId(text);
                            if (trxError && text.trim().length > 0) {
                              setTrxError(false);
                            }
                          }}
                          autoCapitalize="none"
                          autoCorrect={false}
                        />
                      </View>
                      {trxError ? (
                        <Text style={styles.trxErrorHelperText}>
                          ⚠️ Payment Transaction ID is required. Please check your payment SMS receipt and enter the TID here.
                        </Text>
                      ) : (
                        <Text style={styles.trxHelperText}>
                          ℹ️ Transfer fee above, copy the Transaction ID / TID from SMS receipt, and paste it here.
                        </Text>
                      )}
                    </View>
                  </>
                )}

                {/* Submit Button */}
                <TouchableOpacity
                  style={[
                    styles.submitBtn,
                    { backgroundColor: mode === 'signup' ? currentPreset.accentColor : '#0284C7' },
                  ]}
                  onPress={mode === 'login' ? handleLogin : handleSignup}
                  activeOpacity={0.85}
                >
                  <Text style={styles.submitBtnText}>
                    {mode === 'login'
                      ? 'Sign In to Dashboard'
                      : `Submit ${currentPreset.title.split(' ')[0]} Registration`}
                  </Text>
                  <ArrowRight size={16} color="#FFFFFF" />
                </TouchableOpacity>
              </View>

              {/* Enterprise Security Note */}
              <View style={styles.footerNote}>
                <Lock size={12} color="#475569" />
                <Text style={styles.footerNoteText}>
                  Multi-Tenant Secure Cloud • Role-Based Access Control
                </Text>
              </View>
            </>
          )}
        </View>
      </ScrollView>

      {/* Payment QR Code Popup Modal */}
      <PaymentQrModal
        visible={showQrModal}
        onClose={() => setShowQrModal(false)}
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
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    paddingVertical: 36,
  },
  centeredWrapper: {
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoBadge: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#0284C720',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#38BDF840',
    marginBottom: 10,
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#F8FAFC',
    letterSpacing: -0.5,
  },
  brandSubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 4,
    textAlign: 'center',
    fontWeight: '500',
  },
  pendingSuccessCard: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1.5,
    borderColor: '#F59E0B',
    alignItems: 'center',
    marginBottom: 20,
  },
  pendingIconBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#78350F30',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#F59E0B',
    marginBottom: 14,
  },
  pendingSuccessTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#F8FAFC',
    textAlign: 'center',
  },
  pendingSuccessSubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  submittedTrxCard: {
    backgroundColor: '#0F172A',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#F59E0B50',
    width: '100%',
    marginTop: 14,
    gap: 4,
  },
  submittedTrxLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FBBF24',
    letterSpacing: 0.5,
  },
  submittedTrxValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F8FAFC',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  pendingInfoBox: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#334155',
    marginVertical: 16,
    width: '100%',
  },
  pendingInfoText: {
    fontSize: 12,
    color: '#CBD5E1',
    lineHeight: 18,
  },
  pendingLoginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0284C7',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    width: '100%',
    gap: 8,
  },
  pendingLoginBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  pendingNoticeBox: {
    backgroundColor: '#78350F25',
    borderColor: '#F59E0B',
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  pendingNoticeTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FBBF24',
    marginBottom: 4,
  },
  pendingNoticeText: {
    fontSize: 12,
    color: '#FDE68A',
    lineHeight: 16,
  },
  tabToggle: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  toggleBtnActive: {
    backgroundColor: '#0F172A',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  toggleText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  toggleTextActive: {
    color: '#F8FAFC',
    fontWeight: '800',
  },
  errorBox: {
    backgroundColor: '#7F1D1D25',
    borderColor: '#DC2626',
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginBottom: 14,
  },
  errorText: {
    fontSize: 12,
    color: '#F87171',
    fontWeight: '600',
  },
  formCard: {
    backgroundColor: '#1E293B',
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
  },
  fieldGroup: {
    gap: 6,
  },
  label: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '700',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 12,
    height: 46,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    color: '#F8FAFC',
    fontSize: 14,
    height: '100%',
  },
  industryGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  industryOption: {
    flex: 1,
    backgroundColor: '#0F172A',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
    gap: 6,
  },
  industryOptionText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
  },
  paymentQrCard: {
    backgroundColor: '#0F172A',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#38BDF840',
    gap: 10,
  },
  paymentQrTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  qrThumbWrapper: {
    width: 68,
    height: 68,
    borderRadius: 12,
    backgroundColor: '#0B1120',
    padding: 2,
    borderWidth: 1,
    borderColor: '#38BDF860',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  qrZoomOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(2, 6, 23, 0.85)',
    paddingVertical: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  qrZoomText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#38BDF8',
  },
  paymentQrTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  paymentQrSub: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
    lineHeight: 15,
  },
  openQrBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 6,
  },
  openQrBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#38BDF8',
  },
  quickAddressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1E293B',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 8,
  },
  quickAddressLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  quickAddressVal: {
    fontSize: 11,
    color: '#CBD5E1',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  quickCopyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#38BDF820',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
  },
  quickCopyBtnActive: {
    backgroundColor: '#10B981',
  },
  quickCopyBtnText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#38BDF8',
  },
  trxHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mustBadge: {
    backgroundColor: '#F59E0B25',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#F59E0B50',
  },
  mustBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#FBBF24',
  },
  trxHelperText: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 15,
    marginTop: 2,
  },
  labelError: {
    color: '#EF4444',
    fontWeight: '700',
  },
  mustBadgeError: {
    backgroundColor: '#EF444420',
    borderColor: '#EF444480',
  },
  mustBadgeTextError: {
    color: '#EF4444',
  },
  inputWrapperError: {
    backgroundColor: '#450A0A25',
  },
  trxErrorHelperText: {
    fontSize: 11,
    color: '#EF4444',
    lineHeight: 15,
    marginTop: 2,
    fontWeight: '600',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    marginTop: 6,
  },
  submitBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  footerNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    gap: 6,
  },
  footerNoteText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
});
