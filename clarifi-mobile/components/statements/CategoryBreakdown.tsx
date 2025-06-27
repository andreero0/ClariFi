import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import PieChart from '../charts/PieChart'; // Assuming PieChart component exists
import Card from '../ui/Card';

export interface CategorySpending {
  id: string;
  name: string;
  spent: number;
  color: string; // For the chart
  transaction_count: number;
}

interface CategoryBreakdownProps {
  spendingData: CategorySpending[];
  totalSpent: number;
  title?: string;
}

const CategoryBreakdown: React.FC<CategoryBreakdownProps> = ({
  spendingData,
  totalSpent,
  title = 'Spending by Category',
}) => {
  const chartData = spendingData.map(cat => ({
    name: cat.name,
    value: cat.spent,
    color: cat.color,
  }));

  return (
    <Card style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {spendingData && spendingData.length > 0 ? (
        <>
          <PieChart data={chartData} />
          <FlatList
            data={spendingData}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <View style={styles.categoryItem}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View
                    style={[
                      styles.colorIndicator,
                      { backgroundColor: item.color },
                    ]}
                  />
                  <Text style={styles.categoryName}>
                    {item.name} ({item.transaction_count})
                  </Text>
                </View>
                <Text style={styles.categoryAmount}>
                  ${item.spent.toFixed(2)} (
                  {((item.spent / totalSpent) * 100).toFixed(1)}%)
                </Text>
              </View>
            )}
            style={styles.list}
          />
        </>
      ) : (
        <Text style={styles.noDataText}>
          No spending data available to display categories.
        </Text>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  list: {
    marginTop: 16,
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  colorIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  categoryName: {
    fontSize: 15,
    color: '#333',
  },
  categoryAmount: {
    fontSize: 15,
    fontWeight: '500',
    color: '#555',
  },
  noDataText: {
    fontSize: 15,
    color: '#757575',
    textAlign: 'center',
    paddingVertical: 20,
  },
});

export default CategoryBreakdown;
