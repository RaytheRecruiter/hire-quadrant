import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import { useAuth } from '../contexts/AuthContext';

export function useSavedJobs() {
  const { user } = useAuth();
  const [savedJobIds, setSavedJobIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const fetchSaved = useCallback(async () => {
    if (!user) {
      setSavedJobIds(new Set());
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from('saved_jobs')
      .select('job_id')
      .eq('user_id', user.id);
    if (!error && data) {
      setSavedJobIds(new Set(data.map(r => r.job_id)));
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchSaved();
  }, [fetchSaved]);

  const isSaved = useCallback((jobId: string) => savedJobIds.has(jobId), [savedJobIds]);

  const toggleSaved = useCallback(async (jobId: string): Promise<boolean> => {
    if (!user) return false;

    if (savedJobIds.has(jobId)) {
      const { error } = await supabase
        .from('saved_jobs')
        .delete()
        .eq('user_id', user.id)
        .eq('job_id', jobId);
      if (error) {
        console.error('Failed to unsave job:', error);
        return false;
      }
      setSavedJobIds(prev => {
        const next = new Set(prev);
        next.delete(jobId);
        return next;
      });
      return true;
    }

    const { error } = await supabase
      .from('saved_jobs')
      .insert({ user_id: user.id, job_id: jobId });
    if (error) {
      console.error('Failed to save job:', error);
      return false;
    }
    setSavedJobIds(prev => new Set(prev).add(jobId));
    return true;
  }, [user, savedJobIds]);

  return { savedJobIds, isSaved, toggleSaved, loading, refresh: fetchSaved };
}
