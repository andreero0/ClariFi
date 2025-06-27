import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Theme {
  isDark: boolean;
  colors: {
    background: string;
    surface: string;
    primary: string;
    secondary: string;
    text: string;
    textSecondary: string;
    border: string;
    accent: string;
    success: string;
    warning: string;
    error: string;
    card: string;
    cardSecondary: string;
  };
}

const lightTheme: Theme = {
  isDark: false,
  colors: {
    background: '#FAFBFD',
    surface: '#FFFFFF',
    primary: '#2B5CE6',
    secondary: '#4B7BF5',
    text: '#1A1F36',
    textSecondary: '#4A5568',
    border: '#E2E8F0',
    accent: '#6B5DD3',
    success: '#00C896',
    warning: '#F6AD55',
    error: '#E53E3E',
    card: '#FFFFFF',
    cardSecondary: '#F7F9FC',
  },
};

const darkTheme: Theme = {
  isDark: true,
  colors: {
    background: '#08081a',
    surface: '#1e1e3a',
    primary: '#a855f7',
    secondary: '#ec4899',
    text: '#ffffff',
    textSecondary: '#6b7280',
    border: '#374151',
    accent: '#a78bfa',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    card: '#1e1e3a',
    cardSecondary: '#151530',
  },
};

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setDarkMode: (isDark: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [isDark, setIsDark] = useState(false);

  // Load theme preference from storage
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const storedTheme = await AsyncStorage.getItem('theme');
        if (storedTheme) {
          setIsDark(storedTheme === 'dark');
        }
      } catch (error) {
        console.error('Error loading theme:', error);
      }
    };
    loadTheme();
  }, []);

  // Save theme preference to storage
  const saveTheme = async (theme: string) => {
    try {
      await AsyncStorage.setItem('theme', theme);
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  const toggleTheme = () => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);
    saveTheme(newIsDark ? 'dark' : 'light');
  };

  const setDarkMode = (dark: boolean) => {
    setIsDark(dark);
    saveTheme(dark ? 'dark' : 'light');
  };

  const theme = isDark ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
};