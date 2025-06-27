import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface CategoryStatsProps {
  totalCategories: number;
  customCategories: number;
  incomeCategories: number;
  expenseCategories: number;
}

export const CategoryStats: React.FC<CategoryStatsProps> = ({
  totalCategories,
  customCategories,
  incomeCategories,
  expenseCategories,
}) => {
  const defaultCategories = totalCategories - customCategories;

  return (
    <View style={styles.container}>
      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{totalCategories}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>

        <View style={styles.statItem}>
          <Text style={styles.statValue}>{incomeCategories}</Text>
          <Text style={styles.statLabel}>Income</Text>
        </View>

        <View style={styles.statItem}>
          <Text style={styles.statValue}>{expenseCategories}</Text>
          <Text style={styles.statLabel}>Expenses</Text>
        </View>

        <View style={styles.statItem}>
          <Text style={styles.statValue}>{customCategories}</Text>
          <Text style={styles.statLabel}>Custom</Text>
        </View>
      </View>

      <View style={styles.breakdown}>
        <View style={styles.breakdownItem}>
          <View style={[styles.breakdownDot, styles.defaultDot]} />
          <Text style={styles.breakdownText}>
            {defaultCategories} Default categories
          </Text>
        </View>

        <View style={styles.breakdownItem}>
          <View style={[styles.breakdownDot, styles.customDot]} />
          <Text style={styles.breakdownText}>
            {customCategories} Custom categories
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6c757d',
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  breakdown: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#dee2e6',
  },
  breakdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  breakdownDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  defaultDot: {
    backgroundColor: '#007AFF',
  },
  customDot: {
    backgroundColor: '#28a745',
  },
  breakdownText: {
    fontSize: 12,
    color: '#6c757d',
    fontWeight: '500',
  },
});
