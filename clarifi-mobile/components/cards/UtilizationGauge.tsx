import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface UtilizationGaugeProps {
  utilization: number; // Percentage value (0-100)
  creditLimit?: number;
  currentBalance?: number;
  size?: number;
  showText?: boolean;
  showPercentage?: boolean;
  strokeWidth?: number;
}

const UtilizationGauge: React.FC<UtilizationGaugeProps> = ({
  utilization,
  creditLimit = 0,
  currentBalance = 0,
  size = 120,
  showText = true,
  showPercentage = true,
  strokeWidth = 8,
}) => {
  // PRD-compliant color scheme for utilization levels
  const getUtilizationColor = (utilization: number) => {
    if (utilization >= 80) return '#E53E3E'; // PRD Error - Critical
    if (utilization >= 50) return '#F6AD55'; // PRD Warning - Fair/Poor
    if (utilization >= 30) return '#2B5CE6'; // PRD Clarity Blue - Good
    return '#00C896'; // PRD Growth Green - Excellent
  };

  const getUtilizationStatus = (utilization: number) => {
    if (utilization >= 80) return 'Critical';
    if (utilization >= 50) return 'High';
    if (utilization >= 30) return 'Good';
    return 'Excellent';
  };

  const color = getUtilizationColor(utilization);
  const status = getUtilizationStatus(utilization);
  const clampedUtilization = Math.min(utilization, 100);

  // Calculate circumference for SVG-like circular progress
  const radius = (size - 20) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = circumference;
  const strokeDashoffset =
    circumference - (clampedUtilization / 100) * circumference;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Circular Progress Background */}
      <View style={[styles.circularProgress, { width: size, height: size }]}>
        <View
          style={[
            styles.progressBackground,
            {
              width: size - 20,
              height: size - 20,
              borderRadius: (size - 20) / 2,
              borderWidth: strokeWidth,
              borderColor: 'rgba(255,255,255,0.3)', // Light background for visibility
            },
          ]}
        />

        {/* Progress Fill using multiple arcs to simulate circular progress */}
        <View
          style={[
            styles.progressFill,
            {
              width: size - 20,
              height: size - 20,
              borderRadius: (size - 20) / 2,
              borderWidth: strokeWidth,
              borderColor: color,
              borderTopColor: clampedUtilization >= 25 ? color : 'rgba(255,255,255,0.3)',
              borderRightColor: clampedUtilization >= 50 ? color : 'rgba(255,255,255,0.3)',
              borderBottomColor: clampedUtilization >= 75 ? color : 'rgba(255,255,255,0.3)',
              borderLeftColor: clampedUtilization >= 100 ? color : 'rgba(255,255,255,0.3)',
              transform: [{ rotate: '-90deg' }], // Start from top
            },
          ]}
        />
      </View>

      {/* Center Content */}
      {showText && (
        <View style={styles.centerContent}>
          {showPercentage && (
            <Text style={[styles.utilizationText, { color: '#FFFFFF' }]}>
              {clampedUtilization.toFixed(0)}%
            </Text>
          )}
          <Text style={styles.statusText}>{status}</Text>
          {creditLimit > 0 && currentBalance > 0 && (
            <Text style={styles.balanceText}>
              ${currentBalance.toLocaleString()} / ${creditLimit.toLocaleString()}
            </Text>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
    position: 'relative',
  },
  circularProgress: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressBackground: {
    position: 'absolute',
  },
  progressFill: {
    position: 'absolute',
  },
  centerContent: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  utilizationText: {
    fontSize: 20,
    fontWeight: '700', // PRD Bold
    textAlign: 'center',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500', // PRD Medium
    color: '#4A5568', // PRD Neutral Gray
    textAlign: 'center',
    marginTop: 2,
  },
  balanceText: {
    fontSize: 10,
    color: '#718096', // PRD Neutral Gray Secondary
    textAlign: 'center',
    marginTop: 2,
  },
});

export default UtilizationGauge;
export { UtilizationGauge };
