import { Platform, TextStyle } from 'react-native';

// PRD-specified font family: SF Pro Text (iOS) / Roboto (Android) with Inter as fallback
const PRD_FONT_FAMILY = Platform.select({
  ios: 'SF Pro Text',
  android: 'Roboto',
  default: 'Inter', // Fallback for web/other platforms
});

export const fonts = {
  // PRD primary font family
  primary: PRD_FONT_FAMILY,
  // System fallback (legacy support)
  system: Platform.select({
    ios: 'System',
    android: 'Roboto',
    default: 'sans-serif',
  }),
};

// PRD-exact font weights for professional appearance
export const fontWeights: { [key: string]: TextStyle['fontWeight'] } = {
  regular: '400', // PRD Regular
  medium: '500', // PRD Medium
  semibold: '600', // PRD Semibold
  bold: '700', // PRD Bold
  // Legacy support
  thin: '100',
  extraLight: '200',
  light: '300',
  extraBold: '800',
  black: '900',
};

// PRD-exact font sizes (dp) for professional hierarchy
export const fontSizes = {
  // PRD Headings
  h1: 32, // Screen Titles
  h2: 24, // Section Headers
  h3: 18, // Card Headers
  // PRD Body Text
  bodyLarge: 18, // Key Insights
  bodyRegular: 16, // Standard Content
  bodySmall: 14, // Supporting Info
  // PRD Special Text
  caption: 12, // Helper Text
  button: 16, // Button Text
};

// PRD-compliant text styles with exact line heights and letter spacing
const TEXT_STYLES = {
  // PRD H1 (Screen Titles): 32dp font-size, 40dp line-height, Bold (700), -0.5dp letter-spacing
  h1: {
    fontFamily: fonts.primary,
    fontSize: fontSizes.h1,
    fontWeight: fontWeights.bold,
    lineHeight: 40,
    letterSpacing: -0.5,
  } as TextStyle,

  // PRD H2 (Section Headers): 24dp font-size, 32dp line-height, Semibold (600), -0.25dp letter-spacing
  h2: {
    fontFamily: fonts.primary,
    fontSize: fontSizes.h2,
    fontWeight: fontWeights.semibold,
    lineHeight: 32,
    letterSpacing: -0.25,
  } as TextStyle,

  // PRD H3 (Card Headers): 18dp font-size, 24dp line-height, Semibold (600), 0dp letter-spacing
  h3: {
    fontFamily: fonts.primary,
    fontSize: fontSizes.h3,
    fontWeight: fontWeights.semibold,
    lineHeight: 24,
    letterSpacing: 0,
  } as TextStyle,

  // PRD Body Large (Key Insights): 18dp font-size, 28dp line-height, Regular (400), 0dp letter-spacing
  bodyLarge: {
    fontFamily: fonts.primary,
    fontSize: fontSizes.bodyLarge,
    fontWeight: fontWeights.regular,
    lineHeight: 28,
    letterSpacing: 0,
  } as TextStyle,

  // PRD Body Regular (Standard Content): 16dp font-size, 24dp line-height, Regular (400), 0dp letter-spacing
  bodyRegular: {
    fontFamily: fonts.primary,
    fontSize: fontSizes.bodyRegular,
    fontWeight: fontWeights.regular,
    lineHeight: 24,
    letterSpacing: 0,
  } as TextStyle,

  // Alias for bodyRegular
  body: {
    fontFamily: fonts.primary,
    fontSize: fontSizes.bodyRegular,
    fontWeight: fontWeights.regular,
    lineHeight: 24,
    letterSpacing: 0,
  } as TextStyle,

  // PRD Body Small (Supporting Info): 14dp font-size, 20dp line-height, Regular (400), 0dp letter-spacing
  bodySmall: {
    fontFamily: fonts.primary,
    fontSize: fontSizes.bodySmall,
    fontWeight: fontWeights.regular,
    lineHeight: 20,
    letterSpacing: 0,
  } as TextStyle,

  // PRD Caption (Helper Text): 12dp font-size, 16dp line-height, Regular (400), 0.25dp letter-spacing
  caption: {
    fontFamily: fonts.primary,
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.regular,
    lineHeight: 16,
    letterSpacing: 0.25,
  } as TextStyle,

  // PRD Button Text: 16dp font-size, 20dp line-height, Medium (500), 0.5dp letter-spacing
  button: {
    fontFamily: fonts.primary,
    fontSize: fontSizes.button,
    fontWeight: fontWeights.medium,
    lineHeight: 20,
    letterSpacing: 0.5,
  } as TextStyle,

  // PRD Link Text: 16dp font-size, 24dp line-height, Regular (400), 0dp letter-spacing
  link: {
    fontFamily: fonts.primary,
    fontSize: fontSizes.bodyRegular,
    fontWeight: fontWeights.regular,
    lineHeight: 24,
    letterSpacing: 0,
  } as TextStyle,
};

// CRITICAL: Make textStyles globally available IMMEDIATELY to prevent early access errors
if (typeof globalThis !== 'undefined') {
  (globalThis as any).textStyles = TEXT_STYLES;
}
if (typeof global !== 'undefined') {
  (global as any).textStyles = TEXT_STYLES;
}

export const textStyles = TEXT_STYLES;

// Helper function to get specific font styles, useful for theming
export const getFontStyles = (styleName: keyof typeof textStyles) => {
  return textStyles[styleName];
};
