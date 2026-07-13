'use client';

import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="min-h-screen bg-[var(--bg)] flex flex-col items-center justify-center p-8 font-sans">
            <div className="panel max-w-md w-full p-8 text-center">
              <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center mx-auto mb-4">
                <span className="text-rose-600 text-xl font-bold">!</span>
              </div>
              <h2 className="text-lg font-bold text-[var(--fg)] mb-2">Алдаа гарлаа</h2>
              <p className="text-sm text-[var(--muted-foreground)] mb-6">
                Хуудас ачаалахад техникийн алдаа гарлаа. Дахин оролдоно уу.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="bg-[var(--accent)] text-[var(--accent-foreground)] px-6 py-2 rounded-full font-semibold text-sm hover:opacity-90 transition-all cursor-pointer"
              >
                Дахин ачаалах
              </button>
            </div>
          </div>
        )
      );
    }
    return this.props.children;
  }
}
