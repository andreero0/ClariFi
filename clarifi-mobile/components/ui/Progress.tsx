import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';

interface ProgressProps {
  value: number; // 0-100
  color?: string;
  backgroundColor?: string;
  height?: number;
}

export const Progress: React.FC<ProgressProps> = ({
  value,
  color = '#2563EB',
  backgroundColor = '#E5E7EB',
  height = 8,
}) => {
  const animatedWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animatedWidth, {
      toValue: Math.min(Math.max(value, 0), 100),
      duration: 500,
      useNativeDriver: false,
    }).start();
  }, [value]);

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor,
          height,
          borderRadius: height / 2,
        },
      ]}
    >
      <Animated.View
        style={[
          styles.fill,
          {
            backgroundColor: color,
            height,
            borderRadius: height / 2,
            width: animatedWidth.interpolate({
              inputRange: [0, 100],
              outputRange: ['0%', '100%'],
              extrapolate: 'clamp',
            }),
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    overflow: 'hidden',
  },
  fill: {
    // Animated width will be applied
  },
});