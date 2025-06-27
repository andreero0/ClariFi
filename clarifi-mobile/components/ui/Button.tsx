import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'neutral-tertiary';
  size?: 'small' | 'medium' | 'large';
  children: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  style?: ViewStyle;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'medium',
  children,
  onPress,
  disabled = false,
  style,
}) => {
  const sizeStyles = {
    small: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      fontSize: 13,
    },
    medium: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      fontSize: 14,
    },
    large: {
      paddingHorizontal: 20,
      paddingVertical: 12,
      fontSize: 16,
    },
  };

  const variantStyles = {
    primary: {
      backgroundColor: '#2563EB',
      textColor: '#FFFFFF',
      borderColor: '#2563EB',
    },
    secondary: {
      backgroundColor: 'transparent',
      textColor: '#2563EB',
      borderColor: '#2563EB',
    },
    'neutral-tertiary': {
      backgroundColor: 'transparent',
      textColor: '#6B7280',
      borderColor: 'transparent',
    },
  };

  // Safely get styles with fallbacks
  const buttonSize = sizeStyles[size] || sizeStyles.medium;
  const buttonVariant = variantStyles[variant] || variantStyles.primary;

  const buttonStyle: ViewStyle = {
    backgroundColor: disabled ? '#E5E7EB' : buttonVariant?.backgroundColor || '#2563EB',
    borderColor: disabled ? '#E5E7EB' : buttonVariant?.borderColor || '#2563EB',
    paddingHorizontal: buttonSize?.paddingHorizontal || 16,
    paddingVertical: buttonSize?.paddingVertical || 8,
  };

  const textStyle: TextStyle = {
    color: disabled ? '#9CA3AF' : buttonVariant?.textColor || '#FFFFFF',
    fontSize: buttonSize?.fontSize || 14,
  };

  return (
    <TouchableOpacity
      style={[styles.button, buttonStyle, style]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <Text style={[styles.text, textStyle]}>
        {children}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  text: {
    fontWeight: '500',
  },
});