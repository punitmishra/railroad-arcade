'use client';

// ============================================
// Global Error Handler (Layout Level)
// ============================================
// Catches errors that occur at the root layout level.
// This is a fallback when the root layout itself fails.

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body style={{
        backgroundColor: '#050508',
        color: 'white',
        fontFamily: 'system-ui, sans-serif',
        margin: 0,
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}>
        <div style={{ textAlign: 'center', maxWidth: '400px' }}>
          {/* Error Icon */}
          <div style={{
            width: '80px',
            height: '80px',
            margin: '0 auto 24px',
            borderRadius: '16px',
            backgroundColor: 'rgba(239, 68, 68, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid rgba(239, 68, 68, 0.3)',
          }}>
            <svg width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="rgba(248, 113, 113, 1)">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>

          {/* Title */}
          <h1 style={{
            fontSize: '24px',
            fontWeight: 'bold',
            marginBottom: '12px',
            fontFamily: 'Orbitron, system-ui, sans-serif',
          }}>
            Critical Error
          </h1>

          {/* Message */}
          <p style={{ color: '#9ca3af', marginBottom: '24px' }}>
            The application encountered a critical error. Please try again.
          </p>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={reset}
              style={{
                padding: '12px 24px',
                fontSize: '14px',
                fontWeight: '600',
                color: '#111827',
                background: 'linear-gradient(to bottom right, #22d3ee, #06b6d4)',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                minHeight: '44px',
              }}
            >
              Try Again
            </button>
            <button
              onClick={() => window.location.href = '/'}
              style={{
                padding: '12px 24px',
                fontSize: '14px',
                fontWeight: '600',
                color: '#d1d5db',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                cursor: 'pointer',
                minHeight: '44px',
              }}
            >
              Return Home
            </button>
          </div>

          {/* Error ID */}
          {error.digest && (
            <p style={{
              marginTop: '24px',
              fontSize: '12px',
              color: '#6b7280'
            }}>
              Error ID: {error.digest}
            </p>
          )}
        </div>
      </body>
    </html>
  );
}
