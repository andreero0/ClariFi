import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';

interface IconPickerProps {
  selectedIcon: string;
  icons: string[];
  onIconSelect: (icon: string) => void;
}

export const IconPicker: React.FC<IconPickerProps> = ({
  selectedIcon,
  icons,
  onIconSelect,
}) => {
  return (
    <View style={styles.container}>
      {icons.map(icon => (
        <TouchableOpacity
          key={icon}
          style={[
            styles.iconOption,
            selectedIcon === icon && styles.selectedIconOption,
          ]}
          onPress={() => onIconSelect(icon)}
          activeOpacity={0.7}
        >
          <Text style={styles.iconText}>{icon}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'flex-start',
  },
  iconOption: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f9fa',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedIconOption: {
    backgroundColor: '#e3f2fd',
    borderColor: '#007AFF',
  },
  iconText: {
    fontSize: 20,
  },
});
