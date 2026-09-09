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
} from 'lucide-react-native';
import { useAuthStore } from '../store/useAuthStore';
import { IndustryType } from '../types/industry';
import { INDUSTRY_PRESETS } from '../config/industryPresets';

export const AuthScreen: React.FC = () => {
  const { login, signup } = useAuthStore();

  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [storeName, setStoreName] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState<IndustryType>('pharmacy');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pendingNotice, setPendingNotice] = useState<string | null>(null);
  const [registeredPendingStore, setRegisteredPendingStore] = useState<{
    storeName: string;
    email: string;
    industry: IndustryType;
  } | null>(null);

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
    if (!name.trim() || !email.trim() || !storeName.trim()) {
      setErrorMessage('Please fill in your Name, Email, and Store / Business Name.');
      return;
    }

    const res = signup({
      name,
      email,
      password,
      storeName,
      industry: selectedIndustry,
    });

    if (!res.success) {
      setErrorMessage(res.error || 'Registration failed.');
    } else {
      setRegisteredPendingStore({
        storeName: storeName.trim(),
        email: email.trim().toLowerCase(),
        industry: selectedIndustry,
      });
      setName('');
      setPassword('');
    }
  };

  const currentPreset = INDUSTRY_PRESETS[selectedIndustry];

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
              <Text style={styles.pendingSuccessTitle}>Store Registered Successfully!</Text>
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

              <View style={styles.pendingInfoBox}>
                <Text style={styles.pendingInfoText}>
                  ⏳ <Text style={{ fontWeight: '800' }}>Status: Pending Admin Activation</Text>
                  {'\n'}Your account has been submitted for administrator review. Once the Super Admin
                  activates your account in the Admin Command Center, you will be able to log in with{' '}
                  <Text style={{ color: '#38BDF8' }}>{registeredPendingStore.email}</Text>.
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
                <Text style={styles.pendingLoginBtnText}>Go to Sign In</Text>
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

                    {/* Industry Sector Selector during signup */}
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
                  <Text style={styles.label}>Password</Text>
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
                      : `Submit ${currentPreset.title.split(' ')[0]} Store Registration`}
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
  pendingInfoBox: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#334155',
    marginVertical: 18,
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

