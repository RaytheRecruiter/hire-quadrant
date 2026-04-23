import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../utils/supabaseClient';
import { getJobMatchScore } from '../utils/aiClient';
import {
  MatchResult,
  getCachedMatch,
  setCachedMatch,
  getInFlightMatch,
  registerInFlightMatch,
} from '../utils/jobMatchCache';

const REQUEST_TIMEOUT_MS = 12_000;
const EMPTY_RESULT: MatchResult = { matchScore: null, matchingSkills: [] };

async function fetchMatchResult(userId: string, jobId: string): Promise<MatchResult> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const { data: cached } = await supabase
      .from('job_match_scores')
      .select('match_score, matching_skills')
      .eq('user_id', userId)
      .eq('job_id', jobId)
      .abortSignal(controller.signal)
      .maybeSingle();

    if (cached) {
      return {
        matchScore: cached.match_score,
        matchingSkills: cached.matching_skills ?? [],
      };
    }

    const [{ data: candidate }, { data: job }] = await Promise.all([
      supabase
        .from('candidates')
        .select('resume_text')
        .eq('user_id', userId)
        .abortSignal(controller.signal)
        .maybeSingle(),
      supabase
        .from('jobs')
        .select('title, description, company')
        .eq('id', jobId)
        .abortSignal(controller.signal)
        .maybeSingle(),
    ]);

    if (!candidate?.resume_text || !job) return EMPTY_RESULT;

    const result = await getJobMatchScore({
      resumeText: candidate.resume_text,
      jobTitle: job.title,
      jobDescription: job.description,
      jobCompany: job.company,
    });

    if (!result) return EMPTY_RESULT;

    await supabase.from('job_match_scores').upsert({
      user_id: userId,
      job_id: jobId,
      match_score: result.match_score,
      matching_skills: result.matching_skills,
    });

    return {
      matchScore: result.match_score,
      matchingSkills: result.matching_skills,
    };
  } catch (err) {
    if ((err as { name?: string })?.name !== 'AbortError') {
      console.error('Error fetching job match score:', err);
    }
    return EMPTY_RESULT;
  } finally {
    clearTimeout(timeoutId);
  }
}

export const useJobMatchScore = (jobId: string) => {
  const { user } = useAuth();
  const userId = user?.id;

  const [state, setState] = useState<MatchResult>(() => {
    if (!userId || !jobId) return EMPTY_RESULT;
    return getCachedMatch(userId, jobId) ?? EMPTY_RESULT;
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId || !jobId) return;

    const cached = getCachedMatch(userId, jobId);
    if (cached !== undefined) {
      setState(cached);
      setLoading(false);
      return;
    }

    let isMounted = true;

    let promise = getInFlightMatch(userId, jobId);
    if (!promise) {
      promise = fetchMatchResult(userId, jobId).then((result) => {
        setCachedMatch(userId, jobId, result);
        return result;
      });
      registerInFlightMatch(userId, jobId, promise);
    }

    setLoading(true);
    promise.then((result) => {
      if (!isMounted) return;
      setState(result);
      setLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, [userId, jobId]);

  return {
    matchScore: state.matchScore,
    matchingSkills: state.matchingSkills,
    loading,
  };
};
