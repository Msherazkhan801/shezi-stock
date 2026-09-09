import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LucideIcon } from 'lucide-react-native';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  accentColor: string;
  badgeText?: string;
  badgeType?: 'success' | 'warning' | 'danger' | 'info';
  style?: any;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  accentColor,
  badgeText,
  badgeType = 'info',
  style,
}) => {
  const getBadgeStyle = () => {
    switch (badgeType) {
      case 'success':
        return { bg: '#064E3B40', text: '#34D399', border: '#05966950' };
      case 'warning':
        return { bg: '#78350F40', text: '#FBBF24', border: '#D9770650' };
      case 'danger':
        return { bg: '#7F1D1D40', text: '#F87171', border: '#DC262650' };
      case 'info':
      default:
        return { bg: '#1E293B80', text: '#94A3B8', border: '#33415560' };
    }
  };

  const badgeStyle = getBadgeStyle();

  return (
    <View style={[styles.card, style]}>
      {/* Top Header Row with Icon and Title */}
      <View style={styles.topRow}>
        <View style={styles.titleWrapper}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
        </View>
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: `${accentColor}18`, borderColor: `${accentColor}35` },
          ]}
        >
          <Icon size={18} color={accentColor} />
        </View>
      </View>

      {/* Main Metric Value Row */}
      <View style={styles.valueRow}>
        <Text style={styles.value}>{value}</Text>
        {badgeText && (
          <View
            style={[
              styles.badge,
              { backgroundColor: badgeStyle.bg, borderColor: badgeStyle.border },
            ]}
          >
            <Text style={[styles.badgeText, { color: badgeStyle.text }]}>{badgeText}</Text>
          </View>
        )}
      </View>

      {/* Subtitle / Context */}
      {subtitle && (
        <Text style={styles.subtitle} numberOfLines={1}>
          {subtitle}
        </Text>
      )}

      {/* Subtle bottom accent glow bar */}
      <View style={[styles.accentLine, { backgroundColor: accentColor }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#131D31',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#24324D',
    flex: 1,
    minWidth: 220,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 3,
  },
  accentLine: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    opacity: 0.85,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  titleWrapper: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginVertical: 2,
  },
  value: {
    fontSize: 26,
    fontWeight: '900',
    color: '#F8FAFC',
    letterSpacing: -0.5,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 6,
    fontWeight: '500',
  },
});

