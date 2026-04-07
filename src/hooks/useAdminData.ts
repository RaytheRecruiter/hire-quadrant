import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../utils/supabaseClient';

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
        supabase.from('jobs').select('*'),
        supabase.from('job_applications').select('*').order('applied_at', { ascending: false }),
        supabase.from('user_profiles').select('*'),
        supabase.from('candidates').select('*'),
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
