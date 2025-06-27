import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Animated,
  Modal,
  Switch,
} from 'react-native';

interface FilterOption {
  id: string;
  label: string;
  color: string;
  icon?: string;
  enabled: boolean;
}

interface ChartFiltersProps {
  filters: FilterOption[];
  onFiltersChange: (filters: FilterOption[]) => void;
  title?: string;
  compact?: boolean;
  showSelectAll?: boolean;
  maxVisibleFilters?: number;
}

export const ChartFilters: React.FC<ChartFiltersProps> = ({
  filters,
  onFiltersChange,
  title = 'Categories',
  compact = false,
  showSelectAll = true,
  maxVisibleFilters = 6,
}) => {
  const [showAllFilters, setShowAllFilters] = useState(false);
  const [animatedHeight] = useState(new Animated.Value(0));
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  const enabledCount = filters.filter(f => f.enabled).length;
  const totalCount = filters.length;
  const hasHiddenFilters = filters.length > maxVisibleFilters;
  const visibleFilters = showAllFilters
    ? filters
    : filters.slice(0, maxVisibleFilters);

  useEffect(() => {
    Animated.timing(animatedHeight, {
      toValue: showAllFilters ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [showAllFilters]);

  const handleFilterToggle = (filterId: string) => {
    const updatedFilters = filters.map(filter =>
      filter.id === filterId ? { ...filter, enabled: !filter.enabled } : filter
    );
    onFiltersChange(updatedFilters);
  };

  const handleSelectAll = () => {
    const allEnabled = enabledCount === totalCount;
    const updatedFilters = filters.map(filter => ({
      ...filter,
      enabled: !allEnabled,
    }));
    onFiltersChange(updatedFilters);
  };

  const renderFilterChip = (filter: FilterOption, showToggle = false) => (
    <TouchableOpacity
      key={filter.id}
      style={[
        styles.filterChip,
        filter.enabled ? styles.filterChipEnabled : styles.filterChipDisabled,
        compact && styles.filterChipCompact,
      ]}
      onPress={() => (showToggle ? undefined : handleFilterToggle(filter.id))}
      activeOpacity={0.7}
    >
      <View
        style={[styles.filterColorIndicator, { backgroundColor: filter.color }]}
      />

      <View style={styles.filterContent}>
        <Text
          style={[
            styles.filterLabel,
            filter.enabled
              ? styles.filterLabelEnabled
              : styles.filterLabelDisabled,
            compact && styles.filterLabelCompact,
          ]}
        >
          {filter.icon && `${filter.icon} `}
          {filter.label}
        </Text>
      </View>

      {showToggle && (
        <Switch
          value={filter.enabled}
          onValueChange={() => handleFilterToggle(filter.id)}
          trackColor={{ false: '#e0e0e0', true: '#2B5CE6' }}
          thumbColor={filter.enabled ? '#ffffff' : '#f4f3f4'}
          style={styles.filterSwitch}
        />
      )}

      {!showToggle && (
        <View
          style={[
            styles.filterStatus,
            filter.enabled
              ? styles.filterStatusEnabled
              : styles.filterStatusDisabled,
          ]}
        >
          <Text
            style={[
              styles.filterStatusText,
              filter.enabled
                ? styles.filterStatusTextEnabled
                : styles.filterStatusTextDisabled,
            ]}
          >
            {filter.enabled ? '✓' : '○'}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderCompactView = () => (
    <View style={styles.compactContainer}>
      <View style={styles.compactHeader}>
        <Text style={styles.compactTitle}>
          {title} ({enabledCount}/{totalCount})
        </Text>
        <TouchableOpacity
          style={styles.expandButton}
          onPress={() => setFilterModalVisible(true)}
        >
          <Text style={styles.expandButtonText}>⚙️</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.compactFilters}
      >
        {filters.filter(f => f.enabled).map(filter => renderFilterChip(filter))}
        {enabledCount === 0 && (
          <Text style={styles.noFiltersText}>No categories selected</Text>
        )}
      </ScrollView>
    </View>
  );

  const renderFullView = () => (
    <View style={styles.fullContainer}>
      <View style={styles.filterHeader}>
        <Text style={styles.filterTitle}>{title}</Text>
        <View style={styles.filterStats}>
          <Text style={styles.filterStatsText}>
            {enabledCount} of {totalCount} selected
          </Text>
          {showSelectAll && (
            <TouchableOpacity
              style={styles.selectAllButton}
              onPress={handleSelectAll}
            >
              <Text style={styles.selectAllText}>
                {enabledCount === totalCount ? 'Clear All' : 'Select All'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.filterGrid}>
        {visibleFilters.map(filter => renderFilterChip(filter))}
      </View>

      {hasHiddenFilters && (
        <TouchableOpacity
          style={styles.showMoreButton}
          onPress={() => setShowAllFilters(!showAllFilters)}
        >
          <Text style={styles.showMoreText}>
            {showAllFilters
              ? 'Show Less'
              : `Show ${filters.length - maxVisibleFilters} More`}
          </Text>
          <Text style={styles.showMoreIcon}>{showAllFilters ? '↑' : '↓'}</Text>
        </TouchableOpacity>
      )}

      {showAllFilters && (
        <Animated.View
          style={[
            styles.additionalFilters,
            {
              maxHeight: animatedHeight.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 200],
              }),
              opacity: animatedHeight,
            },
          ]}
        >
          {filters
            .slice(maxVisibleFilters)
            .map(filter => renderFilterChip(filter))}
        </Animated.View>
      )}
    </View>
  );

  const renderModal = () => (
    <Modal
      visible={filterModalVisible}
      transparent
      animationType="slide"
      onRequestClose={() => setFilterModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filter {title}</Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setFilterModalVisible(false)}
            >
              <Text style={styles.modalCloseText}>Done</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {showSelectAll && (
              <TouchableOpacity
                style={styles.modalSelectAll}
                onPress={handleSelectAll}
              >
                <Text style={styles.modalSelectAllText}>
                  {enabledCount === totalCount
                    ? 'Clear All Categories'
                    : 'Select All Categories'}
                </Text>
              </TouchableOpacity>
            )}

            {filters.map(filter => (
              <View key={filter.id} style={styles.modalFilterItem}>
                {renderFilterChip(filter, true)}
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      {compact ? renderCompactView() : renderFullView()}
      {renderModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },

  // Compact view styles
  compactContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
  },
  compactHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  compactTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  expandButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  expandButtonText: {
    fontSize: 14,
  },
  compactFilters: {
    gap: 6,
  },
  noFiltersText: {
    fontSize: 12,
    color: '#6c757d',
    fontStyle: 'italic',
    paddingVertical: 8,
  },

  // Full view styles
  fullContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  filterStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  filterStatsText: {
    fontSize: 12,
    color: '#6c757d',
  },
  selectAllButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  selectAllText: {
    fontSize: 12,
    color: '#2B5CE6',
    fontWeight: '600',
  },

  // Filter chip styles
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 8,
  },
  filterChipCompact: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginBottom: 0,
  },
  filterChipEnabled: {
    backgroundColor: '#e3f2fd',
    borderColor: '#2B5CE6',
  },
  filterChipDisabled: {
    backgroundColor: '#f8f9fa',
    borderColor: '#e9ecef',
  },
  filterColorIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  filterContent: {
    flex: 1,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  filterLabelCompact: {
    fontSize: 12,
  },
  filterLabelEnabled: {
    color: '#1a1a1a',
  },
  filterLabelDisabled: {
    color: '#6c757d',
  },
  filterStatus: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  filterStatusEnabled: {
    backgroundColor: '#2B5CE6',
  },
  filterStatusDisabled: {
    backgroundColor: '#e9ecef',
  },
  filterStatusText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  filterStatusTextEnabled: {
    color: 'white',
  },
  filterStatusTextDisabled: {
    color: '#6c757d',
  },
  filterSwitch: {
    marginLeft: 8,
  },

  // Grid and additional filters
  filterGrid: {
    gap: 4,
  },
  showMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  showMoreText: {
    fontSize: 14,
    color: '#2B5CE6',
    fontWeight: '600',
    marginRight: 4,
  },
  showMoreIcon: {
    fontSize: 12,
    color: '#2B5CE6',
  },
  additionalFilters: {
    overflow: 'hidden',
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  modalCloseButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  modalCloseText: {
    fontSize: 16,
    color: '#2B5CE6',
    fontWeight: '600',
  },
  modalContent: {
    padding: 20,
  },
  modalSelectAll: {
    paddingVertical: 16,
    paddingHorizontal: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  modalSelectAllText: {
    fontSize: 16,
    color: '#2B5CE6',
    fontWeight: '600',
  },
  modalFilterItem: {
    marginBottom: 4,
  },
});
