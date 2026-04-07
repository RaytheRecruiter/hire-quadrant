import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../utils/supabaseClient';

interface DashboardUser {
  id: string;
  companyId?: string;
  role: string;
}

export const useCompanyDashboard = (user: DashboardUser | null) => {
  const [company, setCompany] = useState<any>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!user?.companyId) {
      setLoading(false);
      setError('No company associated with this account');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch company data
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .select('*')
        .eq('id', user.companyId)
        .single();

      if (companyError) {
        console.error('Error fetching company:', companyError);
        setError('Failed to load company data');
        setLoading(false);
        return;
      }

      setCompany(companyData);
      const companyName = companyData?.name || companyData?.display_name || '';

      // Fetch jobs for this company
      const { data: allJobs, error: jobsError } = await supabase
        .from('jobs')
        .select('*');

      if (jobsError) {
        console.error('Error fetching jobs:', jobsError);
        setError('Failed to load jobs');
        setLoading(false);
        return;
      }

      const companyJobs = (allJobs || []).filter(
        (job: any) =>
          job.source_company === companyName ||
          job.company === companyName
      );
      setJobs(companyJobs);

      // Fetch applications for those jobs
      if (companyJobs.length > 0) {
        const jobIds = companyJobs.map((j: any) => j.id);
        const { data: appsData, error: appsError } = await supabase
          .from('job_applications')
          .select('*');

        if (appsError) {
          console.error('Error fetching applications:', appsError);
        } else {
          const filteredApps = (appsData || []).filter((app: any) =>
            jobIds.includes(app.job_id)
          );
          setApplications(filteredApps);
        }
      } else {
        setApplications([]);
      }
    } catch (err) {
      console.error('Error in useCompanyDashboard:', err);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }, [user?.companyId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const updateCompanyProfile = async (updates: Record<string, any>) => {
    if (!user?.companyId) return;

    try {
      const { error: updateError } = await supabase
        .from('companies')
        .update(updates)
        .eq('id', user.companyId);

      if (updateError) {
        console.error('Error updating company profile:', updateError);
        throw new Error('Failed to update company profile');
      }

      setCompany((prev: any) => (prev ? { ...prev, ...updates } : prev));
    } catch (err) {
      throw err;
    }
  };

  const updateApplicationStatus = async (id: string, status: string) => {
    try {
      const { error: updateError } = await supabase
        .from('job_applications')
        .update({ status })
        .eq('id', id);

      if (updateError) {
        console.error('Error updating application status:', updateError);
        throw new Error('Failed to update application status');
      }

      setApplications((prev) =>
        prev.map((app) => (app.id === id ? { ...app, status } : app))
      );
    } catch (err) {
      throw err;
    }
  };

  const refreshData = () => {
    fetchData();
  };

  return {
    company,
    jobs,
    applications,
    loading,
    error,
    updateCompanyProfile,
    updateApplicationStatus,
    refreshData,
  };
};
