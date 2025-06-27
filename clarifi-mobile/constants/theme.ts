// Re-export theme from colors for backwards compatibility
export { theme, lightColors, darkColors } from './colors';

// Export specific theme properties for easy access
export const defaultTheme = {
  // Primary colors
  primary: '#2B5CE6',
  clarityBlue: '#2B5CE6',
  primaryHover: '#4B7BF5',

  // Text colors
  textPrimary: '#1A1F36',
  midnightInk: '#1A1F36',
  textSecondary: '#4A5568',
  neutralGray: '#4A5568',

  // Background colors
  backgroundDefault: '#FAFBFD',
  backgroundSecondary: '#FFFFFF',
  surface: '#FFFFFF',
  pureWhite: '#FFFFFF',
  appBackground: '#FAFBFD',
  cloudGray: '#F7F9FC',

  // Accent colors
  growthGreen: '#00C896',
  growth: '#00C896',
  wisdomPurple: '#6B5DD3',
  wisdom: '#6B5DD3',

  // Functional colors
  success: '#00A76F',
  error: '#E53E3E',
  errorRed: '#E53E3E',
  warning: '#F6AD55',

  // Border colors
  border: '#E2E8F0',
  borderLight: '#E2E8F0',
};

export default defaultTheme;
