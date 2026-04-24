import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../utils/supabaseClient';

export interface CompanyUpdate {
  id: string;
  company_id: string;
  author_id: string;
  title: string;
  body: string;
  pinned: boolean;
  published_at: string;
  created_at: string;
  updated_at: string;
}

export function useCompanyUpdates(companyId: string | null | undefined) {
  const [updates, setUpdates] = useState<CompanyUpdate[]>([]);
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
      const { data, error: err } = await supabase
        .from('company_updates')
        .select('*')
        .eq('company_id', companyId)
        .order('pinned', { ascending: false })
        .order('published_at', { ascending: false });
      if (err) throw err;
      setUpdates((data as CompanyUpdate[]) ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load updates');
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    load();
  }, [load]);

  return { updates, loading, error, refresh: load };
}
