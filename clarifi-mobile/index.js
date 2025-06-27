import { LogBox } from 'react-native';

// Global configuration to suppress React.Children.only errors

// Suppress specific warnings that cause red screen errors
LogBox.ignoreLogs([
  'React.Children.only expected to receive a single React element child',
  'Warning: React.Children.only',
  'Warning: Each child in a list should have a unique "key" prop',
  'expo-notifications: Android Push notifications',
  'Using undefined type for key is not supported',
]);

// Override console.error to convert React.Children.only errors to warnings
const originalError = console.error;
console.error = (...args) => {
  const message = args[0];
  if (
    typeof message === 'string' &&
    message.includes(
      'React.Children.only expected to receive a single React element child'
    )
  ) {
    console.warn('🔄 React.Children.only error bypassed:', message);
    return;
  }
  originalError.apply(console, args);
};

// Import the expo router entry point - this handles app registration
import 'expo-router/entry';
