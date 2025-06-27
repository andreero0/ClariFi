import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useMemo,
} from 'react';
import { Appearance } from 'react-native';
import { theme, lightColors, darkColors } from '../constants/colors'; // Adjusted import
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeMode = 'light' | 'dark';
export type AppTheme = typeof lightColors; // Or a more generic theme type if structures differ significantly

interface ThemeContextType {
  themeMode: ThemeMode;
  theme: AppTheme;
  isSystemTheme: boolean;
  isDarkMode: boolean;
  setThemeMode: (mode: ThemeMode | 'system') => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'app-theme-mode';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // Stores the user's explicit choice: 'light', 'dark', or 'system'
  const [userPreference, setUserPreference] = useState<ThemeMode | 'system'>(
    'system'
  );
  // Stores the actual theme being applied (resolved from userPreference and system setting)
  const [activeThemeMode, setActiveThemeMode] = useState<ThemeMode>(
    Appearance.getColorScheme() || 'light'
  );

  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        const storedPreference = (await AsyncStorage.getItem(
          THEME_STORAGE_KEY
        )) as ThemeMode | 'system' | null;
        if (storedPreference) {
          setUserPreference(storedPreference);
          if (storedPreference !== 'system') {
            setActiveThemeMode(storedPreference);
          }
        }
      } catch (error) {
        console.error('Failed to load theme preference from storage', error);
      }
    };
    loadThemePreference();
  }, []);

  useEffect(() => {
    const systemTheme = Appearance.getColorScheme() || 'light';
    if (userPreference === 'system') {
      setActiveThemeMode(systemTheme);
    }
    // If user has a specific preference (light/dark), it's already set and system changes are ignored until they switch back to 'system'
  }, [userPreference, Appearance.getColorScheme()]);

  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      if (userPreference === 'system') {
        setActiveThemeMode(colorScheme || 'light');
      }
    });
    return () => subscription.remove();
  }, [userPreference]);

  const setThemeMode = async (mode: ThemeMode | 'system') => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
      setUserPreference(mode);
      if (mode === 'system') {
        setActiveThemeMode(Appearance.getColorScheme() || 'light');
      } else {
        setActiveThemeMode(mode);
      }
    } catch (error) {
      console.error('Failed to save theme preference to storage', error);
    }
  };

  const currentTheme = useMemo(() => {
    return activeThemeMode === 'dark' ? darkColors : lightColors;
  }, [activeThemeMode]);

  const toggleTheme = () => {
    const newMode = activeThemeMode === 'light' ? 'dark' : 'light';
    setThemeMode(newMode);
  };

  const isDarkMode = activeThemeMode === 'dark';

  return (
    <ThemeContext.Provider
      value={{
        themeMode: activeThemeMode,
        theme: currentTheme,
        isSystemTheme: userPreference === 'system',
        isDarkMode,
        setThemeMode,
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
