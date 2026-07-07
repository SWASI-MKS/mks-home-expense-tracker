
import React, { Component, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-8 text-center border border-red-500 rounded-lg bg-red-50 dark:bg-red-950">
          <h2 className="text-xl font-bold text-red-600 dark:text-red-400">
            Transaction Details failed to render
          </h2>
          <p className="mt-2 text-sm text-red-500 dark:text-red-300">
            {this.state.error?.message}
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}
