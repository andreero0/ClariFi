import React from 'react';
import { View, ViewStyle } from 'react-native';
import { spacing } from '../../constants/spacing';

interface SpacerProps {
  size?: keyof typeof spacing | number;
  horizontal?: boolean;
  flex?: number; // Add flex property to allow spacer to expand
  style?: ViewStyle;
}

const Spacer: React.FC<SpacerProps> = ({
  size = 'md', // Default to medium spacing
  horizontal = false,
  flex,
  style,
}) => {
  const getSpacingValue = (value: keyof typeof spacing | number): number => {
    if (typeof value === 'string') {
      return spacing?.[value] ?? 16; // Default fallback value
    }
    return value;
  };

  const spaceSize = getSpacingValue(size);

  const spacerStyle: ViewStyle = horizontal
    ? { width: spaceSize }
    : { height: spaceSize };

  if (flex !== undefined) {
    spacerStyle.flex = flex;
  }

  return <View style={[spacerStyle, style]} />;
};

export default Spacer;
