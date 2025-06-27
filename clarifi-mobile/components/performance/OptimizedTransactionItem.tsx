import React, { memo, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Transaction } from '../../services/storage/dataModels';
import { formatCurrency } from '../../utils/formatting/currency';
import { colors } from '../../constants/colors';
import { textStyles } from '../../constants/typography';

interface OptimizedTransactionItemProps {
  transaction: Transaction;
  isSelected: boolean;
  isSelectionMode: boolean;
  onPress: () => void;
  onLongPress: () => void;
  onToggleSelection: () => void;
}

// Optimized transaction item with React.memo and callbacks
const OptimizedTransactionItem = memo<OptimizedTransactionItemProps>(
  ({
    transaction,
    isSelected,
    isSelectionMode,
    onPress,
    onLongPress,
    onToggleSelection,
  }) => {
    // Memoized formatters to prevent re-computation
    const formattedAmount = React.useMemo(
      () => formatCurrency(transaction.amount),
      [transaction.amount]
    );

    const formattedDate = React.useMemo(
      () => new Date(transaction.date).toLocaleDateString(),
      [transaction.date]
    );

    const amountColor = React.useMemo(
      () => (transaction.amount >= 0 ? colors.success : colors.error),
      [transaction.amount]
    );

    // Memoized styles based on selection state
    const containerStyle = React.useMemo(
      () => [styles.container, isSelected && styles.selectedContainer],
      [isSelected]
    );

    return (
      <TouchableOpacity
        style={containerStyle}
        onPress={onPress}
        onLongPress={onLongPress}
        activeOpacity={0.7}
      >
        {isSelectionMode && (
          <TouchableOpacity
            style={[styles.checkbox, isSelected && styles.checkedCheckbox]}
            onPress={onToggleSelection}
          >
            {isSelected && <Text style={styles.checkmark}>✓</Text>}
          </TouchableOpacity>
        )}

        <View style={styles.content}>
          <View style={styles.leftSection}>
            <Text style={styles.description} numberOfLines={1}>
              {transaction.description}
            </Text>
            <Text style={styles.merchant} numberOfLines={1}>
              {transaction.merchant_name || 'Unknown Merchant'}
            </Text>
            <Text style={styles.date}>{formattedDate}</Text>
          </View>

          <View style={styles.rightSection}>
            <Text style={[styles.amount, { color: amountColor }]}>
              {formattedAmount}
            </Text>
            {transaction.category_name && (
              <Text style={styles.category} numberOfLines={1}>
                {transaction.category_name}
              </Text>
            )}
            {transaction.user_verified && (
              <Text style={styles.verified}>✓ Verified</Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison function for memo optimization
    return (
      prevProps.transaction.id === nextProps.transaction.id &&
      prevProps.transaction.amount === nextProps.transaction.amount &&
      prevProps.transaction.description === nextProps.transaction.description &&
      prevProps.transaction.date === nextProps.transaction.date &&
      prevProps.transaction.merchant_name ===
        nextProps.transaction.merchant_name &&
      prevProps.transaction.category_name ===
        nextProps.transaction.category_name &&
      prevProps.transaction.user_verified ===
        nextProps.transaction.user_verified &&
      prevProps.isSelected === nextProps.isSelected &&
      prevProps.isSelectionMode === nextProps.isSelectionMode
    );
  }
);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    marginHorizontal: 16,
    marginVertical: 4,
    padding: 16,
    borderRadius: 12,
    shadowColor: colors.textPrimary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  selectedContainer: {
    backgroundColor: colors.primary + '10',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.neutral.medium,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkedCheckbox: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkmark: {
    color: colors.surface,
    fontSize: 12,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  leftSection: {
    flex: 1,
    marginRight: 16,
  },
  rightSection: {
    alignItems: 'flex-end',
    minWidth: 100,
  },
  description: {
    ...textStyles.bodyRegular,
    color: colors.textPrimary,
    fontWeight: '600',
    marginBottom: 4,
  },
  merchant: {
    ...textStyles.bodySmall,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  date: {
    ...textStyles.caption,
    color: colors.textSecondary,
  },
  amount: {
    ...textStyles.bodyRegular,
    fontWeight: '700',
    marginBottom: 4,
  },
  category: {
    ...textStyles.caption,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  verified: {
    ...textStyles.caption,
    color: colors.success,
    fontWeight: '500',
  },
});

OptimizedTransactionItem.displayName = 'OptimizedTransactionItem';

export default OptimizedTransactionItem;
