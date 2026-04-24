import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import type { CompanyReview } from './useCompanyReviews';

export function useCompanyDashboardReviews(companyId: string | null | undefined) {
  const [reviews, setReviews] = useState<CompanyReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!companyId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      // RLS grants company admins SELECT on every status for their company
      const { data, error: err } = await supabase
        .from('company_reviews')
        .select(`*, response:company_review_responses(body, created_at, responder_id)`)
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });
      if (err) throw err;
      const normalized = (data ?? []).map((r: any) => ({
        ...r,
        response: Array.isArray(r.response) ? r.response[0] ?? null : r.response ?? null,
      })) as CompanyReview[];
      setReviews(normalized);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load reviews');
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    load();
  }, [load]);

  return { reviews, loading, error, refresh: load };
}
