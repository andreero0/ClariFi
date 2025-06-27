import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  TextStyle,
  TextInputProps,
  AccessibilityProps,
} from 'react-native';
import { type LucideIcon, Eye, EyeOff } from 'lucide-react-native'; // Corrected import for LucideIcon type
import { textStyles } from '../../constants/typography'; // Corrected import for textStyles
import { spacing } from '../../constants/spacing';
import Icon from './Icon';
import { useTheme } from '../../context/ThemeContext';

export interface InputProps extends TextInputProps, AccessibilityProps {
  label?: string;
  error?: string;
  leftIcon?: LucideIcon; // Use LucideIcon type
  rightIcon?: LucideIcon; // Use LucideIcon type
  onRightIconPress?: () => void;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  labelStyle?: TextStyle;
  errorStyle?: TextStyle;
  disabled?: boolean;
  // accessibilityLabel will come from AccessibilityProps or be derived from label
  // accessibilityHint will come from AccessibilityProps
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  leftIcon,
  rightIcon,
  onRightIconPress,
  containerStyle,
  inputStyle: customInputStyle,
  labelStyle: customLabelStyle,
  errorStyle: customErrorStyle,
  disabled = false,
  secureTextEntry,
  accessibilityLabel, // Explicitly get accessibilityLabel
  accessibilityHint,
  ...props
}) => {
  const { theme } = useTheme(); // Use theme from context
  const [isFocused, setIsFocused] = useState(false);
  const [isSecureTextVisible, setIsSecureTextVisible] =
    useState(!secureTextEntry);

  const handleFocus = () => setIsFocused(true);
  const handleBlur = () => setIsFocused(false);

  const toggleSecureTextVisibility = () => {
    if (onRightIconPress) {
      onRightIconPress();
    } else {
      setIsSecureTextVisible(!isSecureTextVisible);
    }
  };

  const finalAccessibilityLabel = accessibilityLabel || label; // Use explicit or derived label

  const borderColor = error
    ? theme.error
    : isFocused
      ? theme.primary
      : disabled
        ? theme.neutral.light
        : theme.neutral.medium;

  const inputContainerStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: spacing.sm,
    borderColor: borderColor,
    backgroundColor: disabled
      ? theme.neutral.lighter
      : theme.backgroundSecondary,
    minHeight: 52, // Increased height to accommodate text properly
  };

  const textInputStyle: TextStyle = {
    ...(textStyles.bodyRegular || {}), // Corrected to use textStyles
    flex: 1,
    paddingVertical: spacing.md, // Increased padding to prevent text cutoff
    color: disabled ? theme.textDisabled : theme.textPrimary,
    marginLeft: leftIcon ? spacing.sm : 0,
    marginRight: rightIcon || secureTextEntry ? spacing.sm : 0,
    lineHeight: 20, // Explicit line height to prevent clipping
    includeFontPadding: false, // Android: Remove extra font padding
    textAlignVertical: 'center', // Ensure proper vertical alignment
  };

  const finalLabelStyle: TextStyle = {
    ...(textStyles.caption || {}), // Corrected to use textStyles
    color: theme.textSecondary,
    marginBottom: spacing.xs,
    ...(customLabelStyle as object),
  };

  const finalErrorStyle: TextStyle = {
    ...(textStyles.caption || {}), // Corrected to use textStyles
    color: theme.error,
    marginTop: spacing.xs,
    ...(customErrorStyle as object),
  };

  const iconColor = disabled ? theme.textDisabled : theme.neutral.dark;

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={finalLabelStyle}>{label}</Text>}
      <View style={inputContainerStyle}>
        {leftIcon && <Icon name={leftIcon} size={20} color={iconColor} />}
        <TextInput
          style={[textInputStyle, customInputStyle]}
          placeholderTextColor={theme.neutral.medium} // Themed placeholder
          onFocus={handleFocus}
          onBlur={handleBlur}
          editable={!disabled}
          secureTextEntry={secureTextEntry && !isSecureTextVisible}
          accessibilityLabel={finalAccessibilityLabel} // Set accessibilityLabel
          accessibilityHint={accessibilityHint} // Set accessibilityHint
          {...props}
        />
        {secureTextEntry && (
          <TouchableOpacity
            onPress={toggleSecureTextVisibility}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityLabel={
              isSecureTextVisible ? 'Hide password' : 'Show password'
            }
            accessibilityRole="button"
          >
            <Icon
              name={isSecureTextVisible ? EyeOff : Eye}
              size={20}
              color={iconColor}
            />
          </TouchableOpacity>
        )}
        {rightIcon && !secureTextEntry && (
          <TouchableOpacity
            onPress={onRightIconPress}
            disabled={!onRightIconPress}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityRole="button"
          >
            <Icon name={rightIcon} size={20} color={iconColor} />
          </TouchableOpacity>
        )}
      </View>
      {error && (
        <Text style={finalErrorStyle} accessibilityLiveRegion="polite">
          {error}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
});

export default Input;
