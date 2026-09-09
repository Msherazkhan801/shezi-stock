import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  Pill,
  Store,
  UtensilsCrossed,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Zap,
  Sparkles,
} from 'lucide-react-native';
import { useAppStore } from '../store/useAppStore';
import { useAuthStore } from '../store/useAuthStore';
import { INDUSTRY_PRESETS } from '../config/industryPresets';
import { IndustryType } from '../types/industry';

export const IndustrySelectScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { activeIndustry, setIndustry, tenant } = useAppStore();
  const { currentUser } = useAuthStore();

  React.useEffect(() => {
    if (currentUser && currentUser.role !== 'super_admin') {
      navigation.replace('MainTabs');
    }
  }, [currentUser]);

  const handleSelectIndustry = (type: IndustryType) => {
    if (currentUser && currentUser.role !== 'super_admin') {
      navigation.replace('MainTabs');
      return;
    }
    setIndustry(type);
    navigation.navigate('MainTabs');
  };

  const industries: IndustryType[] = ['pharmacy', 'general_store', 'restaurant'];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.brandRow}>
            <View style={styles.logoBadge}>
              <Zap size={20} color="#38BDF8" />
            </View>
            <Text style={styles.brandName}>SheziStock</Text>
          </View>
          <Text style={styles.heading}>Select Industry Mode</Text>
          <Text style={styles.subheading}>
            Dynamic multi-tenant engine adapts schemas, POS workflows, and inventory tracking to your business model.
          </Text>
        </View>

        {/* Industry Cards List */}
        <ScrollView style={styles.cardsScroll} contentContainerStyle={styles.cardsContent}>
          {industries.map((ind) => {
            const preset = INDUSTRY_PRESETS[ind];
            const isSelected = activeIndustry === ind;

            const getIcon = () => {
              switch (ind) {
                case 'pharmacy':
                  return <Pill size={24} color={preset.accentColor} />;
                case 'general_store':
                  return <Store size={24} color={preset.accentColor} />;
                case 'restaurant':
                  return <UtensilsCrossed size={24} color={preset.accentColor} />;
              }
            };

            return (
              <TouchableOpacity
                key={ind}
                style={[
                  styles.industryCard,
                  isSelected && {
                    borderColor: preset.accentColor,
                    borderWidth: 2,
                    backgroundColor: `${preset.accentColor}12`,
                  },
                ]}
                onPress={() => handleSelectIndustry(ind)}
                activeOpacity={0.85}
              >
                {/* Top Badge */}
                <View style={styles.cardTopRow}>
                  <View style={[styles.iconContainer, { backgroundColor: `${preset.accentColor}25` }]}>
                    {getIcon()}
                  </View>
                  <View style={[styles.badge, { backgroundColor: `${preset.accentColor}30` }]}>
                    <Text style={[styles.badgeText, { color: preset.accentColor }]}>
                      {preset.badge}
                    </Text>
                  </View>
                </View>

                {/* Title & Tagline */}
                <Text style={styles.cardTitle}>{preset.title}</Text>
                <Text style={styles.cardTagline}>{preset.tagline}</Text>

                {/* Schema Highlights */}
                <View style={styles.highlightsContainer}>
                  <Text style={styles.highlightsHeader}>SECTOR CAPABILITIES:</Text>
                  {preset.schemaHighlights.slice(0, 3).map((hl, i) => (
                    <View key={i} style={styles.highlightItem}>
                      <CheckCircle2 size={13} color={preset.accentColor} />
                      <Text style={styles.highlightText}>{hl}</Text>
                    </View>
                  ))}
                </View>

                {/* Launch / Select Button */}
                <View style={[styles.cardFooter, { borderTopColor: isSelected ? `${preset.accentColor}40` : '#334155' }]}>
                  <Text style={[styles.footerStatus, isSelected && { color: preset.accentColor, fontWeight: '700' }]}>
                    {isSelected ? '✓ Currently Active Mode' : 'Switch & Open POS'}
                  </Text>
                  <View style={[styles.arrowCircle, { backgroundColor: preset.accentColor }]}>
                    <ArrowRight size={14} color="#FFFFFF" />
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0B1120',
  },
  container: {
    flex: 1,
    backgroundColor: '#0B1120',
    paddingHorizontal: 16,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 10 : 20,
    paddingBottom: 16,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  logoBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#0284C725',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#38BDF8',
  },
  brandName: {
    fontSize: 18,
    fontWeight: '900',
    color: '#F8FAFC',
    letterSpacing: -0.5,
  },
  heading: {
    fontSize: 26,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: -0.8,
  },
  subheading: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 6,
    lineHeight: 18,
  },
  cardsScroll: {
    flex: 1,
  },
  cardsContent: {
    paddingBottom: 24,
    gap: 14,
  },
  industryCard: {
    backgroundColor: '#1E293B',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#334155',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 46,
    height: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  cardTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#F8FAFC',
    marginBottom: 4,
  },
  cardTagline: {
    fontSize: 13,
    color: '#94A3B8',
    lineHeight: 18,
    marginBottom: 14,
  },
  highlightsContainer: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 12,
    gap: 6,
    marginBottom: 14,
  },
  highlightsHeader: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  highlightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  highlightText: {
    fontSize: 12,
    color: '#CBD5E1',
    fontWeight: '500',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingTop: 12,
  },
  footerStatus: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
  },
  arrowCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
