import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../utils/supabaseClient';
import { getJobMatchScore } from '../utils/aiClient';

export const useJobMatchScore = (jobId: string) => {
  const { user } = useAuth();
  const [matchScore, setMatchScore] = useState<number | null>(null);
  const [matchingSkills, setMatchingSkills] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user?.id || !jobId) return;

    const fetchOrCompute = async () => {
      setLoading(true);

      try {
        // 1. Check cache
        const { data: cached } = await supabase
          .from('job_match_scores')
          .select('match_score, matching_skills')
          .eq('user_id', user.id)
          .eq('job_id', jobId)
          .maybeSingle();

        if (cached) {
          setMatchScore(cached.match_score);
          setMatchingSkills(cached.matching_skills ?? []);
          setLoading(false);
          return;
        }

        // 2. Get resume text + job details
        const [{ data: candidate }, { data: job }] = await Promise.all([
          supabase
            .from('candidates')
            .select('resume_text')
            .eq('user_id', user.id)
            .maybeSingle(),
          supabase
            .from('jobs')
            .select('title, description, company')
            .eq('id', jobId)
            .maybeSingle(),
        ]);

        if (!candidate?.resume_text || !job) {
          setLoading(false);
          return;
        }

        // 3. Call ai-helpers/job-match
        const result = await getJobMatchScore({
          resumeText: candidate.resume_text,
          jobTitle: job.title,
          jobDescription: job.description,
          jobCompany: job.company,
        });

        if (result) {
          // 4. Cache result
          await supabase.from('job_match_scores').upsert({
            user_id: user.id,
            job_id: jobId,
            match_score: result.match_score,
            matching_skills: result.matching_skills,
          });
          setMatchScore(result.match_score);
          setMatchingSkills(result.matching_skills);
        }
      } catch (error) {
        console.error('Error fetching job match score:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrCompute();
  }, [user?.id, jobId]);

  return { matchScore, matchingSkills, loading };
};
