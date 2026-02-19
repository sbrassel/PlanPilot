'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        console.error('ErrorBoundary caught:', error.message, errorInfo.componentStack);
    }

    handleReload = () => {
        window.location.reload();
    };

    handleReset = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="error-boundary-fallback" style={{
                    maxWidth: '520px',
                    margin: '80px auto',
                    padding: 'var(--space-8)',
                    textAlign: 'center',
                }}>
                    <div style={{ fontSize: '64px', marginBottom: 'var(--space-4)' }}>⚠️</div>
                    <h2 style={{ marginBottom: 'var(--space-3)' }}>Etwas ist schiefgelaufen</h2>
                    <p className="text-secondary" style={{ marginBottom: 'var(--space-6)' }}>
                        Ein unerwarteter Fehler ist aufgetreten. Deine bisherigen Eingaben wurden automatisch gespeichert.
                    </p>
                    <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'center' }}>
                        <button className="btn btn-primary" onClick={this.handleReload}>
                            🔄 Seite neu laden
                        </button>
                        <button className="btn btn-secondary" onClick={this.handleReset}>
                            Erneut versuchen
                        </button>
                    </div>
                    {process.env.NODE_ENV === 'development' && this.state.error && (
                        <details style={{ marginTop: 'var(--space-6)', textAlign: 'left' }}>
                            <summary className="text-sm text-secondary" style={{ cursor: 'pointer' }}>
                                Technische Details (nur Dev)
                            </summary>
                            <pre style={{
                                fontSize: 'var(--text-xs)',
                                background: 'var(--color-surface)',
                                padding: 'var(--space-3)',
                                borderRadius: 'var(--radius-md)',
                                overflow: 'auto',
                                marginTop: 'var(--space-2)',
                            }}>
                                {this.state.error.message}{'\n'}{this.state.error.stack}
                            </pre>
                        </details>
                    )}
                </div>
            );
        }

        return this.props.children;
    }
}
