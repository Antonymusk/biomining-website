import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { logger } from '../lib/logger';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, isChunkError: false };
  }

  static getDerivedStateFromError(error) {
    const errorStr = error?.message || error?.toString() || '';
    // Detect dynamic import and chunk loading failures caused by new deployments
    const isChunkError = 
      /Failed to fetch dynamically imported module/i.test(errorStr) ||
      /Importing a module script failed/i.test(errorStr) ||
      /Loading chunk/i.test(errorStr);

    return { hasError: true, error, isChunkError };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    logger.error('App-Level ErrorBoundary', error.toString(), errorInfo?.componentStack);
  }

  render() {
    if (this.state.hasError) {
      const { isChunkError } = this.state;

      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-dark-bg p-6 text-center">
          <div className={`bg-dark-card border ${isChunkError ? 'border-primary/30' : 'border-danger/30'} rounded-2xl p-8 max-w-md w-full shadow-2xl transition-all duration-300`}>
            <div className={`flex justify-center mb-6 ${isChunkError ? 'text-primary' : 'text-danger'}`}>
              {isChunkError ? (
                <div className="p-4 bg-primary/10 rounded-full animate-pulse">
                  <RefreshCw size={48} className="animate-spin" style={{ animationDuration: '3s' }} />
                </div>
              ) : (
                <AlertTriangle size={64} />
              )}
            </div>
            
            <h1 className="text-2xl font-bold text-white mb-2">
              {isChunkError ? 'Platform Update Ready' : 'Something went wrong'}
            </h1>
            
            <p className="text-gray-400 mb-6 text-sm leading-relaxed">
              {isChunkError 
                ? 'A new version of the BioMine platform has been securely deployed. A quick synchronization is needed to launch the latest interface updates.'
                : 'The application encountered an unexpected operational error. Please refresh the application to try again.'}
            </p>
            
            <button 
              onClick={() => {
                // Clear any stored session reload flags to allow fresh attempts
                sessionStorage.removeItem('biomine-app-asset-reload');
                window.location.reload();
              }}
              className={`w-full py-3.5 ${isChunkError ? 'bg-primary hover:bg-primary/90' : 'bg-danger hover:bg-danger/90'} text-white rounded-xl transition-all duration-200 flex items-center justify-center gap-2 font-semibold shadow-lg active:scale-[0.99]`}
            >
              <RefreshCw size={18} className={isChunkError ? "animate-spin" : ""} />
              {isChunkError ? 'Synchronize & Launch Dashboard' : 'Reload Application'}
            </button>

            {this.state.error && !isChunkError && (
              <div className="mt-6 text-left p-3 bg-dark-bg/80 rounded-lg border border-dark-border overflow-auto max-h-32 text-xs text-danger font-mono">
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
