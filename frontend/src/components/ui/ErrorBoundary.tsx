'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode | ((error: Error, reset: () => void) => ReactNode);
  componentName?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Structured browser console error logging
    console.error(`[ErrorBoundary${this.props.componentName ? ` - ${this.props.componentName}` : ''}] caught error:`, error, errorInfo);
  }

  reset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (typeof this.props.fallback === 'function') {
        return this.props.fallback(this.state.error, this.reset);
      }
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          role="alert"
          aria-live="assertive"
          className="p-6 my-4 bg-white border border-red-200 rounded-lg shadow-xs max-w-xl mx-auto text-left"
        >
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-red-50 text-red-600 rounded-md shrink-0">
              <AlertTriangle className="w-5 h-5" aria-hidden="true" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-sm font-semibold text-slate-900">
                {this.props.componentName
                  ? `Component Error: ${this.props.componentName}`
                  : 'An unexpected application error occurred'}
              </h2>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                This component encountered a rendering issue. Other parts of the application remain fully functional.
              </p>
              
              <details className="mt-2.5">
                <summary className="text-[11px] font-medium text-slate-500 hover:text-slate-800 cursor-pointer">
                  Technical details
                </summary>
                <pre className="mt-1.5 p-2.5 bg-slate-50 border border-slate-200 rounded text-[11px] font-mono text-red-700 overflow-x-auto whitespace-pre-wrap">
                  {this.state.error.message}
                </pre>
              </details>

              <div className="mt-3.5">
                <button
                  type="button"
                  onClick={this.reset}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-md shadow-xs transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Retry Component</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
