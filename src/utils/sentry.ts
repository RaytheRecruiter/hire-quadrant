import * as Sentry from '@sentry/react';

export const initializeSentry = () => {
  // Initialize Sentry for error tracking
  // IMPORTANT: Replace YOUR_SENTRY_DSN with your actual Sentry DSN
  // Sign up at: https://sentry.io/ (free plan includes 5,000 errors/month)
  const SENTRY_DSN = 'YOUR_SENTRY_DSN';

  if (SENTRY_DSN && SENTRY_DSN !== 'YOUR_SENTRY_DSN') {
    Sentry.init({
      dsn: SENTRY_DSN,
      environment: process.env.NODE_ENV || 'development',
      integrations: [
        new Sentry.Replay({
          maskAllText: true,
          blockAllMedia: true,
        }),
      ],
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,
      beforeSend(event, hint) {
        // Filter out network errors and other non-critical issues
        if (event.exception) {
          const error = hint.originalException as Error;
          if (error?.message?.includes('NetworkError')) {
            return null; // Skip network errors
          }
        }
        return event;
      },
    });
  }
};

// Capture custom exceptions
export const captureException = (error: Error, context?: Record<string, any>) => {
  Sentry.captureException(error, {
    contexts: context ? { custom: context } : undefined,
  });
};

// Capture messages for debugging
export const captureMessage = (message: string, level: 'info' | 'warning' | 'error' = 'info') => {
  Sentry.captureMessage(message, level);
};

// Set user context for better error tracking
export const setUserContext = (userId: string, email?: string, username?: string) => {
  Sentry.setUser({
    id: userId,
    email,
    username,
  });
};

// Clear user context on logout
export const clearUserContext = () => {
  Sentry.setUser(null);
};
