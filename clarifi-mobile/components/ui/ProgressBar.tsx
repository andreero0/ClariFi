import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../../constants/colors';

export interface ProgressBarProps {
  progress: number; // A value between 0 and 1
  height?: number;
  backgroundColor?: string;
  progressColor?: string;
  borderRadius?: number;
  style?: ViewStyle; // Style for the container
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  height = 8,
  backgroundColor = colors.neutral.light,
  progressColor = colors.primary,
  borderRadius = 4,
  style,
}) => {
  const clampedProgress = Math.max(0, Math.min(1, progress)); // Ensure progress is between 0 and 1

  return (
    <View
      style={[
        styles.container,
        { height, backgroundColor, borderRadius },
        style,
      ]}
    >
      <View
        style={[
          styles.progressBar,
          {
            width: `${clampedProgress * 100}%`,
            backgroundColor: progressColor,
            borderRadius,
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden', // Ensures the inner bar respects the container's borderRadius
    width: '100%',
  },
  progressBar: {
    height: '100%',
  },
});

export default ProgressBar;
