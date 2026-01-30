/**
 * Error Boundary Component
 * Catches React errors and prevents white screen crashes
 */
import React, { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error to console
    console.error('Error Boundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    
    // Reload the page to reset state
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const isDark = document.documentElement.classList.contains('dark');
      
      return (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            padding: '20px',
            backgroundColor: isDark ? '#0f172a' : '#f8fafc',
            color: isDark ? '#f1f5f9' : '#1e293b',
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          <div
            style={{
              maxWidth: '600px',
              padding: '32px',
              backgroundColor: isDark ? '#1e293b' : 'white',
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            }}
          >
            <h1
              style={{
                fontSize: '24px',
                fontWeight: 'bold',
                marginBottom: '16px',
                color: '#ef4444',
              }}
            >
              ⚠️ Something went wrong
            </h1>
            
            <p
              style={{
                fontSize: '16px',
                marginBottom: '24px',
                lineHeight: '1.6',
              }}
            >
              The application encountered an error. Don't worry, your work is auto-saved.
            </p>

            {this.state.error && (
              <details
                style={{
                  marginBottom: '24px',
                  padding: '16px',
                  backgroundColor: isDark ? '#0f172a' : '#f1f5f9',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontFamily: 'monospace',
                }}
              >
                <summary
                  style={{
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    marginBottom: '8px',
                  }}
                >
                  Error Details
                </summary>
                <pre
                  style={{
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    margin: 0,
                  }}
                >
                  {this.state.error.toString()}
                  {this.state.errorInfo && (
                    <>
                      {'\n\n'}
                      {this.state.errorInfo.componentStack}
                    </>
                  )}
                </pre>
              </details>
            )}

            <button
              onClick={this.handleReset}
              style={{
                padding: '12px 24px',
                fontSize: '16px',
                fontWeight: 'bold',
                color: 'white',
                backgroundColor: '#3b82f6',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#2563eb';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#3b82f6';
              }}
            >
              Reload Application
            </button>

            <p
              style={{
                marginTop: '16px',
                fontSize: '14px',
                color: isDark ? '#94a3b8' : '#64748b',
              }}
            >
              If this problem persists, please report it with the error details above.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
