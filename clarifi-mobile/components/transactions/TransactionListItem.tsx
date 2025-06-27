import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';
import {
  Check,
  RotateCcw,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  ShoppingBag,
  Car,
  Coffee,
  Home,
  Heart,
  GraduationCap,
  DollarSign,
} from 'lucide-react-native';
import { Transaction } from '../../services/storage/dataModels';
import { formatCurrency } from '../../utils/formatting/currency';
import { formatDate } from '../../utils/formatting/date';
import * as SPACING from '../../constants/spacing';

export interface TransactionListItemProps {
  transaction: Transaction;
  isSelected: boolean;
  isSelectionMode: boolean;
  onPress: () => void;
  onLongPress: () => void;
  onToggleSelection: () => void;
}

export const TransactionListItem: React.FC<TransactionListItemProps> = ({
  transaction,
  isSelected,
  isSelectionMode,
  onPress,
  onLongPress,
  onToggleSelection,
}) => {
  const isExpense = transaction.amount < 0;
  const isUserVerified = transaction.user_verified;

  const handlePress = () => {
    if (isSelectionMode) {
      onToggleSelection();
    } else {
      onPress();
    }
  };

  const getCategoryIcon = (categoryName?: string) => {
    const iconProps = { size: 16, color: '#718096' };
    if (!categoryName) return <DollarSign {...iconProps} />;

    const key = categoryName.toLowerCase();
    switch (key) {
      case 'food':
      case 'dining':
      case 'restaurants':
        return <Coffee {...iconProps} />;
      case 'transport':
      case 'transportation':
        return <Car {...iconProps} />;
      case 'shopping':
        return <ShoppingBag {...iconProps} />;
      case 'entertainment':
        return <Coffee {...iconProps} />;
      case 'bills':
      case 'utilities':
        return <Home {...iconProps} />;
      case 'income':
      case 'salary':
        return <TrendingUp {...iconProps} color="#00C896" />;
      case 'healthcare':
      case 'health':
        return <Heart {...iconProps} />;
      case 'education':
        return <GraduationCap {...iconProps} />;
      default:
        return <DollarSign {...iconProps} />;
    }
  };

  const getConfidenceStyle = (confidence: number) => {
    if (confidence >= 80) return styles.highConfidence;
    if (confidence >= 60) return styles.mediumConfidence;
    return styles.lowConfidence;
  };

  const getConfidenceDotStyle = (confidence: number) => {
    if (confidence >= 80) return styles.highConfidenceDot;
    if (confidence >= 60) return styles.mediumConfidenceDot;
    return styles.lowConfidenceDot;
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        isSelected && styles.selectedContainer,
        isSelectionMode && styles.selectionModeContainer,
      ]}
      onPress={handlePress}
      onLongPress={onLongPress}
      activeOpacity={0.7}
    >
      {/* Selection Indicator */}
      {isSelectionMode && (
        <View style={styles.selectionIndicator}>
          <View style={[styles.checkbox, isSelected && styles.checkedBox]}>
            {isSelected && <Check size={14} color="#FFFFFF" />}
          </View>
        </View>
      )}

      {/* Category Icon */}
      <View style={styles.categoryIconContainer}>
        {getCategoryIcon(transaction.category_name)}
      </View>

      {/* Transaction Content */}
      <View style={styles.content}>
        <View style={styles.topRow}>
          <View style={styles.transactionInfo}>
            <Text style={styles.description} numberOfLines={1}>
              {transaction.description}
            </Text>
            {transaction.merchant_name && (
              <Text style={styles.merchant} numberOfLines={1}>
                {transaction.merchant_name}
              </Text>
            )}
          </View>

          <View style={styles.amountContainer}>
            <Text
              style={[
                styles.amount,
                isExpense ? styles.expenseAmount : styles.incomeAmount,
              ]}
            >
              {formatCurrency(Math.abs(transaction.amount))}
            </Text>
            {isExpense && <Text style={styles.expenseIndicator}>-</Text>}
          </View>
        </View>

        <View style={styles.bottomRow}>
          <View style={styles.metadata}>
            <Text style={styles.date}>{formatDate(transaction.date)}</Text>
            {transaction.category_name && (
              <>
                <Text style={styles.separator}>•</Text>
                <Text style={styles.category}>{transaction.category_name}</Text>
              </>
            )}
          </View>

          {/* Status Indicators */}
          <View style={styles.statusIndicators}>
            {isUserVerified && (
              <View style={styles.verifiedBadge}>
                <Check size={12} color="#FFFFFF" />
              </View>
            )}
            {transaction.is_recurring && (
              <View style={styles.recurringBadge}>
                <RotateCcw size={12} color="#FFFFFF" />
              </View>
            )}
            {!isUserVerified && transaction.ai_confidence !== undefined && (
              <View
                style={[
                  styles.confidenceBadge,
                  getConfidenceStyle(transaction.ai_confidence),
                ]}
              >
                <View
                  style={[
                    styles.confidenceDot,
                    getConfidenceDotStyle(transaction.ai_confidence),
                  ]}
                />
              </View>
            )}
            {!isUserVerified && transaction.ai_confidence === undefined && (
              <View style={styles.aiBadge}>
                <Text style={styles.aiText}>AI</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Right Arrow Indicator */}
      {!isSelectionMode && (
        <View style={styles.arrowContainer}>
          <ChevronRight size={16} color="#718096" />
        </View>
      )}
    </TouchableOpacity>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: SPACING.MD || 16,
    marginVertical: SPACING.XS || 4,
    padding: SPACING.MD || 16,
    borderRadius: 12,
    minHeight: 80,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  selectedContainer: {
    backgroundColor: '#2B5CE610',
    borderWidth: 1,
    borderColor: '#2B5CE630',
  },
  selectionModeContainer: {
    paddingLeft: SPACING.SM || 8,
  },
  selectionIndicator: {
    marginRight: SPACING.SM || 12,
    width: 24,
    alignItems: 'center',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#2B5CE6',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkedBox: {
    backgroundColor: '#2B5CE6',
    borderColor: '#2B5CE6',
  },
  categoryIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F7F9FC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.SM || 12,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.SM || 8,
  },
  transactionInfo: {
    flex: 1,
    marginRight: SPACING.MD || 16,
  },
  description: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1F36',
    marginBottom: SPACING.XXS || 2,
  },
  merchant: {
    fontSize: 14,
    color: '#718096',
    fontWeight: '400',
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  amount: {
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: -0.5,
  },
  incomeAmount: {
    color: '#00C896',
  },
  expenseAmount: {
    color: '#1A1F36',
  },
  expenseIndicator: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1F36',
    marginLeft: 2,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metadata: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  date: {
    fontSize: 13,
    color: '#718096',
    fontWeight: '400',
  },
  separator: {
    fontSize: 13,
    color: '#718096',
    marginHorizontal: SPACING.XS || 6,
  },
  category: {
    fontSize: 13,
    color: '#4A5568',
    fontWeight: '500',
  },
  statusIndicators: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  verifiedBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#00A76F',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: SPACING.XXS || 4,
  },
  recurringBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#4B7BF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: SPACING.XXS || 4,
  },
  aiBadge: {
    paddingHorizontal: SPACING.XS || 6,
    paddingVertical: SPACING.XXS || 2,
    borderRadius: 8,
    backgroundColor: '#6B5DD3',
    marginLeft: SPACING.XXS || 4,
  },
  aiText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  confidenceBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: SPACING.XXS || 4,
    borderWidth: 2,
  },
  confidenceDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  highConfidence: {
    backgroundColor: '#FFFFFF',
    borderColor: '#00A76F',
  },
  highConfidenceDot: {
    backgroundColor: '#00A76F',
  },
  mediumConfidence: {
    backgroundColor: '#FFFFFF',
    borderColor: '#F6AD55',
  },
  mediumConfidenceDot: {
    backgroundColor: '#F6AD55',
  },
  lowConfidence: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E53E3E',
  },
  lowConfidenceDot: {
    backgroundColor: '#E53E3E',
  },
  arrowContainer: {
    marginLeft: SPACING.SM || 8,
    width: 20,
    alignItems: 'center',
  },
});
