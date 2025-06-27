import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
} from 'react-native';
import { useTheme, ThemeMode } from '../../context/ThemeContext';
import { spacing } from '../../constants/spacing';

export const ThemeSwitcher: React.FC = () => {
  const { themeMode, setThemeMode, theme, isSystemTheme } = useTheme();
  // const systemTheme = useColorScheme(); // RN hook to get current system theme

  const options: { label: string; value: ThemeMode | 'system' }[] = [
    { label: 'Light', value: 'light' },
    { label: 'Dark', value: 'dark' },
    { label: 'System', value: 'system' },
  ];

  const styles = StyleSheet.create({
    container: {
      paddingVertical: spacing.md,
    },
    label: {
      fontSize: 16,
      color: theme.textSecondary,
      marginBottom: spacing.sm,
    },
    optionsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      backgroundColor: theme.backgroundSecondary,
      borderRadius: 8,
      padding: spacing.xs,
      borderWidth: 1,
      borderColor: theme.neutral.light,
    },
    optionButton: {
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      borderRadius: 6,
      flex: 1,
      alignItems: 'center',
    },
    optionButtonSelected: {
      backgroundColor: theme.primary,
    },
    optionText: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.textPrimary,
    },
    optionTextSelected: {
      color: theme.white,
    },
    systemInfo: {
      fontSize: 12,
      color: theme.textDisabled,
      marginTop: spacing.xs,
      textAlign: 'center',
    },
  });

  const handleSetTheme = (mode: ThemeMode | 'system') => {
    setThemeMode(mode);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Appearance</Text>
      <View style={styles.optionsContainer}>
        {options.map(option => {
          const currentActualTheme = isSystemTheme
            ? useColorScheme() || 'light'
            : themeMode;
          const isSelected =
            option.value === 'system'
              ? isSystemTheme // Check if 'system' is the *preference*
              : option.value === themeMode && !isSystemTheme; // Check if light/dark is the *preference* and it matches current actual theme mode

          // Adjust for when system is selected, highlight the effective theme
          let effectiveSelected = isSelected;
          if (
            option.value !== 'system' &&
            isSystemTheme &&
            option.value === currentActualTheme
          ) {
            // When system is preferred, and this option matches the system's current theme
            effectiveSelected = true;
          }
          if (option.value === 'system' && isSystemTheme) {
            effectiveSelected = true;
          } else if (
            option.value !== 'system' &&
            option.value === themeMode &&
            !isSystemTheme
          ) {
            effectiveSelected = true;
          } else {
            effectiveSelected = false;
          }

          return (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.optionButton,
                effectiveSelected && styles.optionButtonSelected,
              ]}
              onPress={() => handleSetTheme(option.value)}
            >
              <Text
                style={[
                  styles.optionText,
                  effectiveSelected && styles.optionTextSelected,
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      {isSystemTheme && (
        <Text style={styles.systemInfo}>
          Currently using system theme ({useColorScheme()})
        </Text>
      )}
    </View>
  );
};

export default ThemeSwitcher;
