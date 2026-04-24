import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import { useAuth } from '../contexts/AuthContext';

export interface NotificationPreferences {
  email_job_alerts: boolean;
  email_application_updates: boolean;
  email_messages: boolean;
  email_review_responses: boolean;
  email_marketing: boolean;
  push_enabled: boolean;
  digest_frequency: 'off' | 'daily' | 'weekly';
}

const DEFAULTS: NotificationPreferences = {
  email_job_alerts: true,
  email_application_updates: true,
  email_messages: true,
  email_review_responses: true,
  email_marketing: false,
  push_enabled: false,
  digest_frequency: 'daily',
};

export function useNotificationPreferences() {
  const { user } = useAuth();
  const [prefs, setPrefs] = useState<NotificationPreferences>(DEFAULTS);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      if (!cancelled && data) {
        setPrefs({
          email_job_alerts: data.email_job_alerts,
          email_application_updates: data.email_application_updates,
          email_messages: data.email_messages,
          email_review_responses: data.email_review_responses,
          email_marketing: data.email_marketing,
          push_enabled: data.push_enabled,
          digest_frequency: data.digest_frequency,
        });
      }
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const save = useCallback(
    async (patch: Partial<NotificationPreferences>) => {
      if (!user?.id) return;
      setSaving(true);
      const next = { ...prefs, ...patch };
      setPrefs(next);
      await supabase.from('notification_preferences').upsert(
        { user_id: user.id, ...next, updated_at: new Date().toISOString() },
        { onConflict: 'user_id' },
      );
      setSaving(false);
    },
    [user?.id, prefs],
  );

  return { prefs, save, loading, saving };
}
