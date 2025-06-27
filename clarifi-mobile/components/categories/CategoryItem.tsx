import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Edit2, Trash2, TrendingUp, TrendingDown } from 'lucide-react-native';
import { formatCurrency } from '../../utils/formatting/currency';
import { colors } from '../../constants/colors';
import { textStyles } from '../../constants/typography';

interface Category {
  id: string;
  name: string;
  color: string;
  type: 'income' | 'expense';
  icon?: string;
  is_default: boolean;
  usage_count?: number;
  total_amount?: number;
  created_at: string;
  updated_at: string;
}

interface CategoryItemProps {
  category: Category;
  onEdit: () => void;
  onDelete: () => void;
  showStats?: boolean;
}

export const CategoryItem: React.FC<CategoryItemProps> = ({
  category,
  onEdit,
  onDelete,
  showStats = true,
}) => {
  const getTypeIcon = () => {
    const iconProps = { size: 20, color: colors.surface };
    return category.type === 'income' ? (
      <TrendingUp {...iconProps} />
    ) : (
      <TrendingDown {...iconProps} />
    );
  };

  const getUsageStats = () => {
    if (!showStats) return null;

    return (
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Usage</Text>
          <Text style={styles.statValue}>
            {category.usage_count || 0} times
          </Text>
        </View>
        {category.total_amount !== undefined && (
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Total</Text>
            <Text
              style={[
                styles.statValue,
                category.type === 'income'
                  ? styles.incomeText
                  : styles.expenseText,
              ]}
            >
              {formatCurrency(Math.abs(category.total_amount))}
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.content} onPress={onEdit}>
        {/* Color indicator and icon */}
        <View style={styles.leftSection}>
          <View
            style={[styles.colorIndicator, { backgroundColor: category.color }]}
          >
            {category.icon ? (
              <Text style={styles.categoryIcon}>{category.icon}</Text>
            ) : (
              getTypeIcon()
            )}
          </View>

          <View style={styles.categoryInfo}>
            <View style={styles.nameContainer}>
              <Text style={styles.categoryName}>{category.name}</Text>
              {category.is_default && (
                <View style={styles.defaultBadge}>
                  <Text style={styles.defaultBadgeText}>Default</Text>
                </View>
              )}
            </View>

            <View style={styles.metaContainer}>
              <Text style={styles.categoryType}>
                {category.type === 'income' ? 'Income' : 'Expense'}
              </Text>
              <Text style={styles.separator}>•</Text>
              <Text style={styles.categoryId}>
                ID: {category.id.slice(0, 8)}
              </Text>
            </View>

            {getUsageStats()}
          </View>
        </View>

        {/* Action buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={onEdit}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Edit2 size={16} color={colors.primary} />
          </TouchableOpacity>

          {!category.is_default && (
            <TouchableOpacity
              style={[styles.actionButton, styles.deleteButton]}
              onPress={onDelete}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Trash2 size={16} color={colors.error} />
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  leftSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  colorIndicator: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  categoryIcon: {
    fontSize: 20,
  },
  categoryInfo: {
    flex: 1,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  categoryName: {
    ...textStyles.bodyMedium,
    color: colors.textPrimary,
    marginRight: 8,
    fontWeight: '600',
  },
  defaultBadge: {
    backgroundColor: colors.primary + '20',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  defaultBadgeText: {
    ...textStyles.caption,
    fontWeight: '500',
    color: colors.primary,
    textTransform: 'uppercase',
  },
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryType: {
    ...textStyles.bodySmall,
    color: colors.textSecondary,
    textTransform: 'capitalize',
  },
  separator: {
    fontSize: 14,
    color: '#dee2e6',
    marginHorizontal: 6,
  },
  categoryId: {
    fontSize: 12,
    color: '#adb5bd',
    fontFamily: 'monospace',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    alignItems: 'flex-start',
  },
  statLabel: {
    fontSize: 12,
    color: '#6c757d',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1a1a1a',
  },
  incomeText: {
    color: '#28a745',
  },
  expenseText: {
    color: '#dc3545',
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.neutral.lightest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButton: {
    backgroundColor: colors.error + '10',
  },
});
