// Lightweight window error + unhandled-rejection capture that writes to
// the client_errors Supabase table. Replaces Sentry for MVP. Silent on
// failure so instrumentation never takes the site down.

import { supabase } from './supabaseClient';

const SESSION_KEY = 'hq-event-session-id';

function getSessionId(): string {
  if (typeof window === 'undefined') return 'server';
  let id = sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

async function log(message: string, stack: string | undefined, severity: 'error' | 'warning' = 'error') {
  try {
    const { data: session } = await supabase.auth.getSession();
    await supabase.from('client_errors').insert({
      user_id: session?.session?.user?.id ?? null,
      session_id: getSessionId(),
      message: message.slice(0, 500),
      stack: stack?.slice(0, 4000) ?? null,
      url: typeof window !== 'undefined' ? window.location.pathname : null,
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 200) : null,
      severity,
    });
  } catch {
    // swallow
  }
}

let installed = false;

export function installErrorCapture(): void {
  if (installed || typeof window === 'undefined') return;
  installed = true;

  window.addEventListener('error', (e) => {
    if (!e.message) return;
    log(e.message, e.error?.stack);
  });

  window.addEventListener('unhandledrejection', (e) => {
    const reason = e.reason;
    const message = typeof reason === 'string' ? reason : reason?.message ?? 'Unhandled rejection';
    const stack = reason?.stack;
    log(message, stack);
  });
}
