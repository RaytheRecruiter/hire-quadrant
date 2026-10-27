import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../utils/supabaseClient';

// Scott/Ray QA (2026-10-27): admin "Job Performance" table showed as
// "cut off" with missing data, and the Overview stat card read "Total
// Jobs: 1000" against a real jobs table of 2,551 rows. Root cause: every
// query below was a bare `.select('*')` with no `.range()`/`.limit()` and
// no `.order()`, so PostgREST silently applied its server-side default
// row cap (1000) and handed back an arbitrary, unordered slice. This
// quietly undercounted every admin-side total (stats, Job Performance,
// Source Performance) derived from `jobs`, not just the table rendering.
// Page through in batches instead of trusting a single unbounded select.
const PAGE_SIZE = 1000;

async function fetchAllRows<T>(
  table: string,
  select: string,
  orderBy?: { column: string; ascending?: boolean },
): Promise<{ data: T[]; error: { message: string } | null }> {
  const rows: T[] = [];
  let from = 0;
  for (;;) {
    let query = supabase.from(table).select(select).range(from, from + PAGE_SIZE - 1);
    if (orderBy) query = query.order(orderBy.column, { ascending: orderBy.ascending ?? true });
    const { data, error } = await query;
    if (error) return { data: rows, error };
    const batch = (data ?? []) as T[];
    rows.push(...batch);
    if (batch.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }
  return { data: rows, error: null };
}

export interface AdminJob {
  id: string;
  title: string;
  company: string;
  description?: string;
  location?: string;
  type?: string;
  salary?: string;
  source_company?: string;
  posted_date?: string;
  external_job_id?: string;
  external_url?: string;
  source_xml_file?: string;
  views?: number;
  applications?: number;
}

export interface AdminApplication {
  id: string;
  job_id: string;
  user_id: string;
  user_name?: string;
  user_email?: string;
  status: string;
  applied_at: string;
  source_company?: string;
  // The resume attached to this specific application (can differ from the
  // candidate's profile resume) — Ray 2026-08-14.
  resume_url?: string | null;
}

export interface AdminUserProfile {
  id: string;
  user_id: string;
  name: string;
  email?: string;
  role: string;
  company_id?: string;
  created_at: string;
}

export interface AdminCandidate {
  id: string;
  name?: string;
  email?: string;
  [key: string]: any;
}

export function useAdminData() {
  const [jobs, setJobs] = useState<AdminJob[]>([]);
  const [applications, setApplications] = useState<AdminApplication[]>([]);
  const [candidates, setCandidates] = useState<AdminCandidate[]>([]);
  const [userProfiles, setUserProfiles] = useState<AdminUserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [jobsResult, applicationsResult, profilesResult, candidatesResult] = await Promise.all([
        fetchAllRows<AdminJob>('jobs', '*', { column: 'id' }),
        fetchAllRows<AdminApplication>('job_applications', '*', { column: 'applied_at', ascending: false }),
        fetchAllRows<AdminUserProfile>('user_profiles', '*', { column: 'id' }),
        fetchAllRows<AdminCandidate>('candidates', '*', { column: 'user_id' }),
      ]);

      if (jobsResult.error) throw new Error(`Jobs fetch failed: ${jobsResult.error.message}`);
      if (applicationsResult.error) throw new Error(`Applications fetch failed: ${applicationsResult.error.message}`);
      if (profilesResult.error) throw new Error(`User profiles fetch failed: ${profilesResult.error.message}`);
      // candidates table may not exist yet, so we handle this gracefully
      if (candidatesResult.error) {
        console.warn('Candidates fetch warning:', candidatesResult.error.message);
      }

      setJobs(jobsResult.data || []);
      setApplications(applicationsResult.data || []);
      setUserProfiles(profilesResult.data || []);
      setCandidates(candidatesResult.data || []);
    } catch (err: any) {
      console.error('Error fetching admin data:', err);
      setError(err.message || 'Failed to fetch admin data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const updateApplicationStatus = useCallback(async (id: string, status: string) => {
    const { error: updateError } = await supabase
      .from('job_applications')
      .update({ status })
      .eq('id', id);

    if (updateError) {
      console.error('Error updating application status:', updateError);
      throw updateError;
    }

    // Update local state optimistically
    setApplications(prev =>
      prev.map(app => (app.id === id ? { ...app, status } : app))
    );
  }, []);

  const refreshData = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return {
    jobs,
    applications,
    candidates,
    userProfiles,
    loading,
    error,
    updateApplicationStatus,
    refreshData,
  };
}
