import React, { ReactNode, ErrorInfo } from 'react';
import { AlertCircle, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error Boundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} />;
    }

    return this.props.children;
  }
}

const ErrorFallback: React.FC<{ error: Error | null }> = ({ error }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950 px-4">
      <div className="max-w-md text-center">
        <div className="w-16 h-16 mx-auto mb-6 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
          <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
        </div>
        <h1 className="font-display text-2xl font-bold text-secondary-900 dark:text-white mb-2">
          Something went wrong
        </h1>
        <p className="text-secondary-600 dark:text-slate-400 mb-6">
          We encountered an unexpected error. Please try refreshing the page or returning to the home page.
        </p>
        {error && process.env.NODE_ENV === 'development' && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900 rounded-lg p-4 mb-6 text-left">
            <p className="text-xs font-mono text-red-700 dark:text-red-300 whitespace-pre-wrap break-words">
              {error.message}
            </p>
          </div>
        )}
        <div className="flex items-center gap-3 justify-center">
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-lg shadow-soft transition-colors"
          >
            Refresh Page
          </button>
          <button
            onClick={() => { window.location.href = '/'; }}
            className="inline-flex items-center gap-2 px-4 py-2.5 border border-gray-200 dark:border-slate-700 text-secondary-700 dark:text-slate-300 font-semibold rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
          >
            <Home className="h-4 w-4" />
            Home
          </button>
        </div>
      </div>
    </div>
  );
};
