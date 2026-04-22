import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useJobs } from '../contexts/JobContext';
import { supabase } from '../utils/supabaseClient';

export const useRecentlyViewed = (excludeJobId?: string) => {
  const { user } = useAuth();
  const { jobs } = useJobs();
  const [recentJobIds, setRecentJobIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) {
      setRecentJobIds([]);
      setLoading(false);
      return;
    }

    const fetchRecentlyViewed = async () => {
      try {
        const { data, error } = await supabase
          .from('job_views')
          .select('job_id')
          .eq('user_id', user.id)
          .order('viewed_at', { ascending: false })
          .limit(20);

        if (error) {
          console.error('Failed to fetch recently viewed jobs:', error);
          setRecentJobIds([]);
        } else if (data) {
          // Deduplicate and exclude the current job
          const uniqueIds = [...new Set(data.map(r => r.job_id))]
            .filter(id => id !== excludeJobId)
            .slice(0, 6);
          setRecentJobIds(uniqueIds);
        }
      } catch (error) {
        console.error('Error fetching recently viewed jobs:', error);
        setRecentJobIds([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentlyViewed();
  }, [user?.id, excludeJobId]);

  // Map job IDs to full job objects
  const recentJobs = recentJobIds
    .map(id => jobs.find(j => j.id === id))
    .filter(Boolean);

  return { recentJobs, loading };
};
