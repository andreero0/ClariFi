import React, { memo, useCallback, useMemo } from 'react';
import {
  FlatList,
  ListRenderItem,
  StyleSheet,
  RefreshControl,
  ViewStyle,
} from 'react-native';
import { Transaction } from '../../services/storage/dataModels';
import OptimizedTransactionItem from './OptimizedTransactionItem';
import { colors } from '../../constants/colors';

interface OptimizedTransactionListProps {
  transactions: Transaction[];
  selectedTransactions: Set<string>;
  isSelectionMode: boolean;
  refreshing: boolean;
  onRefresh: () => void;
  onTransactionPress: (transaction: Transaction) => void;
  onTransactionLongPress: (transaction: Transaction) => void;
  onToggleSelection: (transactionId: string) => void;
  ListHeaderComponent?: React.ComponentType<any> | React.ReactElement | null;
  ListEmptyComponent?: React.ComponentType<any> | React.ReactElement | null;
  contentContainerStyle?: ViewStyle;
}

// Performance-optimized transaction list with virtual scrolling
const OptimizedTransactionList = memo<OptimizedTransactionListProps>(
  ({
    transactions,
    selectedTransactions,
    isSelectionMode,
    refreshing,
    onRefresh,
    onTransactionPress,
    onTransactionLongPress,
    onToggleSelection,
    ListHeaderComponent,
    ListEmptyComponent,
    contentContainerStyle,
  }) => {
    // Optimized item height calculation for better scrolling performance
    const getItemLayout = useCallback(
      (data: any, index: number) => ({
        length: ITEM_HEIGHT,
        offset: ITEM_HEIGHT * index,
        index,
      }),
      []
    );

    // Memoized key extractor to prevent re-computation
    const keyExtractor = useCallback((item: Transaction) => item.id, []);

    // Memoized render item with performance optimizations
    const renderItem: ListRenderItem<Transaction> = useCallback(
      ({ item }) => {
        const isSelected = selectedTransactions.has(item.id);

        return (
          <OptimizedTransactionItem
            transaction={item}
            isSelected={isSelected}
            isSelectionMode={isSelectionMode}
            onPress={() => onTransactionPress(item)}
            onLongPress={() => onTransactionLongPress(item)}
            onToggleSelection={() => onToggleSelection(item.id)}
          />
        );
      },
      [
        selectedTransactions,
        isSelectionMode,
        onTransactionPress,
        onTransactionLongPress,
        onToggleSelection,
      ]
    );

    // Memoized refresh control to prevent re-creation
    const refreshControl = useMemo(
      () => (
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.primary}
          colors={[colors.primary]}
        />
      ),
      [refreshing, onRefresh]
    );

    return (
      <FlatList
        data={transactions}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        getItemLayout={getItemLayout}
        ListHeaderComponent={ListHeaderComponent}
        ListEmptyComponent={ListEmptyComponent}
        refreshControl={refreshControl}
        contentContainerStyle={contentContainerStyle}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={true} // Improve memory usage
        maxToRenderPerBatch={10} // Optimize initial render
        updateCellsBatchingPeriod={50} // Reduce re-render frequency
        windowSize={10} // Optimize virtual window size
        initialNumToRender={15} // Optimize initial render count
        style={styles.list}
      />
    );
  }
);

// Estimated item height for getItemLayout optimization
const ITEM_HEIGHT = 80;

const styles = StyleSheet.create({
  list: {
    flex: 1,
    backgroundColor: colors.backgroundPrimary,
  },
});

OptimizedTransactionList.displayName = 'OptimizedTransactionList';

export default OptimizedTransactionList;
