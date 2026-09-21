import React, { Component } from 'react';

class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        // Filter out iframe-related errors (these are usually from HMR or extensions)
        if (error?.message?.includes('iframe') || error?.message?.includes('postMessage')) {
            console.warn('Iframe-related error caught (likely from HMR or extension):', error.message);
            this.setState({ hasError: false });
            return;
        }

        this.setState({
            error: error,
            errorInfo: errorInfo
        });

        console.error('Error caught by boundary:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    padding: '40px',
                    textAlign: 'center',
                    background: '#1E293B',
                    color: '#fff',
                    borderRadius: '16px',
                    margin: '20px'
                }}>
                    <h2 style={{ color: '#EF4444', marginBottom: '16px' }}>Something went wrong</h2>
                    <p style={{ color: '#94A3B8', marginBottom: '20px' }}>
                        The application encountered an error. Please try refreshing the page.
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        style={{
                            padding: '12px 24px',
                            background: '#3B82F6',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '16px',
                            cursor: 'pointer'
                        }}
                    >
                        Refresh Page
                    </button>
                    {this.state.error && (
                        <details style={{ marginTop: '20px', textAlign: 'left' }}>
                            <summary style={{ cursor: 'pointer', color: '#64748B' }}>Error Details</summary>
                            <pre style={{
                                fontSize: '12px',
                                color: '#EF4444',
                                marginTop: '10px',
                                padding: '10px',
                                background: '#0F172A',
                                borderRadius: '8px',
                                overflow: 'auto'
                            }}>
                                {this.state.error.toString()}
                                {this.state.errorInfo?.componentStack}
                            </pre>
                        </details>
                    )}
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
