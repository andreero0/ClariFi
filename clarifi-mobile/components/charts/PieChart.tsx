import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// This is a placeholder. You would use a library like react-native-svg for actual charts
// or a dedicated charting library like victory-native or react-native-chart-kit.

interface PieChartDataItem {
  name: string;
  value: number;
  color: string;
}

interface PieChartProps {
  data: PieChartDataItem[];
  title?: string;
}

const PieChart: React.FC<PieChartProps> = ({ data, title }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <View style={styles.container}>
      {title && <Text style={styles.title}>{title}</Text>}
      <View style={styles.chartContainer}>
        {/* Actual pie chart rendering would go here */}
        <Text style={styles.placeholderText}>Pie Chart Placeholder</Text>
      </View>
      <View style={styles.legendContainer}>
        {data.map(item => (
          <View key={item.name} style={styles.legendItem}>
            <View
              style={[styles.legendColor, { backgroundColor: item.color }]}
            />
            <Text style={styles.legendText}>
              {item.name}:{' '}
              {total > 0 ? ((item.value / total) * 100).toFixed(1) : '0.0'}% (
              {item.value})
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 8,
    marginVertical: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  chartContainer: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  placeholderText: {
    color: '#757575',
  },
  legendContainer: {
    width: '100%',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendText: {
    fontSize: 14,
  },
});

export default PieChart;
