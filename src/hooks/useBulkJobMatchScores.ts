import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../utils/supabaseClient';
import { getCachedMatch, setCachedMatch } from '../utils/jobMatchCache';

export const useBulkJobMatchScores = (jobIds: string[]) => {
  const { user, isCompany, isAdmin } = useAuth();
  const userId = user?.id;
  const idsKey = jobIds.join('|');

  useEffect(() => {
    if (!userId || isCompany || isAdmin || jobIds.length === 0) return;

    const uncached = jobIds.filter((id) => getCachedMatch(userId, id) === undefined);
    if (uncached.length === 0) return;

    let cancelled = false;

    (async () => {
      try {
        const { data, error } = await supabase
          .from('job_match_scores')
          .select('job_id, match_score, matching_skills')
          .eq('user_id', userId)
          .in('job_id', uncached);

        if (cancelled || error || !data) return;

        for (const row of data) {
          setCachedMatch(userId, row.job_id, {
            matchScore: row.match_score,
            matchingSkills: row.matching_skills ?? [],
          });
        }
      } catch (err) {
        if (!cancelled) console.error('Bulk job match prefetch failed:', err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId, isCompany, isAdmin, idsKey]);
};
