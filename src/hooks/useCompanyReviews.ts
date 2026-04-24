import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import { useAuth } from '../contexts/AuthContext';

export interface CompanyReview {
  id: string;
  company_id: string;
  author_id: string;
  rating_overall: number;
  rating_work_life: number | null;
  rating_compensation: number | null;
  rating_management: number | null;
  rating_culture: number | null;
  rating_career_growth: number | null;
  title: string;
  pros: string | null;
  cons: string | null;
  employment_status: 'current' | 'former' | null;
  job_title: string | null;
  is_anonymous: boolean;
  status: 'pending' | 'approved' | 'rejected';
  rejected_reason: string | null;
  created_at: string;
  updated_at: string;
  response?: {
    body: string;
    created_at: string;
    responder_id: string;
  } | null;
}

export function useCompanyReviews(companyId: string | null | undefined) {
  const { user } = useAuth();
  const [approved, setApproved] = useState<CompanyReview[]>([]);
  const [own, setOwn] = useState<CompanyReview | null>(null);
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

      // Approved reviews + their responses (RLS will filter correctly)
      const { data: approvedData, error: approvedErr } = await supabase
        .from('company_reviews')
        .select(
          `*, response:company_review_responses(body, created_at, responder_id)`,
        )
        .eq('company_id', companyId)
        .eq('status', 'approved')
        .order('created_at', { ascending: false });
      if (approvedErr) throw approvedErr;

      const normalized = (approvedData ?? []).map((r: any) => ({
        ...r,
        response: Array.isArray(r.response) ? r.response[0] ?? null : r.response ?? null,
      })) as CompanyReview[];
      setApproved(normalized);

      // Own review (any status)
      if (user?.id) {
        const { data: ownData } = await supabase
          .from('company_reviews')
          .select('*')
          .eq('company_id', companyId)
          .eq('author_id', user.id)
          .maybeSingle();
        setOwn((ownData as CompanyReview) ?? null);
      } else {
        setOwn(null);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load reviews');
    } finally {
      setLoading(false);
    }
  }, [companyId, user?.id]);

  useEffect(() => {
    load();
  }, [load]);

  return { approved, own, loading, error, refresh: load };
}
