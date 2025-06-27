import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';

interface DividerProps {
  color?: string;
  thickness?: number;
  style?: ViewStyle; // For additional styling like margins
  vertical?: boolean; // Add support for vertical dividers
  length?: number | string; // Length if vertical, defaults to 100%
}

const Divider: React.FC<DividerProps> = ({
  color = colors.neutral.light,
  thickness = 1,
  style,
  vertical = false,
  length = '100%',
}) => {
  const dividerStyle: ViewStyle = vertical
    ? {
        width: thickness,
        height: length,
        backgroundColor: color,
        marginHorizontal: spacing.sm, // Default margin for vertical dividers
      }
    : {
        height: thickness,
        width: '100%',
        backgroundColor: color,
        marginVertical: spacing.md, // Default margin for horizontal dividers
      };

  return <View style={[dividerStyle, style]} />;
};

export default Divider;
