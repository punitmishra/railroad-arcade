'use client';

// ============================================
// Error Boundary Component
// ============================================
// Catches React errors and displays a friendly
// fallback UI with retry functionality.

import { Component, ReactNode, ErrorInfo } from 'react';

// ============================================
// Types
// ============================================

export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetKeys?: unknown[];
  variant?: 'full' | 'inline' | 'minimal';
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

// ============================================
// Default Error Fallback Components
// ============================================

interface ErrorFallbackProps {
  error: Error | null;
  resetError: () => void;
  variant: 'full' | 'inline' | 'minimal';
}

function DefaultErrorFallback({ error, resetError, variant }: ErrorFallbackProps) {
  if (variant === 'minimal') {
    return (
      <div className="flex items-center gap-2 p-2 rounded-lg bg-red-500/10 border border-red-500/20">
        <svg className="w-4 h-4 text-red-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <span className="text-xs text-red-300">Error loading</span>
        <button
          onClick={resetError}
          className="text-xs text-cyan-400 hover:text-cyan-300 underline"
        >
          Retry
        </button>
      </div>
    );
  }

  if (variant === 'inline') {
    return (
      <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-red-500/20">
            <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-red-300">Something went wrong</h3>
            <p className="mt-1 text-xs text-gray-400 truncate">
              {error?.message || 'An unexpected error occurred'}
            </p>
            <button
              onClick={resetError}
              className="mt-2 px-3 py-1.5 text-xs font-medium text-white bg-red-600 hover:bg-red-500 rounded-lg transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Full variant
  return (
    <div className="flex items-center justify-center min-h-[300px] p-8">
      <div className="max-w-md w-full text-center">
        {/* Error Icon */}
        <div className="mx-auto w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mb-6">
          <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>

        {/* Title */}
        <h2 className="text-xl font-semibold text-white mb-2">
          Oops! Something went wrong
        </h2>

        {/* Error Message */}
        <p className="text-sm text-gray-400 mb-6">
          {error?.message || 'An unexpected error occurred while loading this content.'}
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={resetError}
            className="px-5 py-2.5 text-sm font-medium text-gray-900 bg-gradient-to-br from-cyan-400 to-cyan-500 rounded-xl hover:shadow-lg hover:shadow-cyan-500/25 transition-all"
          >
            Try Again
          </button>
          <button
            onClick={() => window.location.reload()}
            className="px-5 py-2.5 text-sm font-medium text-gray-300 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all"
          >
            Reload Page
          </button>
        </div>

        {/* Technical Details (collapsible) */}
        {error && process.env.NODE_ENV === 'development' && (
          <details className="mt-6 text-left">
            <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-400">
              Technical details
            </summary>
            <pre className="mt-2 p-3 text-xs text-red-300 bg-red-500/10 rounded-lg overflow-auto max-h-32">
              {error.stack || error.message}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}

// ============================================
// Error Boundary Class Component
// ============================================

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });

    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log error in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps): void {
    // Reset error state if resetKeys change
    if (this.state.hasError && this.props.resetKeys) {
      const prevResetKeys = prevProps.resetKeys || [];
      const hasChangedKey = this.props.resetKeys.some(
        (key, index) => key !== prevResetKeys[index]
      );
      if (hasChangedKey) {
        this.resetError();
      }
    }
  }

  resetError = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render(): ReactNode {
    const { hasError, error } = this.state;
    const { children, fallback, variant = 'full' } = this.props;

    if (hasError) {
      // Use custom fallback if provided
      if (fallback) {
        return fallback;
      }

      // Use default fallback
      return (
        <DefaultErrorFallback
          error={error}
          resetError={this.resetError}
          variant={variant}
        />
      );
    }

    return children;
  }
}

// ============================================
// Functional Wrapper for Hooks Support
// ============================================

interface WithErrorBoundaryOptions {
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  variant?: 'full' | 'inline' | 'minimal';
}

export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  options: WithErrorBoundaryOptions = {}
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary
      fallback={options.fallback}
      onError={options.onError}
      variant={options.variant}
    >
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name || 'Component'})`;

  return WrappedComponent;
}

// ============================================
// Exports
// ============================================

export default ErrorBoundary;
