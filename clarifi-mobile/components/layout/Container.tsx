import React from 'react';
import { View, StyleSheet, ViewProps, ViewStyle } from 'react-native';
import { spacing } from '../../constants/spacing';
import { SIZES } from '../../constants/spacing';

interface ContainerProps extends ViewProps {
  children: React.ReactNode;
  style?: ViewStyle;
  padding?: keyof typeof spacing | number; // Use keys from spacing or a custom number
  paddingHorizontal?: keyof typeof spacing | number;
  paddingVertical?: keyof typeof spacing | number;
  paddingTop?: keyof typeof spacing | number;
  paddingBottom?: keyof typeof spacing | number;
  paddingLeft?: keyof typeof spacing | number;
  paddingRight?: keyof typeof spacing | number;
  margin?: keyof typeof spacing | number;
  flex?: number;
  center?: boolean; // Shortcut for alignItems: center and justifyContent: center
  row?: boolean; // Shortcut for flexDirection: row
}

const Container: React.FC<ContainerProps> = ({
  children,
  style,
  padding = SIZES.padding, // Default padding from SIZES
  paddingHorizontal,
  paddingVertical,
  paddingTop,
  paddingBottom,
  paddingLeft,
  paddingRight,
  margin,
  flex,
  center,
  row,
  ...props
}) => {
  const getSpacingValue = (
    value: keyof typeof spacing | number | undefined
  ): number | undefined => {
    if (typeof value === 'string') {
      return spacing?.[value] ?? undefined;
    }
    return value;
  };

  const containerStyle: ViewStyle = {
    padding: getSpacingValue(padding),
    paddingHorizontal: getSpacingValue(paddingHorizontal),
    paddingVertical: getSpacingValue(paddingVertical),
    paddingTop: getSpacingValue(paddingTop),
    paddingBottom: getSpacingValue(paddingBottom),
    paddingLeft: getSpacingValue(paddingLeft),
    paddingRight: getSpacingValue(paddingRight),
    margin: getSpacingValue(margin),
  };

  if (flex !== undefined) {
    containerStyle.flex = flex;
  }
  if (center) {
    containerStyle.alignItems = 'center';
    containerStyle.justifyContent = 'center';
  }
  if (row) {
    containerStyle.flexDirection = 'row';
  }

  // Remove undefined padding properties to allow default `padding` to take effect
  // or specific paddings to override general padding if they are explicitly set.
  for (const key in containerStyle) {
    if (containerStyle[key as keyof ViewStyle] === undefined) {
      delete containerStyle[key as keyof ViewStyle];
    }
  }
  // If specific paddings (e.g. paddingHorizontal) are set, we might want to unset the general `padding`
  // to avoid double padding or conflicting styles. This logic can be complex.
  // For simplicity, if more specific padding is used, general padding should ideally not be set by default,
  // or a more sophisticated style merging logic is needed.
  // Current approach: general padding is default, specific ones can be added.

  return (
    <View style={[styles.base, containerStyle, style]} {...props}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    // Default base styles for a container if any
    // For example, `flex: 1` could be a default if containers always fill space,
    // but that's too presumptive. Let's keep it minimal.
  },
});

export default Container;
