import { useEffect, useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import { getCareerPaths, type CareerPath } from '../utils/aiClient';

export const useCareerPaths = (jobTitle: string) => {
  const [paths, setPaths] = useState<CareerPath[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!jobTitle) return;

    const fetchOrCompute = async () => {
      setLoading(true);

      try {
        const normalizedTitle = jobTitle.toLowerCase().trim();

        // 1. Check cache
        const { data: cached } = await supabase
          .from('career_path_cache')
          .select('paths')
          .eq('job_title', normalizedTitle)
          .maybeSingle();

        if (cached) {
          setPaths(cached.paths || []);
          setLoading(false);
          return;
        }

        // 2. Call Claude via Edge Function
        const result = await getCareerPaths({
          jobTitle,
        });

        if (result && result.length > 0) {
          // 3. Cache result
          await supabase.from('career_path_cache').upsert({
            job_title: normalizedTitle,
            paths: result,
          });
          setPaths(result);
        }
      } catch (error) {
        console.error('Error fetching career paths:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrCompute();
  }, [jobTitle]);

  return { paths, loading };
};
