import React from 'react';
import { View, StyleSheet } from 'react-native';

interface IconWithBackgroundProps {
  icon: React.ReactNode;
  variant?: 'default' | 'success' | 'error' | 'warning' | 'brand';
  size?: 'small' | 'medium' | 'large';
}

export const IconWithBackground: React.FC<IconWithBackgroundProps> = ({
  icon,
  variant = 'default',
  size = 'medium',
}) => {
  const sizeStyles = {
    small: { width: 32, height: 32 },
    medium: { width: 40, height: 40 },
    large: { width: 48, height: 48 },
  };

  const variantStyles = {
    default: {
      backgroundColor: '#F3F4F6',
      iconColor: '#6B7280',
    },
    success: {
      backgroundColor: '#DCFCE7',
      iconColor: '#166534',
    },
    error: {
      backgroundColor: '#FEE2E2',
      iconColor: '#991B1B',
    },
    warning: {
      backgroundColor: '#FEF3C7',
      iconColor: '#92400E',
    },
    brand: {
      backgroundColor: '#DBEAFE',
      iconColor: '#1D4ED8',
    },
  };

  const containerSize = sizeStyles[size];
  const style = variantStyles[variant];

  return (
    <View
      style={[
        styles.container,
        containerSize,
        {
          backgroundColor: style.backgroundColor,
        },
      ]}
    >
      {React.isValidElement(icon) && 
        React.cloneElement(icon, {
          color: style.iconColor,
          size: size === 'small' ? 16 : size === 'large' ? 24 : 20,
        })
      }
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
});