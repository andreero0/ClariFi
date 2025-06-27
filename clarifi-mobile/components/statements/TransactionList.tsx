import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import Card from '../ui/Card';

export interface Transaction {
  id: string;
  date: string; // Consider using Date object, format for display
  description: string;
  amount: number;
  category_id?: string; // Link to a category
  category_name?: string; // Denormalized for display
  is_recurring?: boolean;
  user_verified?: boolean;
  // Add other fields from your spec (Feature 2)
}

interface TransactionListProps {
  transactions: Transaction[];
  onTransactionPress?: (transaction: Transaction) => void;
  ListHeaderComponent?: React.ReactElement | null;
}

const TransactionItem: React.FC<{
  item: Transaction;
  onPress?: (transaction: Transaction) => void;
}> = ({ item, onPress }) => {
  return (
    <TouchableOpacity onPress={() => onPress?.(item)} disabled={!onPress}>
      <Card style={styles.transactionItemContainer}>
        <View style={styles.transactionRow}>
          <Text style={styles.descriptionText} numberOfLines={1}>
            {item.description}
          </Text>
          <Text
            style={[
              styles.amountText,
              item.amount < 0 ? styles.expenseText : styles.incomeText,
            ]}
          >
            {item.amount < 0 ? '-' : ''}${Math.abs(item.amount).toFixed(2)}
          </Text>
        </View>
        <View style={styles.transactionRow}>
          <Text style={styles.dateText}>{item.date}</Text>
          {item.category_name && (
            <Text style={styles.categoryText}>{item.category_name}</Text>
          )}
        </View>
      </Card>
    </TouchableOpacity>
  );
};

const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  onTransactionPress,
  ListHeaderComponent,
}) => {
  if (!transactions || transactions.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No transactions found.</Text>
        <Text style={styles.emptySubText}>
          Import statements or add transactions manually.
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={transactions}
      renderItem={({ item }) => (
        <TransactionItem item={item} onPress={onTransactionPress} />
      )}
      keyExtractor={item => item.id}
      ListHeaderComponent={ListHeaderComponent}
      contentContainerStyle={styles.listContentContainer}
    />
  );
};

const styles = StyleSheet.create({
  transactionItemContainer: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginVertical: 4,
    marginHorizontal: 2, // To allow shadow to show if Card has elevation
  },
  transactionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  descriptionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    flexShrink: 1, // Allow text to shrink if too long
    marginRight: 8,
  },
  amountText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  expenseText: {
    color: '#D32F2F',
  },
  incomeText: {
    color: '#388E3C',
  },
  dateText: {
    fontSize: 13,
    color: '#757575',
  },
  categoryText: {
    fontSize: 13,
    color: '#0277BD',
    fontWeight: '500',
    backgroundColor: '#E1F5FE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden', // For borderRadius on Android
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    color: '#757575',
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: '#9E9E9E',
    textAlign: 'center',
  },
  listContentContainer: {
    paddingVertical: 8,
  },
});

export default TransactionList;
