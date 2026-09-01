import React, { Component, ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * 错误边界组件
 * 捕获子组件树中的 JavaScript 错误，记录错误，并显示备用 UI
 */
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
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // 记录到错误监控服务（如果可用）
    if (window.navigator.sendBeacon) {
      const errorData = JSON.stringify({
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
      });
      
      try {
        window.navigator.sendBeacon('/api/errors', errorData);
      } catch (e) {
        console.warn('Failed to send error to server:', e);
      }
    }

    // 调用自定义错误处理器
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    this.setState({
      errorInfo,
    });
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // 如果提供了自定义的 fallback
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // 默认错误 UI
      return (
        <div style={{
          padding: '20px',
          margin: '20px',
          border: '2px solid #ff4d4f',
          borderRadius: '8px',
          backgroundColor: '#fff2f0',
          textAlign: 'center',
        }}>
          <h2 style={{ color: '#cf1322', margin: '0 0 10px 0' }}>
            ⚠️ something went wrong
          </h2>
          <p style={{ color: '#555', margin: '0 0 10px 0' }}>
            The application encountered an unexpected error.
          </p>
          {this.state.error && (
            <div style={{
              padding: '10px',
              margin: '10px 0',
              backgroundColor: '#fff',
              border: '1px solid #ffa39e',
              borderRadius: '4px',
              textAlign: 'left',
              fontFamily: 'monospace',
              fontSize: '12px',
              overflow: 'auto',
              maxHeight: '200px',
            }}>
              <strong>Error:</strong> {this.state.error.message}
            </div>
          )}
          <button
            onClick={this.handleReset}
            style={{
              padding: '8px 16px',
              fontSize: '14px',
              cursor: 'pointer',
              backgroundColor: '#1890ff',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
            }}
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * 函数式错误边界 Hook
 */
export function useErrorHandler(error: Error | null): void {
  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);
}

/**
 * 高阶组件：为组件添加错误边界
 */
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  fallback?: ReactNode
): React.ComponentType<P> {
  return function WithErrorBoundary(props: P) {
    return (
      <ErrorBoundary fallback={fallback}>
        <WrappedComponent {...props} />
      </ErrorBoundary>
    );
  };
}
