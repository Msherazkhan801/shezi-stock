import React from 'react';
import { Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LucideIcon } from 'lucide-react-native';

interface ActionButtonProps {
  label: string;
  icon: LucideIcon;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  accentColor?: string;
  style?: any;
}

export const ActionButton: React.FC<ActionButtonProps> = ({
  label,
  icon: Icon,
  onPress,
  variant = 'secondary',
  accentColor = '#0284C7',
  style,
}) => {
  const isPrimary = variant === 'primary';
  const isOutline = variant === 'outline';

  return (
    <TouchableOpacity
      style={[
        styles.btn,
        isPrimary && { backgroundColor: accentColor, borderColor: accentColor },
        isOutline && styles.btnOutline,
        style,
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Icon
        size={18}
        color={isPrimary ? '#FFFFFF' : isOutline ? '#38BDF8' : '#F8FAFC'}
      />
      <Text
        style={[
          styles.text,
          isPrimary && { color: '#FFFFFF' },
          isOutline && { color: '#38BDF8' },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  btn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E293B',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 2,
  },
  btnOutline: {
    backgroundColor: '#0F172A',
    borderColor: '#38BDF840',
  },
  text: {
    fontSize: 13,
    fontWeight: '800',
    color: '#F8FAFC',
  },
});
