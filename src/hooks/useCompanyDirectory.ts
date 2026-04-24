import { useEffect, useState } from 'react';
import { supabase } from '../utils/supabaseClient';

export interface DirectoryCompany {
  id: string;
  slug: string;
  name: string;
  display_name: string;
  logo: string | null;
  industry: string | null;
  size: string | null;
  location: string | null;
  description: string | null;
  claimed_at: string | null;
  job_count: number;
  review_count: number;
  avg_rating: number;
}

export function useCompanyDirectory() {
  const [companies, setCompanies] = useState<DirectoryCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const { data, error: err } = await supabase
          .from('public_company_directory')
          .select('*')
          .order('job_count', { ascending: false })
          .order('review_count', { ascending: false });
        if (err) throw err;
        if (!cancelled) setCompanies(data ?? []);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load companies');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { companies, loading, error };
}
