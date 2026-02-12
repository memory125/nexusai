import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-screen w-screen items-center justify-center p-4" style={{ background: 'var(--t-bg)' }}>
          <div className="glass-card max-w-md w-full rounded-2xl p-8 text-center">
            <div className="mb-4 text-6xl">💥</div>
            <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--t-text)' }}>
              出错了
            </h2>
            <p className="text-sm mb-4" style={{ color: 'var(--t-text-secondary)' }}>
              应用遇到了意外错误，请刷新页面重试
            </p>
            <button
              onClick={() => window.location.reload()}
              className="glass-btn-primary px-6 py-2 rounded-lg text-sm font-medium"
            >
              刷新页面
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
