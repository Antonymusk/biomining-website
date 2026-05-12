import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { logger } from '../lib/logger';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    logger.error('App-Level ErrorBoundary', error.toString(), errorInfo?.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-dark-bg p-6 text-center">
          <div className="bg-dark-card border border-danger/30 rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <div className="flex justify-center mb-6 text-danger">
              <AlertTriangle size={64} />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Something went wrong</h1>
            <p className="text-gray-400 mb-6 text-sm">
              The application encountered an unexpected error. Please refresh the page to try again.
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="w-full py-3 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 font-medium"
            >
              <RefreshCw size={18} />
              Reload Application
            </button>
            {this.state.error && (
              <div className="mt-6 text-left p-3 bg-dark-bg rounded-lg border border-dark-border overflow-auto max-h-32 text-xs text-danger font-mono">
                {this.state.error.toString()}
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children; 
  }
}
