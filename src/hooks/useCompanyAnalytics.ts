import { useEffect, useState } from 'react';
import { supabase } from '../utils/supabaseClient';

export interface CompanyAnalytics {
  total_views_30d: number;
  review_count: number;
  avg_rating: number;
  follower_count: number;
}

export function useCompanyAnalytics(companyId: string | null | undefined) {
  const [stats, setStats] = useState<CompanyAnalytics | null>(null);
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
        const { data, error: err } = await supabase.rpc('get_company_dashboard_stats', {
          target_company_id: companyId,
        });
        if (err) throw err;
        const result = data as { error?: string } & CompanyAnalytics;
        if (result?.error) throw new Error(result.error);
        if (!cancelled) setStats(result as CompanyAnalytics);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load analytics');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [companyId]);

  return { stats, loading, error };
}
