import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import { useAuth } from '../contexts/AuthContext';

export function useSkippedJobs() {
  const { user } = useAuth();
  const [skippedJobIds, setSkippedJobIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const fetchSkipped = useCallback(async () => {
    if (!user) {
      setSkippedJobIds(new Set());
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from('job_skips')
      .select('job_id')
      .eq('user_id', user.id);
    if (!error && data) {
      setSkippedJobIds(new Set(data.map(r => r.job_id)));
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchSkipped();
  }, [fetchSkipped]);

  const isSkipped = useCallback((jobId: string) => skippedJobIds.has(jobId), [skippedJobIds]);

  const skipJob = useCallback(async (jobId: string): Promise<boolean> => {
    if (!user) return false;

    // Optimistic update
    setSkippedJobIds(prev => new Set(prev).add(jobId));

    const { error } = await supabase
      .from('job_skips')
      .insert({ user_id: user.id, job_id: jobId });

    if (error) {
      console.error('Failed to skip job:', error);
      // Revert optimistic update
      setSkippedJobIds(prev => {
        const next = new Set(prev);
        next.delete(jobId);
        return next;
      });
      return false;
    }
    return true;
  }, [user]);

  const unskipJob = useCallback(async (jobId: string): Promise<boolean> => {
    if (!user) return false;

    // Optimistic update
    setSkippedJobIds(prev => {
      const next = new Set(prev);
      next.delete(jobId);
      return next;
    });

    const { error } = await supabase
      .from('job_skips')
      .delete()
      .eq('user_id', user.id)
      .eq('job_id', jobId);

    if (error) {
      console.error('Failed to unskip job:', error);
      // Revert optimistic update
      setSkippedJobIds(prev => new Set(prev).add(jobId));
      return false;
    }
    return true;
  }, [user]);

  return { skippedJobIds, isSkipped, skipJob, unskipJob, loading, refresh: fetchSkipped };
}
