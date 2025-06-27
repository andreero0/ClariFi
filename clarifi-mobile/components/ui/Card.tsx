import React, { ReactNode, FC } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  Platform,
  GestureResponderEvent,
  AccessibilityProps,
} from 'react-native';
// import { colors } from '../../constants/colors'; // Removed direct import
import { spacing } from '../../constants/spacing';
import { useTheme } from '../../context/ThemeContext'; // Added useTheme hook

export interface CardProps extends AccessibilityProps {
  children: ReactNode;
  style?: ViewStyle;
  onPress?: (event: GestureResponderEvent) => void;
  disabled?: boolean;
  // Shadow specific props (optional, can be simplified or enhanced)
  shadow?: boolean; // Simpler toggle for default shadow
  shadowColor?: string;
  shadowOpacity?: number;
  shadowRadius?: number;
  shadowOffset?: { width: number; height: number };
  elevation?: number; // For Android
  // accessibilityLabel can be passed via props
  // accessibilityHint can be passed via props
  // accessibilityRole will be set if onPress is present
}

export const Card: FC<CardProps> = ({
  children,
  style,
  onPress,
  disabled = false,
  shadow = true, // Default to having a shadow
  shadowColor: customShadowColor,
  shadowOpacity = 0.08, // Softer default shadow
  shadowRadius = 15, // Softer default shadow
  shadowOffset = { width: 0, height: 5 }, // Default offset
  elevation = 3, // Default Android elevation
  accessibilityLabel,
  accessibilityHint,
  accessibilityRole,
  ...props // Spread other accessibility props
}) => {
  const { theme } = useTheme(); // Use theme from context

  const cardStyle: ViewStyle = {
    backgroundColor: theme.backgroundSecondary, // Use themed background
    borderRadius: 12, // Consistent border radius
    padding: spacing.md, // Consistent padding
  };

  const shadowStyle: ViewStyle = shadow
    ? {
        ...(Platform.OS === 'ios'
          ? {
              shadowColor: customShadowColor || theme.black, // Themed shadow or custom
              shadowOpacity: shadowOpacity,
              shadowRadius: shadowRadius,
              shadowOffset: shadowOffset,
            }
          : {
              elevation: elevation, // Android elevation
            }),
      }
    : {};

  const combinedStyle = StyleSheet.flatten([
    cardStyle,
    shadowStyle,
    style, // User-provided styles override defaults
  ]);

  const finalAccessibilityRole = onPress
    ? accessibilityRole || 'button'
    : accessibilityRole;

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        style={combinedStyle}
        activeOpacity={0.8}
        disabled={disabled}
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        accessibilityRole={finalAccessibilityRole}
        {...props}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View
      style={combinedStyle}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityRole={accessibilityRole}
      {...props}
    >
      {children}
    </View>
  );
};

export default Card;
