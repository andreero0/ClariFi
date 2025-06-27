/**
 * Spacing scale based on an 8dp grid system.
 * These values can be used for margins, paddings, and other layout spacing.
 */

// Fail-safe spacing object that will always exist
const SPACING_VALUES = {
  xxs: 2, // 0.25 * 8
  xs: 4, // 0.5 * 8
  sm: 8, // 1 * 8
  md: 12, // 1.5 * 8
  lg: 16, // 2 * 8
  xl: 24, // 3 * 8
  xxl: 32, // 4 * 8
  xxxl: 40, // 5 * 8
  xxxxl: 48, // 6*8
  // Add more as needed, e.g., spacing.xlarge * 2 for 64px
};

// CRITICAL: Make spacing globally available IMMEDIATELY to prevent early access errors
if (typeof globalThis !== 'undefined') {
  (globalThis as any).spacing = SPACING_VALUES;
}
if (typeof global !== 'undefined') {
  (global as any).spacing = SPACING_VALUES;
}

// Export with error handling
export const spacing = SPACING_VALUES;

export const SIZES = {
  // Global sizes
  base: 8,
  font: 14,
  radius: 12,
  padding: 24,

  // Font sizes from typography.ts for convenience if needed directly in layout
  h1: 32,
  h2: 24,
  h3: 20,
  body1: 16,
  body2: 14,
  body3: 12,
  caption: 10,

  // App dimensions
  // get these from Dimensions API or hardcode for specific needs
  // screenWidth: Dimensions.get('window').width,
  // screenHeight: Dimensions.get('window').height,
};
