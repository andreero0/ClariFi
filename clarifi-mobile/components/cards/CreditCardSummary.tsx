import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import {
  formatCreditLimit,
  getUtilizationStatus,
  getUtilizationColor,
} from '../../types/creditCard';

interface CreditCardSummaryProps {
  totalCreditLimit: number;
  totalUtilization: number;
  averageUtilization: number;
  cardCount: number;
}

export const CreditCardSummary: React.FC<CreditCardSummaryProps> = ({
  totalCreditLimit,
  totalUtilization,
  averageUtilization,
  cardCount,
}) => {
  const utilizationStatus = getUtilizationStatus(totalUtilization);
  const utilizationColor = getUtilizationColor(utilizationStatus);
  const averageUtilizationStatus = getUtilizationStatus(averageUtilization);
  const averageUtilizationColor = getUtilizationColor(averageUtilizationStatus);

  const getCreditHealthMessage = () => {
    if (totalUtilization <= 10) {
      return 'Excellent credit utilization! Keep it up.';
    } else if (totalUtilization <= 30) {
      return 'Good credit management. Consider paying down balances.';
    } else if (totalUtilization <= 50) {
      return 'Moderate utilization. Work on reducing balances.';
    } else if (totalUtilization <= 80) {
      return 'High utilization may hurt your credit score.';
    } else {
      return 'Critical utilization! Pay down balances immediately.';
    }
  };

  const getRecommendation = () => {
    if (totalUtilization > 30) {
      const targetReduction =
        ((totalUtilization - 30) / 100) * totalCreditLimit;
      return `Consider paying down ${formatCreditLimit(targetReduction)} to improve your credit score.`;
    } else if (cardCount === 1) {
      return 'Consider adding another card to increase available credit and lower utilization.';
    } else if (totalUtilization < 5) {
      return 'Great job! Your low utilization helps maintain an excellent credit score.';
    }
    return 'Maintain current payment habits to keep your credit healthy.';
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Credit Overview</Text>
        <Text style={styles.subtitle}>
          {cardCount} card{cardCount !== 1 ? 's' : ''} •{' '}
          {formatCreditLimit(totalCreditLimit)} total limit
        </Text>
      </View>

      {/* Main utilization display */}
      <View style={styles.mainMetric}>
        <View style={styles.utilizationCircle}>
          <Text
            style={[styles.utilizationPercentage, { color: utilizationColor }]}
          >
            {totalUtilization.toFixed(0)}%
          </Text>
          <Text style={styles.utilizationLabel}>Total Utilization</Text>
        </View>

        <View style={styles.utilizationBar}>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${Math.min(totalUtilization, 100)}%`,
                  backgroundColor: utilizationColor,
                },
              ]}
            />
          </View>

          {/* Utilization markers */}
          <View style={styles.markers}>
            <View style={[styles.marker, { left: '30%' }]}>
              <Text style={styles.markerText}>30%</Text>
            </View>
            <View style={[styles.marker, { left: '80%' }]}>
              <Text style={styles.markerText}>80%</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Secondary metrics */}
      <View style={styles.secondaryMetrics}>
        <View style={styles.metric}>
          <Text style={styles.metricValue}>
            {averageUtilization.toFixed(0)}%
          </Text>
          <Text style={styles.metricLabel}>Avg per Card</Text>
          <View
            style={[
              styles.statusDot,
              { backgroundColor: averageUtilizationColor },
            ]}
          />
        </View>

        <View style={styles.metric}>
          <Text style={styles.metricValue}>
            {formatCreditLimit(totalCreditLimit * (1 - totalUtilization / 100))}
          </Text>
          <Text style={styles.metricLabel}>Available Credit</Text>
          <View style={[styles.statusDot, { backgroundColor: '#28a745' }]} />
        </View>
      </View>

      {/* Health message */}
      <View
        style={[
          styles.healthMessage,
          { backgroundColor: `${utilizationColor}15` },
        ]}
      >
        <View
          style={[styles.healthIcon, { backgroundColor: utilizationColor }]}
        >
          <Text style={styles.healthIconText}>
            {totalUtilization <= 30 ? '✓' : '!'}
          </Text>
        </View>
        <View style={styles.healthContent}>
          <Text style={[styles.healthTitle, { color: utilizationColor }]}>
            Credit Health
          </Text>
          <Text style={styles.healthDescription}>
            {getCreditHealthMessage()}
          </Text>
        </View>
      </View>

      {/* Recommendation */}
      <View style={styles.recommendation}>
        <Text style={styles.recommendationTitle}>💡 Recommendation</Text>
        <Text style={styles.recommendationText}>{getRecommendation()}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    margin: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6c757d',
  },
  mainMetric: {
    alignItems: 'center',
    marginBottom: 24,
  },
  utilizationCircle: {
    alignItems: 'center',
    marginBottom: 16,
  },
  utilizationPercentage: {
    fontSize: 36,
    fontWeight: '800',
    lineHeight: 42,
  },
  utilizationLabel: {
    fontSize: 14,
    color: '#6c757d',
    fontWeight: '500',
  },
  utilizationBar: {
    width: '100%',
    position: 'relative',
  },
  progressTrack: {
    height: 8,
    backgroundColor: '#e9ecef',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  markers: {
    position: 'relative',
    marginTop: 8,
  },
  marker: {
    position: 'absolute',
    alignItems: 'center',
    transform: [{ translateX: -15 }],
  },
  markerText: {
    fontSize: 10,
    color: '#6c757d',
    fontWeight: '500',
  },
  secondaryMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
    paddingVertical: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
  },
  metric: {
    alignItems: 'center',
    position: 'relative',
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    color: '#6c757d',
    textAlign: 'center',
  },
  statusDot: {
    position: 'absolute',
    top: -4,
    right: -8,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  healthMessage: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  healthIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  healthIconText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  healthContent: {
    flex: 1,
  },
  healthTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  healthDescription: {
    fontSize: 13,
    color: '#495057',
    lineHeight: 18,
  },
  recommendation: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  recommendationTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 6,
  },
  recommendationText: {
    fontSize: 13,
    color: '#495057',
    lineHeight: 18,
  },
});
