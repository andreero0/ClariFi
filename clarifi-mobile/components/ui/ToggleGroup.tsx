import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';

interface ToggleGroupItemProps {
  value: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  isSelected?: boolean;
  onPress?: () => void;
}

interface ToggleGroupProps {
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactElement<ToggleGroupItemProps>[];
}

const ToggleGroupItem: React.FC<ToggleGroupItemProps> = ({
  children,
  icon,
  isSelected,
  onPress,
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.item,
        isSelected && styles.itemSelected,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {icon && <View style={styles.itemIcon}>{icon}</View>}
      <Text
        style={[
          styles.itemText,
          isSelected && styles.itemTextSelected,
        ]}
      >
        {children}
      </Text>
    </TouchableOpacity>
  );
};

export const ToggleGroup: React.FC<ToggleGroupProps> & {
  Item: typeof ToggleGroupItem;
} = ({ value, onValueChange, children }) => {
  return (
    <View style={styles.container}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, {
            isSelected: child.props.value === value,
            onPress: () => onValueChange(child.props.value),
          });
        }
        return child;
      })}
    </View>
  );
};

ToggleGroup.Item = ToggleGroupItem;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 4,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  itemSelected: {
    backgroundColor: '#2563EB',
  },
  itemIcon: {
    marginRight: 6,
  },
  itemText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
  },
  itemTextSelected: {
    color: '#FFFFFF',
  },
});