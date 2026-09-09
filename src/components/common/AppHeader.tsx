import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import {
  Pill,
  Store,
  UtensilsCrossed,
  RefreshCw,
  Wifi,
  WifiOff,
  ChevronDown,
  LogOut,
  ShieldCheck,
  Building2,
} from 'lucide-react-native';
import { useAppStore } from '../../store/useAppStore';
import { useAuthStore } from '../../store/useAuthStore';
import { INDUSTRY_PRESETS } from '../../config/industryPresets';

interface AppHeaderProps {
  title?: string;
  subtitle?: string;
  showBranchSelector?: boolean;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  title,
  subtitle,
  showBranchSelector = true,
}) => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { activeIndustry, tenant, isSyncing, isOnline, triggerSync } = useAppStore();
  const { currentUser, logout, isImpersonating } = useAuthStore();
  const preset = INDUSTRY_PRESETS[activeIndustry];

  const topInset = Math.max(insets.top, Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0);
  const headerTopPadding = topInset > 0 ? topInset + 8 : 14;

  const getIndustryIcon = () => {
    switch (activeIndustry) {
      case 'pharmacy':
        return <Pill size={14} color="#fff" />;
      case 'general_store':
        return <Store size={14} color="#fff" />;
      case 'restaurant':
        return <UtensilsCrossed size={14} color="#fff" />;
    }
  };

  const activeBranch =
    tenant.branches.find((b) => b.id === tenant.activeBranchId) || tenant.branches[0] || {
      name: 'Main Dispensary',
      code: '01',
    };

  return (
    <View style={[styles.container, { paddingTop: headerTopPadding }]}>
      {/* Super Admin Back to HQ Banner */}
      {currentUser?.role === 'super_admin' && (
        <View style={styles.adminBanner}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <ShieldCheck size={14} color="#FB7185" />
            <Text style={styles.adminBannerText}>
              {isImpersonating ? `Inspecting ${tenant.businessName}` : 'Super Admin Active'}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => navigation.navigate('AdminCommandCenter')}
            style={styles.adminHqBtn}
          >
            <Text style={styles.adminHqText}>Admin HQ</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.topRow}>
        {/* Industry Mode: Switcher for Admin, Locked License Badge for Store Users */}
        {currentUser?.role === 'super_admin' ? (
          <TouchableOpacity
            style={[styles.industryBadge, { backgroundColor: preset.accentColor }]}
            onPress={() => navigation.navigate('IndustrySelect')}
            activeOpacity={0.8}
          >
            {getIndustryIcon()}
            <Text style={styles.industryBadgeText}>{preset.title.split(' ')[0]} Mode</Text>
            <ChevronDown size={14} color="#fff" style={{ marginLeft: 2 }} />
          </TouchableOpacity>
        ) : (
          <View style={[styles.industryBadge, { backgroundColor: preset.accentColor }]}>
            {getIndustryIcon()}
            <Text style={styles.industryBadgeText}>{preset.title.split(' ')[0]} Licensed</Text>
          </View>
        )}

        {/* Sync & Logout Controls */}
        <View style={styles.statusGroup}>
          <TouchableOpacity
            style={[styles.syncButton, isSyncing && styles.syncingActive]}
            onPress={triggerSync}
            disabled={isSyncing}
            activeOpacity={0.7}
          >
            <RefreshCw size={12} color={isSyncing ? preset.accentColor : '#94A3B8'} />
            <Text style={[styles.syncText, isSyncing && { color: preset.accentColor }]}>
              {isSyncing ? 'Syncing' : 'Sync'}
            </Text>
          </TouchableOpacity>

          {/* User Sign Out */}
          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={logout}
            activeOpacity={0.7}
          >
            <LogOut size={13} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Title & Store Name */}
      <View style={styles.titleRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title} numberOfLines={1}>
            {title || tenant.businessName}
          </Text>
          {showBranchSelector ? (
            <Text style={styles.subtitle}>
              📍 {activeBranch.name} • Owner: {currentUser?.name || tenant.ownerName || 'Staff'}
            </Text>
          ) : (
            subtitle && <Text style={styles.subtitle}>{subtitle}</Text>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  adminBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#E11D4820',
    borderColor: '#E11D48',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 10,
  },
  adminBannerText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FB7185',
  },
  adminHqBtn: {
    backgroundColor: '#E11D48',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  adminHqText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  industryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 3,
  },
  industryBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  statusGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  syncingActive: {
    borderColor: '#38BDF8',
    borderWidth: 1,
  },
  syncText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
  },
  logoutBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 19,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '500',
  },
});
