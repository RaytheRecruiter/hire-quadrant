import { useEffect, useState } from 'react';
import { supabase } from '../utils/supabaseClient';

export interface TimePoint {
  date: string; // YYYY-MM-DD
  views: number;
  new_followers: number;
}

export function useCompanyAnalyticsTimeseries(
  companyId: string | null | undefined,
  days = 30,
) {
  const [series, setSeries] = useState<TimePoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!companyId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

        const [viewsRes, followersRes] = await Promise.all([
          supabase
            .from('company_page_views')
            .select('viewed_at')
            .eq('company_id', companyId)
            .gte('viewed_at', since)
            .limit(50000),
          supabase
            .from('company_followers')
            .select('created_at')
            .eq('company_id', companyId)
            .gte('created_at', since)
            .limit(50000),
        ]);

        if (viewsRes.error) throw viewsRes.error;
        if (followersRes.error) throw followersRes.error;

        const buckets = new Map<string, TimePoint>();
        for (let i = days - 1; i >= 0; i--) {
          const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
          const key = d.toISOString().slice(0, 10);
          buckets.set(key, { date: key, views: 0, new_followers: 0 });
        }

        (viewsRes.data ?? []).forEach((row: { viewed_at: string }) => {
          const key = row.viewed_at.slice(0, 10);
          const pt = buckets.get(key);
          if (pt) pt.views += 1;
        });
        (followersRes.data ?? []).forEach((row: { created_at: string }) => {
          const key = row.created_at.slice(0, 10);
          const pt = buckets.get(key);
          if (pt) pt.new_followers += 1;
        });

        if (!cancelled) setSeries(Array.from(buckets.values()));
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load analytics');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [companyId, days]);

  return { series, loading, error };
}
