import React, { useState } from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

export default function ErrorBoundary({ children }: ErrorBoundaryProps) {
  const [error, setError] = useState<Error | null>(null);

  const handleOnError = React.useCallback((event: ErrorEvent) => {
    event.preventDefault();
    setError(event.error);
  }, []);

  const handleReset = () => {
    setError(null);
  };

  React.useEffect(() => {
    if (!error) {
      window.addEventListener('error', handleOnError);
      return () => window.removeEventListener('error', handleOnError);
    }
  }, [error, handleOnError]);

  React.useEffect(() => {
    if (!error) {
      const handler = (event: PromiseRejectionEvent) => {
        event.preventDefault();
        setError(event.reason instanceof Error ? event.reason : new Error(String(event.reason)));
      };
      window.addEventListener('unhandledrejection', handler);
      return () => window.removeEventListener('unhandledrejection', handler);
    }
  }, [error]);

  if (error) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-bg-app text-text-secondary p-8">
        <div className="max-w-md text-center space-y-4">
          <div className="text-4xl font-bold text-text-dim">⚠</div>
          <h1 className="text-lg font-bold text-text-primary">Something went wrong</h1>
          <p className="text-sm text-text-muted font-mono">
            {error.message || 'An unexpected error occurred'}
          </p>
          <button
            onClick={handleReset}
            className="px-6 py-2 bg-white text-black font-bold rounded-lg hover:bg-white/90 transition-all text-sm"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return children;
}
