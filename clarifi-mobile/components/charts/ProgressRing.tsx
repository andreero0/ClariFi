import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// Placeholder for ProgressRing component
// Consider using react-native-svg for a custom implementation or a library

interface ProgressRingProps {
  progress: number; // Value between 0 and 1
  radius?: number;
  strokeWidth?: number;
  color?: string;
  label?: string;
}

const ProgressRing: React.FC<ProgressRingProps> = ({
  progress,
  radius = 50,
  strokeWidth = 10,
  color = '#007AFF',
  label,
}) => {
  const clampedProgress = Math.max(0, Math.min(1, progress));

  return (
    <View style={styles.container}>
      <View
        style={{
          width: radius * 2,
          height: radius * 2,
          borderRadius: radius,
          borderWidth: strokeWidth,
          borderColor: '#e0e0e0',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* This is a very simplified visual representation */}
        <View
          style={{
            width: radius * 2 - strokeWidth * 2,
            height: radius * 2 - strokeWidth * 2,
            borderRadius: radius - strokeWidth,
            backgroundColor: color,
            transform: [{ scale: clampedProgress }], // Simplistic progress
          }}
        />
        <Text
          style={styles.progressText}
        >{`${(clampedProgress * 100).toFixed(0)}%`}</Text>
      </View>
      {label && <Text style={styles.labelText}>{label}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 10,
  },
  progressText: {
    position: 'absolute',
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  labelText: {
    marginTop: 8,
    fontSize: 14,
    color: '#555',
  },
});

export default ProgressRing;
