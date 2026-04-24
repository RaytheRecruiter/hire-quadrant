// Fire-and-forget event logger. Silently drops on failure so it never
// blocks the UX. Uses sessionStorage for a session id, generated once.

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

export async function logEvent(
  event_type: string,
  properties: Record<string, unknown> = {},
): Promise<void> {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const user_id = sessionData?.session?.user?.id ?? null;
    await supabase.from('app_events').insert({
      user_id,
      session_id: getSessionId(),
      event_type,
      properties,
      url: typeof window !== 'undefined' ? window.location.pathname : null,
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 200) : null,
    });
  } catch {
    // swallow
  }
}
