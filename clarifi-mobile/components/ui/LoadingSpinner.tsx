import React from 'react';
import {
  ActivityIndicator,
  ActivityIndicatorProps,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { colors } from '../../constants/colors';

export interface LoadingSpinnerProps extends ActivityIndicatorProps {
  size?: 'small' | 'large' | number; // number for custom size on Android
  color?: string;
  style?: ViewStyle; // Style for a potential container view
  isLoading?: boolean; // Control visibility directly
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'large',
  color = colors.primary,
  style,
  isLoading = true,
  ...props
}) => {
  if (!isLoading) {
    return null;
  }

  return (
    <View style={[styles.container, style]}>
      <ActivityIndicator size={size} color={color} {...props} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    // Default styling, e.g. if it needs to take full screen or specific padding
    // For now, it's minimal and relies on parent layout or passed style.
  },
});

export default LoadingSpinner;
