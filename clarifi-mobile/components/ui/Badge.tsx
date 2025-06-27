import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface BadgeProps {
  variant?: 'success' | 'error' | 'warning' | 'neutral';
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'neutral',
  icon,
  children,
}) => {
  const variantStyles = {
    success: {
      backgroundColor: '#DCFCE7',
      textColor: '#166534',
      borderColor: '#BBF7D0',
    },
    error: {
      backgroundColor: '#FEE2E2',
      textColor: '#991B1B',
      borderColor: '#FECACA',
    },
    warning: {
      backgroundColor: '#FEF3C7',
      textColor: '#92400E',
      borderColor: '#FDE68A',
    },
    neutral: {
      backgroundColor: '#F3F4F6',
      textColor: '#374151',
      borderColor: '#E5E7EB',
    },
  };

  const style = variantStyles[variant];

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: style.backgroundColor,
          borderColor: style.borderColor,
        },
      ]}
    >
      {icon && <View style={styles.icon}>{icon}</View>}
      <Text style={[styles.text, { color: style.textColor }]}>
        {children}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  icon: {
    marginRight: 4,
  },
  text: {
    fontSize: 12,
    fontWeight: '500',
  },
});