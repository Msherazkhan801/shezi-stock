import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  Building2,
  Database,
  RefreshCw,
  Plus,
  ShieldCheck,
  CheckCircle2,
  DollarSign,
  Layers,
  Sparkles,
} from 'lucide-react-native';
import { AppHeader } from '../components/common/AppHeader';
import { useAppStore } from '../store/useAppStore';
import { useAuthStore } from '../store/useAuthStore';
import { useInventoryStore } from '../store/useInventoryStore';
import { INDUSTRY_PRESETS } from '../config/industryPresets';
import { initFirebase } from '../config/firebaseConfig';

export const SettingsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { activeIndustry, tenant, updateTenant, setActiveBranch, triggerSync, isSyncing } = useAppStore();
  const { currentUser } = useAuthStore();
  const { resetToDefaults } = useInventoryStore();
  const preset = INDUSTRY_PRESETS[activeIndustry];

  const [businessName, setBusinessName] = useState(tenant.businessName);
  const [currencySymbol, setCurrencySymbol] = useState(tenant.currencySymbol);
  const [taxRate, setTaxRate] = useState(tenant.taxRate.toString());
  const [enableTax, setEnableTax] = useState(tenant.enableTax);

  const [firebaseApiKey, setFirebaseApiKey] = useState('AIzaSyAv9OOaOjFLF6jahe5V3MiXvqP2xXaajcA');
  const [firebaseProjectId, setFirebaseProjectId] = useState('shezistocks');
  const [isTestingFirebase, setIsTestingFirebase] = useState(false);
  const [firebaseStatusMessage, setFirebaseStatusMessage] = useState<string | null>(null);

  const handleSaveTenantSettings = () => {
    updateTenant({
      businessName,
      currencySymbol,
      taxRate: parseFloat(taxRate) || 0,
      enableTax,
    });
    Alert.alert('Settings Saved', 'Business and tax configurations updated successfully.');
  };

  const handleTestFirebase = async () => {
    setIsTestingFirebase(true);
    setFirebaseStatusMessage(null);

    const res = initFirebase({
      apiKey: firebaseApiKey,
      projectId: firebaseProjectId,
      authDomain: `${firebaseProjectId}.firebaseapp.com`,
      storageBucket: `${firebaseProjectId}.firebasestorage.app`,
      messagingSenderId: '757439565104',
      appId: '1:757439565104:web:f3ce867632ab82213a8cf5',
      measurementId: 'G-F3EJVGV61H',
    });

    await new Promise((resolve) => setTimeout(resolve, 800));
    setIsTestingFirebase(false);

    if (res.isConnected) {
      setFirebaseStatusMessage('✓ Multi-Tenant Firestore Connected with Offline Persistence Active');
      updateTenant({ isFirebaseConnected: true });
    } else {
      setFirebaseStatusMessage('⚠️ Running in Local Offline Persistence Mode (AsyncStorage Active)');
    }
  };

  const handleResetData = () => {
    resetToDefaults();
    Alert.alert('Reset Complete', 'Loaded initial demo products for Pharmacy, General Store, and Restaurant.');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <AppHeader title="Settings & Multi-Tenant" showBranchSelector={false} />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Industry Sector Card: Switchable for Super Admin, Locked for Store Owners */}
        {currentUser?.role === 'super_admin' ? (
          <TouchableOpacity
            style={[styles.industrySwitchCard, { borderColor: preset.accentColor }]}
            onPress={() => navigation.navigate('IndustrySelect')}
            activeOpacity={0.85}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.industrySwitchLabel}>Current Industry Mode</Text>
              <Text style={[styles.industrySwitchTitle, { color: preset.accentColor }]}>
                {preset.title}
              </Text>
              <Text style={styles.industrySwitchSub}>
                Tap to switch between Pharmacy, General Store, and Restaurant
              </Text>
            </View>
            <View style={[styles.switchBadge, { backgroundColor: preset.accentColor }]}>
              <Text style={styles.switchBadgeText}>Change</Text>
            </View>
          </TouchableOpacity>
        ) : (
          <View style={[styles.industrySwitchCard, { borderColor: preset.accentColor, backgroundColor: '#0F172A' }]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.industrySwitchLabel}>Store Sector License</Text>
              <Text style={[styles.industrySwitchTitle, { color: preset.accentColor }]}>
                {preset.title}
              </Text>
              <Text style={styles.industrySwitchSub}>
                Your store account is permanently licensed for {preset.title}. Contact HQ Super Administrator for any sector change requests.
              </Text>
            </View>
            <View style={[styles.switchBadge, { backgroundColor: '#334155' }]}>
              <Text style={[styles.switchBadgeText, { color: '#94A3B8' }]}>🔒 Locked</Text>
            </View>
          </View>
        )}

        {/* Business & Multi-Tenant Branches */}
        <Text style={styles.sectionTitle}>Business & Organization</Text>
        <View style={styles.card}>
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Business / Organization Name</Text>
            <TextInput
              style={styles.input}
              value={businessName}
              onChangeText={setBusinessName}
              placeholderTextColor="#64748B"
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.fieldGroup, { flex: 1 }]}>
              <Text style={styles.label}>Currency Symbol</Text>
              <TextInput
                style={styles.input}
                value={currencySymbol}
                onChangeText={setCurrencySymbol}
                placeholderTextColor="#64748B"
              />
            </View>
            <View style={[styles.fieldGroup, { flex: 1 }]}>
              <Text style={styles.label}>Sales Tax Rate (%)</Text>
              <TextInput
                style={styles.input}
                value={taxRate}
                onChangeText={setTaxRate}
                keyboardType="numeric"
                placeholderTextColor="#64748B"
              />
            </View>
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.switchText}>Enable Sales Tax on Billing</Text>
            <Switch
              value={enableTax}
              onValueChange={setEnableTax}
              trackColor={{ false: '#334155', true: preset.accentColor }}
              thumbColor="#FFFFFF"
            />
          </View>

          {/* Active Branch Selector */}
          <Text style={[styles.label, { marginTop: 10 }]}>Select Active Branch / Location:</Text>
          <View style={styles.branchesList}>
            {tenant.branches.map((b) => {
              const isSelected = tenant.activeBranchId === b.id;
              return (
                <TouchableOpacity
                  key={b.id}
                  style={[
                    styles.branchItem,
                    isSelected && { borderColor: preset.accentColor, backgroundColor: `${preset.accentColor}15` },
                  ]}
                  onPress={() => setActiveBranch(b.id)}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.branchName, isSelected && { color: preset.accentColor, fontWeight: '800' }]}>
                      {b.name} ({b.code})
                    </Text>
                    <Text style={styles.branchAddress}>{b.address}</Text>
                  </View>
                  {isSelected && <CheckCircle2 size={16} color={preset.accentColor} />}
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: preset.accentColor }]}
            onPress={handleSaveTenantSettings}
          >
            <Text style={styles.saveBtnText}>Save Business Info</Text>
          </TouchableOpacity>
        </View>

        {/* Cloud Firestore Configuration */}
     

        {/* Demo Data Management */}
        <Text style={styles.sectionTitle}>Data Management</Text>
        <View style={styles.card}>
          <Text style={styles.cardSubtext}>
            Reload standard high-fidelity sample catalogs for Pharmacy (medicines with batches), General Store (aisles/cartons), and Restaurant (dishes with BOM recipes).
          </Text>

          <TouchableOpacity style={styles.resetBtn} onPress={handleResetData}>
            <Text style={styles.resetBtnText}>Restore Default Demo Datasets</Text>
          </TouchableOpacity>
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
  industrySwitchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
  },
  industrySwitchLabel: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  industrySwitchTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: 2,
  },
  industrySwitchSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  switchBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  switchBadgeText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 12,
  },
  fieldGroup: {
    gap: 4,
  },
  label: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#0F172A',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#F8FAFC',
    fontSize: 14,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  switchText: {
    fontSize: 13,
    color: '#F8FAFC',
    fontWeight: '600',
  },
  branchesList: {
    gap: 8,
  },
  branchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0F172A',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  branchName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  branchAddress: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  saveBtn: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 6,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  testBtn: {
    flex: 1.4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F172A',
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#38BDF8',
    gap: 6,
  },
  testBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#38BDF8',
  },
  syncBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F172A',
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#10B981',
    gap: 6,
  },
  syncBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#10B981',
  },
  statusBox: {
    backgroundColor: '#0F172A',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  statusBoxText: {
    fontSize: 11,
    color: '#34D399',
    fontWeight: '600',
  },
  cardSubtext: {
    fontSize: 12,
    color: '#94A3B8',
    lineHeight: 18,
  },
  resetBtn: {
    backgroundColor: '#7F1D1D25',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DC2626',
    marginTop: 4,
  },
  resetBtnText: {
    color: '#F87171',
    fontSize: 13,
    fontWeight: '700',
  },
});
