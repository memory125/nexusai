import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

// TypeScript declarations for Vite
declare global {
  interface ImportMetaEnv {
    readonly DEV: boolean;
    readonly PROD: boolean;
  }
  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

// Error logging service
const logError = (error: Error, errorInfo: ErrorInfo) => {
  const errorReport = {
    message: error.message,
    stack: error.stack,
    componentStack: errorInfo.componentStack,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    url: window.location.href,
  };
  
  // In production, send to error tracking service
  if (import.meta.env.PROD) {
    console.error('[ErrorReport]', errorReport);
  } else {
    console.error('[Dev Error]:', errorReport);
  }
};

export class ErrorBoundary extends Component<Props, State> {
  private retryCount = 0;
  private maxRetries = 3;

  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    logError(error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  private handleRetry = () => {
    if (this.retryCount < this.maxRetries) {
      this.retryCount++;
      this.setState({ hasError: false, error: undefined, errorInfo: undefined });
    }
  };

  private handleReset = () => {
    this.retryCount = 0;
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex h-full w-full items-center justify-center p-4">
          <div className="glass-card max-w-lg w-full rounded-2xl p-8 text-center">
            <div className="mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/20 mb-4">
                <AlertTriangle className="w-8 h-8 text-red-400" />
              </div>
              <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--t-text)' }}>
                出现错误
              </h2>
              <p className="text-sm mb-2" style={{ color: 'var(--t-text-secondary)' }}>
                {this.state.error?.message || '应用遇到了意外错误'}
              </p>
              {this.retryCount > 0 && (
                <p className="text-xs text-red-400">
                  重试次数: {this.retryCount}/{this.maxRetries}
                </p>
              )}
            </div>

            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleRetry}
                disabled={this.retryCount >= this.maxRetries}
                className="glass-btn flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
              >
                <RefreshCw className="w-4 h-4" />
                重试
              </button>
              <button
                onClick={this.handleReset}
                className="glass-btn-primary flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
              >
                <Home className="w-4 h-4" />
                返回首页
              </button>
            </div>

            {import.meta.env.DEV && this.state.error && (
              <details className="mt-6 text-left">
                <summary className="text-xs cursor-pointer" style={{ color: 'var(--t-text-muted)' }}>
                  详细信息 (开发模式)
                </summary>
                <pre className="mt-2 p-3 rounded-lg bg-red-500/10 text-xs overflow-auto max-h-40" style={{ color: 'var(--t-text-secondary)' }}>
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook for component-level error handling
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null);

  const handleError = React.useCallback((err: Error) => {
    console.error('[ErrorHandler]', err);
    setError(err);
  }, []);

  const clearError = React.useCallback(() => {
    setError(null);
  }, []);

  return { error, handleError, clearError };
}

// Higher-order component for error boundaries
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  return function WithErrorBoundary(props: P) {
    return (
      <ErrorBoundary {...errorBoundaryProps}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}