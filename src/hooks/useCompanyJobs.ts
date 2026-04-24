import { useEffect, useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import type { Job } from '../contexts/JobContext';

// Fetches every job for a specific company directly (bypasses the
// paginated JobContext, which only holds the current directory page
// and would make CompanyProfile miss most of an employer's roles).
export function useCompanyJobs(
  params: {
    companyId: string | null | undefined;
    companyName?: string | null;
    companyDisplayName?: string | null;
  },
  limit = 500,
) {
  const { companyId, companyName, companyDisplayName } = params;
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!companyId && !companyName && !companyDisplayName) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);

        let query = supabase
          .from('jobs')
          .select(
            'id, title, company, location, type, salary, posted_date, description, external_job_id, external_url, source_company, source_xml_file, company_id, is_sponsored, sponsor_tier',
          )
          .order('posted_date', { ascending: false })
          .limit(limit);

        // Prefer FK match; fall back to name match for legacy rows where
        // company_id was never backfilled.
        if (companyId) {
          const names = [companyName, companyDisplayName]
            .filter((n): n is string => !!n)
            .map((n) => n.replace(/,/g, '\\,'));
          if (names.length > 0) {
            query = query.or(`company_id.eq.${companyId},company.in.(${names.join(',')})`);
          } else {
            query = query.eq('company_id', companyId);
          }
        } else if (companyName || companyDisplayName) {
          const names = [companyName, companyDisplayName]
            .filter((n): n is string => !!n)
            .map((n) => n.replace(/,/g, '\\,'));
          query = query.in('company', names);
        }

        const { data, error: err } = await query;
        if (err) throw err;
        if (!cancelled) setJobs((data ?? []) as Job[]);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load jobs');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [companyId, companyName, companyDisplayName, limit]);

  return { jobs, loading, error };
}
