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

        const select =
          'id, title, company, location, type, salary, posted_date, description, external_job_id, external_url, source_company, source_xml_file, company_id, is_sponsored, sponsor_tier';

        let rows: Job[] = [];

        // Primary path: FK match. Fast, covers all rows the Phase 5
        // backfill linked up.
        if (companyId) {
          const { data, error: err } = await supabase
            .from('jobs')
            .select(select)
            .eq('company_id', companyId)
            .order('posted_date', { ascending: false })
            .limit(limit);
          if (err) throw err;
          rows = (data ?? []) as Job[];
        }

        // Fallback: name match. Covers legacy rows the backfill missed
        // (edge cases with trailing whitespace, slug collisions, etc.).
        // Only runs when the FK path returned nothing so commas/special
        // chars in company names can't break the query.
        if (rows.length === 0) {
          const names = Array.from(
            new Set([companyName, companyDisplayName].filter((n): n is string => !!n && n.length > 0)),
          );
          for (const name of names) {
            const { data, error: err } = await supabase
              .from('jobs')
              .select(select)
              .eq('company', name)
              .order('posted_date', { ascending: false })
              .limit(limit);
            if (err) continue; // soft-fail; keep any rows we already have
            const found = (data ?? []) as Job[];
            if (found.length > 0) {
              rows = found;
              break;
            }
          }
        }

        if (!cancelled) setJobs(rows);
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
