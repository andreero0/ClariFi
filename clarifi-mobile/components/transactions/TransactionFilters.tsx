import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  Modal,
} from 'react-native';
import { FilterState } from '../../app/(tabs)/transactions';
import { formatDateRange, toISODateString } from '../../utils/formatting/date';

interface TransactionFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  onClose: () => void;
}

export const TransactionFilters: React.FC<TransactionFiltersProps> = ({
  filters,
  onFiltersChange,
  onClose,
}) => {
  const [localFilters, setLocalFilters] = useState<FilterState>(filters);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const categories = [
    { id: 'food', name: 'Food & Dining', color: '#FF6B6B' },
    { id: 'transport', name: 'Transportation', color: '#4ECDC4' },
    { id: 'shopping', name: 'Shopping', color: '#45B7D1' },
    { id: 'entertainment', name: 'Entertainment', color: '#96CEB4' },
    { id: 'bills', name: 'Bills & Utilities', color: '#FECA57' },
    { id: 'income', name: 'Income', color: '#48CAE4' },
    { id: 'healthcare', name: 'Healthcare', color: '#FF9FF3' },
    { id: 'education', name: 'Education', color: '#54A0FF' },
  ];

  const dateRangeOptions = [
    {
      label: 'Last 7 days',
      getValue: () => {
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - 7);
        return {
          start: toISODateString(start),
          end: toISODateString(end),
        };
      },
    },
    {
      label: 'Last 30 days',
      getValue: () => {
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - 30);
        return {
          start: toISODateString(start),
          end: toISODateString(end),
        };
      },
    },
    {
      label: 'This month',
      getValue: () => {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        return {
          start: toISODateString(start),
          end: toISODateString(end),
        };
      },
    },
    {
      label: 'Last month',
      getValue: () => {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const end = new Date(now.getFullYear(), now.getMonth(), 0);
        return {
          start: toISODateString(start),
          end: toISODateString(end),
        };
      },
    },
  ];

  const sortOptions = [
    { key: 'date', label: 'Date' },
    { key: 'amount', label: 'Amount' },
    { key: 'merchant', label: 'Merchant' },
  ] as const;

  const handleApplyFilters = () => {
    onFiltersChange(localFilters);
    onClose();
  };

  const handleResetFilters = () => {
    const resetFilters: FilterState = {
      searchText: '',
      sortBy: 'date',
      sortOrder: 'desc',
    };
    setLocalFilters(resetFilters);
    onFiltersChange(resetFilters);
    onClose();
  };

  const handleCategorySelect = (categoryId: string) => {
    setLocalFilters(prev => ({
      ...prev,
      categoryId: prev.categoryId === categoryId ? undefined : categoryId,
    }));
  };

  const handleDateRangeSelect = (dateRange: { start: string; end: string }) => {
    setLocalFilters(prev => ({
      ...prev,
      dateRange,
    }));
  };

  const handleSortChange = (sortBy: FilterState['sortBy']) => {
    setLocalFilters(prev => ({
      ...prev,
      sortBy,
      sortOrder:
        prev.sortBy === sortBy && prev.sortOrder === 'desc' ? 'asc' : 'desc',
    }));
  };

  const getDateRangeLabel = () => {
    if (!localFilters.dateRange) {
      return 'All time';
    }

    return formatDateRange(
      localFilters.dateRange.start,
      localFilters.dateRange.end
    );
  };

  const getSortLabel = () => {
    const sortOption = sortOptions.find(
      option => option.key === localFilters.sortBy
    );
    const direction = localFilters.sortOrder === 'desc' ? '↓' : '↑';
    return `${sortOption?.label || 'Date'} ${direction}`;
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Filter Transactions</Text>
          </View>

          {/* Categories */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Category</Text>
            <View style={styles.categoryContainer}>
              {categories.map(category => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryChip,
                    localFilters.categoryId === category.id &&
                      styles.categoryChipSelected,
                  ]}
                  onPress={() => handleCategorySelect(category.id)}
                >
                  <View
                    style={[
                      styles.categoryIndicator,
                      { backgroundColor: category.color },
                    ]}
                  />
                  <Text
                    style={[
                      styles.categoryChipText,
                      localFilters.categoryId === category.id &&
                        styles.categoryChipTextSelected,
                    ]}
                  >
                    {category.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Date Range */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Date Range</Text>
            <View style={styles.dateRangeContainer}>
              <TouchableOpacity
                style={styles.dateRangeButton}
                onPress={() =>
                  setLocalFilters(prev => ({ ...prev, dateRange: undefined }))
                }
              >
                <Text style={styles.dateRangeButtonText}>
                  {getDateRangeLabel()}
                </Text>
              </TouchableOpacity>

              {dateRangeOptions.map((option, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.dateRangeOption}
                  onPress={() => handleDateRangeSelect(option.getValue())}
                >
                  <Text style={styles.dateRangeOptionText}>{option.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Sort */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Sort By</Text>
            <View style={styles.sortContainer}>
              {sortOptions.map(option => (
                <TouchableOpacity
                  key={option.key}
                  style={[
                    styles.sortOption,
                    localFilters.sortBy === option.key &&
                      styles.sortOptionSelected,
                  ]}
                  onPress={() => handleSortChange(option.key)}
                >
                  <Text
                    style={[
                      styles.sortOptionText,
                      localFilters.sortBy === option.key &&
                        styles.sortOptionTextSelected,
                    ]}
                  >
                    {option.label}
                    {localFilters.sortBy === option.key && (
                      <Text style={styles.sortDirection}>
                        {' '}
                        {localFilters.sortOrder === 'desc' ? '↓' : '↑'}
                      </Text>
                    )}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* User Verified Toggle */}
          <View style={styles.section}>
            <View style={styles.toggleContainer}>
              <Text style={styles.toggleLabel}>
                Show only user-verified transactions
              </Text>
              <Switch
                value={localFilters.showOnlyUserVerified || false}
                onValueChange={value =>
                  setLocalFilters(prev => ({
                    ...prev,
                    showOnlyUserVerified: value,
                  }))
                }
                trackColor={{ false: '#767577', true: '#007AFF' }}
                thumbColor="#ffffff"
              />
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionContainer}>
        <TouchableOpacity
          style={styles.resetButton}
          onPress={handleResetFilters}
        >
          <Text style={styles.resetButtonText}>Reset</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.applyButton}
          onPress={handleApplyFilters}
        >
          <Text style={styles.applyButtonText}>Apply Filters</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
    maxHeight: 400,
  },
  content: {
    flex: 1,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  categoryChipSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  categoryIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  categoryChipText: {
    fontSize: 14,
    color: '#495057',
  },
  categoryChipTextSelected: {
    color: '#ffffff',
  },
  dateRangeContainer: {
    gap: 8,
  },
  dateRangeButton: {
    padding: 12,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  dateRangeButtonText: {
    fontSize: 14,
    color: '#495057',
    fontWeight: '500',
  },
  dateRangeOption: {
    padding: 12,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  dateRangeOptionText: {
    fontSize: 14,
    color: '#007AFF',
  },
  sortContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  sortOption: {
    flex: 1,
    padding: 12,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dee2e6',
    alignItems: 'center',
  },
  sortOptionSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  sortOptionText: {
    fontSize: 14,
    color: '#495057',
    fontWeight: '500',
  },
  sortOptionTextSelected: {
    color: '#ffffff',
  },
  sortDirection: {
    fontWeight: '700',
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  toggleLabel: {
    fontSize: 14,
    color: '#495057',
    flex: 1,
    marginRight: 12,
  },
  actionContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  resetButton: {
    flex: 1,
    padding: 12,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dee2e6',
    alignItems: 'center',
  },
  resetButtonText: {
    fontSize: 16,
    color: '#6c757d',
    fontWeight: '500',
  },
  applyButton: {
    flex: 2,
    padding: 12,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '600',
  },
});
