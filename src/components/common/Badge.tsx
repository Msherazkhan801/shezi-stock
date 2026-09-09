import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface BadgeProps {
  label: string;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'purple' | 'neutral';
  size?: 'small' | 'medium';
  icon?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'info',
  size = 'small',
  icon,
}) => {
  const getColors = () => {
    switch (variant) {
      case 'success':
        return { bg: '#064E3B', border: '#059669', text: '#34D399' };
      case 'warning':
        return { bg: '#78350F', border: '#D97706', text: '#FBBF24' };
      case 'danger':
        return { bg: '#7F1D1D', border: '#DC2626', text: '#F87171' };
      case 'purple':
        return { bg: '#3B0764', border: '#7C3AED', text: '#C084FC' };
      case 'neutral':
        return { bg: '#334155', border: '#475569', text: '#CBD5E1' };
      case 'info':
      default:
        return { bg: '#0C4A6E', border: '#0284C7', text: '#38BDF8' };
    }
  };

  const colors = getColors();

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: colors.bg,
          borderColor: colors.border,
          paddingHorizontal: size === 'small' ? 7 : 10,
          paddingVertical: size === 'small' ? 2 : 4,
        },
      ]}
    >
      {icon && <View style={{ marginRight: 4 }}>{icon}</View>}
      <Text
        style={[
          styles.badgeText,
          {
            color: colors.text,
            fontSize: size === 'small' ? 10 : 12,
          },
        ]}
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 6,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
