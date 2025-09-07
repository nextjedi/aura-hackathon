import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary bg-red-500/20 border border-red-500/30 rounded-lg p-4">
          <div className="text-red-300 mb-2">
            <h3 className="text-lg font-semibold">⚠️ Component Error</h3>
            <p className="text-sm">Something went wrong in this component.</p>
          </div>
          
          {this.props.fallback ? (
            this.props.fallback
          ) : (
            <div className="mt-3">
              <button
                onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
                className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition-colors"
              >
                Try Again
              </button>
            </div>
          )}

          {process.env.NODE_ENV === 'development' && (
            <details className="mt-3 text-xs">
              <summary className="cursor-pointer text-red-400">Technical Details</summary>
              <div className="mt-2 p-2 bg-gray-900/50 rounded text-gray-300 font-mono">
                {this.state.error && this.state.error.toString()}
                <br />
                {this.state.errorInfo.componentStack}
              </div>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;