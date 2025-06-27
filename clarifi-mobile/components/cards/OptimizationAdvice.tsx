import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Card from '../ui/Card';
import CustomButton from '../ui/Button';

interface OptimizationAdviceProps {
  advice: {
    title: string;
    description: string;
    estimatedScoreImpact?: number;
    estimatedInterestSavings?: number;
  };
  onAction?: () => void;
}

const OptimizationAdvice: React.FC<OptimizationAdviceProps> = ({
  advice,
  onAction,
}) => {
  return (
    <Card style={styles.container}>
      <Text style={styles.title}>{advice.title}</Text>
      <Text style={styles.description}>{advice.description}</Text>
      {advice.estimatedScoreImpact && (
        <Text style={styles.impactText}>
          Potential Score Impact: +{advice.estimatedScoreImpact} points
        </Text>
      )}
      {advice.estimatedInterestSavings && (
        <Text style={styles.savingsText}>
          Est. Interest Savings: ${advice.estimatedInterestSavings.toFixed(2)}
          /month
        </Text>
      )}
      {onAction && (
        <CustomButton
          title="Learn More / Take Action"
          onPress={onAction}
          variant="outline"
          buttonStyle={styles.actionButton}
        />
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
    borderColor: '#4CAF50',
    borderLeftWidth: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    color: '#555',
    marginBottom: 10,
  },
  impactText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2E7D32',
    marginBottom: 5,
  },
  savingsText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2E7D32',
    marginBottom: 10,
  },
  actionButton: {
    marginTop: 10,
    borderColor: '#4CAF50',
  },
});

export default OptimizationAdvice;
