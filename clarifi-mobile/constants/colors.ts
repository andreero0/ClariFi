const LIGHT_COLORS = {
  // PRD Core Palette - Section 4.1
  clarityBlue: '#2B5CE6', // Clarity Blue - Primary buttons, key interactive elements
  primary: '#2B5CE6', // Alias for clarityBlue
  primaryHover: '#4B7BF5', // Sky Trust - Lighter blue for interactions

  // PRD Text Colors
  midnightInk: '#1A1F36', // Midnight Ink - High readability on light backgrounds
  textPrimary: '#1A1F36', // Alias for midnightInk
  neutralGray: '#4A5568', // Neutral Gray from PRD

  // PRD Surface Colors
  pureWhite: '#FFFFFF', // Pure White - Cards, content areas, input backgrounds
  surface: '#FFFFFF', // Alias for pureWhite
  appBackground: '#FAFBFD', // App Background - Subtle blue-tinted gray
  cloudGray: '#F7F9FC', // Cloud Gray - App background sections, disabled states

  // PRD Accent Colors
  growthGreen: '#00C896', // Growth Green - Success states, positive financial indicators
  growth: '#00C896', // Alias for growthGreen
  wisdomPurple: '#6B5DD3', // Wisdom Purple - Educational content, premium features
  wisdom: '#6B5DD3', // Alias for wisdomPurple

  // PRD Functional Colors
  success: '#00A76F', // Success
  errorRed: '#E53E3E', // Error
  error: '#E53E3E', // Alias for errorRed
  errorBackground: '#FEF2F2', // Light error background
  warning: '#F6AD55', // Warning

  // Supporting colors (maintained for compatibility)
  secondary: '#34D399', // Bright Mint (legacy)

  // Neutral Palette (updated to match PRD Cloud Gray)
  neutral: {
    lightest: '#F7F9FC', // Cloud Gray - App background sections, disabled states
    lighter: '#F3F4F6',
    light: '#E2E8F0', // Border color from PRD
    medium: '#718096', // Neutral Gray from PRD
    dark: '#4A5568', // Neutral Gray from PRD
    darker: '#374151',
    darkest: '#1A1F36', // Midnight Ink
  },

  // Legacy semantic colors for backward compatibility
  info: '#2196F3',

  // Common UI Colors
  white: '#FFFFFF',
  black: '#000000',

  // Subframe-inspired color tokens
  subframe: {
    // Neutral grays
    neutral50: '#F9FAFB',
    neutral100: '#F3F4F6',
    neutral200: '#E5E7EB',
    neutral300: '#D1D5DB',
    neutral600: '#4B5563',
    neutral700: '#374151',
    
    // Brand colors
    brand50: '#EFF6FF',
    brand100: '#DBEAFE',
    brand600: '#2563EB',
    
    // Success colors
    success50: '#F0FDF4',
    success100: '#DCFCE7',
    success600: '#16A34A',
    success700: '#15803D',
    
    // Error colors  
    error50: '#FEF2F2',
    error100: '#FEE2E2',
    error300: '#FCA5A5',
    error600: '#DC2626',
    error700: '#B91C1C',
    
    // Warning colors
    warning50: '#FFFBEB',
    warning100: '#FEF3C7',
    warning600: '#D97706',
    warning700: '#B45309',
  },

  // Spacing property to fix potential theme.spacing access
  spacing: {
    xxs: 2,
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
    xxxl: 40,
    xxxxl: 48,
  },
  transparent: 'transparent',

  // Text Colors (PRD-compliant)
  textSecondary: '#4A5568', // Neutral Gray (Secondary)
  textDisabled: '#718096', // Neutral Gray (Medium)
  textLight: '#FFFFFF',
  textInfo: '#2196F3',

  // Background Colors (PRD-compliant)
  backgroundPrimary: '#FAFBFD', // PRD App Background
  backgroundSecondary: '#FFFFFF', // Pure White
  backgroundDefault: '#FAFBFD', // PRD App Background
  backgroundOffset: '#F7F9FC', // Cloud Gray
  // Add more as needed for light theme

  // Border Colors (PRD-compliant)
  borderLight: '#E2E8F0', // PRD Border color
  border: '#E2E8F0', // PRD Border color
};

export const darkColors = {
  // PRD Dark Mode Colors - Section 4.2
  primary: '#5B8AF8', // Clarity Blue adjusted for dark backgrounds
  primaryHover: '#7BA7F7', // Sky Trust adjusted

  // PRD Dark Mode Text Colors
  textPrimary: '#F7FAFC', // F7FAFC from PRD
  textSecondary: '#A0AEC0', // A0AEC0 from PRD
  textDisabled: '#A0AEC0',
  textLight: '#F7FAFC',

  // PRD Dark Mode Accent Colors
  growth: '#48BB78', // Growth Green adjusted from PRD
  wisdom: '#9F7AEA', // Wisdom Purple adjusted from PRD
  success: '#48BB78', // Success adjusted from PRD
  warning: '#F6AD55', // Warning from PRD (unchanged)
  error: '#FC8181', // Error adjusted from PRD

  // PRD Dark Mode Background Colors
  appBackground: '#0F1419', // App Background from PRD
  backgroundPrimary: '#0F1419', // App Background from PRD
  backgroundSecondary: '#1A202C', // Surface Background from PRD
  backgroundDefault: '#0F1419',
  backgroundOffset: '#1A202C',
  surface: '#1A202C', // Surface/Card Background from PRD

  // PRD Dark Mode Border Colors
  borderLight: '#2D3748', // Border/Divider from PRD
  border: '#2D3748',

  // Legacy colors for compatibility
  secondary: '#48BB78',
  info: '#5B8AF8',

  neutral: {
    lightest: '#1A202C',
    lighter: '#2D3748',
    light: '#4A5568',
    medium: '#A0AEC0',
    dark: '#F7FAFC',
    darker: '#F7FAFC',
    darkest: '#F7FAFC',
  },

  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',

  // Spacing property to fix potential theme.spacing access
  spacing: {
    xxs: 2,
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
    xxxl: 40,
    xxxxl: 48,
  },
};

// CRITICAL: Make colors globally available IMMEDIATELY to prevent early access errors
if (typeof globalThis !== 'undefined') {
  (globalThis as any).colors = LIGHT_COLORS;
}
if (typeof global !== 'undefined') {
  (global as any).colors = LIGHT_COLORS;
}

export const lightColors = LIGHT_COLORS;

export const theme = {
  light: LIGHT_COLORS,
  dark: darkColors,
};

// Default export can be light theme, or a function to get current theme based on settings
export const colors = LIGHT_COLORS; // For existing imports to not break immediately
