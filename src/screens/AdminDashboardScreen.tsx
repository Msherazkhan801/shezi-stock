import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  Platform,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import {
  ShieldCheck,
  Building2,
  Users,
  Plus,
  Trash2,
  Pill,
  Store,
  UtensilsCrossed,
  LogOut,
  X,
  ExternalLink,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  KeyRound,
  Mail,
  User,
  Layers,
} from 'lucide-react-native';
import { useAuthStore } from '../store/useAuthStore';
import { StatCard } from '../components/common/StatCard';
import { Badge } from '../components/common/Badge';
import { IndustryType } from '../types/industry';
import { INDUSTRY_PRESETS } from '../config/industryPresets';

export const AdminDashboardScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const {
    currentUser,
    users,
    logout,
    createStoreAccountAsAdmin,
    activateUserAccount,
    suspendUserAccount,
    deleteUserAccount,
    switchTenantAsAdmin,
    clearAllDemoData,
  } = useAuthStore();

  const topInset = Math.max(insets.top, Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0);
  const adminHeaderPaddingTop = topInset > 0 ? topInset + 8 : 12;

  const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'active' | 'suspended'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newOwnerName, setNewOwnerName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newStoreName, setNewStoreName] = useState('');
  const [newIndustry, setNewIndustry] = useState<IndustryType>('pharmacy');
  const [newPhone, setNewPhone] = useState('');
  const [newAddress, setNewAddress] = useState('');

  const [inspectUser, setInspectUser] = useState<any | null>(null);

  const filteredUsers = users.filter((u) => {
    const matchesFilter = activeFilter === 'all' ? true : u.status === activeFilter;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.storeName.toLowerCase().includes(q) ||
      u.industry.toLowerCase().includes(q);
    return matchesFilter && matchesSearch;
  });

  const totalStores = users.filter((u) => u.role === 'store_admin').length;
  const activeStores = users.filter((u) => u.status === 'active' && u.role === 'store_admin').length;
  const pendingStores = users.filter((u) => u.status === 'pending' && u.role === 'store_admin').length;
  const suspendedStores = users.filter((u) => u.status === 'suspended' && u.role === 'store_admin').length;

  const handleCreateStore = () => {
    if (!newOwnerName.trim() || !newEmail.trim() || !newPassword.trim() || !newStoreName.trim()) {
      Alert.alert('Incomplete Form', 'Please fill in owner name, email, password, and business name.');
      return;
    }

    const res = createStoreAccountAsAdmin({
      name: newOwnerName.trim(),
      email: newEmail.trim().toLowerCase(),
      password: newPassword.trim(),
      storeName: newStoreName.trim(),
      industry: newIndustry,
      phone: newPhone.trim(),
      address: newAddress.trim(),
    });

    if (res.success) {
      Alert.alert(
        'Store Provisioned Successfully',
        `Store "${newStoreName}" has been provisioned under ${newIndustry.toUpperCase()} edition. The owner can now sign in immediately with credentials:\n\nEmail: ${newEmail}\nPassword: ${newPassword}`
      );
      setShowCreateModal(false);
      setNewOwnerName('');
      setNewEmail('');
      setNewPassword('');
      setNewStoreName('');
      setNewPhone('');
      setNewAddress('');
    } else {
      Alert.alert('Provisioning Failed', res.error || 'Could not provision store.');
    }
  };

  const handleSwitchToTenant = (user: any) => {
    switchTenantAsAdmin(user.tenantId, user.industry, user.storeName, user.name);
    Alert.alert(
      'Session Impersonated',
      `Switched live session to "${user.storeName}" (${user.industry.toUpperCase()} edition). Opening store interface...`,
      [
        {
          text: 'Open Store View',
          onPress: () => navigation.navigate('MainTabs'),
        },
      ]
    );
  };

  const handleDeleteUser = (user: any) => {
    Alert.alert(
      'Delete Store Account',
      `Permanently delete "${user.storeName}" (${user.email})? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Store',
          style: 'destructive',
          onPress: () => deleteUserAccount(user.id),
        },
      ]
    );
  };

  const handleClearDemoData = () => {
    Alert.alert(
      'Reset All System Data',
      'This will erase all registered stores, test products, and sales logs to leave a clean production slate. Super Admin login credentials will be preserved.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Erase & Reset',
          style: 'destructive',
          onPress: () => {
            clearAllDemoData();
            Alert.alert('Clean Slate Initialized', 'All store accounts and inventory have been reset.');
          },
        },
      ]
    );
  };

  return (
    <View style={styles.safeArea}>
      {/* Top Enterprise Admin Bar */}
      <View style={[styles.adminHeader, { paddingTop: adminHeaderPaddingTop }]}>
        <View style={styles.headerInner}>
          <View style={styles.headerLeft}>
            <View style={styles.adminBadge}>
              <ShieldCheck size={15} color="#FB7185" />
              <Text style={styles.adminBadgeText}>SUPER ADMIN COMMAND CENTER</Text>
            </View>

            <View style={styles.systemStatusPill}>
              <View style={styles.statusDot} />
            </View>
          </View>

          <View style={styles.headerRight}>
            <View style={styles.adminUserBadge}>
              <User size={13} color="#94A3B8" />
              <Text style={styles.adminUserText} numberOfLines={1}>
                {currentUser?.email}
              </Text>
            </View>

            <TouchableOpacity onPress={logout} style={styles.logoutBtn} activeOpacity={0.75}>
              <LogOut size={14} color="#F87171" />
              <Text style={styles.logoutText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.dashboardContainer}>
          {/* Hero Title & Platform Summary */}
          <View style={styles.heroSection}>
           
            <View style={styles.heroActionRow}>
              <TouchableOpacity
                style={styles.primaryCreateBtn}
                onPress={() => setShowCreateModal(true)}
                activeOpacity={0.85}
              >
                <Plus size={16} color="#FFFFFF" />
                <Text style={styles.primaryCreateBtnText}>Provision New Store</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cleanSlateBtn}
                onPress={handleClearDemoData}
                activeOpacity={0.8}
              >
                <Trash2 size={14} color="#F87171" />
                <Text style={styles.cleanSlateBtnText}>Reset System</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Metrics Overview Grid */}
          <View style={styles.statsRow}>
            <StatCard
              title="Total Registered Stores"
              value={nonAdminUsers.length}
              subtitle="Platform-wide tenants"
              icon={Building2}
              accentColor="#E11D48"
              badgeText={pendingUsers.length > 0 ? `${pendingUsers.length} Pending Review` : 'All Active'}
              badgeType={pendingUsers.length > 0 ? 'warning' : 'success'}
            />

            <StatCard
              title="Pending Activation"
              value={pendingUsers.length}
              subtitle="Awaiting admin review"
              icon={Users}
              accentColor="#F59E0B"
              badgeText={pendingUsers.length > 0 ? 'Action Required' : '0 Pending'}
              badgeType={pendingUsers.length > 0 ? 'danger' : 'success'}
            />

            <StatCard
              title="Active Licenses"
              value={activeUsers.length}
              subtitle="Full operational access"
              icon={Store}
              accentColor="#10B981"
              badgeText={`${activeUsers.length} Online`}
              badgeType="success"
            />

            <StatCard
              title="Suspended Stores"
              value={suspendedUsers.length}
              subtitle="Access disabled"
              icon={ShieldCheck}
              accentColor="#64748B"
              badgeText={suspendedUsers.length > 0 ? `${suspendedUsers.length} Inactive` : 'None'}
              badgeType="info"
            />
          </View>

          {/* Directory Toolbar: Live Search & Filter Tabs */}
          <View style={styles.directoryToolbar}>
            {/* Search Box */}
            <View style={styles.searchWrapper}>
              <Search size={16} color="#64748B" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search stores by business name, owner name, email..."
                placeholderTextColor="#64748B"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.searchClearBtn}>
                  <X size={14} color="#94A3B8" />
                </TouchableOpacity>
              )}
            </View>

            {/* Filter Tabs */}
            <View style={styles.filterTabsContainer}>
              <TouchableOpacity
                style={[styles.filterTab, activeFilter === 'all' && styles.filterTabActive]}
                onPress={() => setActiveFilter('all')}
              >
                <Text style={[styles.filterTabText, activeFilter === 'all' && styles.filterTabTextActive]}>
                  All Stores ({nonAdminUsers.length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.filterTab,
                  activeFilter === 'pending' && styles.filterTabActive,
                  pendingUsers.length > 0 && { borderColor: '#F59E0B50' },
                ]}
                onPress={() => setActiveFilter('pending')}
              >
                <Text
                  style={[
                    styles.filterTabText,
                    activeFilter === 'pending' && styles.filterTabTextActive,
                    pendingUsers.length > 0 && { color: '#FBBF24', fontWeight: '800' },
                  ]}
                >
                  ⏳ Pending ({pendingUsers.length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.filterTab, activeFilter === 'active' && styles.filterTabActive]}
                onPress={() => setActiveFilter('active')}
              >
                <Text style={[styles.filterTabText, activeFilter === 'active' && styles.filterTabTextActive]}>
                  🟢 Active ({activeUsers.length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.filterTab, activeFilter === 'suspended' && styles.filterTabActive]}
                onPress={() => setActiveFilter('suspended')}
              >
                <Text style={[styles.filterTabText, activeFilter === 'suspended' && styles.filterTabTextActive]}>
                  🔴 Suspended ({suspendedUsers.length})
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Store Tenants Directory */}
          <View style={styles.storeDirectorySection}>
            <View style={styles.sectionHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Layers size={18} color="#38BDF8" />
                <Text style={styles.sectionTitle}>
                  Store Tenants Directory ({filteredUsers.length})
                </Text>
              </View>
              {pendingUsers.length > 0 && (
                <View style={styles.pendingBadgeAlert}>
                  <AlertTriangle size={13} color="#FBBF24" />
                  <Text style={styles.pendingBadgeAlertText}>
                    {pendingUsers.length} Store{pendingUsers.length > 1 ? 's' : ''} Awaiting Activation
                  </Text>
                </View>
              )}
            </View>

            {filteredUsers.length === 0 ? (
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIconCircle}>
                  <Store size={32} color="#475569" />
                </View>
                <Text style={styles.emptyTitle}>
                  {searchQuery
                    ? 'No matching stores found'
                    : activeFilter === 'pending'
                    ? 'No pending store requests'
                    : 'No store accounts registered yet'}
                </Text>
                <Text style={styles.emptySub}>
                  {searchQuery
                    ? `No registered stores match "${searchQuery}". Try a different keyword.`
                    : activeFilter === 'pending'
                    ? 'All store registrations have been reviewed and activated.'
                    : 'Use the button below or register from the sign up screen to add stores.'}
                </Text>

                <TouchableOpacity
                  style={styles.emptyActionBtn}
                  onPress={() => setShowCreateModal(true)}
                  activeOpacity={0.8}
                >
                  <Plus size={16} color="#FFFFFF" />
                  <Text style={styles.emptyActionBtnText}>Provision First Store</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.storesGrid}>
                {filteredUsers.map((u) => {
                  const preset = INDUSTRY_PRESETS[u.industry];

                  const getSectorIcon = () => {
                    switch (u.industry) {
                      case 'pharmacy':
                        return <Pill size={18} color={preset.accentColor} />;
                      case 'general_store':
                        return <Store size={18} color={preset.accentColor} />;
                      case 'restaurant':
                        return <UtensilsCrossed size={18} color={preset.accentColor} />;
                    }
                  };

                  const isPending = u.status === 'pending';
                  const isActive = u.status === 'active';
                  const isSuspended = u.status === 'suspended';

                  return (
                    <View
                      key={u.id}
                      style={[
                        styles.storeCard,
                        isPending && styles.storeCardPending,
                        isSuspended && styles.storeCardSuspended,
                      ]}
                    >
                      {/* Top Store Header */}
                      <View style={styles.storeCardHeader}>
                        <View
                          style={[
                            styles.sectorIconBox,
                            {
                              backgroundColor: `${preset.accentColor}18`,
                              borderColor: `${preset.accentColor}40`,
                            },
                          ]}
                        >
                          {getSectorIcon()}
                        </View>

                        <View style={{ flex: 1 }}>
                          <View style={styles.storeNameRow}>
                            <Text style={styles.storeNameText} numberOfLines={1}>
                              {u.storeName}
                            </Text>
                            <Badge
                              label={preset.title.split(' ')[0]}
                              variant="neutral"
                              size="small"
                            />
                          </View>

                          <Text style={styles.storeOwnerSub}>
                            👤 {u.name} • <Text style={{ color: '#94A3B8' }}>{u.email}</Text>
                          </Text>
                        </View>

                        {/* Status Badge */}
                        <View style={styles.statusBadgeWrapper}>
                          {isPending && (
                            <View style={[styles.statusPill, { backgroundColor: '#78350F35', borderColor: '#F59E0B' }]}>
                              <Clock size={11} color="#FBBF24" />
                              <Text style={[styles.statusPillText, { color: '#FBBF24' }]}>Pending</Text>
                            </View>
                          )}
                          {isActive && (
                            <View style={[styles.statusPill, { backgroundColor: '#064E3B35', borderColor: '#10B981' }]}>
                              <CheckCircle2 size={11} color="#34D399" />
                              <Text style={[styles.statusPillText, { color: '#34D399' }]}>Active</Text>
                            </View>
                          )}
                          {isSuspended && (
                            <View style={[styles.statusPill, { backgroundColor: '#7F1D1D35', borderColor: '#DC2626' }]}>
                              <AlertTriangle size={11} color="#F87171" />
                              <Text style={[styles.statusPillText, { color: '#F87171' }]}>Suspended</Text>
                            </View>
                          )}
                        </View>
                      </View>

                      {/* Store Metadata Specs Grid */}
                      <View style={styles.specsGrid}>
                        <View style={styles.specItem}>
                          <Text style={styles.specLabel}>SECTOR EDITION</Text>
                          <Text style={[styles.specValue, { color: preset.accentColor }]}>
                            {preset.title}
                          </Text>
                        </View>

                        <View style={styles.specItem}>
                          <Text style={styles.specLabel}>ACCOUNT REGISTRATION</Text>
                          <Text style={styles.specValue}>
                            {u.createdBy === 'self' ? '📝 Self-Registered' : '👑 Admin Created'}
                          </Text>
                        </View>

                        <View style={styles.specItem}>
                          <Text style={styles.specLabel}>PASSWORD / ACCESS</Text>
                          <Text style={[styles.specValue, { color: '#CBD5E1' }]}>
                            {u.password || '••••••••'}
                          </Text>
                        </View>

                        <View style={styles.specItem}>
                          <Text style={styles.specLabel}>DATE ADDED</Text>
                          <Text style={styles.specValue}>
                            {new Date(u.createdAt).toLocaleDateString()}
                          </Text>
                        </View>
                      </View>

                      {/* Store Actions Toolbar */}
                      <View style={styles.cardActionsRow}>
                        {isPending ? (
                          <>
                            <TouchableOpacity
                              style={styles.activateActionBtn}
                              onPress={() => handleActivateUser(u)}
                              activeOpacity={0.85}
                            >
                              <ShieldCheck size={15} color="#FFFFFF" />
                              <Text style={styles.activateActionBtnText}>
                                Approve & Activate Store License
                              </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                              style={styles.deleteActionBtn}
                              onPress={() => handleDeleteUser(u)}
                              activeOpacity={0.7}
                            >
                              <Trash2 size={16} color="#EF4444" />
                            </TouchableOpacity>
                          </>
                        ) : (
                          <>
                            <TouchableOpacity
                              style={[
                                styles.inspectActionBtn,
                                {
                                  backgroundColor: `${preset.accentColor}18`,
                                  borderColor: `${preset.accentColor}40`,
                                },
                              ]}
                              onPress={() => handleInspectStore(u.tenantId)}
                              activeOpacity={0.8}
                            >
                              <ExternalLink size={14} color={preset.accentColor} />
                              <Text
                                style={[styles.inspectActionBtnText, { color: preset.accentColor }]}
                              >
                                Inspect Live Dashboard
                              </Text>
                            </TouchableOpacity>

                            {isActive ? (
                              <TouchableOpacity
                                style={styles.suspendActionBtn}
                                onPress={() => handleSuspendUser(u)}
                                activeOpacity={0.7}
                              >
                                <Text style={styles.suspendActionBtnText}>Suspend</Text>
                              </TouchableOpacity>
                            ) : (
                              <TouchableOpacity
                                style={styles.reactivateActionBtn}
                                onPress={() => handleActivateUser(u)}
                                activeOpacity={0.7}
                              >
                                <Text style={styles.reactivateActionBtnText}>Reactivate</Text>
                              </TouchableOpacity>
                            )}

                            <TouchableOpacity
                              style={styles.deleteActionBtn}
                              onPress={() => handleDeleteUser(u)}
                              activeOpacity={0.7}
                            >
                              <Trash2 size={16} color="#64748B" />
                            </TouchableOpacity>
                          </>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Provision New Store Modal - Rock-Solid Responsive Centering */}
      <Modal
        visible={showCreateModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                <View style={styles.modalIconBadge}>
                  <Plus size={18} color="#E11D48" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalTitle}>Provision New Store Tenant</Text>
                  <Text style={styles.modalSub}>
                    Immediately activates an enterprise store license and manager account
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={() => setShowCreateModal(false)}
                style={styles.modalCloseBtn}
                activeOpacity={0.7}
              >
                <X size={18} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            {/* Modal Form Scroll */}
            <ScrollView
              style={styles.modalScroll}
              contentContainerStyle={styles.modalContent}
              keyboardShouldPersistTaps="handled"
            >
              {/* Store Name */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Business / Store Name *</Text>
                <View style={styles.inputWrapper}>
                  <Store size={16} color="#64748B" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. City Central Pharmacy / West End Mart"
                    placeholderTextColor="#64748B"
                    value={newStoreName}
                    onChangeText={setNewStoreName}
                  />
                </View>
              </View>

              {/* Industry Sector Selector */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Operational Industry Sector *</Text>
                <View style={styles.industryGrid}>
                  <TouchableOpacity
                    style={[
                      styles.industryOption,
                      newIndustry === 'pharmacy' && {
                        borderColor: '#10B981',
                        backgroundColor: '#064E3B35',
                      },
                    ]}
                    onPress={() => setNewIndustry('pharmacy')}
                    activeOpacity={0.8}
                  >
                    <Pill size={18} color="#10B981" />
                    <Text
                      style={[
                        styles.industryOptionText,
                        newIndustry === 'pharmacy' && { color: '#10B981', fontWeight: '800' },
                      ]}
                    >
                      Pharmacy
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.industryOption,
                      newIndustry === 'general_store' && {
                        borderColor: '#6366F1',
                        backgroundColor: '#312E8135',
                      },
                    ]}
                    onPress={() => setNewIndustry('general_store')}
                    activeOpacity={0.8}
                  >
                    <Store size={18} color="#6366F1" />
                    <Text
                      style={[
                        styles.industryOptionText,
                        newIndustry === 'general_store' && { color: '#6366F1', fontWeight: '800' },
                      ]}
                    >
                      General Mart
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.industryOption,
                      newIndustry === 'restaurant' && {
                        borderColor: '#F97316',
                        backgroundColor: '#7C2D1235',
                      },
                    ]}
                    onPress={() => setNewIndustry('restaurant')}
                    activeOpacity={0.8}
                  >
                    <UtensilsCrossed size={18} color="#F97316" />
                    <Text
                      style={[
                        styles.industryOptionText,
                        newIndustry === 'restaurant' && { color: '#F97316', fontWeight: '800' },
                      ]}
                    >
                      Restaurant
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Manager Name */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Manager / Owner Full Name *</Text>
                <View style={styles.inputWrapper}>
                  <User size={16} color="#64748B" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Dr. Arthur Bell / Maria Gomez"
                    placeholderTextColor="#64748B"
                    value={newOwnerName}
                    onChangeText={setNewOwnerName}
                  />
                </View>
              </View>

              {/* Email Address */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Login Email Address *</Text>
                <View style={styles.inputWrapper}>
                  <Mail size={16} color="#64748B" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="manager@store.com"
                    placeholderTextColor="#64748B"
                    value={newEmail}
                    onChangeText={setNewEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
              </View>

              {/* Password */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Account Password</Text>
                <View style={styles.inputWrapper}>
                  <KeyRound size={16} color="#64748B" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="password"
                    placeholderTextColor="#64748B"
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry
                  />
                </View>
              </View>
            </ScrollView>

            {/* Modal Footer Actions */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowCreateModal(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalSubmitBtn}
                onPress={handleCreateStore}
                activeOpacity={0.85}
              >
                <Plus size={16} color="#FFFFFF" />
                <Text style={styles.modalSubmitBtnText}>Create & Activate Store</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0B1120',
  },
  adminHeader: {
    backgroundColor: '#0F172A',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerInner: {
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E11D4818',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E11D4840',
  },
  adminBadgeText: {
    color: '#FB7185',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  systemStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1E293B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  systemStatusText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  adminUserBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1E293B',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
    maxWidth: 240,
  },
  adminUserText: {
    fontSize: 12,
    color: '#CBD5E1',
    fontWeight: '600',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#7F1D1D20',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EF444430',
  },
  logoutText: {
    color: '#F87171',
    fontSize: 12,
    fontWeight: '700',
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 48,
  },
  dashboardContainer: {
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
    gap: 20,
  },
  heroSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 14,
    backgroundColor: '#131D31',
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: '#24324D',
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#F8FAFC',
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 4,
    maxWidth: 600,
    lineHeight: 18,
  },
  heroActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  primaryCreateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#E11D48',
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderRadius: 10,
    shadowColor: '#E11D48',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },
  primaryCreateBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  cleanSlateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#7F1D1D20',
    borderWidth: 1,
    borderColor: '#EF444450',
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  cleanSlateBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F87171',
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  directoryToolbar: {
    backgroundColor: '#131D31',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#24324D',
    gap: 12,
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0B1120',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#24324D',
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#F8FAFC',
    fontSize: 13,
    height: '100%',
  },
  searchClearBtn: {
    padding: 4,
  },
  filterTabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#0B1120',
    borderRadius: 10,
    padding: 4,
    gap: 4,
    flexWrap: 'wrap',
  },
  filterTab: {
    flex: 1,
    minWidth: 100,
    paddingVertical: 8,
    paddingHorizontal: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  filterTabActive: {
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
  },
  filterTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  filterTabTextActive: {
    color: '#F8FAFC',
    fontWeight: '800',
  },
  storeDirectorySection: {
    gap: 14,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: -0.3,
  },
  pendingBadgeAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#78350F35',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  pendingBadgeAlertText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FBBF24',
  },
  emptyContainer: {
    backgroundColor: '#131D31',
    borderRadius: 18,
    padding: 36,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#24324D',
    gap: 10,
  },
  emptyIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  emptySub: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    maxWidth: 450,
    lineHeight: 18,
  },
  emptyActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E11D48',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 10,
    marginTop: 8,
  },
  emptyActionBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  storesGrid: {
    gap: 12,
  },
  storeCard: {
    backgroundColor: '#131D31',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#24324D',
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  storeCardPending: {
    borderColor: '#F59E0B70',
    borderWidth: 1.5,
  },
  storeCardSuspended: {
    opacity: 0.85,
    borderColor: '#DC262650',
  },
  storeCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sectorIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  storeNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  storeNameText: {
    fontSize: 17,
    fontWeight: '900',
    color: '#F8FAFC',
  },
  storeOwnerSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '600',
  },
  statusBadgeWrapper: {
    alignItems: 'flex-end',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '800',
  },
  specsGrid: {
    backgroundColor: '#0B1120',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  specItem: {
    flex: 1,
    minWidth: 120,
  },
  specLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  specValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F8FAFC',
    marginTop: 2,
  },
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  activateActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    gap: 6,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  activateActionBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  inspectActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    gap: 6,
  },
  inspectActionBtnText: {
    fontSize: 12,
    fontWeight: '800',
  },
  suspendActionBtn: {
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
  },
  suspendActionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#CBD5E1',
  },
  reactivateActionBtn: {
    backgroundColor: '#064E3B',
    borderWidth: 1,
    borderColor: '#059669',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
  },
  reactivateActionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#34D399',
  },
  deleteActionBtn: {
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#0B1120',
    borderWidth: 1,
    borderColor: '#1E293B',
  },

  /* Modal Layout */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 10, 20, 0.85)',
    justifyContent: Platform.OS === 'web' ? 'center' : 'flex-end',
    alignItems: 'center',
    padding: Platform.OS === 'web' ? 20 : 0,
  },
  modalCard: {
    backgroundColor: '#131D31',
    borderRadius: Platform.OS === 'web' ? 20 : 24,
    borderBottomLeftRadius: Platform.OS === 'web' ? 20 : 0,
    borderBottomRightRadius: Platform.OS === 'web' ? 20 : 0,
    width: '100%',
    maxWidth: 540,
    maxHeight: Platform.OS === 'web' ? '88%' : '90%',
    borderWidth: 1,
    borderColor: '#24324D',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.45,
    shadowRadius: 24,
    elevation: 10,
    alignSelf: 'center',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#24324D',
    backgroundColor: '#131D31',
  },
  modalIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#E11D4818',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E11D4840',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  modalSub: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  modalCloseBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#0B1120',
    borderWidth: 1,
    borderColor: '#24324D',
  },
  modalScroll: {
    flexGrow: 0,
  },
  modalContent: {
    padding: 20,
    gap: 14,
  },
  fieldGroup: {
    gap: 6,
    width: '100%',
  },
  fieldLabel: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '700',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0B1120',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#24324D',
    paddingHorizontal: 12,
    height: 46,
    width: '100%',
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    color: '#F8FAFC',
    fontSize: 13,
    height: '100%',
  },
  industryGrid: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
  },
  industryOption: {
    flex: 1,
    backgroundColor: '#0B1120',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#24324D',
    gap: 6,
  },
  industryOptionText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
  },
  modalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 10,
    padding: 16,
    backgroundColor: '#0B1120',
    borderTopWidth: 1,
    borderTopColor: '#24324D',
  },
  modalCancelBtn: {
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  modalCancelBtnText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '700',
  },
  modalSubmitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E11D48',
    paddingVertical: 11,
    paddingHorizontal: 18,
    borderRadius: 8,
    shadowColor: '#E11D48',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  modalSubmitBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
