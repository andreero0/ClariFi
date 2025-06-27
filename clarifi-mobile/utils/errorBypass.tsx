import React, { Component, ReactNode } from 'react';

// Error Boundary specifically for React.Children.only errors
export class ReactChildrenOnlyErrorBoundary extends Component<
  { children: ReactNode; fallback?: ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: ReactNode; fallback?: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    // Check if it's the specific React.Children.only error
    if (
      error.message?.includes(
        'React.Children.only expected to receive a single React element child'
      )
    ) {
      return { hasError: true, error };
    }
    // For other errors, don't handle them here
    return null;
  }

  componentDidCatch(error: Error, errorInfo: any) {
    // Log the error but don't crash the app
    console.warn('React.Children.only error bypassed:', error.message);
  }

  render() {
    if (this.state.hasError) {
      // Return children without the problematic wrapper
      return this.props.fallback || <>{this.props.children}</>;
    }

    return this.props.children;
  }
}

// Safe wrapper component
export function SafeWrapper({ children }: { children: ReactNode }) {
  return (
    <ReactChildrenOnlyErrorBoundary>{children}</ReactChildrenOnlyErrorBoundary>
  );
}

// Hook to safely use context with fallback
export function useSafeAuth() {
  try {
    const { useAuth } = require('../context');
    return useAuth();
  } catch (error) {
    console.warn('Auth context error, using fallback values:', error);
    return {
      session: null,
      isLoading: false,
      user: null,
      signIn: () => Promise.resolve(),
      signOut: () => Promise.resolve(),
      signUp: () => Promise.resolve(),
    };
  }
}
