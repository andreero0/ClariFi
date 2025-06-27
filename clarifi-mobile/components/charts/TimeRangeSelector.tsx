import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Animated,
} from 'react-native';

export type TimeRange = 'week' | 'month' | 'quarter' | 'year' | 'custom';

interface TimeRangeOption {
  id: TimeRange;
  label: string;
  shortLabel: string;
  description: string;
}

interface TimeRangeSelectorProps {
  selectedRange: TimeRange;
  onRangeChange: (range: TimeRange) => void;
  onCustomRangePress?: () => void;
  disabled?: boolean;
  compact?: boolean;
}

const timeRangeOptions: TimeRangeOption[] = [
  {
    id: 'week',
    label: 'This Week',
    shortLabel: '7D',
    description: 'Last 7 days',
  },
  {
    id: 'month',
    label: 'This Month',
    shortLabel: '1M',
    description: 'Current month',
  },
  {
    id: 'quarter',
    label: 'This Quarter',
    shortLabel: '3M',
    description: 'Last 3 months',
  },
  {
    id: 'year',
    label: 'This Year',
    shortLabel: '1Y',
    description: 'Current year',
  },
  {
    id: 'custom',
    label: 'Custom',
    shortLabel: '⚙️',
    description: 'Select dates',
  },
];

export const TimeRangeSelector: React.FC<TimeRangeSelectorProps> = ({
  selectedRange,
  onRangeChange,
  onCustomRangePress,
  disabled = false,
  compact = false,
}) => {
  const [slideAnimation] = useState(new Animated.Value(0));

  const handleRangeSelect = (range: TimeRange) => {
    if (disabled) return;

    if (range === 'custom' && onCustomRangePress) {
      onCustomRangePress();
      return;
    }

    // Animate selection feedback
    Animated.sequence([
      Animated.timing(slideAnimation, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnimation, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();

    onRangeChange(range);
  };

  const renderCompactSelector = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.compactContainer}
    >
      {timeRangeOptions.map(option => {
        const isSelected = selectedRange === option.id;

        return (
          <TouchableOpacity
            key={option.id}
            style={[
              styles.compactOption,
              isSelected && styles.compactOptionSelected,
              disabled && styles.compactOptionDisabled,
            ]}
            onPress={() => handleRangeSelect(option.id)}
            activeOpacity={disabled ? 1 : 0.7}
          >
            <Text
              style={[
                styles.compactOptionText,
                isSelected && styles.compactOptionTextSelected,
                disabled && styles.compactOptionTextDisabled,
              ]}
            >
              {option.shortLabel}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );

  const renderFullSelector = () => (
    <View style={styles.fullContainer}>
      <Text style={styles.selectorTitle}>Time Period</Text>

      <View style={styles.optionsGrid}>
        {timeRangeOptions.map(option => {
          const isSelected = selectedRange === option.id;

          return (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.fullOption,
                isSelected && styles.fullOptionSelected,
                disabled && styles.fullOptionDisabled,
              ]}
              onPress={() => handleRangeSelect(option.id)}
              activeOpacity={disabled ? 1 : 0.7}
            >
              <View style={styles.fullOptionHeader}>
                <Text
                  style={[
                    styles.fullOptionLabel,
                    isSelected && styles.fullOptionLabelSelected,
                    disabled && styles.fullOptionLabelDisabled,
                  ]}
                >
                  {option.label}
                </Text>
                {isSelected && (
                  <View style={styles.selectedIndicator}>
                    <Text style={styles.selectedIndicatorText}>✓</Text>
                  </View>
                )}
              </View>

              <Text
                style={[
                  styles.fullOptionDescription,
                  isSelected && styles.fullOptionDescriptionSelected,
                  disabled && styles.fullOptionDescriptionDisabled,
                ]}
              >
                {option.description}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [
            {
              translateY: slideAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [0, -2],
              }),
            },
          ],
        },
      ]}
    >
      {compact ? renderCompactSelector() : renderFullSelector()}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },

  // Compact selector styles
  compactContainer: {
    paddingHorizontal: 16,
    gap: 8,
  },
  compactOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
    minWidth: 50,
    alignItems: 'center',
  },
  compactOptionSelected: {
    backgroundColor: '#2B5CE6',
    borderColor: '#2B5CE6',
  },
  compactOptionDisabled: {
    opacity: 0.5,
  },
  compactOptionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#495057',
  },
  compactOptionTextSelected: {
    color: 'white',
  },
  compactOptionTextDisabled: {
    color: '#adb5bd',
  },

  // Full selector styles
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
  selectorTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  optionsGrid: {
    gap: 8,
  },
  fullOption: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  fullOptionSelected: {
    backgroundColor: '#e3f2fd',
    borderColor: '#2B5CE6',
  },
  fullOptionDisabled: {
    opacity: 0.5,
  },
  fullOptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  fullOptionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#495057',
  },
  fullOptionLabelSelected: {
    color: '#2B5CE6',
  },
  fullOptionLabelDisabled: {
    color: '#adb5bd',
  },
  fullOptionDescription: {
    fontSize: 12,
    color: '#6c757d',
  },
  fullOptionDescriptionSelected: {
    color: '#495057',
  },
  fullOptionDescriptionDisabled: {
    color: '#adb5bd',
  },
  selectedIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#2B5CE6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedIndicatorText: {
    fontSize: 12,
    color: 'white',
    fontWeight: 'bold',
  },
});
