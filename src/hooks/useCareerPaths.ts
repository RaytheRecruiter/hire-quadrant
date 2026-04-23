import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import { getCareerPaths, type CareerPath } from '../utils/aiClient';

const CACHE_EXPIRY_DAYS = 30;

export function useCareerPaths(jobTitle: string, jobDescription?: string) {
  const [paths, setPaths] = useState<CareerPath[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchPaths = async () => {
      try {
        setLoading(true);
        setError(null);

        const normalizedTitle = jobTitle.toLowerCase().trim();

        const { data: cached } = await supabase
          .from('career_path_cache')
          .select('paths, computed_at')
          .ilike('job_title', normalizedTitle)
          .maybeSingle();

        if (cached) {
          const computedAt = new Date(cached.computed_at).getTime();
          const ageMs = Date.now() - computedAt;
          const ageDays = ageMs / (1000 * 60 * 60 * 24);

          if (ageDays < CACHE_EXPIRY_DAYS) {
            if (isMounted) {
              setPaths(cached.paths);
              setLoading(false);
            }
            return;
          }
        }

        const newPaths = await getCareerPaths({
          jobTitle,
          jobDescription,
        });

        const { error: upsertError } = await supabase
          .from('career_path_cache')
          .upsert({
            job_title: normalizedTitle,
            paths: newPaths,
            computed_at: new Date().toISOString(),
          });

        if (upsertError) {
          console.error('Failed to cache career paths:', upsertError);
        }

        if (isMounted) {
          setPaths(newPaths);
        }
      } catch (err) {
        console.error('Error fetching career paths:', err);
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to load career paths');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchPaths();

    return () => {
      isMounted = false;
    };
  }, [jobTitle, jobDescription]);

  return { paths, loading, error };
}
