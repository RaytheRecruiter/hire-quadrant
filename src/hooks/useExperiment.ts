import { useEffect, useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import { useAuth } from '../contexts/AuthContext';

// Sticky A/B assignment: looks up existing assignment in
// experiment_assignments, or hashes subjectId % traffic_percent and
// picks a variant. Falls back to 'control' if the experiment is disabled
// or the table isn't reachable.

const SESSION_KEY = 'hq-event-session-id';

function anonymousSubjectId(): string {
  if (typeof window === 'undefined') return 'server';
  let id = sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

function simpleHash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

interface Experiment {
  key: string;
  variants: string[];
  traffic_percent: number;
  active: boolean;
}

export function useExperiment(key: string, fallback = 'control'): string {
  const { user } = useAuth();
  const [variant, setVariant] = useState<string>(fallback);

  useEffect(() => {
    const subject = user?.id ?? anonymousSubjectId();
    let cancelled = false;
    (async () => {
      const { data: exp } = await supabase
        .from('experiments')
        .select('key, variants, traffic_percent, active')
        .eq('key', key)
        .maybeSingle();
      if (cancelled) return;
      const experiment = exp as Experiment | null;
      if (!experiment || !experiment.active) {
        setVariant(fallback);
        return;
      }

      const { data: existing } = await supabase
        .from('experiment_assignments')
        .select('variant')
        .eq('experiment_key', key)
        .eq('subject_id', subject)
        .maybeSingle();
      if (cancelled) return;
      if (existing?.variant) {
        setVariant(existing.variant);
        return;
      }

      const bucket = simpleHash(key + ':' + subject) % 100;
      if (bucket >= experiment.traffic_percent) {
        setVariant(fallback);
        return;
      }
      const variants = experiment.variants && experiment.variants.length > 0 ? experiment.variants : [fallback];
      const picked = variants[simpleHash(subject + ':' + key) % variants.length];
      setVariant(picked);
      await supabase.from('experiment_assignments').upsert(
        { experiment_key: key, subject_id: subject, variant: picked },
        { onConflict: 'experiment_key,subject_id' },
      );
    })();
    return () => {
      cancelled = true;
    };
  }, [key, user?.id, fallback]);

  return variant;
}
