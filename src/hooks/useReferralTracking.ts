import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';

const REF_KEY = 'hq-referral-code';
const REF_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

// Capture ?ref=CODE from the URL, store it in localStorage, and fire the
// click-tracking RPC. Called from JobDetails page.
export function useReferralTracking(): string | null {
  const [params] = useSearchParams();

  useEffect(() => {
    const code = params.get('ref');
    if (code && code.length > 0) {
      try {
        localStorage.setItem(
          REF_KEY,
          JSON.stringify({ code, at: Date.now() }),
        );
      } catch {
        // ignore
      }
      supabase.rpc('track_referral_click', { p_code: code }).then(() => undefined);
    }
  }, [params]);

  try {
    const raw = localStorage.getItem(REF_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { code: string; at: number };
    if (Date.now() - parsed.at > REF_TTL_MS) {
      localStorage.removeItem(REF_KEY);
      return null;
    }
    return parsed.code;
  } catch {
    return null;
  }
}

export async function attachStoredReferral(userId: string): Promise<void> {
  try {
    const raw = localStorage.getItem(REF_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as { code: string; at: number };
    await supabase.rpc('attach_referral_to_application', {
      p_code: parsed.code,
      p_referee_id: userId,
    });
  } catch {
    // swallow
  }
}
