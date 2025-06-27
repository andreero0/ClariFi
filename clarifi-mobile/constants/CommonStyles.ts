import { StyleSheet } from 'react-native';
import { lightColors } from './colors';
// NOTE: Import spacing directly to avoid circular dependency issues
import { spacing } from './spacing';

/**
 * Common styles used across multiple screens and components
 * Following ClariFi design system guidelines from PRD
 */
export const commonStyles = StyleSheet.create({
  // Safe area container - for screens that need SafeAreaView styling
  safeAreaContainer: {
    flex: 1,
    backgroundColor: lightColors.backgroundDefault, // App Background (#FAFBFD)
  },

  // Main container - standard container for most screens
  container: {
    flex: 1,
    backgroundColor: lightColors.backgroundDefault, // App Background (#FAFBFD)
    paddingHorizontal: spacing.xl, // 24dp horizontal padding per PRD
  },

  // Container with centered content
  centeredContainer: {
    flex: 1,
    backgroundColor: lightColors.backgroundDefault,
    paddingHorizontal: spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Content container for scrollable content
  contentContainer: {
    flexGrow: 1,
    paddingVertical: spacing.lg, // 16dp vertical padding
  },

  // Card style container following PRD specifications
  card: {
    backgroundColor: lightColors.white, // Pure White background
    borderRadius: 16, // 16dp corner radius per PRD
    padding: spacing.xl, // 24dp internal padding per PRD
    shadowColor: lightColors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4, // Android shadow
    marginVertical: spacing.sm,
  },

  // Row layout
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  // Row with space between items
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  // Common spacing utilities
  marginVertical: {
    marginVertical: spacing.lg,
  },

  marginHorizontal: {
    marginHorizontal: spacing.xl,
  },

  // Text alignment utilities
  textCenter: {
    textAlign: 'center',
  },

  // Common layout utilities
  fullWidth: {
    width: '100%',
  },

  // Form container
  formContainer: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
});
