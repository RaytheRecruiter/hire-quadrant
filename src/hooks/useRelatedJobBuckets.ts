import { useEffect, useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import type { RelatedJob } from '../components/RelatedJobCard';

interface Options {
  /** Current job's location; used to partition the Near You bucket. */
  currentLocation?: string;
  /** Current job's min salary; used to partition the Higher Pay bucket. */
  currentMinSalary?: number | null;
  /** Current job's max salary; fallback for Higher Pay comparison. */
  currentMaxSalary?: number | null;
  /** Cap how many jobs the RPC returns. Default 20 — plenty of material to partition. */
  poolSize?: number;
}

interface Buckets {
  similar: RelatedJob[];
  nearYou: RelatedJob[];
  higherPay: RelatedJob[];
  loading: boolean;
}

export const useRelatedJobBuckets = (jobId: string, options: Options = {}): Buckets => {
  const { currentLocation, currentMinSalary, currentMaxSalary, poolSize = 20 } = options;
  const [similar, setSimilar] = useState<RelatedJob[]>([]);
  const [nearYou, setNearYou] = useState<RelatedJob[]>([]);
  const [higherPay, setHigherPay] = useState<RelatedJob[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!jobId) return;
    let cancelled = false;
    setLoading(true);

    (async () => {
      try {
        const { data, error } = await supabase.rpc('find_similar_jobs', {
          source_job_id: jobId,
          result_limit: poolSize,
        });
        if (cancelled) return;
        if (error || !data) {
          setSimilar([]);
          setNearYou([]);
          setHigherPay([]);
          return;
        }
        const pool = data as RelatedJob[];
        setSimilar(pool.slice(0, 5));

        if (currentLocation) {
          const matchLoc = currentLocation.trim().toLowerCase();
          setNearYou(
            pool
              .filter((j) => (j.location || '').trim().toLowerCase() === matchLoc)
              .slice(0, 5)
          );
        } else {
          setNearYou([]);
        }

        const pivot = currentMinSalary ?? currentMaxSalary ?? null;
        if (pivot != null) {
          setHigherPay(
            pool
              .filter((j) => {
                const jobMin = (j as { min_salary?: number | null }).min_salary;
                return jobMin != null && jobMin > pivot;
              })
              .slice(0, 5)
          );
        } else {
          setHigherPay([]);
        }
      } catch (err) {
        if (!cancelled) console.error('useRelatedJobBuckets error:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [jobId, currentLocation, currentMinSalary, currentMaxSalary, poolSize]);

  return { similar, nearYou, higherPay, loading };
};
